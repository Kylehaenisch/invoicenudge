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
const due: DueReminder[] = [];

  for (const template of templates) {
      if (alreadySent.has(template.key)) {
          continue;
         }

    const scheduledFor = addDaysToDateOnly(invoice.due_date, template.offset_days);

    if (scheduledFor <= today
        ) {
         due.push({ templateKey: template.key, scheduledFor });
       }
    }

  return due;


  
  
}
