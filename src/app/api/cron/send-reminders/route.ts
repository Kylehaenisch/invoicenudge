import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFromAddress, getResendClient } from "@/lib/resend";
import { renderTemplate } from "@/lib/merge-fields";
import { getDueReminders } from "@/lib/reminders";
import { todayDateOnly } from "@/lib/format";
import type {
  Client,
  Invoice,
  Profile,
  ReminderKey,
  ReminderTemplate,
} from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

interface InvoiceRow extends Invoice {
  client: Client;
}

/**
 * Runs daily (see vercel.json). For every outstanding invoice, asks
 * getDueReminders() which templates are due, sends them via Resend, logs
 * each attempt, and flips invoices past their due date to 'overdue'.
 */
export async function GET(request: NextRequest) {
  // Vercel sets this header automatically on requests it generates for a
  // Cron Job when CRON_SECRET is configured as a project env var — this
  // check is what stops anyone else from hitting the URL and mass-emailing
  // every client early.
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayDateOnly();

  // 'overdue' invoices still need the +7/+14 day reminders, so both
  // statuses are in scope — 'overdue' here just means "past due, still
  // unpaid," not "done being reminded."
  const { data: invoicesRaw, error: invoicesError } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .in("status", ["sent", "overdue"]);

  if (invoicesError) {
    return NextResponse.json({ error: invoicesError.message }, { status: 500 });
  }

  const invoices = (invoicesRaw ?? []) as InvoiceRow[];
  const resend = getResendClient();
  const fromAddress = getFromAddress();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  let sent = 0;
  const errors: string[] = [];

  for (const invoice of invoices) {
    try {
      const [{ data: templates }, { data: existingLog }, { data: profile }] =
        await Promise.all([
          supabase
            .from("reminder_templates")
            .select("*")
            .eq("user_id", invoice.user_id)
            .eq("enabled", true),
          supabase
            .from("reminder_log")
            .select("template_key")
            .eq("invoice_id", invoice.id),
          supabase.from("profiles").select("*").eq("id", invoice.user_id).single(),
        ]);

      const alreadySent = new Set(
        (existingLog ?? []).map((l) => l.template_key as ReminderKey),
      );
      const dueReminders = getDueReminders(
        invoice,
        (templates ?? []) as ReminderTemplate[],
        alreadySent,
        today,
      );

      for (const reminder of dueReminders) {
        const template = (templates ?? []).find(
          (t) => t.key === reminder.templateKey,
        );
        if (!template) continue;

        const ctx = {
          clientName: invoice.client.name,
          amountCents: invoice.amount_cents,
          dueDate: invoice.due_date,
          invoiceLink: `${appUrl}/invoice/${invoice.public_token}`,
          businessName: (profile as Profile | null)?.business_name || "",
        };

        try {
          // The Resend SDK does NOT throw on an API-level rejection (bad
          // "from" domain, invalid recipient, etc.) — it resolves normally
          // with `{ data: null, error: {...} }`. Ignoring that `error` field
          // was a real bug here: a rejected send would fall through and get
          // logged as "sent" anyway. Throwing makes it hit the catch below
          // like any other failure.
          const { error: sendError } = await resend.emails.send({
            from: fromAddress,
            to: invoice.client.email,
            subject: renderTemplate(template.subject, ctx),
            text: renderTemplate(template.body, ctx),
          });
          if (sendError) throw new Error(sendError.message);

          // The unique (invoice_id, template_key) constraint on
          // reminder_log is the real dedup guarantee if this route is ever
          // triggered twice for the same day.
          const { error: logError } = await supabase
            .from("reminder_log")
            .insert({
              invoice_id: invoice.id,
              template_key: reminder.templateKey,
              scheduled_for: reminder.scheduledFor,
              status: "sent",
            });
          if (!logError) sent++;
        } catch (sendError) {
          await supabase.from("reminder_log").insert({
            invoice_id: invoice.id,
            template_key: reminder.templateKey,
            scheduled_for: reminder.scheduledFor,
            status: "failed",
            error:
              sendError instanceof Error ? sendError.message : String(sendError),
          });
          errors.push(
            `invoice ${invoice.id} / ${reminder.templateKey}: ${sendError}`,
          );
        }
      }

      if (invoice.due_date < today && invoice.status === "sent") {
        await supabase
          .from("invoices")
          .update({ status: "overdue" })
          .eq("id", invoice.id)
          .eq("status", "sent");
      }
    } catch (invoiceError) {
      errors.push(`invoice ${invoice.id}: ${invoiceError}`);
    }
  }

  return NextResponse.json({ checked: invoices.length, sent, errors });
}
