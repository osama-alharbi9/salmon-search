// Date helpers for /history and /saved. Pure; "now" is read inside each call so
// components stay pure during render.

/**
 * Parse a created_at from the API. SQLite returns naive UTC ("2026-11-06T23:26:47",
 * sometimes with a space), Postgres an offset; a naive time is treated as UTC.
 */
export function parseServerDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  let s = raw.trim().replace(" ", "T");
  if (!/(?:Z|[+-]\d{2}:?\d{2})$/i.test(s)) s += "Z";
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Key for grouping by local calendar day. */
export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

/** "Today", "Yesterday", "Wednesday, November 5" (with the year when it isn't this year). */
export function dayLabel(d: Date): string {
  const now = new Date();
  const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

/** "11:26 PM", local time. */
export function timeLabel(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/** "Nov 6", or "Nov 6, 2025" when it isn't this year. */
export function shortDate(d: Date): string {
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
}
