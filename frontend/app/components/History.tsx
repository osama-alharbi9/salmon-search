"use client";
import { useEffect, useState } from "react";
import { api, type HistoryEntry } from "../lib/api";

/* History — a logged-in user's recent searches, recorded automatically, newest
   first. Re-run any with one click. Clear all behind a confirm step. The backend
   caps stored history at 100 per user. Cupertino '84 design. */

function when(iso: string): string {
  // compact, locale-stable relative-ish label
  const d = new Date(iso);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function History({
  onRun,
  onClose,
}: {
  onRun: (items: string[]) => void;
  onClose: () => void;
}) {
  const [list, setList] = useState<HistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const j = await api.history();
        if (live) setList(j.history);
      } catch (e) {
        if (live) setNote(`Could not load history. ${e}`);
      }
    })();
    return () => { live = false; };
  }, []);

  async function clearAll() {
    setConfirmClear(false);
    try {
      await api.clearHistory();
      setList([]);
    } catch (e) {
      setNote(`Clear failed. ${e}`);
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--ink)", padding: "6px 8px" }}>
      <div className="chrome" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>history</span>
        <span>
          {list.length > 0 && !confirmClear && (
            <>
              <span className="link" onClick={() => setConfirmClear(true)}>CLEAR</span>
              {" · "}
            </>
          )}
          <span className="link" onClick={onClose}>close</span>
        </span>
      </div>

      {confirmClear && (
        <div className="chrome" style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span>clear all history?</span>
          <span className="link" style={{ color: "var(--salmon)" }} onClick={clearAll}>yes, clear</span>
          <span className="link" onClick={() => setConfirmClear(false)}>cancel</span>
        </div>
      )}

      <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
        {list.length === 0 && (
          <div className="chrome" style={{ opacity: 0.45 }}>no history yet. run a search.</div>
        )}
        {list.map((h) => (
          <div
            key={h.id}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "4px 0",
              borderTop: "1px dotted var(--ink)",
            }}
          >
            <span className="link" style={{ flex: "0 0 auto" }} onClick={() => onRun(h.items)}>
              RUN
            </span>
            <span style={{ flex: 1, fontSize: 16, lineHeight: 1.2 }}>
              {h.items.join("  +  ")}
            </span>
            <span className="chrome" style={{ flex: "0 0 auto", opacity: 0.5 }}>
              {when(h.created_at)}
            </span>
          </div>
        ))}
      </div>

      {note && <div className="chrome" style={{ marginTop: 6, opacity: 0.7 }}>{note}</div>}
    </div>
  );
}
