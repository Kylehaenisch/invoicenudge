import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmSubmitButton } from "@/components/confirm-submit-button";
import { ClientForm } from "./client-form";
import { deleteClientRecord } from "./actions";
import type { Client } from "@/types/database";

export default async function ClientsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const rows = (clients ?? []) as Client[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl text-ink">Clients</h1>
        <p className="text-sm text-ink-muted">
          Everyone you invoice, in one place.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a client</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All clients</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <EmptyState message="No clients yet — add your first one above." />
          ) : (
            <ul className="divide-y divide-border">
              {rows.map((client) => (
                <li
                  key={client.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{client.name}</p>
                    <p className="text-sm text-ink-muted">
                      {client.email}
                      {client.business_name ? ` · ${client.business_name}` : ""}
                    </p>
                  </div>
                  <form action={deleteClientRecord}>
                    <input type="hidden" name="id" value={client.id} />
                    <ConfirmSubmitButton
                      variant="ghost"
                      size="sm"
                      type="submit"
                      confirmMessage={`Delete ${client.name}? This also deletes their invoices.`}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
