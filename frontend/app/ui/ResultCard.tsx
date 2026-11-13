"use client";
import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { cleanTitle, countLabel, mediaLabel, workHref } from "../lib/query";
import { Button } from "./Button";
import { MissingGroup, Tag } from "./Chip";
import { cx } from "./cx";

/**
 * Coverage meter (DESIGN.md 5.6): one segment per wanted trope, deep for
 * matched, grey for missing; 96 wide, 8 px segments past 8 (118 for 12);
 * above 12 wanted, one continuous bar. Hidden from screen readers because the
 * text ("3 of 3") says the same.
 */
export function Meter({ matched, wanted, className }: { matched: number; wanted: number; className?: string }) {
  if (wanted <= 0) return null;
  if (wanted > 12) {
    return (
      <span className={cx("meter-bar", className)} style={{ width: 96 }} aria-hidden="true">
        <i style={{ width: `${Math.round((matched / wanted) * 100)}%` }} />
      </span>
    );
  }
  const width = wanted > 8 ? wanted * 8 + (wanted - 1) * 2 : 96;
  return (
    <span className={cx("meter", wanted > 8 && "meter-dense", className)} style={{ width }} aria-hidden="true">
      {Array.from({ length: wanted }, (_, i) => (
        <i key={i} data-on={i < matched ? "true" : undefined} />
      ))}
    </span>
  );
}

export type ResultCardWork = {
  /** "Namespace/Slug" */
  id: string;
  title: string;
  namespace: string;
  n_tropes?: number;
};

export type ResultCardProps = {
  /** 1-based rank shown in the disc. */
  rank: number;
  work: ResultCardWork;
  /** Matched trope names (shown as check tags). */
  matched: string[];
  /** Missing trope names (dashed tags after the word "Missing"). */
  missing: string[];
  /** Number of wanted tropes (wanted_count). */
  wanted: number;
  /** Right-most control, normally <SaveWorkButton work={…} />. */
  save?: ReactNode;
  /** Show the tag row (default true). The landing stage hides it. */
  showTags?: boolean;
  /** Missing tags shown before "+N more" (default 3). */
  maxMissing?: number;
  /** Render the title as plain text instead of a link (static previews). */
  noLink?: boolean;
  className?: string;
};

/**
 * Result card with coverage meter (DESIGN.md 5.6). Render inside
 * <ol className="results">. Full matches get the salmon rank disc.
 */
export function ResultCard({
  rank,
  work,
  matched,
  missing,
  wanted,
  save,
  showTags = true,
  maxMissing = 3,
  noLink,
  className,
}: ResultCardProps) {
  const [open, setOpen] = useState(false);
  const tagsId = useId();
  const full = matched.length >= wanted && wanted > 0;
  const title = cleanTitle(work.title, work.namespace);
  const label = mediaLabel(work.namespace);
  const tropes = work.n_tropes === undefined ? null : countLabel(work.n_tropes, "trope");
  const extra = Math.max(0, missing.length - maxMissing);
  const shownMissing = open ? missing : missing.slice(0, maxMissing);
  const summary = `${label}${tropes ? `, ${tropes}` : ""}. Has ${matched.length} of ${wanted} ${wanted === 1 ? "trope" : "tropes"}.`;

  return (
    <li className={cx("rc", !save && "rc-noact", className)}>
      <span className={cx("rank", full && "rank-full")} aria-hidden="true">
        {rank}
      </span>
      <div className="rc-main">
        <span className="visually-hidden">{rank}. </span>
        {noLink ? (
          <span className="rc-title">{title}</span>
        ) : (
          <Link className="rc-title" href={workHref(work.id)}>
            {title}
          </Link>
        )}
        <span className="visually-hidden">, {summary}</span>
        <div className="rc-meta" aria-hidden="true">
          {label}
          {tropes && <> · <span className="num">{tropes}</span></>}
        </div>
      </div>
      <div className="cov" aria-hidden="true">
        <span className="cov-val">
          {matched.length} of {wanted}
        </span>
        <Meter matched={matched.length} wanted={wanted} />
      </div>
      {save}
      {showTags && (matched.length > 0 || missing.length > 0) && (
        <div className="tags" id={tagsId}>
          {matched.length > 0 && <span className="visually-hidden">Has: </span>}
          {matched.map((t) => (
            <Tag kind="matched" key={t}>
              {t}
            </Tag>
          ))}
          <MissingGroup
            tropes={shownMissing}
            more={
              extra > 0 ? (
                <Button
                  variant="tertiary"
                  size="s"
                  aria-expanded={open}
                  aria-controls={tagsId}
                  onClick={() => setOpen((o) => !o)}
                >
                  {open ? "Show fewer" : `+${extra} more`}
                  <span className="visually-hidden"> missing tropes</span>
                </Button>
              ) : null
            }
          />
        </div>
      )}
    </li>
  );
}
