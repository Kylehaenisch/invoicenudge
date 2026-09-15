import type { Invoice, ReminderKey, ReminderTemplate } from "@/types/database";
import { addDaysToDateOnly } from "@/lib/format";

export interface DueReminder {
  templateKey: ReminderKey;
  /** The "YYYY-MM-DD" date this reminder was scheduled for (due_date + offset_days) — not necessarily `today`. */
  scheduledFor: string;
}

/**
 * Decides which of an invoice's enabled reminder templates should go out
 * right now, given what's already been sent.
 *
 * Called once per outstanding invoice by the daily cron
 * (app/api/cron/send-reminders/route.ts), which handles all the I/O
 * (fetching templates/log, sending via Resend, writing reminder_log,
 * flipping status to 'overdue'). This function only decides *which*
 * templates are due — it's pure and easy to unit test on its own.
 *
 * @param invoice      Needs only due_date.
 * @param templates    This user's *enabled* templates (already filtered).
 * @param alreadySent  template_key values that already have a reminder_log
 *                      row for this invoice — never return one of these again.
 * @param today        "YYYY-MM-DD", the cron's run date.
 */
export function getDueReminders(
  invoice: Pick<Invoice, "due_date">,
  templates: ReminderTemplate[],
  alreadySent: Set<ReminderKey>,
  today: string,
): DueReminder[] {
  // TODO(human): implement the due-reminder decision.
  //
  // For each template, its target date is:
  //   addDaysToDateOnly(invoice.due_date, template.offset_days)
  // (offset_days is negative for "before due", 0 on the due date, positive after.)
  //
  // Design questions to settle:
  //   1. Skip anything already in `alreadySent` — that part's non-negotiable
  //      (it's what stops duplicate emails).
  //   2. Fire only when target date === today, or also "catch up" on any
  //      target date <= today that hasn't been sent? Exact-match is simpler
  //      but silently skips a reminder if the cron didn't run on the right
  //      day (a failed deploy, Vercel outage, etc). Catch-up guarantees
  //      nothing is missed, but could send several reminders at once for an
  //      invoice that hasn't been checked in a while.
  //   3. Return `scheduledFor` as the template's *computed target date*
  //      (not `today`) — reminder_log and the invoice detail page's history
  //      both show this value, and it should reflect what the reminder was
  //      for, not when the cron happened to run.
  return [];
}
