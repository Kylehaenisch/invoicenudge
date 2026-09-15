# InvoiceNudge

Invoice reminders for freelance photographers. Create clients and invoices;
InvoiceNudge automatically emails your client 3 days before an invoice is
due, on the due date, and 7 and 14 days after — using templates you write —
until you mark it paid.

**Stack:** Next.js 16 (App Router) + TypeScript, Tailwind CSS v4, Supabase
(Postgres + Auth), Resend, Stripe Checkout, deployed on Vercel.

## Status: needs one piece before it runs

[`src/lib/reminders.ts`](src/lib/reminders.ts) has a `TODO(human)` — the
function that decides which reminders are due on a given day. Everything
else (schema, auth, dashboard, invoices, templates, Stripe, the cron route
that calls this function) is built and compiles. Fill that in first; see the
comment in the file for the design questions it needs to answer.

## Data model

- **profiles** — one per photographer, auto-created on signup
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
[`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).

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

At [resend.com](https://resend.com), grab an API key. For real sending
you'll need a verified domain; for local testing Resend's sandbox works
without one (emails only deliver to your own verified address).

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
