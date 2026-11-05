// Typed client for the salmon FastAPI backend.
// Base URL is configurable; defaults to the local dev API.
const BASE =
  process.env.NEXT_PUBLIC_SALMON_API ?? "http://localhost:8000";

export type Turn = { role: "user" | "assistant"; content: string };

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

export type AskResponse = {
  answer: string;
  source: { id?: string; title: string; namespace: string; n_tropes: number } | null;
  results: ResultItem[];
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

export type TropeSearch = {
  found: boolean;
  resolved: string[];
  unknown: string[];
  total?: number;
  results: ResultItem[];
};

// VDS (Vibe, Don't Search).
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
export type VdsSearchResponse = {
  found: boolean;
  tropes: string[];
  titles: { input: string; id: string; title: string; n_pulled: number }[];
  unknown: string[];
  total: number;
  results: CoverageItem[];
  medium: MediumFilter;
};

// credentials: "include" so the httpOnly session cookie rides along.
async function post<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
    signal,
  });
  if (!r.ok) {
    // surface the server's human message (FastAPI puts it in .detail)
    let detail = `HTTP ${r.status}`;
    try {
      const j = await r.json();
      if (j?.detail) detail = j.detail;
    } catch {}
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

async function del<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) throw new Error(`${path} -> HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "include",
  });
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try { const j = await r.json(); if (j?.detail) detail = j.detail; } catch {}
    throw new Error(detail);
  }
  return r.json() as Promise<T>;
}

// --- auth (step 1) ----------------------------------------------------------
export type AuthUser = { id: number; email: string; name: string | null; has_google: boolean };
export const GOOGLE_LOGIN_URL = `${BASE}/api/auth/google/login`;

// --- saved searches / works / history ---------------------------------------
export type SavedSearch = { id: number; name: string; items: string[]; created_at: string };
export type SavedWork = {
  id: number; work_id: string; title: string; namespace: string | null; created_at: string;
};
export type HistoryEntry = { id: number; items: string[]; created_at: string };

export const api = {
  ask: (q: string, history: Turn[], signal?: AbortSignal) =>
    post<AskResponse>("/api/ask", { q, history }, signal),
  workById: (id: string) => post<WorkDetail>("/api/work_by_id", { id }),
  byTropes: (tropes: string[], namespaces?: string[]) =>
    post<TropeSearch>("/api/by_tropes", { tropes, namespaces }),
  vibe: (vibe: string, signal?: AbortSignal) =>
    post<VibeResponse>("/api/vibe", { vibe }, signal),
  resolve: (phrases: string[], signal?: AbortSignal) =>
    post<ResolveResponse>("/api/resolve", { phrases }, signal),
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
  removeWork: (work_id: string) =>
    del<{ ok: boolean }>(`/api/saved_works/${work_id.split("/").map(encodeURIComponent).join("/")}`),

  // search history
  history: () => get<{ history: HistoryEntry[] }>("/api/history"),
  recordHistory: (items: string[]) =>
    post<{ ok: boolean; recorded: boolean }>("/api/history", { items }),
  clearHistory: () => del<{ ok: boolean }>("/api/history"),
};
