import { formatCents, formatDate } from "@/lib/format";

export interface MergeFieldContext {
  clientName: string;
  amountCents: number;
  dueDate: string; // "YYYY-MM-DD"
  invoiceLink: string;
  businessName: string;
}

/** The merge fields available in reminder templates, for the settings UI. */
export const MERGE_FIELDS = [
  { token: "{{client_name}}", label: "Client name" },
  { token: "{{amount}}", label: "Invoice amount" },
  { token: "{{due_date}}", label: "Due date" },
  { token: "{{invoice_link}}", label: "Link to the invoice" },
  { token: "{{business_name}}", label: "Your business name" },
] as const;

/** Substitutes merge-field tokens (e.g. "{{client_name}}") into a template string. */
export function renderTemplate(template: string, ctx: MergeFieldContext): string {
  return template
    .replaceAll("{{client_name}}", ctx.clientName)
    .replaceAll("{{amount}}", formatCents(ctx.amountCents))
    .replaceAll("{{due_date}}", formatDate(ctx.dueDate))
    .replaceAll("{{invoice_link}}", ctx.invoiceLink)
    .replaceAll("{{business_name}}", ctx.businessName);
}
