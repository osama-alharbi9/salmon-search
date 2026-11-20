import Link from "next/link";
import { buttonClass, Chip } from "../ui";
import { appHref, filterLabel } from "../lib/query";
import {
  BEBOP_ITEMS,
  BEBOP_LEADER,
  BEBOP_TROPES,
  FILM_CHIPS,
  FILM_ITEMS,
  FILM_ROWS,
  FILM_TOTAL,
} from "./data";
import { PreviewChips, PreviewComposer, PreviewRows, PreviewSummary } from "./ResultPreview";

// Feature splits (DESIGN.md 9.1 #6 and #7, m03, m04, m18): text and a crop of
// the real composer and results. #7 is mirrored on lg+.

export function TitleSplit() {
  return (
    <section className="lp-band lp-split-band" aria-labelledby="title-split-h">
      <div className="mk-container lp-split">
        <div className="lp-split-text">
          <h2 id="title-split-h" className="heading-l">
            Start from a story you already love
          </h2>
          <p className="body-m muted lp-split-body">
            Type a title of two or more words, or put like in front of any title. salmon swaps it for up to 12 of that
            work&apos;s most distinctive tropes, the rarest ones that still appear in at least 8 works, and leaves the work
            itself out of the results.
          </p>
          <div className="lp-split-actions">
            <Link className={buttonClass("primary", "l")} href={appHref(BEBOP_ITEMS)}>
              Try like Cowboy Bebop
            </Link>
            <a className="link" href="#faq-titles">
              See how titles work
            </a>
          </div>
        </div>
        <figure className="lp-media">
          <div className="lp-media-panel" aria-hidden="true" inert>
            <PreviewComposer>
              <Chip kind="title" label="Cowboy Bebop" phrase="like Cowboy Bebop" meta="12 tropes" />
              <Chip kind="filter" label={filterLabel("include", ["Anime"])} />
            </PreviewComposer>
            <p className="label muted lp-media-label">Cowboy Bebop became 12 tropes</p>
            <div className="tags lp-media-tags">
              {BEBOP_TROPES.map((t) => (
                <span className="tag lp-tag-grey" key={t}>
                  {t}
                </span>
              ))}
            </div>
            <div className="lp-media-rows">
              <PreviewRows rows={[BEBOP_LEADER]} wanted={12} save={false} />
            </div>
          </div>
          <figcaption className="body-s muted lp-media-cap">
            like Cowboy Bebop, anime only. Ghost in the Shell: Stand Alone Complex leads.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

export function FilterSplit() {
  return (
    <section className="lp-band lp-split-band lp-band-follow" aria-labelledby="filter-split-h">
      <div className="mk-container lp-split lp-split-mirror">
        <div className="lp-split-text">
          <h2 id="filter-split-h" className="heading-l">
            Keep it to film, anime, books or games
          </h2>
          <p className="body-m muted lp-split-body">
            Add movies only, anime only or no fanfic to your search. Words like only, no, just and without next to a
            medium set a filter. They never count as tropes.
          </p>
          <div className="lp-split-actions">
            <Link className={buttonClass("primary", "l")} href={appHref(FILM_ITEMS)}>
              Try a film-only search
            </Link>
          </div>
        </div>
        <figure className="lp-media">
          <div className="lp-media-panel" aria-hidden="true" inert>
            <PreviewComposer>
              <PreviewChips chips={FILM_CHIPS} />
              <Chip kind="filter" label={filterLabel("include", ["Film"])} />
            </PreviewComposer>
            <PreviewSummary total={FILM_TOTAL} wanted={2} />
            <PreviewRows rows={FILM_ROWS} wanted={2} save={false} />
            <p className="label muted lp-media-label">Other filters</p>
            <div className="tags">
              <Chip kind="filter" label={filterLabel("include", ["Anime"])} />
              <Chip kind="filter" label={filterLabel("include", ["Literature"])} />
              <Chip kind="filter" label={filterLabel("exclude", ["Fanfic"])} />
            </div>
          </div>
          <figcaption className="body-s muted lp-media-cap">
            time travel, stable time loop, movies only. Interstellar and Star Trek: First Contact lead.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
