import type { Profile } from "@/types/database";

export type AccessLevel = "full" | "read_only";

/**
 * Decides what a user can do based on their subscription state.
 *
 * Called by:
 *   - the dashboard layout, to show a "reactivate billing" banner
 *   - createInvoice / createClientRecord, to block new work
 *   - the reminders cron, to skip sending on behalf of a lapsed account
 * Viewing existing data is never blocked by this — only the ability to
 * create new things or have reminders go out. That's the whole meaning of
 * "read_only".
 */
export function getAccessLevel(
  profile: Pick<Profile, "subscription_status" | "current_period_end">,
): AccessLevel {
  const { subscription_status, current_period_end } = profile;

  if (subscription_status === "trialing" || subscription_status === "active") {
    return "full";
  }

  if (subscription_status === "past_due") {
    return "full";
  }

  const stillWithinPaidPeriod =
    current_period_end !== null && new Date(current_period_end) > new Date();

  return stillWithinPaidPeriod ? "full" : "read_only";
}
