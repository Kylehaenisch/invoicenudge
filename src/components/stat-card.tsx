import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger";
}) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-serif text-3xl",
          tone === "danger" ? "text-rose-600" : "text-ink",
        )}
      >
        {value}
      </p>
    </Card>
  );
}
