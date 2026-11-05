"use client";
import { useEffect, useRef, useState } from "react";
import { api, type ResolvedTrope } from "../lib/api";

/* VdsPanel — "Vibe, Don't Search" input.

   Two fields, separate jobs:
   1. VIBE field is an INPUT HELPER ONLY. It never searches. On "Read", Claude
      proposes loose phrases, the engine resolves each to a real trope, and
      those tropes are ADDED as chips into the tropes field below.
   2. TROPES field is THE SEARCH. It holds every chip (from the vibe field or typed
      by hand). One "Search" button runs the engine on exactly those chips. A chip
      may be a trope phrase or a work title ("like Firefly"); the engine classifies
      and expands titles to their tropes. Engine is the source of truth. */

type Chip = {
  text: string;         // the raw chip: a trope phrase, or a title ("like Firefly")
  trope?: string;       // resolved real trope (preview; engine confirms at search)
  resolving?: boolean;  // mid-resolve
  unknown?: boolean;    // resolved to nothing
  isTitle?: boolean;    // looks like a "like X" title input
};

const looksLikeTitle = (s: string) => /^\s*(?:works?\s+)?like\s+\S/i.test(s);

export default function VdsPanel({
  onSearch,
  busy,
  seed,
}: {
  onSearch: (items: string[]) => void;
  busy?: boolean;
  seed?: string[];
}) {
  const [vibe, setVibe] = useState("");
  const [chips, setChips] = useState<Chip[]>([]);
  const [add, setAdd] = useState("");
  const [reading, setReading] = useState(false);
  const [note, setNote] = useState("");
  const seeded = useRef(false);

  // Tropes deep-linked from another page (?trope= / ?q=) arrive as the `seed`
  // prop after the parent parses the URL. Drop them in as chips once and resolve.
  useEffect(() => {
    if (seeded.current || !seed || !seed.length) return;
    seeded.current = true;
    setChips(seed.map((t) => ({ text: t, resolving: true })));
    resolvePreview(seed);
  }, [seed]);

  // Preview-resolve trope phrases to real tropes so chips are meaningful before
  // search. Titles ("like X") are left as-is; the engine expands them on search.
  async function resolvePreview(texts: string[]) {
    const phrases = texts.filter((t) => !looksLikeTitle(t));
    if (!phrases.length) {
      setChips((cs) => cs.map((c) => (c.resolving ? { ...c, resolving: false } : c)));
      return;
    }
    try {
      const j = await api.resolve(phrases);
      const byPhrase = new Map<string, ResolvedTrope>(
        j.resolved.map((r) => [r.phrase, r])
      );
      setChips((cs) =>
        cs.map((c) => {
          if (!texts.includes(c.text) || c.isTitle || looksLikeTitle(c.text)) {
            return { ...c, resolving: false, isTitle: looksLikeTitle(c.text) };
          }
          const r = byPhrase.get(c.text);
          return r
            ? { text: c.text, trope: r.trope }
            : { text: c.text, unknown: true };
        })
      );
    } catch (e) {
      setNote(`Resolve failed. ${e}`);
      setChips((cs) => cs.map((c) => ({ ...c, resolving: false })));
    }
  }

  // VIBE HELPER: vibe -> phrases (Claude) -> resolve -> ADD chips. No search.
  async function runVibe() {
    const v = vibe.trim();
    if (!v || reading) return;
    setReading(true);
    setNote("Reading the vibe.");
    try {
      const j = await api.vibe(v);
      if (j.error) {
        setNote(j.error);
        setReading(false);
        return;
      }
      if (!j.phrases.length) {
        setNote("The model returned nothing. Try a fuller vibe.");
        setReading(false);
        return;
      }
      // add only phrases not already present as chips
      const have = new Set(chips.map((c) => c.text.toLowerCase()));
      const incoming = j.phrases.filter((p) => !have.has(p.toLowerCase()));
      if (!incoming.length) {
        setNote("Those are already in your tropes.");
        setReading(false);
        return;
      }
      setChips((cs) => [...cs, ...incoming.map((p) => ({ text: p, resolving: true }))]);
      setNote("");
      await resolvePreview(incoming);
    } catch (e) {
      setNote(`Could not read the vibe. ${e}`);
    }
    setReading(false);
  }

  function addChip() {
    const p = add.trim();
    if (!p) return;
    if (chips.some((c) => c.text.toLowerCase() === p.toLowerCase())) {
      setAdd("");
      return;
    }
    setChips((cs) => [...cs, { text: p, resolving: true, isTitle: looksLikeTitle(p) }]);
    setAdd("");
    resolvePreview([p]);
  }

  const delChip = (text: string) =>
    setChips((cs) => cs.filter((c) => c.text !== text));

  // THE SEARCH: run on the user's RAW input box text (exactly as typed) PLUS the
  // existing chips. We do NOT rewrite their wording, the engine classifies and
  // resolves internally. Add is the only path that pins a chip; Search does not
  // need the text Added first. The raw input is left in the box for editing.
  function search() {
    const raw = add.trim();
    const items = [...chips.map((c) => c.text), ...(raw ? [raw] : [])];
    if (!items.length) {
      setNote("Type a trope or title, or read a vibe.");
      return;
    }
    onSearch(items);
  }

  const tropeCount = chips.length;

  return (
    <div style={{ borderTop: "1px solid var(--ink)", padding: "6px 8px" }}>
      <div className="chrome">vibe, don&apos;t search</div>

      {/* 1 · VIBE field (helper only, never searches) */}
      <div className="chrome" style={{ marginTop: 6, opacity: 0.6 }}>
        describe a vibe · fills the tropes below
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 2 }}>
        <input
          className="field"
          style={{ flex: 1, border: "1px solid var(--ink)", fontSize: 17, padding: "3px 6px" }}
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && runVibe()}
          placeholder="something cozy but a little sad with a crew that feels like family"
        />
        <button className="btn" type="button" onClick={runVibe} disabled={reading || busy}>
          {reading ? "..." : "Read"}
        </button>
      </div>

      {/* 2 · TROPES field (the search) */}
      <div className="chrome" style={{ marginTop: 8, opacity: 0.6 }}>
        tropes {tropeCount > 0 && `· ${tropeCount}`} · or a title, e.g. like Firefly
      </div>
      <div style={{ margin: "4px 0", minHeight: 18 }}>
        {chips.length === 0 && (
          <span className="chrome" style={{ opacity: 0.45 }}>
            nothing yet. read a vibe, or add a trope or title.
          </span>
        )}
        {chips.map((c) => (
          <span
            key={c.text}
            className={`trope ${c.trope || c.isTitle ? "sel" : ""}`}
            onClick={() => delChip(c.text)}
            title="remove"
            style={{ marginBottom: 6 }}
          >
            {c.resolving ? (
              <>
                {c.text} <span className="caret" style={{ height: 12, width: 7 }} />
              </>
            ) : c.isTitle ? (
              <>
                {c.text}{" "}
                <span className="chrome" style={{ opacity: 0.6 }}>title</span> ✕
              </>
            ) : c.trope ? (
              <>
                {c.trope}{" "}
                <span className="chrome" style={{ opacity: 0.6 }}>({c.text})</span> ✕
              </>
            ) : (
              <>
                {c.text}{" "}
                <span className="chrome" style={{ color: "var(--salmon)" }}>no trope</span> ✕
              </>
            )}
          </span>
        ))}
      </div>

      {/* add-your-own + the single search */}
      <form
        style={{ display: "flex", gap: 6 }}
        onSubmit={(e) => {
          e.preventDefault();
          addChip();
        }}
      >
        <input
          className="field"
          style={{ flex: 1, border: "1px solid var(--ink)", fontSize: 17, padding: "3px 6px" }}
          value={add}
          onChange={(e) => setAdd(e.target.value)}
          placeholder="add a trope or phrase, or a title like Firefly"
        />
        <button className="btn" type="submit">Add</button>
        <button className="btn" type="button" onClick={search} disabled={busy}>
          {busy ? "..." : "Search"}
        </button>
      </form>

      {note && (
        <div className="chrome" style={{ marginTop: 6, opacity: 0.7 }}>{note}</div>
      )}
    </div>
  );
}
