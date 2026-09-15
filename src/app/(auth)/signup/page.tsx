"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUp, type AuthActionState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState<
    AuthActionState,
    FormData
  >(signUp, null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <p className="mt-1 text-sm text-ink-muted">
          Start chasing unpaid invoices automatically.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input
              id="business_name"
              name="business_name"
              placeholder="e.g. Kyle Haenisch Photography"
              autoComplete="organization"
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
            />
            <p className="mt-1 text-xs text-ink-muted">At least 8 characters.</p>
          </div>
          {state?.error && (
            <p className="text-sm text-rose-600">{state.error}</p>
          )}
          {state?.message && (
            <p className="text-sm text-emerald-700">{state.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Creating account…" : "Sign up"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
