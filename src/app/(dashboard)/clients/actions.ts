"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessLevel } from "@/lib/subscription";

export type ClientActionState = { error?: string; ok?: boolean };

export async function createClientRecord(
  _prevState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "").trim();

  if (!name || !email) {
    return { error: "Name and email are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status, current_period_end")
    .eq("id", user.id)
    .single();
  if (profile && getAccessLevel(profile) !== "full") {
    return { error: "Your subscription isn't active — reactivate billing to add clients." };
  }

  const { error } = await supabase.from("clients").insert({
    user_id: user.id,
    name,
    email,
    business_name: businessName,
  });

  if (error) return { error: error.message };

  revalidatePath("/clients");
  return { ok: true };
}

export async function deleteClientRecord(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Deleting a client cascades to their invoices (see the FK in
  // 0001_init.sql) — the confirm() in <ConfirmSubmitButton> is the only
  // guard against an accidental click.
  await supabase.from("clients").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/clients");
}
