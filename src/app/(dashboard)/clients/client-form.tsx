"use client";

import { useActionState, useEffect, useRef } from "react";
import { createClientRecord, type ClientActionState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ClientActionState = {};

export function ClientForm() {
  const [state, formAction, pending] = useActionState(
    createClientRecord,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // `state` is a fresh object on every action result (never the same
  // reference twice), so this fires exactly once per successful submit —
  // unlike comparing against a primitive like `null`, which two different
  // "no error" results would look identical to react and only reset once.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="name">Client name</Label>
        <Input id="name" name="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="business_name">Business name (optional)</Label>
        <Input id="business_name" name="business_name" />
      </div>
      {state.error && (
        <p className="text-sm text-rose-600 sm:col-span-3">{state.error}</p>
      )}
      <div className="sm:col-span-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add client"}
        </Button>
      </div>
    </form>
  );
}
