"use client";
import type { MouseEvent } from "react";
import type { VdsSearchResponse } from "@/app/lib/api";
import { CC_BY_NC_SA_URL, ExternalLink, ResultCard, SaveWorkButton, TVTROPES_URL } from "@/app/ui";
import { countLabel, formatCount } from "@/app/lib/query";
import { rememberOpenedFromResults } from "./memory";
import { displayTotal, PAGE_SIZE } from "./ResultsHeader";

/** "Showing the top 25 of 4,232. salmon returns 25 results per search." */
export function footerLine(shown: number, total: number): string {
  if (shown < total) {
    return `Showing the top ${formatCount(shown)} of ${formatCount(total)}. salmon returns ${PAGE_SIZE} results per search.`;
  }
  return `Showing all ${countLabel(total, "work")}. salmon returns up to ${PAGE_SIZE} results per search.`;
}

/** The ranked list of result cards (DESIGN.md 5.6) and the list footer. */
export function ResultsList({ res, href }: { res: VdsSearchResponse; href: string }) {
  // Remember that a work was opened from these results, so its page can go Back.
  const click = (e: MouseEvent<HTMLOListElement>) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href^='/work/']");
    if (a) rememberOpenedFromResults(href, a.pathname);
  };

  return (
    <>
      <ol className="results" onClickCapture={click} aria-label="Results, fullest first">
        {res.results.map((r, i) => (
          <ResultCard
            key={r.id}
            rank={i + 1}
            work={{ id: r.id, title: r.title, namespace: r.namespace, n_tropes: r.n_tropes }}
            matched={r.matched_tropes}
            missing={r.missing_tropes}
            wanted={r.wanted_count}
            save={<SaveWorkButton work={{ id: r.id, title: r.title, namespace: r.namespace }} next={href} />}
          />
        ))}
      </ol>
      <p className="body-s muted mt-6">
        {footerLine(res.results.length, displayTotal(res))} Trope data from{" "}
        <ExternalLink href={TVTROPES_URL}>TVTropes</ExternalLink>,{" "}
        <ExternalLink href={CC_BY_NC_SA_URL}>CC BY-NC-SA</ExternalLink>.
      </p>
    </>
  );
}
