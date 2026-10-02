"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "verifying" | "ready" | "invalid" | "saving" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase reports a used/expired link by redirecting here with an
    // `error` param (query string or fragment). Checked first because the
    // getSession() fallback below can't tell a recovery session from an
    // ordinary logged-in one — without this, someone already signed in
    // (e.g. right after a successful reset) would see the password form for
    // a dead link instead of the "invalid or expired" message.
    const linkError =
      new URLSearchParams(window.location.search).get("error") ??
      new URLSearchParams(window.location.hash.slice(1)).get("error");
    if (linkError) {
      setStatus("invalid");
      return;
    }

    const supabase = createClient();

    // Clicking the email link lands here with the session encoded in the
    // URL fragment (#access_token=...&type=recovery) — createBrowserClient
    // reads that automatically on load and fires this event once the
    // recovery session is actually usable. If the link was already used or
    // has expired, no event fires and this page waits forever without the
    // timeout below.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    // Covers the case where the fragment was already consumed before this
    // listener attached (e.g. a fast reload) — a session existing at all on
    // this page only ever means a recovery session, so it's safe to treat
    // the same as the event above.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus("ready");
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "verifying" ? "invalid" : current));
    }, 5000);

    return () => {
      listener.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const confirm = String(formData.get("confirm") ?? "");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setError(null);
    setStatus("saving");
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setStatus("ready");
      return;
    }

    setStatus("done");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a new password</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "verifying" && (
          <p className="text-sm text-ink-muted">Verifying your link…</p>
        )}

        {status === "invalid" && (
          <div className="space-y-3">
            <p className="text-sm text-rose-600">
              This reset link is invalid or has expired.
            </p>
            <Link href="/forgot-password" className="text-sm text-accent hover:underline">
              Request a new one
            </Link>
          </div>
        )}

        {(status === "ready" || status === "saving" || status === "done") && (
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">New password</Label>
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
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                required
                autoComplete="new-password"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={status !== "ready"}>
              {status === "ready" ? "Set new password" : "Saving…"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
