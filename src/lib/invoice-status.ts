import type { Invoice, InvoiceStatus } from "@/types/database";
import { parseDateOnly, todayDateOnly } from "@/lib/format";

/**
 * The dashboard shows overdue invoices immediately, without waiting for the
 * next cron run to flip the stored `status` column. The stored status is
 * still what the reminders cron and reminder_log rely on (see
 * lib/reminders.ts) — this is purely a display-time overlay.
 */
export function getDisplayStatus(invoice: Pick<Invoice, "status" | "due_date">): InvoiceStatus {
  if (invoice.status === "draft" || invoice.status === "paid") {
    return invoice.status;
  }
  const isPastDue = parseDateOnly(invoice.due_date) < parseDateOnly(todayDateOnly());
  return isPastDue ? "overdue" : "sent";
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
  overdue: "Overdue",
};

export const STATUS_BADGE_CLASS: Record<InvoiceStatus, string> = {
  draft: "bg-stone-100 text-stone-600 ring-stone-300",
  sent: "bg-sky-50 text-sky-700 ring-sky-200",
  paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  overdue: "bg-rose-50 text-rose-700 ring-rose-200",
};
