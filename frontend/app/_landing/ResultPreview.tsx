import type { ReactNode } from "react";
import { Chip, Icon, ResultCard } from "../ui";
import { formatCount } from "../lib/query";
import type { ExampleRow } from "./data";

// Static pictures of the real app, built from the real components with real
// data (DESIGN.md 4.6: "imagery is real product UI"). They are pictures, not
// controls: the visual part is aria-hidden and inert, and a caption (visible
// or visually hidden) says what it shows.

/** A grey save disc that looks like the save button but is not one. */
export function FakeSave() {
  return (
    <span className="ibtn" aria-hidden="true">
      <Icon name="bookmark" size={20} />
    </span>
  );
}

/** Rows of result cards for a picture: no links, no tags unless asked. */
export function PreviewRows({
  rows,
  wanted,
  save = true,
  showTags = false,
}: {
  rows: ExampleRow[];
  wanted: number;
  save?: boolean;
  showTags?: boolean;
}) {
  return (
    <ol className="results">
      {rows.map((r, i) => (
        <ResultCard
          key={r.work.id}
          rank={i + 1}
          work={r.work}
          matched={r.matched}
          missing={r.missing}
          wanted={wanted}
          showTags={showTags}
          noLink
          save={save ? <FakeSave /> : undefined}
        />
      ))}
    </ol>
  );
}

/** The resolved chips row of a composer, without remove buttons. */
export function PreviewChips({ chips }: { chips: { phrase: string; trope: string; count: number }[] }) {
  return (
    <>
      {chips.map((c) => (
        <Chip key={c.trope} kind="resolved" label={c.trope} phrase={c.phrase} count={c.count} />
      ))}
    </>
  );
}

/** "4,232 works  have at least 1 of your 3 tropes." */
export function PreviewSummary({ total, wanted, noun = "works" }: { total: number; wanted: number; noun?: string }) {
  return (
    <p className="lp-summary">
      <span className="h2 num">
        {formatCount(total)} {noun}
      </span>
      <span className="muted">
        have at least 1 of your {wanted} {wanted === 1 ? "trope" : "tropes"}.
      </span>
    </p>
  );
}

/** A composer-shaped box holding chips, with the search icon. Picture only. */
export function PreviewComposer({ children }: { children: ReactNode }) {
  return (
    <div className="composer lp-composer-static">
      <Icon name="search" size={24} className="composer-lead" />
      {children}
    </div>
  );
}
