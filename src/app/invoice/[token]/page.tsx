import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatCents, formatDate } from "@/lib/format";
import { getDisplayStatus } from "@/lib/invoice-status";
import type { InvoiceWithClient, Profile } from "@/types/database";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Service-role client: this page has no logged-in user to scope RLS to —
  // possession of the (unguessable, uuid) token in the URL is the only
  // authorization, same as any "share link" feature. See lib/supabase/admin.ts.
  const supabase = createAdminClient();

  const { data: invoiceRaw } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("public_token", token)
    .single();

  // See the same note in app/(dashboard)/invoices/[id]/page.tsx — the
  // hand-authored Database type has no FK "Relationships" metadata, so a
  // joined select needs an explicit cast.
  const invoice = invoiceRaw as InvoiceWithClient | null;

  if (!invoice) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", invoice.user_id)
    .single();

  const client = invoice.client;
  const displayStatus = getDisplayStatus(invoice);
  const businessName =
    (profile as Profile | null)?.business_name || "Your photographer";

  return (
    <div className="min-h-screen bg-paper px-4 py-12">
      <div className="mx-auto max-w-lg">
        <p className="mb-6 text-center font-serif text-xl text-ink">
          {businessName}
        </p>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Invoice</CardTitle>
            <InvoiceStatusBadge status={displayStatus} />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="font-serif text-4xl text-ink">
                {formatCents(invoice.amount_cents)}
              </p>
              <p className="mt-1 text-sm text-ink-muted">
                {invoice.status === "paid"
                  ? "Paid"
                  : `Due ${formatDate(invoice.due_date)}`}
              </p>
            </div>

            {invoice.description && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                  Description
                </p>
                <p className="mt-1 text-sm text-ink">{invoice.description}</p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                Billed to
              </p>
              <p className="mt-1 text-sm text-ink">{client.name}</p>
            </div>

            {invoice.status !== "paid" && invoice.status !== "draft" && (
              <form
                method="POST"
                action={`/api/public/invoices/${token}/checkout`}
              >
                <Button type="submit" className="w-full">
                  Pay {formatCents(invoice.amount_cents)}
                </Button>
              </form>
            )}

            {invoice.status === "paid" && (
              <p className="rounded-md bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-700">
                This invoice has been paid — thank you!
              </p>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Paying by another method (check, transfer)? Just let{" "}
          {businessName} know directly — no need to use this link.
        </p>
      </div>
    </div>
  );
}
