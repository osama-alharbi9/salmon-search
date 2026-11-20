// Reads ?next= on the server for /login and /signup. Pure (no "use client"),
// so the server pages can call it.
import { safeNext } from "../lib/query";

export type AuthSearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * `next`: where to go after success, a same-origin path (default /app).
 * `keepNext`: the validated ?next= to carry to the other form's link, or null
 * when the visitor didn't bring one (so the links stay plain /login, /signup).
 */
export async function readNext(searchParams: AuthSearchParams) {
  const raw = (await searchParams).next;
  const value = typeof raw === "string" ? raw : null;
  const kept = safeNext(value, "");
  return { next: kept || "/app", keepNext: kept || null };
}
