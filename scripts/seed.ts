/**
 * Seeds a demo photographer account with clients and invoices in a mix of
 * statuses (draft, upcoming, overdue, paid) so the app is testable without
 * manual data entry.
 *
 * Usage:  npm run seed
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in
 * .env.local (the service-role key bypasses RLS — never run this against
 * a project you don't own, and never ship this key to the browser).
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/types/database";

const SEED_EMAIL = process.env.SEED_EMAIL ?? "demo@invoicenudge.test";
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? "demo12345";
const SEED_BUSINESS_NAME =
  process.env.SEED_BUSINESS_NAME ?? "John Doe Photography";

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local",
    );
  }

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Looking for existing demo user (${SEED_EMAIL})…`);
  const { data: existingUsers, error: listError } =
    await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw listError;

  let userId = existingUsers.users.find((u) => u.email === SEED_EMAIL)?.id;

  if (userId) {
    console.log(`Found existing demo user ${userId}.`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: SEED_EMAIL,
      password: SEED_PASSWORD,
      email_confirm: true, // skip the confirmation-email flow for the demo account
      user_metadata: { business_name: SEED_BUSINESS_NAME },
    });
    if (error || !data.user) throw error ?? new Error("Could not create demo user");
    userId = data.user.id;
    console.log(`Created demo user ${userId}.`);
  }

  // The on_auth_user_created trigger (0001_init.sql) already created the
  // profile row + 4 default reminder templates. Just make sure the business
  // name is set even if this user already existed from a previous run.
  await supabase
    .from("profiles")
    .update({ business_name: SEED_BUSINESS_NAME })
    .eq("id", userId);

  // Wipe previous demo clients/invoices so this script is safely re-runnable
  // (deleting a client cascades to their invoices — see the FK in the migration).
  await supabase.from("clients").delete().eq("user_id", userId);

  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .insert([
      {
        user_id: userId,
        name: "Alex Rivera",
        email: "alex@example.com",
        business_name: "Rivera Weddings",
      },
      {
        user_id: userId,
        name: "Jamie Chen",
        email: "jamie@example.com",
        business_name: "",
      },
      {
        user_id: userId,
        name: "Morgan Blake",
        email: "morgan@example.com",
        business_name: "Blake & Co Events",
      },
    ])
    .select("*");
  if (clientsError || !clients) throw clientsError;

  const [alex, jamie, morgan] = clients;

  const { error: invoicesError } = await supabase.from("invoices").insert([
    {
      user_id: userId,
      client_id: alex.id,
      amount_cents: 250000,
      description: "Wedding photography — full day coverage",
      issue_date: addDays(-20),
      due_date: addDays(10),
      status: "sent",
    },
    {
      user_id: userId,
      client_id: alex.id,
      amount_cents: 45000,
      description: "Engagement session",
      issue_date: addDays(-40),
      due_date: addDays(-25),
      status: "paid",
      paid_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      user_id: userId,
      client_id: jamie.id,
      amount_cents: 80000,
      description: "Family portrait session",
      issue_date: addDays(-10),
      due_date: addDays(2),
      status: "sent",
    },
    {
      user_id: userId,
      client_id: jamie.id,
      amount_cents: 120000,
      description: "Senior portraits",
      issue_date: addDays(-30),
      due_date: addDays(-16),
      status: "sent",
    },
    {
      user_id: userId,
      client_id: morgan.id,
      amount_cents: 300000,
      description: "Corporate headshots — 20 employees",
      issue_date: addDays(-5),
      due_date: addDays(14),
      status: "draft",
    },
    {
      user_id: userId,
      client_id: morgan.id,
      amount_cents: 60000,
      description: "Product photography",
      issue_date: addDays(-60),
      due_date: addDays(-45),
      status: "sent",
    },
  ]);
  if (invoicesError) throw invoicesError;

  console.log("\nSeed complete. 3 clients, 6 invoices (draft/sent/overdue/paid mix).\n");
  console.log("Log in at /login with:");
  console.log(`  email:    ${SEED_EMAIL}`);
  console.log(`  password: ${SEED_PASSWORD}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
