-- Adds subscription state to profiles so InvoiceNudge itself can be sold as
-- a monthly subscription — separate from the Stripe payments your users'
-- *clients* make on individual invoices (that flow is untouched).

alter table public.profiles
  add column stripe_customer_id text unique,
  add column stripe_subscription_id text unique,
  add column subscription_status text,
  add column current_period_end timestamptz;

-- No CHECK constraint on subscription_status: Stripe's own subscription
-- status values (trialing, active, past_due, canceled, unpaid, incomplete,
-- incomplete_expired, paused) are the source of truth. Storing whatever
-- Stripe sends avoids a second enum drifting out of sync with theirs.
--
-- All four columns are nullable — a profile with subscription_status = null
-- has never started a subscription (this matters for lib/subscription.ts's
-- access-level decision, and for pre-billing accounts like the seed demo
-- user, which the seed script sets to an active-looking state instead).
