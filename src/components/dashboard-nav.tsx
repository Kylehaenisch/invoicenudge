"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/clients", label: "Clients" },
  { href: "/invoices", label: "Invoices" },
  { href: "/settings/templates", label: "Reminder templates" },
  { href: "/settings/billing", label: "Billing" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    // Wraps instead of scrolling horizontally — at narrow widths a hidden
    // overflow-x-auto has no visible hint that "Billing" exists off-screen,
    // and there are only 5 short links, so a second row is simpler than
    // teaching a scroll affordance.
    <nav className="flex flex-wrap gap-1">
      {LINKS.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/dashboard" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-accent-soft text-accent-dark"
                : "text-ink-muted hover:bg-black/5 hover:text-ink",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
