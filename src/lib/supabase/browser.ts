import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Browser-side Supabase client — the one exception to this project's
 * "everything goes through a server action" pattern.
 *
 * Needed only for password recovery: Supabase's reset-password email links
 * to this app with the session in the URL fragment (`#access_token=...`),
 * which never reaches the server (fragments aren't sent in HTTP requests).
 * Only client-side JS can read it. `createBrowserClient` (from @supabase/ssr,
 * not plain @supabase/supabase-js) picks up that fragment automatically and
 * writes the resulting session to cookies — the same cookies
 * lib/supabase/server.ts reads — so the rest of the app keeps working
 * entirely through cookie-based server actions once this page is done.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
