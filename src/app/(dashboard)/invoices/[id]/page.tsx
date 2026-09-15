import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { CopyLinkButton } from "@/components/copy-link-button";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatCents, formatDate } from "@/lib/format";
import { getDisplayStatus } from "@/lib/invoice-status";
import { REMINDER_KEY_LABEL } from "@/lib/reminder-templates";
import { markInvoicePaid, markInvoiceSent, deleteInvoice } from "../actions";
import type { InvoiceWithClient, ReminderLogEntry } from "@/types/database";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  // Cast rather than rely on inferred embedding types: the hand-authored
  // Database type has no real FK "Relationships" metadata (see
  // src/types/database.ts), so postgrest-js can't type a joined
  // `client:clients(*)` select on its own.
  const invoice = invoiceRaw as InvoiceWithClient | null;

  if (!invoice) notFound();

  const client = invoice.client;
  const displayStatus = getDisplayStatus(invoice);

  const { data: log } = await supabase
    .from("reminder_log")
    .select("*")
    .eq("invoice_id", id)
    .order("scheduled_for", { ascending: true });

  const reminderLog = (log ?? []) as ReminderLogEntry[];

  const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invoice/${invoice.public_token}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/invoices" className="text-sm text-ink-muted hover:text-ink">
            ← All invoices
          </Link>
          <h1 className="mt-1 font-serif text-2xl text-ink">
            {formatCents(invoice.amount_cents)} — {client.name}
          </h1>
        </div>
        <InvoiceStatusBadge status={displayStatus} />
      </div>

      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <Detail label="Client" value={`${client.name} (${client.email})`} />
          <Detail label="Description" value={invoice.description || "—"} />
          <Detail label="Issue date" value={formatDate(invoice.issue_date)} />
          <Detail label="Due date" value={formatDate(invoice.due_date)} />
          {invoice.paid_at && (
            <Detail
              label="Paid on"
              value={new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(new Date(invoice.paid_at))}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client-facing link</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-ink-muted">
            This is the link sent in reminder emails ({"{{invoice_link}}"}).
            Anyone with it can view — and pay — this invoice.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-paper px-3 py-2 text-xs text-ink-muted">
              {publicUrl}
            </code>
            <CopyLinkButton url={publicUrl} />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        {invoice.status === "draft" && (
          <form action={markInvoiceSent}>
            <input type="hidden" name="id" value={invoice.id} />
            <Button type="submit">Mark as sent</Button>
          </form>
        )}
        {invoice.status !== "paid" && (
          <form action={markInvoicePaid}>
            <input type="hidden" name="id" value={invoice.id} />
            <Button type="submit" variant="secondary">
              Mark as paid
            </Button>
          </form>
        )}
        <form action={deleteInvoice}>
          <input type="hidden" name="id" value={invoice.id} />
          <ConfirmSubmitButton
            type="submit"
            variant="danger"
            confirmMessage="Delete this invoice? This can't be undone."
          >
            Delete invoice
          </ConfirmSubmitButton>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reminder history</CardTitle>
        </CardHeader>
        <CardContent>
          {reminderLog.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No reminders sent yet.
              {invoice.status === "sent" &&
                " They'll go out automatically as each scheduled date arrives."}
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {reminderLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-ink">
                    {REMINDER_KEY_LABEL[entry.template_key]}
                  </span>
                  <span className="text-ink-muted">
                    {entry.status === "sent"
                      ? `Sent ${formatDate(entry.scheduled_for)}`
                      : `${entry.status} — ${formatDate(entry.scheduled_for)}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 text-sm text-ink">{value}</p>
    </div>
  );
}
