import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, InvoiceWithClient } from "@/types/database";
import { getResendClient, getFromAddress } from "@/lib/resend";
import { renderTemplate } from "@/lib/merge-fields";
import { getAccessLevel } from "@/lib/subscription";
import { todayDateOnly } from "@/lib/format";

/**
 * Sends the "on_send" template immediately when an invoice is created (or a
 * draft is marked) as "sent" — called directly from the invoices server
 * actions, not the daily cron (that only handles the 4 due-date-relative
 * reminders — see lib/reminders.ts).
 *
 * Never throws: a failed or skipped send should never block the invoice
 * action that triggered it. Failures are logged to reminder_log the same
 * way the cron logs a failed reminder, so they're still visible on the
 * invoice's history.
 */
export async function sendInvoiceCreatedNotification(
  supabase: SupabaseClient<Database>,
  invoiceId: string,
  userId: string,
): Promise<void> {
  try {
    // Already sent (or already attempted)? Don't send again — this also
    // protects against createInvoice/markInvoiceSent somehow running twice
    // for the same invoice (a double-click, a retried request).
    const { data: existingLog } = await supabase
      .from("reminder_log")
      .select("id")
      .eq("invoice_id", invoiceId)
      .eq("template_key", "on_send")
      .maybeSingle();
    if (existingLog) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    // Same rule as the cron: a lapsed subscription pauses outgoing email,
    // not just new invoice/client creation.
    if (!profile || getAccessLevel(profile) !== "full") return;

    const { data: template } = await supabase
      .from("reminder_templates")
      .select("*")
      .eq("user_id", userId)
      .eq("key", "on_send")
      .eq("enabled", true)
      .maybeSingle();
    if (!template) return;

    // Cast rather than rely on inferred embedding types — the hand-authored
    // Database type has no real FK "Relationships" metadata (see
    // src/types/database.ts), so postgrest-js can't type a joined
    // `client:clients(*)` select on its own.
    const { data: invoiceDataRaw } = await supabase
      .from("invoices")
      .select("*, client:clients(*)")
      .eq("id", invoiceId)
      .single();
    const invoiceRaw = invoiceDataRaw as InvoiceWithClient | null;
    if (!invoiceRaw) return;

    const client = invoiceRaw.client;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const ctx = {
      clientName: client.name,
      amountCents: invoiceRaw.amount_cents,
      dueDate: invoiceRaw.due_date,
      invoiceLink: `${appUrl}/invoice/${invoiceRaw.public_token}`,
      businessName: profile.business_name || "",
    };

    const resend = getResendClient();
    const { error: sendError } = await resend.emails.send({
      from: getFromAddress(),
      to: client.email,
      subject: renderTemplate(template.subject, ctx),
      text: renderTemplate(template.body, ctx),
    });

    if (sendError) {
      await supabase.from("reminder_log").insert({
        invoice_id: invoiceId,
        template_key: "on_send",
        scheduled_for: todayDateOnly(),
        status: "failed",
        error: sendError.message,
      });
      return;
    }

    await supabase.from("reminder_log").insert({
      invoice_id: invoiceId,
      template_key: "on_send",
      scheduled_for: todayDateOnly(),
      status: "sent",
    });
  } catch (err) {
    try {
      await supabase.from("reminder_log").insert({
        invoice_id: invoiceId,
        template_key: "on_send",
        scheduled_for: todayDateOnly(),
        status: "failed",
        error: err instanceof Error ? err.message : String(err),
      });
    } catch {
      // Genuinely nothing more we can do here.
    }
  }
}
