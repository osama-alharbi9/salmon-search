"use client";
import Link from "next/link";
import { useState } from "react";
import type { ResultItem } from "../lib/api";

function workHref(id: string) {
  // id is "Namespace/Slug" — route is /work/Namespace/Slug (catch-all)
  return `/work/${id.split("/").map(encodeURIComponent).join("/")}`;
}

// ResultItem augmented at render with maxSim for bar normalization
type RowItem = ResultItem & { maxSim?: number };

function Row({
  rank,
  r,
  onTrope,
  selected,
  saved,
  onToggleSave,
}: {
  rank: number;
  r: RowItem;
  onTrope?: (t: string) => void;
  selected?: Set<string>;
  saved?: boolean;
  onToggleSave?: (r: RowItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const why = r.why || (r.shared_tropes ?? []).slice(0, 3).join(" · ");
  const hasShared = (r.shared_tropes ?? []).length > 0;
  return (
    <div className="res">
      <span className="rank">{rank}</span>
      <span className="ttl">
        <Link className="link" href={workHref(r.id)}>
          {r.title}
        </Link>
      </span>
      <span className="ns">
        {onToggleSave && (
          <>
            <span
              className="link"
              onClick={() => onToggleSave(r)}
              title={saved ? "remove bookmark" : "save work"}
              style={saved ? { color: "var(--salmon)" } : undefined}
            >
              {saved ? "★ saved" : "☆ save"}
            </span>
            {" · "}
          </>
        )}
        {r.namespace}
        {hasShared && (
          <>
            {" · "}
            <span className="link" onClick={() => setOpen((o) => !o)}>
              tropes
            </span>
          </>
        )}
      </span>
      {why && <span className="why">{why}</span>}
      {r.similarity != null && r.maxSim != null && (
        <span className="bar">
          <i style={{ width: `${Math.max(8, Math.round((r.similarity / r.maxSim) * 100))}%` }} />
        </span>
      )}
      {open && hasShared && (
        <div className="detail">
          <div className="dhead">shared with source · click to search</div>
          {(r.shared_tropes ?? []).map((t) => (
            <span
              key={t}
              className={`trope${selected?.has(t) ? " sel" : ""}`}
              onClick={onTrope ? () => onTrope(t) : undefined}
              style={onTrope ? undefined : { cursor: "default" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultList({
  results,
  onTrope,
  selected,
  savedIds,
  onToggleSave,
}: {
  results: ResultItem[];
  onTrope?: (t: string) => void;
  selected?: Set<string>;
  savedIds?: Set<string>;          // work_ids the user has bookmarked
  onToggleSave?: (r: ResultItem) => void;
}) {
  if (!results.length) return null;
  const maxSim = results[0].similarity ?? 1;
  return (
    <div className="reslist">
      {results.map((r, i) => (
        <Row
          key={`${r.id}-${i}`}
          rank={i + 1}
          r={{ ...(r as RowItem), maxSim }}
          onTrope={onTrope}
          selected={selected}
          saved={savedIds?.has(r.id)}
          onToggleSave={onToggleSave}
        />
      ))}
    </div>
  );
}
