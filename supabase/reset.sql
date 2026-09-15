-- Undoes 0001_init.sql completely, so it can be safely re-run from scratch.
-- Only use this on a project with no real data in it yet.

-- Trigger on auth.users isn't removed by dropping our tables (it's not our
-- table), so it needs dropping explicitly.
drop trigger if exists on_auth_user_created on auth.users;

-- Dropping each table with cascade also removes its own triggers, indexes,
-- and RLS policies automatically.
drop table if exists public.reminder_log cascade;
drop table if exists public.invoices cascade;
drop table if exists public.reminder_templates cascade;
drop table if exists public.clients cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.seed_reminder_templates() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.invoice_status cascade;
drop type if exists public.reminder_key cascade;
drop type if exists public.reminder_log_status cascade;
