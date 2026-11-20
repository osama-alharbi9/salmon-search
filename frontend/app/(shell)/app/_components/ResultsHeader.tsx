"use client";
import type { ReactNode, Ref } from "react";
import type { VdsSearchResponse } from "@/app/lib/api";
import { Banner, Chip } from "@/app/ui";
import { cleanTitle, countLabel, filterLabel } from "@/app/lib/query";
import type { ExpandedTitle } from "./chips";

/** salmon returns at most this many results per search. */
export const PAGE_SIZE = 25;

/**
 * The number of works to report. The server's total counts pages, and a work
 * can have several pages with one title that the list shows once. A list
 * shorter than a full page is everything there is, so its length is the count.
 */
export function displayTotal(res: VdsSearchResponse): number {
  return res.results.length < PAGE_SIZE ? res.results.length : res.total;
}

export function wantedCount(res: VdsSearchResponse): number {
  return res.results[0]?.wanted_count ?? res.tropes.length;
}

/** "have at least 1 of your 3 tropes. Showing the top 25, fullest first." */
export function summaryLine(res: VdsSearchResponse): string {
  const total = displayTotal(res);
  const shown = res.results.length;
  const wanted = wantedCount(res);
  const verb = total === 1 ? "has" : "have";
  if (wanted === 1) {
    const which = res.tropes[0] ? `the trope ${res.tropes[0]}` : "your trope";
    return `${verb} ${which}.${shown < total ? ` Showing the top ${shown}.` : ""}`;
  }
  const lead = `${verb} at least 1 of your ${wanted} tropes.`;
  if (shown < total) return `${lead} Showing the top ${shown}, fullest first.`;
  if (total > 1) return `${lead} Showing all of them, fullest first.`;
  return lead;
}

export type TitleRow = ExpandedTitle & { key: string; regionId: string; open: boolean };

export type ResultsHeaderProps = {
  res: VdsSearchResponse;
  headingRef: Ref<HTMLHeadingElement>;
  /** Save search button (or the signed-out link). */
  saveAction: ReactNode;
  titles: TitleRow[];
  onToggleTitle: (key: string) => void;
  onClearFilter: () => void;
  /** "like X" items whose work was not found: [title, trope it became]. */
  missingTitles: { title: string; trope?: string }[];
  /** True when any chip is a loose match. */
  weak: boolean;
};

/** Medium filter chips as they read in the results ("Only film", "No fan fiction"). */
export function FilterChips({ medium }: { medium: VdsSearchResponse["medium"] }) {
  return (
    <>
      {medium.include.length > 0 && (
        <Chip kind="filter" label={filterLabel("include", medium.include, "prefix")} />
      )}
      {medium.exclude.length > 0 && (
        <Chip kind="filter" label={filterLabel("exclude", medium.exclude, "prefix")} />
      )}
    </>
  );
}

export function hasFilter(res: VdsSearchResponse): boolean {
  return res.medium.include.length > 0 || res.medium.exclude.length > 0;
}

/**
 * Results header (DESIGN.md 9.2 step 4): "4,232 works", the summary line and
 * Save search, then the filter, title, unmatched and weak-match rows when they
 * apply.
 */
export function ResultsHeader({
  res,
  headingRef,
  saveAction,
  titles,
  onToggleTitle,
  onClearFilter,
  missingTitles,
  weak,
}: ResultsHeaderProps) {
  return (
    <div className="mt-10 mb-6 grid gap-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 ref={headingRef} tabIndex={-1} className="h2 num scroll-mt-24 outline-none">
            {countLabel(displayTotal(res), "work")}
          </h2>
          <p className="muted mt-1">{summaryLine(res)}</p>
        </div>
        {saveAction}
      </div>

      {hasFilter(res) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="visually-hidden">Filter:</span>
          <FilterChips medium={res.medium} />
          <button type="button" className="textbtn" onClick={onClearFilter}>
            Clear filter
          </button>
        </div>
      )}

      {titles.map((t) => (
        <div key={t.key} className="grid gap-3">
          <p className="body-s flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span>
              <span className="font-semibold">{cleanTitle(t.title, t.id.split("/")[0])}</span> became{" "}
              <span className="num">{countLabel(t.tropes.length, "trope")}</span>.
            </span>
            <button
              type="button"
              className="textbtn"
              aria-expanded={t.open}
              aria-controls={t.regionId}
              onClick={() => onToggleTitle(t.key)}
            >
              {t.open ? "Hide them" : "Show them"}
            </button>
          </p>
          <ul
            id={t.regionId}
            hidden={!t.open}
            className="tags m-0 list-none p-0"
            aria-label={`Tropes from ${cleanTitle(t.title, t.id.split("/")[0])}`}
          >
            {t.tropes.map((tr) => (
              <li key={tr} className="tag bg-muted text-ink">
                {tr}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {missingTitles.map((m) => (
        <p key={m.title} className="body-s">
          No work is called {m.title}, so salmon searched it as{" "}
          {m.trope ? <>the trope <span className="font-semibold">{m.trope}</span></> : "a trope"}.
        </p>
      ))}

      {res.unknown.length > 0 && (
        <p className="body-s">No trope found for: {res.unknown.join(", ")}.</p>
      )}

      {weak && (
        <Banner variant="warning" title="Some phrases only loosely matched a trope">
          Check the chips marked Check this match. If a trope is wrong, remove it and try other wording.
        </Banner>
      )}
    </div>
  );
}
