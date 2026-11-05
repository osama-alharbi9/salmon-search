"use client";
import { useEffect, useState } from "react";
import { api, type SavedSearch } from "../lib/api";

/* SavedSearches — a logged-in user's named searches. Save the current search
   (its raw items: trope chips, any "like Title", any medium-filter clause), list
   them, re-run one with a click, or delete. Re-running replays the saved items
   through the same /api/vds_search path. Cupertino '84 design. */

export default function SavedSearches({
  currentItems,
  onRun,
  onClose,
}: {
  currentItems: string[];      // items of the last search, savable
  onRun: (items: string[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<SavedSearch[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  async function rename(id: number) {
    const n = editName.trim();
    if (!n) return;
    try {
      const updated = await api.renameSearch(id, n);
      setList((l) => l.map((s) => (s.id === id ? updated : s)));
      setEditId(null);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Rename failed.");
    }
  }

  async function load() {
    try {
      const j = await api.savedSearches();
      setList(j.saved);
    } catch (e) {
      setNote(`Could not load saved searches. ${e}`);
    }
  }

  // load the list once on open; the await defers the setState out of the effect
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const j = await api.savedSearches();
        if (live) setList(j.saved);
      } catch (e) {
        if (live) setNote(`Could not load saved searches. ${e}`);
      }
    })();
    return () => { live = false; };
  }, []);

  async function save() {
    const n = name.trim();
    if (!n) { setNote("Name the search first."); return; }
    if (!currentItems.length) { setNote("Run a search first, then save it."); return; }
    setBusy(true);
    setNote("");
    try {
      await api.saveSearch(n, currentItems);
      setName("");
      await load();
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Save failed.");
    }
    setBusy(false);
  }

  async function remove(id: number) {
    try {
      await api.deleteSearch(id);
      setList((l) => l.filter((s) => s.id !== id));
    } catch (e) {
      setNote(`Delete failed. ${e}`);
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--ink)", padding: "6px 8px" }}>
      <div className="chrome" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>saved searches</span>
        <span className="link" onClick={onClose}>close</span>
      </div>

      {/* save the current search */}
      <form
        style={{ display: "flex", gap: 6, marginTop: 6 }}
        onSubmit={(e) => { e.preventDefault(); save(); }}
      >
        <input
          className="field"
          style={{ flex: 1, border: "1px solid var(--ink)", fontSize: 17, padding: "3px 6px" }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={currentItems.length ? "name this search to save it" : "run a search first"}
          disabled={!currentItems.length}
        />
        <button className="btn" type="submit" disabled={busy || !currentItems.length}>
          {busy ? "..." : "Save"}
        </button>
      </form>

      {/* the list */}
      <div style={{ marginTop: 8, maxHeight: 180, overflowY: "auto" }}>
        {list.length === 0 && (
          <div className="chrome" style={{ opacity: 0.45 }}>no saved searches yet.</div>
        )}
        {list.map((s) => (
          <div
            key={s.id}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "4px 0",
              borderTop: "1px dotted var(--ink)",
              flexWrap: "wrap",
            }}
          >
            <span className="link" style={{ flex: "0 0 auto" }} onClick={() => onRun(s.items)}>
              RUN
            </span>
            {editId === s.id ? (
              <form
                style={{ flex: 1, display: "flex", gap: 6 }}
                onSubmit={(e) => { e.preventDefault(); rename(s.id); }}
              >
                <input
                  className="field" autoFocus
                  style={{ flex: 1, border: "1px solid var(--ink)", fontSize: 16, padding: "1px 5px" }}
                  value={editName} onChange={(e) => setEditName(e.target.value)}
                />
                <button className="btn" type="submit">Save</button>
                <span className="link" onClick={() => setEditId(null)}>cancel</span>
              </form>
            ) : (
              <span style={{ flex: 1, fontSize: 17, lineHeight: 1.2 }}>
                {s.name}{" "}
                <span
                  className="link chrome"
                  onClick={() => { setEditId(s.id); setEditName(s.name); }}
                >
                  rename
                </span>
              </span>
            )}
            <span className="link" style={{ flex: "0 0 auto" }} onClick={() => remove(s.id)}>
              ✕
            </span>
            {/* tropes + filters preview */}
            <div className="chrome" style={{ flexBasis: "100%", opacity: 0.55, paddingLeft: 32 }}>
              {s.items.join("  +  ")}
            </div>
          </div>
        ))}
      </div>

      {note && (
        <div className="chrome" style={{ marginTop: 6, opacity: 0.7 }}>{note}</div>
      )}
    </div>
  );
}
