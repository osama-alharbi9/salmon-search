// Typed client for the salmon FastAPI backend.
// Base URL is configurable; defaults to the local dev API. Every call sends the
// httpOnly session cookie (credentials: "include"); no tokens live in JS.
const BASE =
  process.env.NEXT_PUBLIC_SALMON_API ?? "http://localhost:8000";

export type ResultItem = {
  id: string;
  title: string;
  namespace: string;
  similarity?: number;
  shared_count?: number;
  shared_tropes?: string[];
  why?: string;
  n_tropes?: number;
};

export type WorkDetail = {
  found: boolean;
  id?: string;
  title?: string;
  namespace?: string;
  n_tropes?: number;
  tropes?: string[];
  intro?: string;
  url?: string;
};

// Vibe field and chip preview.
export type VibeResponse = { phrases: string[]; error?: string };
export type ResolvedTrope = { phrase: string; trope: string; sim: number; count: number };
export type ResolveResponse = { resolved: ResolvedTrope[]; unknown: string[] };

export type CoverageItem = ResultItem & {
  matched_count: number;
  wanted_count: number;
  matched_tropes: string[];
  missing_tropes: string[];
};
export type MediumFilter = { include: string[]; exclude: string[] };
export type ExpandedTitle = { input: string; id: string; title: string; n_pulled: number };
export type VdsSearchResponse = {
  found: boolean;
  /** Final trope list searched, including tropes expanded from titles. */
  tropes: string[];
  /** Trope names the non-title phrases matched (present on found searches). */
  resolved?: string[];
  titles: ExpandedTitle[];
  unknown: string[];
  total: number;
  results: CoverageItem[];
  medium: MediumFilter;
};

/** Optional server features. Both false when not set up (local dev). */
export type ServerConfig = { google: boolean; vibe: boolean };

// ── errors ────────────────────────────────────────────────────────────────────

/**
 * Every failed call (except an abort) rejects with an ApiError.
 * - `status`: HTTP status, or 0 when the server could not be reached.
 * - `message`: a plain sentence that is safe to show (DESIGN.md 8.4 wording).
 * - `field`: for 422 validation errors (and a few known 400/409 errors), the
 *   form field the message belongs to, e.g. "email", "password", "name", "items".
 * - `detail`: the server's raw detail, for logs only. Never show it.
 * Aborted requests reject with the original DOMException named "AbortError".
 */
export class ApiError extends Error {
  readonly status: number;
  readonly field?: string;
  readonly detail?: string;

  constructor(status: number, message: string, field?: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.field = field;
    this.detail = detail;
  }
}

export const NETWORK_MESSAGE = "salmon couldn't reach its server. Try again in a moment.";
const SERVER_MESSAGE = "salmon's server had a problem. Try again in a moment.";

export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}

/** True for a fetch cancelled with AbortController (a stopped search). */
export function isAbortError(e: unknown): boolean {
  return (
    (typeof DOMException !== "undefined" && e instanceof DOMException && e.name === "AbortError") ||
    (e instanceof Error && e.name === "AbortError")
  );
}

/** A readable message for any thrown value. */
export function errorMessage(e: unknown, fallback = SERVER_MESSAGE): string {
  if (e instanceof ApiError) return e.message;
  return fallback;
}


/** Known server details mapped to the product's wording, with their field. */
const KNOWN_DETAILS: Record<string, { message: string; field?: string }> = {
  "Wrong email or password.": { message: "That email and password don't match. Try again." },
  "An account with that email already exists.": {
    message: "There's already an account with this email. Log in instead.",
    field: "email",
  },
  "Password must be at least 8 characters.": {
    message: "Use at least 8 characters.",
    field: "password",
  },
  "Not signed in.": { message: "Log in to do that." },
  "Google sign-in is not configured on the server.": {
    message: "Google sign-in isn't set up on this server.",
  },
  "Saved search not found.": { message: "That saved search no longer exists." },
};

/** Messages for 422 validation errors, by field. */
const FIELD_MESSAGES: Record<string, string> = {
  email: "Enter an email address like name@example.com.",
  password: "Use at least 8 characters.",
  name: "Enter a name.",
  items: "Add a trope or a title first.",
};

type FastApiValidationItem = { loc?: (string | number)[]; msg?: string; type?: string };

function fieldFromLoc(loc: (string | number)[] | undefined): string | undefined {
  if (!loc) return undefined;
  for (let i = loc.length - 1; i >= 0; i--) {
    const part = loc[i];
    if (typeof part === "string" && part !== "body" && part !== "query" && part !== "path") {
      return part;
    }
  }
  return undefined;
}

async function toApiError(r: Response): Promise<ApiError> {
  let detail: unknown;
  try {
    const j = await r.json();
    detail = j?.detail;
  } catch {
    detail = undefined;
  }

  // FastAPI 422: detail is an array of {loc, msg, type}.
  if (Array.isArray(detail)) {
    const first = (detail as FastApiValidationItem[])[0];
    const field = fieldFromLoc(first?.loc);
    const message =
      (field && FIELD_MESSAGES[field]) || "Check what you entered and try again.";
    return new ApiError(r.status, message, field, first?.msg);
  }

  if (typeof detail === "string" && detail.trim()) {
    const known = KNOWN_DETAILS[detail];
    if (known) return new ApiError(r.status, known.message, known.field, detail);
    // Server sentences are written for people; anything else gets the generic line.
    const readable = /^[A-Z][^{}<>]*[.?]$/.test(detail) && detail.length <= 200;
    return new ApiError(r.status, readable ? detail : SERVER_MESSAGE, undefined, detail);
  }

  if (r.status === 401) return new ApiError(401, "Log in to do that.");
  if (r.status === 404) return new ApiError(404, "salmon couldn't find that.");
  return new ApiError(r.status, SERVER_MESSAGE);
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      // credentials: "include" so the httpOnly session cookie rides along.
      credentials: "include",
      signal,
    });
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new ApiError(0, NETWORK_MESSAGE);
  }
  if (!r.ok) throw await toApiError(r);
  try {
    return (await r.json()) as T;
  } catch (e) {
    if (isAbortError(e)) throw e;
    throw new ApiError(r.status, SERVER_MESSAGE);
  }
}

const post = <T>(path: string, body: unknown, signal?: AbortSignal) =>
  request<T>("POST", path, body, signal);
const get = <T>(path: string, signal?: AbortSignal) =>
  request<T>("GET", path, undefined, signal);
const del = <T>(path: string) => request<T>("DELETE", path);
const patch = <T>(path: string, body: unknown) => request<T>("PATCH", path, body);

// --- auth -------------------------------------------------------------------
export type AuthUser = { id: number; email: string; name: string | null; has_google: boolean };
/** Google sign-in is a full-page navigation to this URL (not a fetch). */
export const GOOGLE_LOGIN_URL = `${BASE}/api/auth/google/login`;

// --- saved searches / works / history ---------------------------------------
export type SavedSearch = { id: number; name: string; items: string[]; created_at: string };
export type SavedWork = {
  id: number; work_id: string; title: string; namespace: string | null; created_at: string;
};
export type HistoryEntry = { id: number; items: string[]; created_at: string };

/** GET /api/config: which optional features this server has set up. */
export const getConfig = (signal?: AbortSignal) => get<ServerConfig>("/api/config", signal);

export const api = {
  config: getConfig,
  workById: (id: string, signal?: AbortSignal) =>
    post<WorkDetail>("/api/work_by_id", { id }, signal),
  /** The error arrives in `error` with HTTP 200 (e.g. vibe not set up). */
  vibe: (vibe: string, signal?: AbortSignal) =>
    post<VibeResponse>("/api/vibe", { vibe }, signal),
  resolve: (phrases: string[], signal?: AbortSignal) =>
    post<ResolveResponse>("/api/resolve", { phrases }, signal),
  /** Raw item strings, including "like X" and filter clauses, unchanged. */
  vdsSearch: (items: string[], signal?: AbortSignal) =>
    post<VdsSearchResponse>("/api/vds_search", { items }, signal),
  me: () => get<{ user: AuthUser | null }>("/api/auth/me"),
  signup: (email: string, password: string, name?: string) =>
    post<AuthUser>("/api/auth/signup", { email, password, name }),
  login: (email: string, password: string) =>
    post<AuthUser>("/api/auth/login", { email, password }),
  logout: () => post<{ ok: boolean }>("/api/auth/logout", {}),
  savedSearches: () => get<{ saved: SavedSearch[] }>("/api/saved_searches"),
  saveSearch: (name: string, items: string[]) =>
    post<SavedSearch>("/api/saved_searches", { name, items }),
  renameSearch: (id: number, name: string) =>
    patch<SavedSearch>(`/api/saved_searches/${id}`, { name }),
  deleteSearch: (id: number) => del<{ ok: boolean }>(`/api/saved_searches/${id}`),

  // saved works (bookmarks)
  savedWorks: () => get<{ saved: SavedWork[] }>("/api/saved_works"),
  saveWork: (work_id: string, title: string, namespace?: string | null) =>
    post<SavedWork>("/api/saved_works", { work_id, title, namespace }),
  /** Keeps the slash: /api/saved_works/{Namespace}/{Slug}, each part encoded. */
  removeWork: (work_id: string) =>
    del<{ ok: boolean }>(`/api/saved_works/${work_id.split("/").map(encodeURIComponent).join("/")}`),

  // search history
  history: () => get<{ history: HistoryEntry[] }>("/api/history"),
  /** Fire and forget after every signed-in search. */
  recordHistory: (items: string[]) =>
    post<{ ok: boolean; recorded: boolean }>("/api/history", { items }),
  clearHistory: () => del<{ ok: boolean }>("/api/history"),
};
