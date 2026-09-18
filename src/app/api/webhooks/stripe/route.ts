import { type NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionStatus } from "@/types/database";

// The Stripe SDK's crypto verification needs the Node runtime, not Edge.
export const runtime = "nodejs";

/**
 * Stripe's own `Subscription.Status` type includes a branded catch-all for
 * statuses they might add later, so it's wider than our SubscriptionStatus
 * union. We store whatever Stripe actually sends (see the migration) — this
 * cast just tells TypeScript we're trusting that at runtime.
 */
function toStoredStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  return status as SubscriptionStatus;
}

/**
 * In this Stripe API version, current_period_end lives on each subscription
 * *item*, not the subscription itself (a breaking change from older
 * versions/training data — see AGENTS.md). InvoiceNudge subscriptions are
 * always single-item, so the first item's period covers the whole thing.
 */
function getCurrentPeriodEnd(subscription: Stripe.Subscription): string | null {
  const seconds = subscription.items.data[0]?.current_period_end;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature!,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 },
    );
  }

  const supabase = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.mode === "subscription") {
      // This is a user paying *you* for InvoiceNudge itself — see
      // app/api/subscribe/checkout/route.ts.
      const userId = session.metadata?.user_id;
      if (userId && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription,
        );
        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subscription.id,
            subscription_status: toStoredStatus(subscription.status),
            current_period_end: getCurrentPeriodEnd(subscription),
          })
          .eq("id", userId);
      }
    } else {
      // This is one of your users' *clients* paying an invoice — see
      // app/api/public/invoices/[token]/checkout/route.ts.
      const invoiceId = session.metadata?.invoice_id;
      if (invoiceId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        // .neq("status", "paid") makes this idempotent if Stripe retries
        // the webhook, or if the photographer already hit "Mark as paid".
        await supabase
          .from("invoices")
          .update({
            status: "paid",
            paid_at: new Date().toISOString(),
            stripe_payment_intent_id: paymentIntentId,
          })
          .eq("id", invoiceId)
          .neq("status", "paid");
      }
    }
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    await supabase
      .from("profiles")
      .update({
        subscription_status: toStoredStatus(subscription.status),
        current_period_end: getCurrentPeriodEnd(subscription),
      })
      .eq("stripe_customer_id", customerId);
  }

  return NextResponse.json({ received: true });
}
