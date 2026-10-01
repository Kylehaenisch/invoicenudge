import type { Profile } from "@/types/database";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResendClient, getFromAddress } from "@/lib/resend";

/**
 * Sends the one-time "your trial ends soon" email and marks it sent, so it's
 * never sent twice for the same trial. This is a transactional email about
 * InvoiceNudge's own billing, sent to the photographer themselves — distinct
 * from reminder_templates, which are the client-facing nudges your users
 * send to *their* clients. Throws on a Resend-level send failure so the
 * caller (the cron) can log it rather than silently marking it sent.
 */
export async function sendTrialEndingEmail(profile: Profile): Promise<void> {
  const supabase = createAdminClient();
  const resend = getResendClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  const trialEndDate = profile.current_period_end
    ? new Date(profile.current_period_end).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : "soon";

  const { error: sendError } = await resend.emails.send({
    from: getFromAddress(),
    to: profile.email,
    subject: "Your InvoiceNudge trial ends soon",
    text: [
      `Hi ${profile.business_name || "there"},`,
      "",
      `Your 14-day free trial ends on ${trialEndDate}. After that, the card on file will be charged $15/month to keep your reminders running — no action needed if you want to continue.`,
      "",
      `If you'd rather not continue, you can cancel any time from Settings > Billing: ${appUrl}/settings/billing`,
      "",
      "— InvoiceNudge",
    ].join("\n"),
  });
  if (sendError) throw new Error(sendError.message);

  await supabase
    .from("profiles")
    .update({ trial_ending_notified_at: new Date().toISOString() })
    .eq("id", profile.id);
}
