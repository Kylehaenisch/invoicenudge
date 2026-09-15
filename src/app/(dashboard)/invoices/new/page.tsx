import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InvoiceForm } from "./invoice-form";
import { addDaysToDateOnly, todayDateOnly } from "@/lib/format";
import type { Client } from "@/types/database";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("name", { ascending: true });

  const rows = (clients ?? []) as Client[];
  const today = todayDateOnly();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">New invoice</h1>
        <p className="text-sm text-ink-muted">
          Reminders start automatically once an invoice is marked &quot;Sent.&quot;
        </p>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-ink-muted">
              You need at least one client before creating an invoice.
            </p>
            <Link href="/clients" className="mt-3 inline-block">
              <Button>Add a client</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice details</CardTitle>
          </CardHeader>
          <CardContent>
            <InvoiceForm
              clients={rows}
              defaultIssueDate={today}
              defaultDueDate={addDaysToDateOnly(today, 14)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
