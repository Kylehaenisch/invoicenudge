import type { Profile } from "@/types/database";

/**
 * Decides whether a given trialing profile should get the "your trial ends
 * soon" email right now. Called once per profile by the cron in
 * app/api/cron/send-trial-ending, which already filters to
 * subscription_status = 'trialing' and trial_ending_notified_at is null —
 * this function only has to decide the *timing* half of "who gets emailed
 * today."
 */
export function shouldSendTrialEndingReminder(
  profile: Pick<Profile, "subscription_status" | "current_period_end" | "trial_ending_notified_at">,
  now: Date,
): boolean {
  if (!profile.current_period_end) return false;

  const msUntilEnd = new Date(profile.current_period_end).getTime() - now.getTime();
  const daysUntilEnd = msUntilEnd / (1000 * 60 * 60 * 24);

  // A window ("3 days or less away"), not an exact match on day 3 — a cron
  // that's late by even a few hours shouldn't miss the email entirely. The
  // >= 0 excludes a current_period_end already in the past: once a trial
  // actually ends, Stripe's webhook flips subscription_status away from
  // 'trialing' before this cron would ever see it again, so this is mostly
  // defensive.
  return daysUntilEnd >= 0 && daysUntilEnd <= 3;
}
