import type { ReactNode } from "react";

export function EmptyState({
  message,
  action,
}: {
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-10 text-center">
      <p className="text-sm text-ink-muted">{message}</p>
      {action}
    </div>
  );
}
