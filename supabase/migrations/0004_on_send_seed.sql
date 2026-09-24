-- Run this AFTER 0003_on_send_key.sql has been committed (separate query).
--
-- offset_days = 0 for 'on_send' is a placeholder, not a real due-date
-- offset — the cron explicitly excludes this key
-- (`.neq("key", "on_send")` in app/api/cron/send-reminders/route.ts) so
-- it's never scheduled/interpreted as "due today" the way the real
-- 'due_date' key is. Kept NOT NULL / a plain number so
-- lib/reminders.ts's ReminderTemplate type and getDueReminders() didn't
-- need to change at all.

-- Give every existing user the new template — the trigger below only
-- fires for brand-new signups going forward.
insert into public.reminder_templates (user_id, key, offset_days, subject, body, enabled)
select
  id,
  'on_send',
  0,
  'Invoice from {{business_name}}: {{amount}} due {{due_date}}',
  E'Hi {{client_name}},\n\nHere''s your invoice for {{amount}}, due {{due_date}}.\n\nYou can view and pay it here: {{invoice_link}}\n\nThanks!\n{{business_name}}',
  true
from public.profiles
on conflict (user_id, key) do nothing;

-- Update the signup trigger so future users get all 5 templates.
create or replace function public.seed_reminder_templates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.reminder_templates (user_id, key, offset_days, subject, body) values
    (new.id, 'on_send', 0,
     'Invoice from {{business_name}}: {{amount}} due {{due_date}}',
     E'Hi {{client_name}},\n\nHere''s your invoice for {{amount}}, due {{due_date}}.\n\nYou can view and pay it here: {{invoice_link}}\n\nThanks!\n{{business_name}}'),
    (new.id, 'before_due_3', -3,
     'Upcoming invoice: {{amount}} due {{due_date}}',
     E'Hi {{client_name}},\n\nJust a friendly heads up that invoice for {{amount}} is due on {{due_date}}.\n\nYou can view it here: {{invoice_link}}\n\nThanks!\n{{business_name}}'),
    (new.id, 'due_date', 0,
     'Invoice due today: {{amount}}',
     E'Hi {{client_name}},\n\nYour invoice for {{amount}} is due today ({{due_date}}).\n\nView and pay here: {{invoice_link}}\n\nThanks!\n{{business_name}}'),
    (new.id, 'after_due_7', 7,
     'Overdue: invoice for {{amount}} was due {{due_date}}',
     E'Hi {{client_name}},\n\nThis is a reminder that your invoice for {{amount}} was due on {{due_date}} and is now overdue.\n\nView and pay here: {{invoice_link}}\n\nPlease let me know if you have any questions.\n{{business_name}}'),
    (new.id, 'after_due_14', 14,
     'Second notice: invoice for {{amount}} is 14 days overdue',
     E'Hi {{client_name}},\n\nYour invoice for {{amount}} (originally due {{due_date}}) is now two weeks overdue.\n\nView and pay here: {{invoice_link}}\n\nPlease reach out if there''s an issue so we can sort it out.\n{{business_name}}');
  return new;
end;
$$;
