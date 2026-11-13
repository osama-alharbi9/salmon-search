"use client";
import { useId, useMemo, useRef, useState } from "react";
import { Button, Icon, IconButton, TropeLink } from "@/app/ui";
import { countLabel } from "@/app/lib/query";

/** Trope links shown before "Show all". */
const FIRST = 60;

/** Alphabetical, ignoring case and leading quotes or bars left over from the source pages. */
const collator = new Intl.Collator("en", { sensitivity: "base", numeric: true });
const sortKey = (t: string) => t.replace(/^[^\p{L}\p{N}]+/u, "");
const byName = (a: string, b: string) => collator.compare(sortKey(a), sortKey(b)) || collator.compare(a, b);

/**
 * The work's tropes (DESIGN.md 9.3 step 7): a filter field, then trope links
 * to /app?trope=… in alphabetical order, the first 60 and "Show all".
 */
export function TropeList({ tropes }: { tropes: string[] }) {
  const [query, setQuery] = useState("");
  const [all, setAll] = useState(false);
  const inputId = useId();
  const hintId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const sorted = useMemo(
    () => [...new Set(tropes)].sort(byName),
    [tropes],
  );
  const q = query.trim().toLowerCase();
  const matches = q ? sorted.filter((t) => t.toLowerCase().includes(q)) : sorted;
  const shown = q || all ? matches : matches.slice(0, FIRST);
  const hidden = !q && !all ? sorted.length - shown.length : 0;

  const showAll = () => {
    setAll(true);
    // Keep focus in place: move it to the first trope that was hidden.
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll<HTMLAnchorElement>("a")[FIRST]?.focus();
    });
  };

  if (!sorted.length) {
    return <p className="muted mt-4">This dataset lists no tropes for this work.</p>;
  }

  return (
    <>
      <form className="pillfield pillfield-s mt-4" role="search" onSubmit={(e) => e.preventDefault()}>
        <Icon name="search" size={20} />
        <label htmlFor={inputId} className="visually-hidden">
          Filter tropes
        </label>
        <input
          id={inputId}
          className="pillfield-input [&::-webkit-search-cancel-button]:appearance-none"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter tropes, like hero"
          autoComplete="off"
          aria-describedby={hintId}
        />
        {query && (
          <IconButton icon="close" size="s" tone="ghost" label="Clear the filter" onClick={() => setQuery("")} />
        )}
      </form>
      <div className="mt-3 flex flex-wrap justify-between gap-x-4 gap-y-1">
        <p className="body-s muted" id={hintId}>
          Select a trope to find works that share it.
        </p>
        <p className="body-s font-semibold num" aria-live="polite">
          {q ? (matches.length ? `${countLabel(matches.length, "trope")} ${matches.length === 1 ? "matches" : "match"}` : "No tropes match") : ""}
        </p>
      </div>
      {shown.length > 0 && (
        <ul ref={listRef} className="tags m-0 mt-4 list-none p-0">
          {shown.map((t) => (
            <li key={t} className="max-w-full">
              <TropeLink trope={t} />
            </li>
          ))}
        </ul>
      )}
      {hidden > 0 && (
        <Button variant="secondary" size="m" className="mt-6" onClick={showAll}>
          Show all {countLabel(sorted.length, "trope")}
        </Button>
      )}
    </>
  );
}
