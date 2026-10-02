"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(requestPasswordReset, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          We&apos;ll email you a link to set a new one.
        </p>
      </CardHeader>
      <CardContent>
        {state?.message ? (
          <p className="text-sm text-emerald-700">{state.message}</p>
        ) : (
          <form action={formAction} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                defaultValue={state?.values?.email ?? ""}
              />
            </div>
            {state?.error && (
              <p className="text-sm text-rose-600">{state.error}</p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm text-ink-muted">
          <Link href="/login" className="text-accent hover:underline">
            Back to log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
