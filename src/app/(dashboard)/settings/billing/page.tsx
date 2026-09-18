import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAccessLevel } from "@/lib/subscription";

const STATUS_COPY: Record<string, string> = {
  trialing: "You're on your 14-day free trial.",
  active: "Your subscription is active.",
  past_due: "Your last payment failed — Stripe will retry automatically.",
  canceled: "Your subscription has been canceled.",
  unpaid: "Your subscription is unpaid.",
  incomplete: "Your subscription setup wasn't completed.",
  incomplete_expired: "Your subscription setup expired before completing.",
  paused: "Your subscription is paused.",
};

export default async function BillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end")
    .eq("id", user!.id)
    .single();

  const hasSubscribed = Boolean(profile?.subscription_status);
  const accessLevel = profile ? getAccessLevel(profile) : "full";
  const statusText = profile?.subscription_status
    ? (STATUS_COPY[profile.subscription_status] ?? profile.subscription_status)
    : "You haven't started a subscription yet.";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Billing</h1>
        <p className="text-sm text-ink-muted">
          InvoiceNudge is $15/month, with a 14-day free trial.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscription status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-ink">{statusText}</p>

          {profile?.current_period_end && (
            <p className="text-sm text-ink-muted">
              {accessLevel === "full" ? "Renews" : "Access was covered through"}{" "}
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
                new Date(profile.current_period_end),
              )}
              .
            </p>
          )}

          {hasSubscribed ? (
            <Link href="/api/subscribe/portal">
              <Button>Manage billing</Button>
            </Link>
          ) : (
            <Link href="/api/subscribe/checkout">
              <Button>Start free trial</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
