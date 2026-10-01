import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { shouldSendTrialEndingReminder } from "@/lib/trial-ending";
import { sendTrialEndingEmail } from "@/lib/send-trial-ending-email";
import type { Profile } from "@/types/database";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Runs daily (see vercel.json). Separate from send-reminders — that cron
 * emails your users' *clients* about unpaid invoices; this one emails your
 * users themselves about their own InvoiceNudge trial ending.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const { data: trialingProfiles, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("subscription_status", "trialing")
    .is("trial_ending_notified_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const profile of (trialingProfiles ?? []) as Profile[]) {
    if (!shouldSendTrialEndingReminder(profile, now)) continue;

    try {
      await sendTrialEndingEmail(profile);
      sent++;
    } catch (sendError) {
      errors.push(
        `profile ${profile.id}: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
      );
    }
  }

  return NextResponse.json({
    checked: trialingProfiles?.length ?? 0,
    sent,
    errors,
  });
}
