"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TemplateActionState = { error?: string; ok?: boolean };

export async function updateTemplate(
  _prevState: TemplateActionState,
  formData: FormData,
): Promise<TemplateActionState> {
  const id = String(formData.get("id") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const enabled = formData.get("enabled") === "on";

  if (!subject || !body) {
    return { error: "Subject and body are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase
    .from("reminder_templates")
    .update({ subject, body, enabled })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/templates");
  return { ok: true };
}
