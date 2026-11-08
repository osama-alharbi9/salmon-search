// The composer's chip model: what each raw item is and what it matched.
import type { ChipKind } from "@/app/ui";
import type { VdsSearchResponse } from "@/app/lib/api";
import {
  classifyItem,
  cleanTitle,
  countLabel,
  dedupeItems,
  filterLabel,
  splitItems,
  type ClassifiedItem,
} from "@/app/lib/query";
import type { Preview } from "./memory";

/** Below this similarity a matched trope is shown as "Check this match". */
export const WEAK_SIM = 0.85;

/** A title the server expanded into tropes. */
export type ExpandedTitle = { title: string; id: string; tropes: string[] };

export type ChipItem = {
  id: number;
  /** The raw item, exactly as typed. This is what gets searched. */
  text: string;
  cls: ClassifiedItem;
  /** /api/resolve answer for trope chips: undefined while waiting, null for no trope. */
  preview?: Preview;
  /** /api/resolve could not be reached. */
  previewFailed?: boolean;
  /** After a search: the server read this item as a title. */
  expanded?: ExpandedTitle;
  /** After a search: a "like X" item whose title the server did not know. */
  titleMissing?: boolean;
  /** After a search: the server found no trope for it. */
  unknown?: boolean;
};

export type ChipView = {
  kind: ChipKind;
  label: string;
  phrase: string;
  count?: number;
  meta?: string;
};

let nextId = 1;

export function makeChip(text: string, preview?: Preview): ChipItem {
  const t = text.trim();
  return { id: nextId++, text: t, cls: classifyItem(t), preview };
}

/**
 * True for chips that should be sent to /api/resolve: trope phrases, and
 * "like X" items whose title the server did not know (it read them as tropes).
 * Titles and filter clauses never are.
 */
export function needsPreview(c: ChipItem): boolean {
  if (c.preview !== undefined || c.previewFailed) return false;
  return c.cls.kind === "trope" || (c.cls.kind === "title" && !!c.titleMissing);
}

/** Split typed or pasted text into items (on +), dropping ones already present. */
export function newItems(text: string, existing: readonly ChipItem[]): string[] {
  const have = new Set(existing.map((c) => c.text.toLowerCase()));
  return dedupeItems(splitItems(text)).filter((t) => !have.has(t.toLowerCase()));
}

function namespaceOf(id: string): string {
  return id.split("/")[0] ?? "";
}

/** How a chip looks and reads (DESIGN.md 5.4). */
export function chipView(c: ChipItem): ChipView {
  const phrase = c.text;
  if (c.cls.kind === "filter") {
    return { kind: "filter", label: filterLabel(c.cls.mode, c.cls.media, "suffix"), phrase };
  }
  if (c.expanded) {
    return {
      kind: "title",
      label: cleanTitle(c.expanded.title, namespaceOf(c.expanded.id)),
      phrase,
      meta: countLabel(c.expanded.tropes.length, "trope"),
    };
  }
  if (c.cls.kind === "title") {
    if (c.titleMissing) {
      // The server found no such work and read the whole item as a trope phrase.
      if (c.preview) {
        return { kind: "weak", label: c.preview.trope, phrase, meta: "No work with this title" };
      }
      return { kind: "unknown", label: c.cls.title, phrase, meta: "No work with this title" };
    }
    return { kind: "title", label: c.cls.title, phrase };
  }
  if (c.unknown) return { kind: "unknown", label: c.text, phrase };
  if (c.previewFailed) return { kind: "unknown", label: c.text, phrase, meta: "Not checked" };
  if (c.preview === undefined) return { kind: "pending", label: c.text, phrase };
  if (c.preview === null) return { kind: "unknown", label: c.text, phrase };
  const p = c.preview;
  if (p.sim < WEAK_SIM) return { kind: "weak", label: p.trope, phrase, count: p.count };
  return { kind: "resolved", label: p.trope, phrase, count: p.count };
}

/** True when the chip is a loose match the person should check. */
export function isWeak(c: ChipItem): boolean {
  return chipView(c).kind === "weak";
}

/**
 * The tropes each expanded title became. The server adds title tropes first,
 * in item order, then the phrase tropes, so each title's tropes are the next
 * n_pulled entries of `tropes`.
 */
export function expandedTitles(res: VdsSearchResponse): Map<string, ExpandedTitle> {
  const out = new Map<string, ExpandedTitle>();
  let at = 0;
  for (const t of res.titles) {
    const tropes = res.tropes.slice(at, at + t.n_pulled);
    at += t.n_pulled;
    out.set(t.input.trim().toLowerCase(), { title: t.title, id: t.id, tropes });
  }
  return out;
}

/** Copy what a finished search learned about each item onto the chips. */
export function applySearch(chips: ChipItem[], items: string[], res: VdsSearchResponse): ChipItem[] {
  const searched = new Set(items.map((i) => i.toLowerCase()));
  const titles = expandedTitles(res);
  const unknown = new Set(res.unknown.map((u) => u.trim().toLowerCase()));
  return chips.map((c) => {
    const k = c.text.toLowerCase();
    if (!searched.has(k) || c.cls.kind === "filter") return c;
    const expanded = titles.get(k);
    return {
      ...c,
      expanded,
      titleMissing: c.cls.kind === "title" && !expanded,
      unknown: !expanded && unknown.has(k),
    };
  });
}
