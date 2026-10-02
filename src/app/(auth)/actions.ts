"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
  message?: string;
  // Echoed back so the form can re-fill itself after a failed submit —
  // never includes the password, so a validation error doesn't require
  // retyping everything *except* the one field that's actually sensitive.
  values?: { email?: string; business_name?: string };
} | null;

export async function signUp(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const businessName = String(formData.get("business_name") ?? "").trim();
  const termsAccepted = formData.get("terms_accepted") === "on";
  const values = { email, business_name: businessName };

  if (!email || !password) {
    return { error: "Email and password are required.", values };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }
  // The checkbox is `required` in the HTML too, but that only stops a
  // regular browser submission — anyone posting to this action directly
  // could skip it, so the actual consent record has to be enforced here,
  // server-side, not just trusted from the client.
  if (!termsAccepted) {
    return { error: "You must agree to the Terms of Service and Privacy Policy.", values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { business_name: businessName },
      // Without this, Supabase falls back to the project's "Site URL"
      // dashboard setting to build the confirmation link — which defaults
      // to localhost from initial local setup and has to be updated
      // manually per environment. Being explicit here means it's always
      // correct regardless of what that setting is left at. Supabase also
      // requires this exact URL (or a pattern matching it) to be in the
      // project's Redirect URLs allow-list, or it's silently ignored.
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    },
  });

  if (error) return { error: error.message, values };

  // If the Supabase project has "Confirm email" enabled, signUp succeeds but
  // returns no session until the user clicks the confirmation link.
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then log in.",
    };
  }

  // New accounts go straight into Stripe Checkout to start their trial —
  // see app/api/subscribe/checkout/route.ts. If they abandon it, they land
  // back on the dashboard with a "subscribe" banner rather than being stuck.
  redirect("/api/subscribe/checkout");
}

export async function signIn(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: "Invalid email or password.", values: { email } };

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
  });

  // Supabase's own API doesn't reveal whether the email matched an account,
  // and neither should this response — telling an attacker "no account with
  // that email" lets them enumerate real customer addresses. A genuine
  // delivery failure (bad API key, etc.) still surfaces as `error` here, but
  // "no such user" never does, so the same message covers both cases.
  if (error) return { error: "Something went wrong. Please try again." };

  return {
    message: "If an account exists for that email, a reset link is on its way.",
  };
}
