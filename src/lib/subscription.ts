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
  // TODO(human): implement the access-level decision.
  //
  // profile.subscription_status is whatever Stripe last reported (see
  // SubscriptionStatus in types/database.ts): "trialing" | "active" |
  // "past_due" | "canceled" | "unpaid" | "incomplete" |
  // "incomplete_expired" | "paused" | null.
  //
  // null means "never started a subscription" — that includes both a
  // brand-new signup who hasn't finished Stripe Checkout yet, AND any
  // pre-billing account (the seed script sets the demo account to look
  // like an active subscriber instead, specifically so it isn't caught by
  // this case — see scripts/seed.ts).
  //
  // Design questions to settle:
  //   1. Which statuses count as "full" access? "trialing" and "active"
  //      clearly should. What about "past_due" — a card that failed once
  //      but Stripe is still retrying? Giving it a grace period (full
  //      access) is more forgiving to a customer with a temporarily
  //      declined card; treating it as read_only immediately is stricter
  //      but simpler and matches "read-only on lapse" from the product
  //      decision.
  //   2. profile.current_period_end is the end of the period Stripe has
  //      already been paid through. Should someone who canceled still get
  //      full access until current_period_end passes (they paid for this
  //      period, they should get to use it), or does "canceled" mean
  //      read_only immediately regardless of current_period_end? There's
  //      no single right answer — it's a business/fairness call.
  //   3. Whatever you decide, null should resolve the same way as your
  //      answer to (1)/(2) would for a lapsed account — don't special-case
  //      it separately from, say, "canceled".
  return "full";
}
