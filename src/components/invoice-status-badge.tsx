import type { InvoiceStatus } from "@/types/database";
import { STATUS_BADGE_CLASS, STATUS_LABEL } from "@/lib/invoice-status";
import { cn } from "@/lib/cn";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        STATUS_BADGE_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
