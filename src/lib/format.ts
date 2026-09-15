/** Formats integer cents as a USD currency string, e.g. 125000 -> "$1,250.00". */
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Parses a plain "YYYY-MM-DD" SQL date column as a local calendar date.
 *
 * `new Date("2026-01-15")` parses as UTC midnight, which renders as Jan 14 in
 * any timezone west of UTC — a classic off-by-one-day bug for date-only
 * values. Splitting and constructing with the local constructor avoids it.
 */
export function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parseDateOnly(dateStr));
}

/** Today as a "YYYY-MM-DD" string in the server's local calendar day. */
export function todayDateOnly(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Adds `days` (may be negative) to a "YYYY-MM-DD" string, returning the same format. */
export function addDaysToDateOnly(dateStr: string, days: number): string {
  const date = parseDateOnly(dateStr);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Whole-day difference (b - a), ignoring time-of-day. */
export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const utcA = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const utcB = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((utcB - utcA) / msPerDay);
}
