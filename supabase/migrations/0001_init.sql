-- InvoiceNudge initial schema
-- Run via `supabase db push` (recommended) or paste into the Supabase SQL Editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per photographer (extends auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  business_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up via Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, business_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'business_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  business_name text not null default '',
  created_at timestamptz not null default now()
);

create index clients_user_id_idx on public.clients (user_id);

alter table public.clients enable row level security;

create policy "clients: owner full access" on public.clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reminder_templates: 4 fixed slots per user, seeded on signup
-- ---------------------------------------------------------------------------
create type public.reminder_key as enum (
  'before_due_3',
  'due_date',
  'after_due_7',
  'after_due_14'
);

create table public.reminder_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  key public.reminder_key not null,
  offset_days integer not null, -- negative = before due date, 0 = on due date, positive = after
  subject text not null,
  body text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  unique (user_id, key)
);

alter table public.reminder_templates enable row level security;

create policy "reminder_templates: owner full access" on public.reminder_templates
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed the 4 default templates whenever a profile is created.
create function public.seed_reminder_templates()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.reminder_templates (user_id, key, offset_days, subject, body) values
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

create trigger on_profile_created_seed_templates
  after insert on public.profiles
  for each row execute procedure public.seed_reminder_templates();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'overdue');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  amount_cents integer not null check (amount_cents > 0),
  description text not null default '',
  issue_date date not null default current_date,
  due_date date not null,
  status public.invoice_status not null default 'draft',
  public_token uuid not null default gen_random_uuid() unique,
  paid_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_public_token_idx on public.invoices (public_token);
create index invoices_status_due_date_idx on public.invoices (status, due_date);

create function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute procedure public.set_updated_at();

alter table public.invoices enable row level security;

create policy "invoices: owner full access" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- reminder_log: idempotency ledger for the daily reminder cron
-- ---------------------------------------------------------------------------
create type public.reminder_log_status as enum ('sent', 'failed', 'skipped');

create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  template_key public.reminder_key not null,
  scheduled_for date not null,
  sent_at timestamptz not null default now(),
  status public.reminder_log_status not null default 'sent',
  error text,
  unique (invoice_id, template_key)
);

create index reminder_log_invoice_id_idx on public.reminder_log (invoice_id);

alter table public.reminder_log enable row level security;

create policy "reminder_log: owner can read" on public.reminder_log
  for select using (
    exists (
      select 1 from public.invoices
      where invoices.id = reminder_log.invoice_id
      and invoices.user_id = auth.uid()
    )
  );

-- No insert/update/delete policy: only the service-role key (cron job, bypasses RLS)
-- is ever allowed to write reminder_log rows.
