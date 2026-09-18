import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe";

/**
 * Sends the signed-in user to Stripe's hosted Customer Portal, where they
 * can update their card, view billing history, or cancel — self-service,
 * no UI for any of that needs to be built here.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  // No Stripe Customer yet means they've never started a subscription —
  // send them to start one instead of a portal that has nothing to show.
  if (!profile?.stripe_customer_id) {
    redirect("/api/subscribe/checkout");
  }

  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
  });

  return NextResponse.redirect(session.url, 303);
}
