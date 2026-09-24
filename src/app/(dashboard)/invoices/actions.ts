"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAccessLevel } from "@/lib/subscription";
import { sendInvoiceCreatedNotification } from "@/lib/send-invoice-notification";

export type InvoiceFormState = { error?: string };

export async function createInvoice(
  _prevState: InvoiceFormState,
  formData: FormData,
): Promise<InvoiceFormState> {
  const clientId = String(formData.get("client_id") ?? "");
  const amountDollars = String(formData.get("amount") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const issueDate = String(formData.get("issue_date") ?? "");
  const dueDate = String(formData.get("due_date") ?? "");
  const status = String(formData.get("status") ?? "draft");

  const amount = Number(amountDollars);
  if (!clientId) return { error: "Choose a client." };
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter an amount greater than $0." };
  }
  if (!dueDate) return { error: "Due date is required." };
  if (issueDate && dueDate < issueDate) {
    return { error: "Due date can't be before the issue date." };
  }
  if (!["draft", "sent"].includes(status)) {
    return { error: "Invalid status." };
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
    return { error: "Your subscription isn't active — reactivate billing to create invoices." };
  }

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      user_id: user.id,
      client_id: clientId,
      amount_cents: Math.round(amount * 100),
      description,
      issue_date: issueDate || undefined,
      due_date: dueDate,
      status: status as "draft" | "sent",
    })
    .select("id")
    .single();

  if (error || !invoice) return { error: error?.message ?? "Could not create invoice." };

  if (status === "sent") {
    await sendInvoiceCreatedNotification(invoice.id, user.id);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices/${invoice.id}`);
}

export async function markInvoicePaid(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Setting status to 'paid' is the only thing the reminders cron checks —
  // see lib/reminders.ts — so this alone stops all future reminder emails.
  await supabase
    .from("invoices")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function markInvoiceSent(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("invoices")
    .update({ status: "sent" })
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "draft");

  await sendInvoiceCreatedNotification(id, user.id);

  revalidatePath(`/invoices/${id}`);
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
}

export async function deleteInvoice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("invoices").delete().eq("id", id).eq("user_id", user.id);

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect("/invoices");
}
