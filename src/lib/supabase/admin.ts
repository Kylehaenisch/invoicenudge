import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 *
 * Server-only. Never import this into a Client Component and never let
 * SUPABASE_SERVICE_ROLE_KEY reach the browser bundle.
 *
 * Used only where there is no logged-in dashboard user to scope RLS to:
 *   - the public invoice link (`/invoice/[token]`) and its checkout route,
 *     which authorize by possession of an unguessable token instead of a
 *     session
 *   - the Stripe webhook, which authenticates via signature verification
 *   - the reminders cron job, which needs to read across every user's
 *     invoices to decide what's due today
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
