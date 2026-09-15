"use client";

import { useActionState } from "react";
import { createInvoice, type InvoiceFormState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Client } from "@/types/database";

const initialState: InvoiceFormState = {};

export function InvoiceForm({
  clients,
  defaultIssueDate,
  defaultDueDate,
}: {
  clients: Client[];
  defaultIssueDate: string;
  defaultDueDate: string;
}) {
  const [state, formAction, pending] = useActionState(
    createInvoice,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="client_id">Client</Label>
        <Select id="client_id" name="client_id" required defaultValue="">
          <option value="" disabled>
            Select a client
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.business_name ? ` (${c.business_name})` : ""}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="amount">Amount (USD)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="1250.00"
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue="sent">
            <option value="draft">Draft (no reminders yet)</option>
            <option value="sent">Sent (reminders start)</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Wedding photography — full day coverage"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="issue_date">Issue date</Label>
          <Input
            id="issue_date"
            name="issue_date"
            type="date"
            defaultValue={defaultIssueDate}
            required
          />
        </div>
        <div>
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={defaultDueDate}
            required
          />
        </div>
      </div>

      {state.error && <p className="text-sm text-rose-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create invoice"}
      </Button>
    </form>
  );
}
