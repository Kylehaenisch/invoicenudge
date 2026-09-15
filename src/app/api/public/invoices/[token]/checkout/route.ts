import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe";
import type { InvoiceWithClient } from "@/types/database";

/**
 * Creates a Stripe Checkout Session for a publicly-linked invoice and
 * redirects the browser straight to it. Authorization is the token itself
 * (see the public invoice page) — there's no signed-in user on this path.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const supabase = createAdminClient();

  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("public_token", token)
    .single();

  // See the note in app/(dashboard)/invoices/[id]/page.tsx — no FK
  // "Relationships" metadata in the hand-authored Database type, so a
  // joined select needs an explicit cast.
  const invoice = invoiceRaw as InvoiceWithClient | null;

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.status === "draft") {
    return NextResponse.json({ error: "Invoice not yet sent" }, { status: 400 });
  }
  if (invoice.status === "paid") {
    return NextResponse.redirect(
      new URL(`/invoice/${token}`, request.url),
      303,
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const stripe = getStripeClient();
  const client = invoice.client;

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: invoice.description || "Invoice payment",
          },
          unit_amount: invoice.amount_cents,
        },
        quantity: 1,
      },
    ],
    customer_email: client.email,
    success_url: `${appUrl}/invoice/${token}?paid=1`,
    cancel_url: `${appUrl}/invoice/${token}`,
    // The webhook (app/api/webhooks/stripe/route.ts) reads this back to know
    // which invoice to mark paid.
    metadata: { invoice_id: invoice.id, public_token: token },
  });

  await supabase
    .from("invoices")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", invoice.id);

  return NextResponse.redirect(session.url!, 303);
}
