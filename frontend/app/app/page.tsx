"use client";
import { useEffect, useRef, useState } from "react";
import { api, type ResultItem, type MediumFilter, type AuthUser } from "../lib/api";
import ResultList from "../components/ResultList";
import VdsPanel from "../components/VdsPanel";
import AuthBar from "../components/AuthBar";
import SavedSearches from "../components/SavedSearches";
import SavedWorks from "../components/SavedWorks";
import History from "../components/History";

type Msg = {
  role: "user" | "bot";
  text: string;
  results?: ResultItem[];
  loading?: boolean;
};

const NS_LABEL: Record<string, string> = {
  Film: "FILM", Series: "TV", Anime: "ANIME", Manga: "MANGA",
  Literature: "LIT", VideoGame: "GAMES", WesternAnimation: "WEST.ANIM",
  VisualNovel: "VN", ComicBook: "COMICS", Webcomic: "WEBCOMIC",
  TabletopGame: "TABLETOP", Fanfic: "FANFIC", Music: "MUSIC",
  Wrestling: "WRESTLING", WebVideo: "WEBVIDEO", WebAnimation: "WEBANIM",
};
const nsLabel = (ns: string) => NS_LABEL[ns] ?? ns.toUpperCase();
const hasFilter = (m: MediumFilter | null) =>
  !!m && (m.include.length > 0 || m.exclude.length > 0);

export default function Home() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("READY.");
  const [seedTropes, setSeedTropes] = useState<string[]>([]);
  const [medium, setMedium] = useState<MediumFilter | null>(null);
  const lastItems = useRef<string[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);   // last search, savable
  const [user, setUser] = useState<AuthUser | null>(null);
  // which logged-in panel is open: searches / works / history / none
  const [panel, setPanel] = useState<"searches" | "works" | "history" | null>(null);
  const [savedWorkIds, setSavedWorkIds] = useState<Set<string>>(new Set());
  const ctrl = useRef<AbortController | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const scroll = () =>
    requestAnimationFrame(() => {
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    });

  // who is signed in (null when logged out; search works either way)
  useEffect(() => {
    api.me().then((r) => setUser(r.user)).catch(() => setUser(null));
  }, []);

  // load the user's bookmarked work ids so results show saved state
  const refreshSavedWorks = () =>
    api.savedWorks()
      .then((r) => setSavedWorkIds(new Set(r.saved.map((w) => w.work_id))))
      .catch(() => {});
  useEffect(() => {
    if (user) refreshSavedWorks();
    else { setSavedWorkIds(new Set()); setPanel(null); }
  }, [user]);

  // bookmark toggle for a result row (optimistic, then reconcile)
  async function toggleSave(r: ResultItem) {
    const id = r.id;
    const isSaved = savedWorkIds.has(id);
    setSavedWorkIds((s) => {
      const n = new Set(s);
      if (isSaved) n.delete(id); else n.add(id);
      return n;
    });
    try {
      if (isSaved) await api.removeWork(id);
      else await api.saveWork(id, r.title, r.namespace);
    } catch {
      refreshSavedWorks();   // revert to server truth on failure
    }
  }

  // deep links from other pages, seeded into the tropes field:
  //   /app?trope=Breaking%20the%20Fourth%20Wall  ·  /app?q=found family + heist
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const t = sp.get("trope");
    const query = sp.get("q");
    if (t || query) {
      const list = [
        ...(t ? [t] : []),
        ...(query ? query.split("+").map((s) => s.trim()).filter(Boolean) : []),
      ];
      setSeedTropes(list);
      window.history.replaceState({}, "", "/app");
    }
  }, []);

  // THE SEARCH: chips (tropes and/or "like Title") -> engine coverage ranking.
  // A medium filter clause in the items only constrains namespaces, never ranks.
  async function search(items: string[]) {
    if (!items.length || busy) return;
    lastItems.current = items;
    setSavedItems(items);              // make this search savable
    // auto-record history for logged-in users (fire and forget, never blocks search)
    if (user) api.recordHistory(items).catch(() => {});
    setBusy(true);
    setStatus("SEARCHING.");
    setMsgs((m) => [
      ...m,
      { role: "user", text: items.join("  +  ") },
      { role: "bot", text: "", loading: true },
    ]);
    scroll();
    ctrl.current = new AbortController();
    try {
      const j = await api.vdsSearch(items, ctrl.current.signal);
      let line: string;
      if (!j.found || !j.tropes.length) {
        line = "Nothing resolved to a real trope. " +
          (j.unknown.length ? `Unmatched: ${j.unknown.join(", ")}.` : "");
      } else {
        const titleNote = j.titles.length
          ? `expanded ${j.titles.map((t) => t.title).join(", ")} into tropes. `
          : "";
        const unknownNote = j.unknown.length ? ` (ignored: ${j.unknown.join(", ")})` : "";
        line = j.results.length
          ? `${titleNote}${j.total} works cover some of ${j.tropes.length} tropes, fullest first:${unknownNote}`
          : `${titleNote}no work covers any of those tropes.${unknownNote}`;
      }
      // map coverage fields onto what ResultList renders
      const results: ResultItem[] = j.results.map((r) => ({
        id: r.id,
        title: r.title,
        namespace: r.namespace,
        n_tropes: r.n_tropes,
        shared_count: r.matched_count,
        shared_tropes: r.matched_tropes,
        why: `covers ${r.matched_count}/${r.wanted_count}` +
          (r.missing_tropes.length ? ` · missing: ${r.missing_tropes.slice(0, 3).join(", ")}` : ""),
      }));
      setMedium(hasFilter(j.medium) ? j.medium : null);
      setMsgs((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "bot", text: line, results };
        return c;
      });
      setStatus("READY.");
    } catch (e: unknown) {
      const aborted = e instanceof DOMException && e.name === "AbortError";
      setMsgs((m) => {
        const c = [...m];
        c[c.length - 1] = { role: "bot", text: aborted ? "Stopped." : `Search failed. ${e}` };
        return c;
      });
      setStatus(aborted ? "STOPPED." : "ERROR.");
    }
    setBusy(false);
    ctrl.current = null;
    scroll();
  }

  // Clear the medium filter: re-run the last search with filter clauses dropped.
  // A clause is one carrying a filter word (only / no / just / exclude / without).
  const FILTER_WORD = /\b(only|exclude|excluding|no|not|without|just)\b/i;
  function clearMedium() {
    if (busy) return;
    const kept = lastItems.current.filter((it) => !FILTER_WORD.test(it));
    setMedium(null);
    if (kept.length) search(kept);
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px 16px",
        height: "100%",
      }}
    >
      <div className="win" style={{ width: "100%", maxWidth: 720, height: "100%", maxHeight: 860 }}>
        <div className="titlebar">
          <span className="close" onClick={() => location.reload()} />
          <span className="ttl" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/salmon-logo-display-transparent.png" alt="" width={16} height={16}
                 style={{ imageRendering: "pixelated", display: "block" }} />
            salmon · vibe
          </span>
          <span style={{ marginLeft: "auto", marginRight: 6, background: "var(--paper)", padding: "0 4px" }}>
            <AuthBar user={user} onChange={setUser} />
          </span>
        </div>

        <div ref={logRef} style={{ flex: "1 1 auto", overflowY: "auto", padding: 16 }}>
          {msgs.length === 0 && (
            <div style={{ fontSize: 19, lineHeight: 1.25 }}>
              Describe a vibe below, salmon turns it into tropes. Tune the tropes, add a title
              like Firefly if you want, then search.
              <span style={{ color: "var(--salmon)" }}>▌</span>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <span className="who chrome">{m.role === "user" ? "you" : "salmon"}</span>
              <div className="bubble">
                {m.loading ? <span className="caret" /> : m.text}
                {m.results && (
                  <ResultList
                    results={m.results}
                    savedIds={user ? savedWorkIds : undefined}
                    onToggleSave={user ? toggleSave : undefined}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        {hasFilter(medium) && (
          <div
            style={{
              borderTop: "1px solid var(--ink)",
              padding: "5px 8px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="trope sel" style={{ marginBottom: 0, cursor: "default" }}>
              MEDIUM:{" "}
              {medium!.include.length > 0
                ? medium!.include.map(nsLabel).join(", ")
                : `NOT ${medium!.exclude.map(nsLabel).join(", ")}`}{" "}
              <span
                className="link"
                style={{ color: "var(--paper)" }}
                onClick={clearMedium}
                title="clear filter"
              >
                ✕
              </span>
            </span>
            <span className="chrome" style={{ opacity: 0.6 }}>
              results limited to this medium
            </span>
          </div>
        )}

        {user && panel === "searches" && (
          <SavedSearches
            currentItems={savedItems}
            onRun={(items) => { setPanel(null); search(items); }}
            onClose={() => setPanel(null)}
          />
        )}
        {user && panel === "works" && (
          <SavedWorks
            onClose={() => setPanel(null)}
            onChanged={refreshSavedWorks}
          />
        )}
        {user && panel === "history" && (
          <History
            onRun={(items) => { setPanel(null); search(items); }}
            onClose={() => setPanel(null)}
          />
        )}

        <VdsPanel busy={busy} seed={seedTropes} onSearch={search} />

        <div className="statusbar">
          <span className="count">{status}</span>
          <span>
            {user && (
              <>
                <span
                  className="link"
                  style={panel === "searches" ? { color: "var(--salmon)" } : undefined}
                  onClick={() => setPanel((p) => (p === "searches" ? null : "searches"))}
                >SEARCHES</span>
                {" · "}
                <span
                  className="link"
                  style={panel === "works" ? { color: "var(--salmon)" } : undefined}
                  onClick={() => setPanel((p) => (p === "works" ? null : "works"))}
                >WORKS</span>
                {" · "}
                <span
                  className="link"
                  style={panel === "history" ? { color: "var(--salmon)" } : undefined}
                  onClick={() => setPanel((p) => (p === "history" ? null : "history"))}
                >HISTORY</span>
                {" · "}
              </>
            )}
            {busy ? (
              <span className="link" onClick={() => ctrl.current?.abort()}>STOP</span>
            ) : (
              <>CUPERTINO &apos;84</>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
