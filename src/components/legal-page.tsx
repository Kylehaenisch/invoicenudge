import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-6 sm:px-6">
        <Link href="/" className="font-serif text-xl text-ink">
          InvoiceNudge
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ink-muted">
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <h1 className="font-serif text-3xl text-ink">{title}</h1>
        <p className="mt-2 text-sm text-ink-muted">Last updated {lastUpdated}</p>

        <div className="prose-legal mt-8 space-y-6 text-sm leading-relaxed text-ink">
          {children}
        </div>
      </main>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-ink-muted sm:px-6">
        InvoiceNudge — built for freelance photographers.
      </footer>
    </div>
  );
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="font-serif text-lg text-ink">{heading}</h2>
      <div className="mt-2 space-y-3 text-ink-muted">{children}</div>
    </section>
  );
}
