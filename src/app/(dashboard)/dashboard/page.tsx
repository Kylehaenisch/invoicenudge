import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { InvoiceStatusBadge } from "@/components/invoice-status-badge";
import { formatCents, formatDate } from "@/lib/format";
import { getDisplayStatus } from "@/lib/invoice-status";
import type { InvoiceWithClient } from "@/types/database";

export default async function DashboardPage() {
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

  const outstanding = invoices.filter(
    (i) => i.displayStatus === "sent" || i.displayStatus === "overdue",
  );
  const totalOutstandingCents = outstanding.reduce(
    (sum, i) => sum + i.amount_cents,
    0,
  );
  const overdueCount = invoices.filter(
    (i) => i.displayStatus === "overdue",
  ).length;
  const upcoming = invoices
    .filter((i) => i.displayStatus === "sent" || i.displayStatus === "overdue")
    .slice(0, 6);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">
            A snapshot of who owes you money.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/clients">
            <Button variant="secondary">Add a client</Button>
          </Link>
          <Link href="/invoices/new">
            <Button>New invoice</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total outstanding" value={formatCents(totalOutstandingCents)} />
        <StatCard
          label="Overdue invoices"
          value={String(overdueCount)}
          tone={overdueCount > 0 ? "danger" : "default"}
        />
        <StatCard label="Open invoices" value={String(outstanding.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming &amp; overdue</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <EmptyState message="Nothing outstanding right now — nice." />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium text-ink hover:text-accent"
                    >
                      {inv.client.name}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      Due {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-ink">
                      {formatCents(inv.amount_cents)}
                    </span>
                    <InvoiceStatusBadge status={inv.displayStatus} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
