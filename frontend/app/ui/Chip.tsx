import Link from "next/link";
import type { ReactNode, Ref } from "react";
import { countLabel, tropeHref } from "../lib/query";
import { cx } from "./cx";
import { Icon } from "./Icon";

/**
 * Composer chip kinds (DESIGN.md 5.4):
 * - pending: phrase sent to /api/resolve, no answer yet (dashed, spinner)
 * - resolved: matched a trope (salmon-100, "1,988 works")
 * - weak: matched with sim under 0.85 (yellow, "Check this match")
 * - title: "like X" or a server-expanded title (grey, "Title" or "12 tropes")
 * - filter: a medium filter clause (outlined, "Film only"); include or exclude look the same
 * - unknown: in unknown[] or resolve failed (red dashed, "No trope found")
 */
export type ChipKind = "pending" | "resolved" | "weak" | "title" | "filter" | "unknown";

export type ChipProps = {
  kind: ChipKind;
  /** Visible label: the trope name (resolved, weak), the raw phrase (pending,
   *  unknown), the title without "like" (title) or the filter label (filter). */
  label: string;
  /** What the person typed. Used in title="" and the accessible name. */
  phrase?: string;
  /** Works using the trope (resolved): shows "1,988 works". */
  count?: number;
  /** Override the meta text after the label. */
  meta?: ReactNode;
  /** Remove handler. Renders a 32 px "Remove {label}" button. */
  onRemove?: () => void;
  /** Ref to the remove button (Backspace in an empty composer focuses the last one). */
  removeRef?: Ref<HTMLButtonElement>;
  /** Override the remove button's accessible name. */
  removeLabel?: string;
  /** Extra control inside the chip before the remove button (e.g. a title's disclosure). */
  children?: ReactNode;
  className?: string;
};

function defaultMeta(kind: ChipKind, count?: number): ReactNode {
  switch (kind) {
    case "resolved":
      return count === undefined ? null : countLabel(count, "work");
    case "weak":
      return "Check this match";
    case "title":
      return "Title";
    case "unknown":
      return "No trope found";
    default:
      return null;
  }
}

function srText(kind: ChipKind, label: string, phrase: string | undefined, count?: number, meta?: ReactNode) {
  const said = phrase && phrase.toLowerCase() !== label.toLowerCase() ? phrase : undefined;
  const metaText = typeof meta === "string" ? meta : undefined;
  switch (kind) {
    case "pending":
      return `${label}, looking for a matching trope`;
    case "resolved":
      return [
        said ?? label,
        said ? `matched ${label}` : "matched",
        count === undefined ? undefined : `used by ${countLabel(count, "work")}`,
      ]
        .filter(Boolean)
        .join(", ");
    case "weak":
      return `${said ?? label}, weak match ${label}, check this match`;
    case "title":
      return `${label}, title${metaText && metaText !== "Title" ? `, ${metaText}` : ""}`;
    case "filter":
      return `${label}, filter`;
    case "unknown":
      return `${label}, no trope found`;
  }
}

const LEAD_ICON: Partial<Record<ChipKind, ReactNode>> = {
  weak: <Icon name="alert" size={16} />,
  title: <Icon name="title" size={20} />,
  filter: <Icon name="filter" size={16} />,
  unknown: <Icon name="info" size={16} />,
};

/**
 * A composer chip. The body is not clickable; only the remove button is.
 * The full description ("true companions, matched True Companions, used by
 * 1,988 works") is read once; the visible parts are hidden from screen readers.
 */
export function Chip({
  kind,
  label,
  phrase,
  count,
  meta,
  onRemove,
  removeRef,
  removeLabel,
  children,
  className,
}: ChipProps) {
  const shownMeta = meta === undefined ? defaultMeta(kind, count) : meta;
  return (
    <span
      className={cx("chip", `chip-${kind}`, className)}
      title={phrase && phrase !== label ? `${phrase}: ${label}` : label}
      aria-busy={kind === "pending" || undefined}
    >
      <span className="visually-hidden">{srText(kind, label, phrase, count, shownMeta)}</span>
      {LEAD_ICON[kind]}
      <span className="chip-label" aria-hidden="true">
        {label}
      </span>
      {shownMeta !== null && shownMeta !== undefined && (
        <span className="chip-meta num" aria-hidden="true">
          {shownMeta}
        </span>
      )}
      {kind === "pending" && <span className="spin spin-16" aria-hidden="true" />}
      {children && <span className="chip-extra">{children}</span>}
      {onRemove && (
        <button
          type="button"
          className="chip-x"
          ref={removeRef}
          aria-label={removeLabel ?? `Remove ${label}`}
          onClick={onRemove}
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </span>
  );
}

// ── read-only result tags ─────────────────────────────────────────────────────

/** Read-only tag inside result cards: matched (check) or missing (minus, dashed). */
export function Tag({ kind, children }: { kind: "matched" | "missing"; children: ReactNode }) {
  return (
    <span className={cx("tag", `tag-${kind}`)}>
      <Icon name={kind === "matched" ? "check" : "minus"} size={16} />
      <span>{children}</span>
    </span>
  );
}

/**
 * The "Missing" word plus its tags, wrapped as one group so the word never ends
 * a line alone. `more` is an optional trailing control (e.g. "+7 more").
 */
export function MissingGroup({ tropes, more }: { tropes: string[]; more?: ReactNode }) {
  if (!tropes.length && !more) return null;
  return (
    <span className="missgrp">
      <span className="miss-label">Missing</span>
      {tropes.map((t) => (
        <Tag kind="missing" key={t}>
          {t}
        </Tag>
      ))}
      {more}
    </span>
  );
}

/** Work-page trope pill: a link to /app?trope=… (32 tall, grey). */
export function TropeLink({ trope, className }: { trope: string; className?: string }) {
  return (
    <Link href={tropeHref(trope)} className={cx("tag", "tag-trope", className)} prefetch={false}>
      {trope}
    </Link>
  );
}
