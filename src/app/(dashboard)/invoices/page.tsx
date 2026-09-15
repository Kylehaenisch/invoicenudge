import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatCents, formatDate } from "@/lib/format";
import { getDisplayStatus } from "@/lib/invoice-status";
import { cn } from "@/lib/cn";
import type { InvoiceStatus, InvoiceWithClient } from "@/types/database";

const FILTERS: { value: InvoiceStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent" },
  { value: "overdue", label: "Overdue" },
  { value: "paid", label: "Paid" },
];

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: statusParam } = await searchParams;
  const activeFilter = (statusParam ?? "all") as InvoiceStatus | "all";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoicesRaw } = await supabase
    .from("invoices")
    .select("*, client:clients(*)")
    .eq("user_id", user!.id)
    .order("due_date", { ascending: true });

  const invoices = ((invoicesRaw ?? []) as InvoiceWithClient[]).map((inv) => ({
    ...inv,
    displayStatus: getDisplayStatus(inv),
  }));

  const filtered =
    activeFilter === "all"
      ? invoices
      : invoices.filter((inv) => inv.displayStatus === activeFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">Invoices</h1>
          <p className="text-sm text-ink-muted">
            {invoices.length} total.
          </p>
        </div>
        <Link href="/invoices/new">
          <Button>New invoice</Button>
        </Link>
      </div>

      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "all" ? "/invoices" : `/invoices?status=${f.value}`}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium",
              activeFilter === f.value
                ? "bg-accent-soft text-accent-dark"
                : "text-ink-muted hover:bg-black/5 hover:text-ink",
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="pt-5">
          {filtered.length === 0 ? (
            <EmptyState message="No invoices match this filter." />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((inv) => (
                <li key={inv.id} className="py-3">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-ink">{inv.client.name}</p>
                      <p className="text-sm text-ink-muted">
                        {inv.description || "No description"} · Due{" "}
                        {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-ink">
                        {formatCents(inv.amount_cents)}
                      </span>
                      <InvoiceStatusBadge status={inv.displayStatus} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
