import type { ReminderKey } from "@/types/database";

/** Fixed v1 schedule — see the "Schedule" decision in the project chat. */
export const REMINDER_KEY_ORDER: ReminderKey[] = [
  "before_due_3",
  "due_date",
  "after_due_7",
  "after_due_14",
];

export const REMINDER_KEY_LABEL: Record<ReminderKey, string> = {
  before_due_3: "3 days before due",
  due_date: "On the due date",
  after_due_7: "7 days after due",
  after_due_14: "14 days after due",
};

export const REMINDER_KEY_OFFSET: Record<ReminderKey, number> = {
  before_due_3: -3,
  due_date: 0,
  after_due_7: 7,
  after_due_14: 14,
};
