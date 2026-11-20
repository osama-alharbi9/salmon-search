// In-tab memory for the search page. Module state survives client-side
// navigation (results -> work page -> Back), so going back to /app?q=… shows
// the same chips and results at once instead of searching again.
import type { ResolvedTrope, VdsSearchResponse } from "@/app/lib/api";

const MAX_RESULTS = 30;
const results = new Map<string, VdsSearchResponse>();

/** A finished search for this /app?q=… link, if this tab ran it recently. */
export function cachedResult(key: string): VdsSearchResponse | undefined {
  return results.get(key);
}

export function rememberResult(key: string, res: VdsSearchResponse) {
  results.delete(key);
  results.set(key, res);
  while (results.size > MAX_RESULTS) {
    const oldest = results.keys().next().value;
    if (oldest === undefined) break;
    results.delete(oldest);
  }
}

/** What a phrase matched in /api/resolve: the trope, or null for no trope. */
export type Preview = ResolvedTrope | null;
const previews = new Map<string, Preview>();

export function cachedPreview(phrase: string): Preview | undefined {
  return previews.get(phrase.trim().toLowerCase());
}

export function rememberPreview(phrase: string, preview: Preview) {
  previews.set(phrase.trim().toLowerCase(), preview);
}

// ── Back and Forward ─────────────────────────────────────────────────────────
// The page a Back or Forward landed on. When the search page mounts or syncs
// right after one, it is a return to a search already shown: it comes back as
// it was, without moving focus or adding to history. Every other arrival (a
// link, Run again, an example) is a new search. Registered once per tab, in
// the capture phase so they run before the router's own listeners: the router
// can re-render the page, and sync it, before popstate even fires, so the
// Navigation API's "navigate" event (a traverse) is the first sign where the
// browser has it; popstate covers the rest.
let poppedTo: string | null = null;

type TraverseEvent = Event & { navigationType?: string; destination?: { url?: string } };

if (typeof window !== "undefined") {
  const nav = (window as Window & { navigation?: EventTarget }).navigation;
  nav?.addEventListener(
    "navigate",
    (e) => {
      const ev = e as TraverseEvent;
      if (ev.navigationType !== "traverse" || !ev.destination?.url) return;
      const u = new URL(ev.destination.url);
      poppedTo = u.pathname + u.search;
    },
    true,
  );
  window.addEventListener(
    "popstate",
    () => {
      poppedTo = window.location.pathname + window.location.search;
    },
    true,
  );
}

/** True if the last Back or Forward landed on `here` (path and query). Reading clears it. */
export function consumeReturn(here: string): boolean {
  const hit = poppedTo === here;
  poppedTo = null;
  return hit;
}

// ── "Back to results" on the work page ───────────────────────────────────────
// Set when someone opens a work from the result list, so the work page knows
// the previous history entry is /app and can use history.back().
let lastOpened: { from: string; to: string } | null = null;

export function rememberOpenedFromResults(from: string, to: string) {
  lastOpened = { from, to };
}

/** The /app link the work at `path` was opened from, if it was opened from results. */
export function openedFromResults(path: string): string | null {
  return lastOpened && lastOpened.to === path ? lastOpened.from : null;
}
