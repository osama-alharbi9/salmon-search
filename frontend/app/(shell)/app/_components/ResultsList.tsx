"use client";
import type { MouseEvent } from "react";
import type { VdsSearchResponse } from "@/app/lib/api";
import { ResultCard, SaveWorkButton } from "@/app/ui";
import { useMedia } from "@/app/lib/media";
import { rememberOpenedFromResults } from "./memory";

/** The ranked list of result cards (DESIGN.md 5.6). */
export function ResultsList({
  res,
  href,
}: {
  res: VdsSearchResponse;
  href: string;
}) {
  // Remember that a work was opened from these results, so its page can go Back.
  const media = useMedia(res.results.map((r) => r.id));
  const click = (e: MouseEvent<HTMLOListElement>) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>(
      "a[href^='/work/']",
    );
    if (a) rememberOpenedFromResults(href, a.pathname);
  };

  return (
    <>
      <ol
        className="results"
        onClickCapture={click}
        aria-label="Results, fullest first"
      >
        {res.results.map((r, i) => (
          <ResultCard
            key={r.id}
            rank={i + 1}
            work={{
              id: r.id,
              title: r.title,
              namespace: r.namespace,
              n_tropes: r.n_tropes,
              poster: media[r.id]?.poster_small,
              year: media[r.id]?.year,
            }}
            matched={r.matched_tropes}
            missing={r.missing_tropes}
            wanted={r.wanted_count}
            save={
              <SaveWorkButton
                work={{ id: r.id, title: r.title, namespace: r.namespace }}
                next={href}
              />
            }
          />
        ))}
      </ol>
    </>
  );
}
