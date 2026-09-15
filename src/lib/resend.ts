import { Resend } from "resend";

let cached: Resend | null = null;

export function getResendClient(): Resend {
  if (!cached) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }
    cached = new Resend(process.env.RESEND_API_KEY);
  }
  return cached;
}

export function getFromAddress(): string {
  return process.env.REMINDER_FROM_EMAIL ?? "InvoiceNudge <onboarding@resend.dev>";
}
