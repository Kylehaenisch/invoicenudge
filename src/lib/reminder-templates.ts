import type { ReminderKey } from "@/types/database";

/**
 * Fixed v1 schedule — see the "Schedule" decision in the project chat.
 * `on_send` isn't really "scheduled" at all — it fires immediately from
 * the create/mark-sent server actions (see lib/send-invoice-notification.ts),
 * not the daily cron. It's included here purely for display order/labels.
 */
export const REMINDER_KEY_ORDER: ReminderKey[] = [
  "on_send",
  "before_due_3",
  "due_date",
  "after_due_7",
  "after_due_14",
];

export const REMINDER_KEY_LABEL: Record<ReminderKey, string> = {
  on_send: "When the invoice is sent",
  before_due_3: "3 days before due",
  due_date: "On the due date",
  after_due_7: "7 days after due",
  after_due_14: "14 days after due",
};

/** offset_days for on_send is a DB placeholder (0), not a real due-date offset — see 0004_on_send_seed.sql. */
export const REMINDER_KEY_OFFSET: Record<ReminderKey, number> = {
  on_send: 0,
  before_due_3: -3,
  due_date: 0,
  after_due_7: 7,
  after_due_14: 14,
};
