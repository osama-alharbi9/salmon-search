"use client";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { api, errorMessage, isAbortError, isApiError, type VdsSearchResponse } from "@/app/lib/api";
import { appHref, countLabel, dedupeItems, formatCount, parseQueryParam } from "@/app/lib/query";
import { useAuthHref, useSession } from "@/app/lib/session";
import {
  Banner,
  Button,
  Delayed,
  EmptyState,
  Icon,
  ResultCardSkeleton,
  useToast,
} from "@/app/ui";
import { applySearch, chipView, expandedTitles, isWeak, makeChip, needsPreview, newItems, type ChipItem } from "./chips";
import { Composer, type ComposerChip } from "./Composer";
import { Examples } from "./Examples";
import { cachedPreview, cachedResult, consumeReturn, rememberPreview, rememberResult, type Preview } from "./memory";
import { displayTotal, FilterChips, hasFilter, ResultsHeader, type TitleRow } from "./ResultsHeader";
import { ResultsList } from "./ResultsList";
import { SaveSearchModal } from "./SaveSearchModal";
import { VibePanel } from "./VibePanel";

/** Works in the dataset (DESIGN.md, README). */
const TOTAL_WORKS = 85633;
const EMPTY_ERROR = "Add a trope or a title first.";
const VIBE_PANEL_ID = "vibe-panel";

type Status = "idle" | "searching" | "stopped" | "error";
type Shown = { items: string[]; key: string; res: VdsSearchResponse };
type UrlMode = "push" | "replace" | "none";
type RunOptions = { url: UrlMode; focus: boolean; record: boolean };

/** A chip for a raw item, with any answer this tab already got from /api/resolve. */
function chipFor(text: string): ChipItem {
  const c = makeChip(text);
  if (c.cls.kind === "trope") c.preview = cachedPreview(c.text);
  return c;
}

/** The search string without ?auth=, keeping the rest byte for byte. */
function withoutAuth(search: string): string {
  const s = search.startsWith("?") ? search.slice(1) : search;
  const kept = s.split("&").filter((pair) => pair && !/^auth(=|$)/.test(pair));
  return kept.length ? `?${kept.join("&")}` : "";
}

function searchError(e: unknown): string {
  if (isApiError(e) && e.status === 0) return "salmon couldn't reach its search server. Try again in a moment.";
  if (isApiError(e) && e.status >= 500) return "salmon's search server had a problem. Try again in a moment.";
  return errorMessage(e, "salmon's search server had a problem. Try again in a moment.");
}

function announce(res: VdsSearchResponse, items: string[]): string {
  if (!res.found) {
    return items.every((i) => chipFor(i).cls.kind === "filter")
      ? "Add a trope or a title too."
      : "None of those matched a trope.";
  }
  if (!res.results.length) {
    return hasFilter(res) ? "No works left after the filter." : "No work has any of those tropes.";
  }
  return `${countLabel(displayTotal(res), "work")} found.`;
}

export function SearchPage({ seeded }: { seeded: boolean }) {
  const { user, loading: sessionLoading, config } = useSession();
  // Changes on every URL change the router knows about: links to /app while
  // this page is open (the sidebar's Search, trope links), Back and Forward.
  const urlKey = useSearchParams().toString();
  const { toast } = useToast();

  const [chips, setChips] = useState<ChipItem[]>([]);
  const [draft, setDraft] = useState("");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const [status, setStatus] = useState<Status>(seeded ? "searching" : "idle");
  const [failMessage, setFailMessage] = useState("");
  const [live, setLive] = useState("");
  const [googleFailed, setGoogleFailed] = useState(false);
  const [vibeOpen, setVibeOpen] = useState(false);
  const [openTitles, setOpenTitles] = useState<ReadonlySet<string>>(new Set());
  const [saveOpen, setSaveOpen] = useState(false);
  const [seq, setSeq] = useState(0);
  // Log in from this page comes back to the search on screen.
  const login = useAuthHref("login", shown?.key);

  const chipsRef = useRef(chips);
  const shownRef = useRef(shown);
  const userRef = useRef(user);
  const sessionLoadingRef = useRef(sessionLoading);
  const toastRef = useRef(toast);
  useEffect(() => {
    chipsRef.current = chips;
    shownRef.current = shown;
    userRef.current = user;
    sessionLoadingRef.current = sessionLoading;
    toastRef.current = toast;
  });

  const ctrl = useRef<AbortController | null>(null);
  /** appHref of the search on screen or in flight; the URL sync skips it. */
  const target = useRef<string | null>(null);
  /** Items of the last search attempt, for "Search again" and "Try again". */
  const attempt = useRef<string[]>([]);
  const focusAfter = useRef(false);
  const pendingHistory = useRef<string[] | null>(null);
  const requested = useRef(new Set<number>());
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── history (signed-in searches are recorded quietly) ──
  const record = useCallback((items: string[]) => {
    if (sessionLoadingRef.current) {
      pendingHistory.current = items;
      return;
    }
    if (userRef.current) api.recordHistory(items).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (sessionLoading || !pendingHistory.current) return;
    const items = pendingHistory.current;
    pendingHistory.current = null;
    if (user) api.recordHistory(items).catch(() => undefined);
  }, [sessionLoading, user]);

  // ── the search ──
  const runSearch = useCallback(
    async (raw: string[], opts: RunOptions) => {
      const items = dedupeItems(raw);
      if (!items.length) {
        setComposerError(EMPTY_ERROR);
        inputRef.current?.focus();
        return;
      }
      const key = appHref(items);
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      target.current = key;
      attempt.current = items;
      setComposerError(null);
      setFailMessage("");
      setStatus("searching");
      setSeq((n) => n + 1);
      setLive(`Searching ${formatCount(TOTAL_WORKS)} works.`);

      try {
        let res = cachedResult(key);
        if (!res) {
          res = await api.vdsSearch(items, c.signal);
          rememberResult(key, res);
        }
        if (ctrl.current !== c) return;
        ctrl.current = null;
        const done = res;
        setChips((cs) => applySearch(cs, items, done));
        setShown({ items, key, res: done });
        setOpenTitles(new Set());
        setStatus("idle");
        setLive(announce(done, items));
        focusAfter.current = opts.focus;

        const here = window.location.pathname + window.location.search;
        if (opts.url === "push" && here !== key) window.history.pushState(null, "", key);
        else if (opts.url === "replace" && here !== key) window.history.replaceState(null, "", key);
        if (opts.record) record(items);
      } catch (e) {
        if (ctrl.current !== c) return;
        ctrl.current = null;
        target.current = shownRef.current?.key ?? null;
        if (isAbortError(e)) {
          setStatus("stopped");
          setLive("Search stopped.");
          return;
        }
        setStatus("error");
        setFailMessage(searchError(e));
        setLive("");
      }
    },
    [record],
  );

  const stop = () => {
    ctrl.current?.abort();
    inputRef.current?.focus();
  };

  /** Back to the first-visit state. */
  const reset = useCallback(() => {
    ctrl.current?.abort();
    ctrl.current = null;
    target.current = null;
    setChips([]);
    setDraft("");
    setShown(null);
    setStatus("idle");
    setFailMessage("");
    setLive("");
  }, []);

  // ── URL: ?q= / ?trope= seed and run a search; ?auth= shows a toast or banner ──
  const syncFromUrl = useCallback(
    (how: "load" | "nav" | "pop") => {
      const raw = window.location.search;
      // Back or Forward to this URL, possibly from another page (a work page)
      const popped = consumeReturn(window.location.pathname + raw);
      const clean = withoutAuth(raw);
      if (clean !== raw) {
        const auth = /(?:^|[?&])auth=([^&]*)/.exec(raw)?.[1];
        if (auth === "ok") toastRef.current("Logged in.");
        else if (auth === "google_failed") setGoogleFailed(true);
        window.history.replaceState(null, "", window.location.pathname + clean);
      }
      const items = parseQueryParam(clean);
      const key = items.length ? appHref(items) : null;
      if (key === target.current) {
        if (!key) setStatus((s) => (s === "searching" && !ctrl.current ? "idle" : s));
        return;
      }
      if (!key) {
        reset();
        return;
      }
      setChips(items.map(chipFor));
      setDraft("");
      // Back or Forward to a search (from a work page, or within /app): show
      // it as it was, without moving focus or adding history. A link to a
      // search this tab already ran (Run again, a trope link) is a new search,
      // though it still comes from the cache.
      const returning = how === "pop" || popped;
      runSearch(items, {
        url: how === "pop" ? "none" : "replace",
        focus: !returning,
        record: !returning,
      });
    },
    [reset, runSearch],
  );

  useEffect(() => {
    // The URL is outside React: read it after mount, and again on Back/Forward.
    let alive = true;
    queueMicrotask(() => {
      if (alive) syncFromUrl("load");
    });
    const onPop = () => syncFromUrl("pop");
    window.addEventListener("popstate", onPop);
    return () => {
      alive = false;
      window.removeEventListener("popstate", onPop);
      ctrl.current?.abort();
      ctrl.current = null;
      target.current = null;
    };
  }, [syncFromUrl]);

  // A <Link> to /app while this page is open. Our own pushState and Back and
  // Forward land here too; the sync skips URLs it is already showing.
  const firstNav = useRef(true);
  useEffect(() => {
    if (firstNav.current) {
      firstNav.current = false;
      return;
    }
    let alive = true;
    queueMicrotask(() => {
      if (alive) syncFromUrl("nav");
    });
    return () => {
      alive = false;
    };
  }, [urlKey, syncFromUrl]);

  // ── chip previews via /api/resolve (trope phrases only) ──
  useEffect(() => {
    const todo = chips.filter((c) => needsPreview(c) && !requested.current.has(c.id));
    if (!todo.length) return;
    const ids = new Set(todo.map((c) => c.id));
    ids.forEach((id) => requested.current.add(id));
    const phrases = dedupeItems(todo.map((c) => c.text));
    api.resolve(phrases).then(
      (r) => {
        const found = new Map<string, Preview>();
        r.resolved.forEach((x) => found.set(x.phrase.trim().toLowerCase(), x));
        r.unknown.forEach((u) => found.set(u.trim().toLowerCase(), null));
        for (const p of phrases) {
          const v = found.get(p.toLowerCase());
          if (v !== undefined) rememberPreview(p, v);
        }
        setChips((cs) =>
          cs.map((c) => (ids.has(c.id) ? { ...c, preview: found.get(c.text.toLowerCase()) ?? null } : c)),
        );
      },
      () => {
        ids.forEach((id) => requested.current.delete(id));
        setChips((cs) => cs.map((c) => (ids.has(c.id) ? { ...c, previewFailed: true } : c)));
      },
    );
  }, [chips]);

  // ── focus the results heading after a search (never the bottom of the list) ──
  useEffect(() => {
    if (!focusAfter.current || status !== "idle" || !shown) return;
    focusAfter.current = false;
    const el = headingRef.current ?? resultsRef.current?.querySelector<HTMLElement>("h2");
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    el.classList.add("outline-none");
    el.focus({ preventScroll: true });
    const r = el.getBoundingClientRect();
    if (r.top < 80 || r.bottom > window.innerHeight) {
      window.scrollTo({ top: Math.max(0, window.scrollY + r.top - 96) });
    }
  }, [status, shown]);

  // ── composer actions ──
  const addText = (text: string) => {
    const items = newItems(text, chipsRef.current);
    if (!items.length) return;
    setChips((cs) => [...cs, ...items.map(chipFor)]);
    setComposerError(null);
  };

  const removeChip = (id: number) => setChips((cs) => cs.filter((c) => c.id !== id));

  const searchNow = () => {
    const extra = newItems(draft, chipsRef.current);
    if (extra.length) setChips((cs) => [...cs, ...extra.map(chipFor)]);
    setDraft("");
    runSearch([...chipsRef.current.map((c) => c.text), ...extra], { url: "push", focus: true, record: true });
  };

  const runExample = (items: string[]) => {
    setChips(items.map(chipFor));
    setDraft("");
    runSearch(items, { url: "push", focus: true, record: true });
  };

  const clearFilter = () => {
    const kept = chipsRef.current.filter((c) => c.cls.kind !== "filter");
    setChips(kept);
    if (!kept.length) {
      reset();
      window.history.pushState(null, "", "/app");
      inputRef.current?.focus();
      return;
    }
    runSearch(
      kept.map((c) => c.text),
      { url: "push", focus: true, record: true },
    );
  };

  const toggleTitle = (key: string) =>
    setOpenTitles((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });

  // ── derived view ──
  const resultsVisible = status !== "searching" && !!shown;
  const titleRows: TitleRow[] = useMemo(() => {
    if (!shown) return [];
    return [...expandedTitles(shown.res)].map(([key, t], i) => ({
      ...t,
      key,
      regionId: `title-tropes-${i}`,
      open: openTitles.has(key),
    }));
  }, [shown, openTitles]);

  const composerChips: ComposerChip[] = chips.map((c) => {
    const view = chipView(c);
    const row = resultsVisible ? titleRows.find((t) => t.key === c.text.toLowerCase()) : undefined;
    const extra = row ? (
      <button
        type="button"
        className="chip-x"
        aria-expanded={row.open}
        aria-controls={row.regionId}
        aria-label={`${row.open ? "Hide" : "Show"} the ${countLabel(row.tropes.length, "trope")} from ${view.label}`}
        onClick={() => toggleTitle(row.key)}
      >
        <Icon name={row.open ? "chevron-up" : "chevron-down"} size={16} />
      </button>
    ) : undefined;
    return { ...view, id: c.id, extra };
  });

  const searchedChips = shown
    ? chips.filter((c) => shown.items.some((i) => i.toLowerCase() === c.text.toLowerCase()))
    : [];
  const missingTitles = searchedChips
    .filter((c) => c.titleMissing && c.cls.kind === "title")
    .map((c) => ({ title: c.cls.kind === "title" ? c.cls.title : c.text, trope: c.preview?.trope }));
  // A missing title has its own "No work is called X" row, so it doesn't
  // also raise the loose-match banner (its chip says "No work with this title").
  const weak = searchedChips.some((c) => isWeak(c) && !c.titleMissing);

  const intro = !shown && status === "idle";

  const saveAction = user ? (
    <Button variant="secondary" size="m" icon="bookmark" onClick={() => setSaveOpen(true)}>
      Save search
    </Button>
  ) : (
    <Button variant="secondary" size="m" icon="bookmark" href={login.href} onClick={login.onClick}>
      Save search
    </Button>
  );

  return (
    <>
      {googleFailed && (
        <Banner
          variant="error"
          title="Google sign-in didn't work."
          className="mb-8"
          onClose={() => setGoogleFailed(false)}
          action={
            <Button variant="secondary" size="s" href={login.href} onClick={login.onClick}>
              Log in
            </Button>
          }
        >
          Try again, or log in with email.
        </Banner>
      )}

      {intro ? (
        <div className="mb-8">
          <h1 className="display-s">What story are you after?</h1>
          <p className="body-m muted measure mt-3">
            Add tropes in plain words, or a title. salmon ranks {formatCount(TOTAL_WORKS)} works by how many of them each
            one has.
          </p>
        </div>
      ) : (
        <h1 className="visually-hidden">Search</h1>
      )}

      <Composer
        chips={composerChips}
        draft={draft}
        onDraftChange={(v) => {
          setDraft(v);
          if (composerError && v.trim()) setComposerError(null);
        }}
        onAdd={addText}
        onRemove={removeChip}
        onSearch={searchNow}
        onStop={stop}
        busy={status === "searching"}
        error={composerError}
        inputRef={inputRef}
        helpAction={
          config.vibe ? (
            <button
              type="button"
              className="textbtn"
              aria-expanded={vibeOpen}
              aria-controls={VIBE_PANEL_ID}
              onClick={() => setVibeOpen((o) => !o)}
            >
              Describe a vibe instead
            </button>
          ) : undefined
        }
      />

      {config.vibe && vibeOpen && (
        <VibePanel id={VIBE_PANEL_ID} existing={chips.map((c) => c.text)} onPhrases={(p) => addText(p.join(" + "))} />
      )}

      <p className="visually-hidden" role="status" aria-live="polite">
        {live}
      </p>

      <div ref={resultsRef} aria-busy={status === "searching" || undefined}>
        {status === "stopped" && (
          <Banner
            className="mt-8"
            title="Search stopped."
            action={
              <Button variant="secondary" size="s" onClick={() => runSearch(attempt.current, { url: "push", focus: true, record: true })}>
                Search again
              </Button>
            }
          />
        )}
        {status === "error" && (
          <Banner
            className="mt-8"
            variant="error"
            title={failMessage}
            action={
              <Button variant="secondary" size="s" onClick={() => runSearch(attempt.current, { url: "push", focus: true, record: true })}>
                Try again
              </Button>
            }
          />
        )}

        {status === "searching" ? (
          <Delayed key={seq}>
            <ol className="results mt-10" aria-label="Loading results">
              <ResultCardSkeleton />
              <ResultCardSkeleton />
              <ResultCardSkeleton />
            </ol>
          </Delayed>
        ) : shown ? (
          <ResultsArea
            shown={shown}
            headingRef={headingRef}
            saveAction={saveAction}
            titleRows={titleRows}
            onToggleTitle={toggleTitle}
            onClearFilter={clearFilter}
            missingTitles={missingTitles}
            weak={weak}
          />
        ) : (
          <Examples onRun={runExample} />
        )}
      </div>

      {saveOpen && shown && <SaveSearchModal open onClose={() => setSaveOpen(false)} items={shown.items} />}
    </>
  );
}

function ResultsArea({
  shown,
  headingRef,
  saveAction,
  titleRows,
  onToggleTitle,
  onClearFilter,
  missingTitles,
  weak,
}: {
  shown: Shown;
  headingRef: Ref<HTMLHeadingElement>;
  saveAction: ReactNode;
  titleRows: TitleRow[];
  onToggleTitle: (key: string) => void;
  onClearFilter: () => void;
  missingTitles: { title: string; trope?: string }[];
  weak: boolean;
}) {
  const { res, items } = shown;

  if (!res.found) {
    const filterOnly = items.every((i) => chipFor(i).cls.kind === "filter");
    return filterOnly ? (
      <EmptyState className="mt-8" icon="filter" title="Add a trope or a title too">
        Filters like movies only narrow a search but can&apos;t start one.
      </EmptyState>
    ) : (
      <EmptyState className="mt-8" icon="search" title="None of those matched a trope">
        Try other wording, or start from a title with like.
      </EmptyState>
    );
  }

  if (!res.results.length) {
    const filtered = hasFilter(res);
    return (
      <div className="mt-8">
        {filtered && (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <span className="visually-hidden">Filter:</span>
            <FilterChips medium={res.medium} />
          </div>
        )}
        <EmptyState
          icon="search"
          title={filtered ? "No works left after the filter" : "No work has any of those tropes"}
          action={
            filtered ? (
              <Button variant="secondary" size="m" onClick={onClearFilter}>
                Clear filter
              </Button>
            ) : undefined
          }
        >
          {filtered
            ? "Works with those tropes exist, but none match the filter. Clear it to search every medium."
            : "Remove one, or try broader wording."}
        </EmptyState>
      </div>
    );
  }

  return (
    <>
      <ResultsHeader
        res={res}
        headingRef={headingRef}
        saveAction={saveAction}
        titles={titleRows}
        onToggleTitle={onToggleTitle}
        onClearFilter={onClearFilter}
        missingTitles={missingTitles}
        weak={weak}
      />
      <ResultsList res={res} href={shown.key} />
    </>
  );
}
