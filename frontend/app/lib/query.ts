// Pure helpers for search items, /app links and media labels. No React, no DOM,
// no imports: node --test runs this file directly (type stripping), so keep the
// syntax erasable (no enums, no namespaces, no parameter properties).

// ── /app?q= parsing ───────────────────────────────────────────────────────────

/** decodeURIComponent that keeps malformed sequences as written instead of throwing. */
function decodePiece(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw.replace(/(?:%[0-9a-f]{2})+/gi, (seq) => {
      try {
        return decodeURIComponent(seq);
      } catch {
        return seq;
      }
    });
  }
}

/** Decode a query-string value the way a form submission encodes it (+ is a space). */
function decodeFormValue(raw: string): string {
  return decodePiece(raw.replace(/\+/g, " "));
}

/** The raw (still encoded) value of `key` in a search string, or null. */
function rawParam(search: string, key: string): string | null {
  const s = search.startsWith("?") ? search.slice(1) : search;
  if (!s) return null;
  for (const pair of s.split("&")) {
    if (!pair) continue;
    const eq = pair.indexOf("=");
    const k = decodeFormValue(eq === -1 ? pair : pair.slice(0, eq));
    if (k === key) return eq === -1 ? "" : pair.slice(eq + 1);
  }
  return null;
}

/** Split text on + into trimmed, non-empty items. */
export function splitItems(text: string): string[] {
  return text
    .split("+")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Drop case-insensitive duplicates, keeping the first spelling. */
export function dedupeItems(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const k = it.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it.trim());
  }
  return out;
}

/**
 * Split the q value of /app?q= (and ?trope=) into search items.
 *
 * URLSearchParams turns a literal + into a space, which collapsed README links
 * like `/app?q=true companions + the caper + anti-hero` into one item. Rule, on
 * the raw q value:
 * - contains %2B: decode normally (+ is a space), then split on the decoded +.
 * - else contains %20 or a raw space: every literal + is a separator.
 * - else decode normally (a one-item form value like `q=true+companions`).
 * `?trope=Name` adds one item, placed first. Duplicates are dropped.
 *
 * @param rawSearch `window.location.search`, with or without the leading "?".
 */
export function parseQueryParam(rawSearch: string): string[] {
  const items: string[] = [];

  const trope = rawParam(rawSearch, "trope");
  if (trope !== null) {
    const t = decodeFormValue(trope).trim();
    if (t) items.push(t);
  }

  const q = rawParam(rawSearch, "q");
  if (q !== null && q !== "") {
    if (/%2b/i.test(q)) {
      items.push(...splitItems(decodeFormValue(q)));
    } else if (/%20| /.test(q)) {
      for (const part of q.split("+")) {
        const t = decodePiece(part).trim();
        if (t) items.push(t);
      }
    } else {
      items.push(...splitItems(decodeFormValue(q)));
    }
  }

  return dedupeItems(items);
}

/**
 * The shareable /app link for a list of items: `/app?q=a%20%2B%20b`.
 * Items are joined with " + " and encoded with encodeURIComponent, so a + is
 * sent as %2B and parseQueryParam splits it back into the same items.
 */
export function appHref(items: string[]): string {
  const clean = items.map((s) => s.trim()).filter(Boolean);
  if (!clean.length) return "/app";
  return `/app?q=${encodeURIComponent(clean.join(" + "))}`;
}

/** `/app?trope=Name`, used by trope links on the work page. */
export function tropeHref(trope: string): string {
  return `/app?trope=${encodeURIComponent(trope)}`;
}

/** `/work/Namespace/Slug` with each segment encoded. `id` is "Namespace/Slug". */
export function workHref(id: string): string {
  return `/work/${id.split("/").map(encodeURIComponent).join("/")}`;
}

/**
 * A safe same-origin path for ?next=, or the fallback. Rejects absolute URLs,
 * protocol-relative `//host` and backslash tricks.
 */
export function safeNext(raw: string | null | undefined, fallback = "/app"): string {
  if (!raw) return fallback;
  const v = raw.trim();
  if (!v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return fallback;
  for (let i = 0; i < v.length; i++) {
    if (v.charCodeAt(i) < 32) return fallback;
  }
  return v;
}

/** Longest saved-search name, the same in Save search and Rename. */
export const SEARCH_NAME_MAX = 60;

/** `/login?next=…` (or /signup) for a same-origin path. */
export function authHref(kind: "login" | "signup", next?: string | null): string {
  const n = safeNext(next ?? null, "");
  return n ? `/${kind}?next=${encodeURIComponent(n)}` : `/${kind}`;
}

// ── medium aliases (copied from backend/app/vds.py) ───────────────────────────

/** Spoken media words for each corpus namespace. Same table as backend/app/vds.py. */
export const MEDIUM_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Film: ["films", "film", "movies", "movie", "cinema"],
  Series: ["tv shows", "tv show", "tv series", "television", "series", "shows", "show", "tv"],
  Anime: ["anime"],
  Manga: ["manga"],
  Literature: ["literature", "books", "book", "novels", "novel"],
  VideoGame: ["video games", "video game", "videogames", "videogame", "games", "game"],
  WesternAnimation: ["western animation", "cartoons", "cartoon"],
  VisualNovel: ["visual novels", "visual novel", "vns", "vn"],
  ComicBook: ["comic books", "comic book", "comics", "comic"],
  Webcomic: ["webcomics", "webcomic"],
  TabletopGame: ["tabletop games", "tabletop game", "tabletop"],
  Fanfic: ["fanfics", "fanfic", "fan fiction", "fanfiction"],
  Music: ["music"],
  Wrestling: ["wrestling"],
  WebVideo: ["web video", "web videos"],
  WebAnimation: ["web animation"],
};

/** (alias, namespace) pairs, longest alias first so multi-word aliases win. */
const ALIAS_PAIRS: ReadonlyArray<readonly [string, string]> = Object.entries(MEDIUM_ALIASES)
  .flatMap(([ns, aliases]) => aliases.map((a) => [a, ns] as const))
  .sort((a, b) => b[0].length - a[0].length);

/** A clause is a filter only if it has one of these words (vds.py _FILTER_RE). */
const FILTER_RE = /\b(only|exclude|excluding|no|not|without|just)\b/i;
/** These filter words make the clause an exclusion (vds.py _EXCLUDE_RE). */
const EXCLUDE_RE = /\b(no|not|without|exclude|excluding)\b/i;
/** "like Firefly" / "works like Firefly" (vds.py _LIKE_RE). */
const LIKE_RE = /^\s*(?:works?\s+)?like\s+(.+)$/i;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export type MediumFilterMode = "include" | "exclude";

export type ClassifiedItem =
  /** A phrase sent to /api/resolve for a chip preview. */
  | { kind: "trope"; text: string }
  /** "like X" or "works like X". `title` is X. Never sent to /api/resolve. */
  | { kind: "title"; text: string; title: string }
  /** A medium filter clause such as "movies only" or "no fanfic". Never resolved. */
  | { kind: "filter"; text: string; mode: MediumFilterMode; media: string[] };

/**
 * Classify one raw item the way the backend will treat it.
 *
 * Order matches vds_search: medium filter clauses first (a filter word plus a
 * known medium alias), then the explicit "like X" title prefix, else a trope.
 * Bare titles such as "the office" are only detectable on the server (it needs
 * the work index); they come back in the search response's `titles[]`.
 */
export function classifyItem(text: string): ClassifiedItem {
  const raw = text.trim();
  const filter = parseFilterClause(raw);
  if (filter) return { kind: "filter", text: raw, ...filter };
  const m = LIKE_RE.exec(raw);
  if (m && m[1].trim()) return { kind: "title", text: raw, title: m[1].trim() };
  return { kind: "trope", text: raw };
}

/** The medium filter in one clause, or null when it is not a filter clause. */
export function parseFilterClause(
  text: string,
): { mode: MediumFilterMode; media: string[] } | null {
  if (!FILTER_RE.test(text)) return null;
  const low = text.toLowerCase();
  let scratch = low;
  const found: string[] = [];
  for (const [alias, ns] of ALIAS_PAIRS) {
    const word = `\\b${escapeRe(alias)}\\b`;
    if (new RegExp(word).test(scratch)) {
      if (!found.includes(ns)) found.push(ns);
      scratch = scratch.replace(new RegExp(word, "g"), " ");
    }
  }
  if (!found.length) return null;
  return { mode: EXCLUDE_RE.test(low) ? "exclude" : "include", media: found };
}

/** True when the item is a medium filter clause (what "Clear filter" removes). */
export function isFilterItem(text: string): boolean {
  return parseFilterClause(text.trim()) !== null;
}

// ── media labels and icons ────────────────────────────────────────────────────

const MEDIA_LABELS: Readonly<Record<string, string>> = {
  Film: "Film",
  Series: "TV series",
  Anime: "Anime",
  Manga: "Manga",
  Literature: "Book",
  VideoGame: "Video game",
  WesternAnimation: "Western animation",
  VisualNovel: "Visual novel",
  ComicBook: "Comic book",
  Webcomic: "Webcomic",
  TabletopGame: "Tabletop game",
  Fanfic: "Fan fiction",
  Music: "Music",
  Wrestling: "Wrestling",
  WebVideo: "Web video",
  WebAnimation: "Web animation",
};

/** Lower-case nouns used in filter labels ("Film only", "No fan fiction"). */
const FILTER_NOUNS: Readonly<Record<string, string>> = {
  Film: "film",
  Series: "TV series",
  Anime: "anime",
  Manga: "manga",
  Literature: "books",
  VideoGame: "video games",
  WesternAnimation: "western animation",
  VisualNovel: "visual novels",
  ComicBook: "comic books",
  Webcomic: "webcomics",
  TabletopGame: "tabletop games",
  Fanfic: "fan fiction",
  Music: "music",
  Wrestling: "wrestling",
  WebVideo: "web video",
  WebAnimation: "web animation",
};

/** "SomeThing" -> "Some thing" for namespaces missing from the table. */
function humanizeNamespace(ns: string): string {
  const words = ns.replace(/([a-z])([A-Z])/g, "$1 $2").split(" ");
  return words.map((w, i) => (i === 0 ? w : w.toLowerCase())).join(" ");
}

/** Human media label for a namespace (DESIGN.md 5.6.1). Never print a raw namespace. */
export function mediaLabel(namespace: string | null | undefined): string {
  if (!namespace) return "Work";
  return MEDIA_LABELS[namespace] ?? humanizeNamespace(namespace);
}

/** Icon names from app/ui/Icon for each media group. */
export type MediaIconName = "film" | "tv" | "anime" | "game" | "book" | "other";

/** The media icon for a namespace: film, tv, anime, game, book or other. */
export function mediaIcon(namespace: string | null | undefined): MediaIconName {
  switch (namespace) {
    case "Film":
      return "film";
    case "Series":
    case "WesternAnimation":
    case "WebVideo":
    case "WebAnimation":
      return "tv";
    case "Anime":
      return "anime";
    case "VideoGame":
    case "TabletopGame":
    case "VisualNovel":
      return "game";
    case "Literature":
    case "Manga":
    case "ComicBook":
    case "Webcomic":
    case "Fanfic":
      return "book";
    default:
      return "other";
  }
}

function capitalize(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/**
 * Label for a medium filter.
 * - form "suffix" (composer chips): "Film only", "Film or anime only", "No fan fiction"
 * - form "prefix" (results filter row): "Only film", "No fan fiction"
 */
export function filterLabel(
  mode: MediumFilterMode,
  namespaces: string[],
  form: "suffix" | "prefix" = "suffix",
): string {
  const nouns = namespaces.map((ns) => FILTER_NOUNS[ns] ?? mediaLabel(ns).toLowerCase());
  const list = nouns.join(" or ");
  if (mode === "exclude") return `No ${list}`;
  return form === "prefix" ? `Only ${list}` : `${capitalize(list)} only`;
}

/**
 * Drop a trailing bracket that repeats the medium:
 * "Quadrilateral Cowboy (Video Game)" with VideoGame -> "Quadrilateral Cowboy".
 */
export function cleanTitle(title: string, namespace?: string | null): string {
  const m = /^(.*\S)\s*\(([^()]+)\)\s*$/.exec(title);
  if (!m || !namespace) return title;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");
  const inner = norm(m[2]);
  if (inner === norm(mediaLabel(namespace)) || inner === norm(namespace)) return m[1];
  return title;
}

// ── numbers ───────────────────────────────────────────────────────────────────

/** 4232 -> "4,232". */
export function formatCount(n: number): string {
  return n.toLocaleString("en-US");
}

/** countLabel(1, "trope") -> "1 trope"; countLabel(4232, "work") -> "4,232 works". */
export function countLabel(n: number, singular: string, plural = `${singular}s`): string {
  return `${formatCount(n)} ${n === 1 ? singular : plural}`;
}
