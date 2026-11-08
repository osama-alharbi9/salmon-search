"use client";
import { useRef, type KeyboardEvent } from "react";
import { formatCount } from "../lib/query";
import { cx } from "./cx";

export type SegmentOption<V extends string> = {
  value: V;
  label: string;
  /** Shown after the label: "Searches 1". */
  count?: number;
};

export type SegmentedControlProps<V extends string> = {
  /** Accessible name of the tab list, e.g. "Saved items". */
  label: string;
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Prefix for tab and panel ids. Panels use segmentPanelProps(idPrefix, value). */
  idPrefix: string;
  className?: string;
};

/** Ids that tie a tab to its panel. */
export function segmentIds(idPrefix: string, value: string) {
  return { tab: `${idPrefix}-tab-${value}`, panel: `${idPrefix}-panel-${value}` };
}

/** Spread on the panel element for the selected segment: role, id, aria-labelledby. */
export function segmentPanelProps(idPrefix: string, value: string) {
  const ids = segmentIds(idPrefix, value);
  return { role: "tabpanel" as const, id: ids.panel, "aria-labelledby": ids.tab, tabIndex: 0 };
}

/**
 * Segmented control (DESIGN.md 5.9): grey 44 px track, white thumb that slides
 * 200 ms. Each segment is a tab; arrow keys, Home and End move and select.
 * Keep the choice in the URL (/saved?tab=works) from onChange.
 */
export function SegmentedControl<V extends string>({
  label,
  options,
  value,
  onChange,
  idPrefix,
  className,
}: SegmentedControlProps<V>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const index = Math.max(0, options.findIndex((o) => o.value === value));

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    let next = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (index + 1) % options.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (index - 1 + options.length) % options.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = options.length - 1;
    if (next < 0) return;
    e.preventDefault();
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div className={cx("seg", className)} role="tablist" aria-label={label} onKeyDown={onKeyDown}>
      <span
        className="seg-thumb"
        aria-hidden="true"
        style={{
          width: `calc((100% - 8px) / ${options.length})`,
          transform: `translateX(${index * 100}%)`,
        }}
      />
      {options.map((o, i) => {
        const ids = segmentIds(idPrefix, o.value);
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={ids.tab}
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            className="seg-tab"
            onClick={() => onChange(o.value)}
          >
            {o.label}
            {o.count !== undefined && <span className="num"> {formatCount(o.count)}</span>}
          </button>
        );
      })}
    </div>
  );
}
