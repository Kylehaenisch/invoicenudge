import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const FEATURES = [
  {
    title: "Invoices that chase themselves",
    body: "Four reminders go out automatically — before the due date, on it, and twice after — so you never have to send an awkward follow-up email again.",
  },
  {
    title: "Your words, not a template's",
    body: "Every reminder is fully editable with merge fields for client name, amount, due date, and a link straight to the invoice.",
  },
  {
    title: "One glance, full picture",
    body: "See total outstanding, overdue invoices, and what's coming due — mark something paid and the reminders stop instantly.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 sm:px-6">
        <span className="font-serif text-xl text-ink">InvoiceNudge</span>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-ink-muted hover:text-ink">
            Log in
          </Link>
          <Link href="/signup">
            <Button size="sm">Sign up</Button>
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="bg-grain pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
          <h1 className="font-serif text-4xl leading-tight text-ink sm:text-5xl">
            Get paid without playing bill collector.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-muted">
            InvoiceNudge sends the follow-up emails you keep meaning to write —
            so your photography business collects what it&apos;s owed while
            you&apos;re out shooting.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/signup">
              <Button size="md">Start free</Button>
            </Link>
            <Link href="/login">
              <Button size="md" variant="secondary">
                Log in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="p-6">
              <h2 className="font-serif text-lg text-ink">{f.title}</h2>
              <p className="mt-2 text-sm text-ink-muted">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <footer className="border-t border-border px-4 py-8 text-center text-xs text-ink-muted sm:px-6">
        InvoiceNudge — built for freelance photographers.
      </footer>
    </div>
  );
}
