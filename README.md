# InvoiceNudge

Invoice reminders for freelance photographers. Create clients and invoices;
InvoiceNudge automatically emails your client 3 days before an invoice is
due, on the due date, and 7 and 14 days after — using templates you write —
until you mark it paid.

**Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, Supabase
(Postgres + Auth), Resend, Stripe Checkout, deployed on Vercel.

## Status: needs one piece before it runs

[`src/lib/subscription.ts`](src/lib/subscription.ts) has a `TODO(human)` —
the function that decides a user's access level (`full` vs `read_only`)
from their subscription state. It defaults to always returning `"full"` so
nothing is blocked until it's filled in; see the comment in the file for the
design questions it needs to answer. Everything else — the $15/mo
subscription Checkout/trial, Stripe Customer Portal, webhook, and every
place that calls this function — is built and compiles.

(Earlier, [`src/lib/reminders.ts`](src/lib/reminders.ts) had the same kind
of `TODO(human)` for deciding which reminders are due — that one's done.)

## Data model

- **profiles** — one per photographer, auto-created on signup. Also holds
  their InvoiceNudge subscription state (`stripe_customer_id`,
  `stripe_subscription_id`, `subscription_status`, `current_period_end`) —
  this is you charging *them*, separate from the per-invoice Stripe
  Checkout below.
- **clients** — name, email, business name
- **invoices** — client, amount, description, dates, status
  (`draft`/`sent`/`paid`/`overdue`), a `public_token` for the client-facing
  link
- **reminder_templates** — 4 fixed slots per user (3 days before, on due
  date, +7, +14), editable subject/body, can be toggled off
- **reminder_log** — one row per (invoice, template) reminder actually sent;
  this is what stops duplicate emails and lets the invoice page show a
  history

Full schema, indexes, and Row Level Security policies:
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) and
[`0002_subscriptions.sql`](supabase/migrations/0002_subscriptions.sql).

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

At [supabase.com](https://supabase.com), create a project, then run the
migration: open the SQL Editor and paste the contents of
`supabase/migrations/0001_init.sql` (or use the Supabase CLI:
`supabase db push` if you've linked the project).

In **Settings → API**, copy the Project URL, `anon` key, and
`service_role` key.

For local testing, either disable **Authentication → Providers → Email →
Confirm email** (so signups work immediately), or use the seed script below,
which creates a pre-confirmed demo account either way.

### 3. Create a Resend account

At [resend.com](https://resend.com), grab an API key. For local testing,
`.env.example`'s default `REMINDER_FROM_EMAIL` (`onboarding@resend.dev`) works
immediately with no domain setup — but Resend will only *deliver* to the
email address you signed up to Resend with (anything else silently fails,
or in newer accounts gets rejected outright). For real sending to real
clients, verify your own domain at [resend.com/domains](https://resend.com/domains)
and switch `REMINDER_FROM_EMAIL` to an address on it.

### 4. Create a Stripe account

At [dashboard.stripe.com](https://dashboard.stripe.com), grab your test-mode
secret key. For the webhook secret, run the Stripe CLI locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints a `whsec_...` value — that's your `STRIPE_WEBHOOK_SECRET` for
local dev. In production, create the webhook endpoint in the Stripe
dashboard instead (pointed at `https://yourdomain.com/api/webhooks/stripe`,
listening for `checkout.session.completed`) and use the secret it gives you.

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase, Resend, and Stripe values from above. Leave
`NEXT_PUBLIC_APP_URL` as `http://localhost:3000` for local dev.

### 6. Seed demo data

```bash
npm run seed
```

Creates a demo photographer account with 3 clients and 6 invoices in a mix
of statuses (draft, upcoming, overdue, paid) — no manual entry needed to
explore the app. Prints the login email/password when done (defaults:
`demo@invoicenudge.test` / `demo12345`, overridable via `SEED_EMAIL` /
`SEED_PASSWORD` env vars). Safe to re-run — it wipes and recreates that
user's clients/invoices each time.

### 7. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with the
seeded account, or sign up your own.

### 8. Try the reminder cron locally

The cron route is a normal route handler, so you can trigger it by hand
instead of waiting for a schedule:

```bash
curl http://localhost:3000/api/cron/send-reminders
```

(No `Authorization` header needed locally unless you've set `CRON_SECRET`
in `.env.local`.) It'll report how many reminders it sent as JSON.

## Selling InvoiceNudge itself as a subscription

There are two entirely separate Stripe integrations in this app — don't mix
them up:

1. **Per-invoice payments** (`app/api/public/invoices/[token]/checkout`) —
   your users' *clients* paying an invoice. Built in v1.
2. **The InvoiceNudge subscription** (`app/api/subscribe/*`) — your users
   paying *you* $15/month, with a 14-day trial. This is what makes it a
   product you can sell.

To set (2) up yourself (or a fresh Stripe account):

1. Create the recurring price: `stripe prices create --unit-amount 1500
   --currency usd -d "recurring[interval]=month" -d
   "product_data[name]=InvoiceNudge Subscription"` (or in the dashboard:
   Product catalog → Add product → Recurring, monthly, $15). Put the
   resulting price ID in `STRIPE_SUBSCRIPTION_PRICE_ID`.
2. Make sure your webhook endpoint (local `stripe listen` or the production
   one in the Stripe dashboard) is subscribed to `checkout.session.completed`,
   `customer.subscription.updated`, and `customer.subscription.deleted` — the
   first migration's webhook only needed the first event; this one needs all
   three.
3. New signups are sent straight into subscription Checkout
   (`app/(auth)/actions.ts`) to start their trial. Existing users can
   (re)subscribe or manage billing from **Settings → Billing**, which links
   to `/api/subscribe/checkout` and Stripe's Customer Portal
   (`/api/subscribe/portal`).
4. **Going live for real** is entirely a Stripe-side step I can't do for
   you: activate your Stripe account (identity + business verification,
   bank account for payouts) in the dashboard, then swap the test-mode keys
   in your env vars for live-mode ones. No code changes needed.
5. Before charging real customers, add real **Terms of Service** and
   **Privacy Policy** pages — Stripe requires these to be linked for live
   subscription billing, and a generic placeholder isn't a substitute for
   actual legal review.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all the variables from `.env.example` as Vercel project env vars —
   set `NEXT_PUBLIC_APP_URL` to your production domain, and generate a
   random value for `CRON_SECRET` (e.g. `openssl rand -hex 32`).
3. `vercel.json` already declares the daily cron
   (`/api/cron/send-reminders`, 13:00 UTC) — Vercel picks it up
   automatically on deploy. Adjust the schedule there if you want a
   different time; note the Hobby plan only supports once-daily crons,
   which matches this app's day-granularity reminders anyway.
4. In the Stripe dashboard, add a **production** webhook endpoint pointed
   at `https://yourdomain.com/api/webhooks/stripe` and put its signing
   secret in `STRIPE_WEBHOOK_SECRET`.
5. In Resend, verify your sending domain and update `REMINDER_FROM_EMAIL`.

## Project structure

```
src/
  app/
    (auth)/            login, signup, shared server actions
    (dashboard)/        everything behind auth: dashboard, clients,
                         invoices, reminder template settings
    invoice/[token]/    public, unauthenticated invoice view (+ Pay Now)
    api/
      cron/send-reminders/       the daily reminder job
      webhooks/stripe/           marks invoices paid on successful payment
      public/invoices/[token]/checkout/   creates the Stripe Checkout session
  components/           shared UI (design system + a few feature widgets)
  lib/                  Supabase clients, formatting, the reminders/
                         merge-field/status logic
  types/database.ts     hand-authored types mirroring the SQL schema
scripts/seed.ts         demo data
supabase/migrations/    schema, RLS policies, triggers
```

## Design notes worth knowing

- **RLS is the real security boundary.** Every dashboard query filters by
  the signed-in user, but Postgres Row Level Security (see the migration)
  enforces that regardless — a missed `.eq("user_id", ...)` wouldn't leak
  another photographer's data.
- **The public invoice link uses the service-role key**, not RLS, since
  there's no logged-in user on that path — authorization is possession of
  the unguessable `public_token` in the URL, same as any "share link"
  feature. See `src/lib/supabase/admin.ts`.
- **"Overdue" is computed at display time** (`src/lib/invoice-status.ts`)
  from `due_date`, not solely trusted from the stored `status` column — so
  the dashboard is accurate even between cron runs. The cron job separately
  flips the stored status once it processes a past-due invoice.
