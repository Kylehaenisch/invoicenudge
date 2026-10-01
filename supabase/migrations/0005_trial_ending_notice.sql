-- Marks when we've sent the "your trial is ending soon" email, so the cron
-- in app/api/cron/send-trial-ending never sends it twice for the same trial.
alter table public.profiles
  add column trial_ending_notified_at timestamptz;
