import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
    size === "md" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-xs",
    variant === "primary" &&
      "bg-accent text-white hover:bg-accent-dark shadow-sm",
    variant === "secondary" &&
      "border border-border bg-surface text-ink hover:border-ink-muted",
    variant === "ghost" && "text-ink-muted hover:bg-black/5 hover:text-ink",
    variant === "danger" &&
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100",
    className,
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";
