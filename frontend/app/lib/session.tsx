"use client";
// Session, server config and saved works, shared by every page.
// <SessionProvider> is mounted once in app/layout.tsx (inside <ToastProvider>).
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { api, ApiError, type AuthUser, type SavedWork, type ServerConfig } from "./api";
import { authHref } from "./query";

// ── session ───────────────────────────────────────────────────────────────────

export type SessionValue = {
  /** The signed-in user, or null (also null while loading). */
  user: AuthUser | null;
  /** True until the first GET /api/auth/me answers. */
  loading: boolean;
  /** Optional features from GET /api/config. Both false until loaded or on failure. */
  config: ServerConfig;
  /** True once /api/config has answered. */
  configLoaded: boolean;
  /** Name, or email when there is no name. Null when signed out. */
  displayName: string | null;
  /** Re-read GET /api/auth/me. Resolves to the user (or null). */
  refresh: () => Promise<AuthUser | null>;
  /** POST /api/auth/login. Rejects with ApiError (status 401: wrong email or password). */
  login: (email: string, password: string) => Promise<AuthUser>;
  /** POST /api/auth/signup. Rejects with ApiError (409 taken, 400 short password, 422 field "email"). */
  signup: (email: string, password: string, name?: string) => Promise<AuthUser>;
  /** POST /api/auth/logout, then clears the user. Rejects with ApiError if it failed (user kept). */
  logout: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/** Read the session. Must be inside <SessionProvider> (the root layout has it). */
export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>.");
  return ctx;
}

/** Initials for the account disc: "Osama Alharbi" -> "OA", "pat@x.y" -> "P". */
export function initials(user: Pick<AuthUser, "name" | "email"> | null): string {
  if (!user) return "";
  const source = (user.name ?? "").trim();
  if (source) {
    const words = source.split(/\s+/).filter(Boolean);
    const letters = words.length > 1 ? words[0][0] + words[words.length - 1][0] : words[0][0];
    return letters.toUpperCase();
  }
  return (user.email[0] ?? "").toUpperCase();
}

const NO_CONFIG: ServerConfig = { google: false, vibe: false };

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ServerConfig>(NO_CONFIG);
  const [configLoaded, setConfigLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const r = await api.me();
      setUser(r.user);
      return r.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((r) => alive && setUser(r.user))
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    api
      .config()
      .then((c) => alive && setConfig({ google: !!c.google, vibe: !!c.vibe }))
      .catch(() => undefined)
      .finally(() => alive && setConfigLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const u = await api.login(email, password);
    setUser(u);
    return u;
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string) => {
    const u = await api.signup(email, password, name?.trim() ? name.trim() : undefined);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      loading,
      config,
      configLoaded,
      displayName: user ? user.name?.trim() || user.email : null,
      refresh,
      login,
      signup,
      logout,
    }),
    [user, loading, config, configLoaded, refresh, login, signup, logout],
  );

  return (
    <SessionContext.Provider value={value}>
      <SavedWorksProvider user={user}>{children}</SavedWorksProvider>
    </SessionContext.Provider>
  );
}

// ── saved works ───────────────────────────────────────────────────────────────

/** What toggle() needs to save a work. */
export type WorkRef = { id: string; title: string; namespace?: string | null };

export type SavedWorksValue = {
  /** Saved work ids ("Namespace/Slug"). Empty when signed out. */
  ids: ReadonlySet<string>;
  /** Saved works, newest first (for /saved). Includes optimistic rows (negative id). */
  works: SavedWork[];
  /** True while the list is loading for the signed-in user. */
  loading: boolean;
  /** True once the list has loaded for the current user. */
  loaded: boolean;
  /** Last load error (shown on /saved with Try again), else null. */
  error: ApiError | null;
  isSaved: (id: string) => boolean;
  /**
   * Save or remove a work. Updates every view at once (optimistic), then
   * reconciles with the server. Resolves to the new saved state; rejects with
   * an ApiError after rolling back if the server refused (e.g. signed out).
   */
  toggle: (work: WorkRef) => Promise<boolean>;
  /** Save (no-op if already saved). Same rules as toggle. */
  save: (work: WorkRef) => Promise<boolean>;
  /** Remove (no-op if not saved). Same rules as toggle. */
  remove: (work: WorkRef) => Promise<boolean>;
  /** Reload the list from the server. */
  reload: () => Promise<void>;
};

const SavedWorksContext = createContext<SavedWorksValue | null>(null);

/** Saved works for the signed-in user, in sync across cards, the work page and /saved. */
export function useSavedWorks(): SavedWorksValue {
  const ctx = useContext(SavedWorksContext);
  if (!ctx) throw new Error("useSavedWorks must be used inside <SessionProvider>.");
  return ctx;
}

type SavedState = {
  /** The user the list belongs to. A different id means "not loaded yet". */
  uid: number | null;
  works: SavedWork[];
  status: "loading" | "ready" | "error";
  error: ApiError | null;
};

function loadedState(uid: number, works: SavedWork[]): SavedState {
  return { uid, works, status: "ready", error: null };
}

function failedState(s: SavedState, uid: number, e: unknown): SavedState {
  const err = e instanceof ApiError ? e : new ApiError(0, "salmon couldn't load your saved works.");
  return { uid, works: s.uid === uid ? s.works : [], status: "error", error: err };
}

function SavedWorksProvider({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  const userId = user?.id ?? null;
  const [state, setState] = useState<SavedState>({ uid: null, works: [], status: "ready", error: null });
  const userRef = useRef(userId);
  const tempId = useRef(-1);
  const inFlight = useRef(new Map<string, number>());

  // State for the current user only; a list for someone else counts as empty.
  const mine = userId !== null && state.uid === userId;
  const works = useMemo(() => (mine ? state.works : []), [mine, state.works]);
  const loading = userId !== null && (!mine || state.status === "loading");
  const loaded = mine && state.status === "ready";
  const error = mine ? state.error : null;

  const fetchList = useCallback(async (uid: number) => {
    try {
      const r = await api.savedWorks();
      if (userRef.current === uid) setState(loadedState(uid, r.saved));
    } catch (e) {
      if (userRef.current === uid) setState((s) => failedState(s, uid, e));
    }
  }, []);

  // load the list whenever the signed-in user changes
  useEffect(() => {
    userRef.current = userId;
    if (userId === null) return;
    let alive = true;
    api.savedWorks().then(
      (r) => {
        if (alive) setState(loadedState(userId, r.saved));
      },
      (e) => {
        if (alive) setState((s) => failedState(s, userId, e));
      },
    );
    return () => {
      alive = false;
    };
  }, [userId]);

  const reload = useCallback(async () => {
    const uid = userRef.current;
    if (uid === null) return;
    setState((s) => (s.uid === uid ? { ...s, status: "loading", error: null } : s));
    await fetchList(uid);
  }, [fetchList]);

  const ids = useMemo(() => new Set(works.map((w) => w.work_id)), [works]);
  const idsRef = useRef(ids);
  const worksRef = useRef(works);
  useEffect(() => {
    idsRef.current = ids;
    worksRef.current = works;
  }, [ids, works]);

  /** Apply a change to the current user's list (creating it if not loaded yet). */
  const edit = useCallback((uid: number, f: (list: SavedWork[]) => SavedWork[]) => {
    setState((s) =>
      s.uid === uid ? { ...s, works: f(s.works) } : { uid, works: f([]), status: "loading", error: null },
    );
  }, []);

  const setSaved = useCallback(
    async (work: WorkRef, want: boolean): Promise<boolean> => {
      const uid = userRef.current;
      if (uid === null) throw new ApiError(401, "Log in to save works.");
      const was = idsRef.current.has(work.id);
      if (was === want) return want;
      // the row as it was, to put back if the change fails
      const before = worksRef.current.find((w) => w.work_id === work.id);

      const seq = (inFlight.current.get(work.id) ?? 0) + 1;
      inFlight.current.set(work.id, seq);
      const optimisticId = tempId.current--;

      // optimistic update, visible everywhere at once
      edit(uid, (list) =>
        want
          ? [
              {
                id: optimisticId,
                work_id: work.id,
                title: work.title,
                namespace: work.namespace ?? null,
                created_at: new Date().toISOString(),
              },
              ...list.filter((w) => w.work_id !== work.id),
            ]
          : list.filter((w) => w.work_id !== work.id),
      );
      idsRef.current = new Set(
        want ? [...idsRef.current, work.id] : [...idsRef.current].filter((id) => id !== work.id),
      );

      try {
        if (want) {
          const row = await api.saveWork(work.id, work.title, work.namespace ?? null);
          if (userRef.current === uid && inFlight.current.get(work.id) === seq) {
            edit(uid, (list) => [row, ...list.filter((w) => w.work_id !== row.work_id)]);
          }
        } else {
          await api.removeWork(work.id);
        }
        return want;
      } catch (e) {
        if (userRef.current === uid) {
          // Undo the optimistic change first, so a failed reload below still
          // leaves the list as it was before the click.
          if (inFlight.current.get(work.id) === seq) {
            edit(uid, (list) => {
              const rest = list.filter((w) => w.work_id !== work.id);
              if (!was || !before) return rest;
              const at = rest.findIndex((w) => w.created_at < before.created_at);
              return at < 0 ? [...rest, before] : [...rest.slice(0, at), before, ...rest.slice(at)];
            });
            idsRef.current = new Set(
              was ? [...idsRef.current, work.id] : [...idsRef.current].filter((id) => id !== work.id),
            );
          }
          // then reconcile with the server's truth
          await fetchList(uid);
        }
        throw e instanceof ApiError ? e : new ApiError(0, "That didn't save. Try again.");
      }
    },
    [edit, fetchList],
  );

  const toggle = useCallback((work: WorkRef) => setSaved(work, !idsRef.current.has(work.id)), [setSaved]);
  const save = useCallback((work: WorkRef) => setSaved(work, true), [setSaved]);
  const remove = useCallback((work: WorkRef) => setSaved(work, false), [setSaved]);
  const isSaved = useCallback((id: string) => ids.has(id), [ids]);

  const value = useMemo<SavedWorksValue>(
    () => ({ ids, works, loading, loaded, error, isSaved, toggle, save, remove, reload }),
    [ids, works, loading, loaded, error, isSaved, toggle, save, remove, reload],
  );

  return <SavedWorksContext.Provider value={value}>{children}</SavedWorksContext.Provider>;
}

// ── log in / sign up links that come back here ───────────────────────────────

/**
 * Href and click handler for a "Log in" or "Sign up" link that returns to the
 * current page: /login?next=/app%3Fq%3D… . The href uses `here` when given
 * (the full path and query of the page, e.g. the search on screen), else the
 * pathname, so it also works without JS, in a new tab and when copied. The
 * click handler adds the live query string.
 *
 *   const login = useAuthHref("login", shown?.key);
 *   <Button href={login.href} onClick={login.onClick}>Log in</Button>
 */
export function useAuthHref(kind: "login" | "signup", here?: string | null) {
  const pathname = usePathname();
  const router = useRouter();
  const href = authHref(kind, here || pathname);
  const onClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      router.push(authHref(kind, window.location.pathname + window.location.search));
    },
    [kind, router],
  );
  return { href, onClick };
}
