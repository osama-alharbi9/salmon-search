"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, type SavedWork } from "../lib/api";

/* SavedWorks — a logged-in user's bookmarked works. Each links back to its work
   page; remove with the X. Cupertino '84 design. The page owns the live saved set
   so result rows stay in sync; this view reads its own copy for display. */

function workHref(id: string) {
  return `/work/${id.split("/").map(encodeURIComponent).join("/")}`;
}

export default function SavedWorks({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged?: () => void;        // tell the page to refresh saved ids
}) {
  const [list, setList] = useState<SavedWork[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const j = await api.savedWorks();
        if (live) setList(j.saved);
      } catch (e) {
        if (live) setNote(`Could not load saved works. ${e}`);
      }
    })();
    return () => { live = false; };
  }, []);

  async function remove(work_id: string) {
    try {
      await api.removeWork(work_id);
      setList((l) => l.filter((w) => w.work_id !== work_id));
      onChanged?.();
    } catch (e) {
      setNote(`Remove failed. ${e}`);
    }
  }

  return (
    <div style={{ borderTop: "1px solid var(--ink)", padding: "6px 8px" }}>
      <div className="chrome" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>saved works</span>
        <span className="link" onClick={onClose}>close</span>
      </div>

      <div style={{ marginTop: 8, maxHeight: 200, overflowY: "auto" }}>
        {list.length === 0 && (
          <div className="chrome" style={{ opacity: 0.45 }}>
            no saved works yet. save one from a result with the star.
          </div>
        )}
        {list.map((w) => (
          <div
            key={w.id}
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              padding: "4px 0",
              borderTop: "1px dotted var(--ink)",
            }}
          >
            <span style={{ flex: 1, fontSize: 17, lineHeight: 1.2 }}>
              <Link className="link" href={workHref(w.work_id)}>{w.title}</Link>
              {w.namespace && (
                <span className="chrome" style={{ opacity: 0.55, marginLeft: 6 }}>
                  {w.namespace}
                </span>
              )}
            </span>
            <span className="link" style={{ flex: "0 0 auto" }} onClick={() => remove(w.work_id)}>
              ✕
            </span>
          </div>
        ))}
      </div>

      {note && <div className="chrome" style={{ marginTop: 6, opacity: 0.7 }}>{note}</div>}
    </div>
  );
}
