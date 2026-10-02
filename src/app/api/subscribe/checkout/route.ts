import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

/**
 * Starts (or resumes) an InvoiceNudge subscription for the signed-in user —
 * this is you charging your users, distinct from the per-invoice Stripe
 * Checkout in app/api/public/invoices/[token]/checkout, which is your
 * users' *clients* paying them.
 *
 * A plain GET so it can be reached with a simple link/redirect (no form
 * needed). It's safe to hit repeatedly *while there's nothing active to
 * protect* (e.g. retrying after an abandoned checkout) — but if a live
 * Stripe subscription already exists for this user, creating another one
 * here would double-bill them, since the webhook only ever remembers the
 * most recent `stripe_subscription_id` and the first one would keep billing
 * in Stripe without the app knowing. Those cases go to the billing page
 * (manage/reactivate via the Customer Portal) instead.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (
    profile?.subscription_status === "trialing" ||
    profile?.subscription_status === "active" ||
    profile?.subscription_status === "past_due"
  ) {
    redirect("/settings/billing");
  }

  const stripe = getStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

  // Reuse the existing Stripe Customer if this user has one already (e.g.
  // they canceled and are resubscribing) rather than creating a duplicate.
  let customerId = profile?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      { price: process.env.STRIPE_SUBSCRIPTION_PRICE_ID!, quantity: 1 },
    ],
    subscription_data: { trial_period_days: 14 },
    success_url: `${appUrl}/dashboard?subscribed=1`,
    cancel_url: `${appUrl}/dashboard`,
    // The webhook (app/api/webhooks/stripe/route.ts) reads this back to
    // know which InvoiceNudge account to attach the subscription to.
    metadata: { user_id: user.id },
  });

  return NextResponse.redirect(session.url!, 303);
}
