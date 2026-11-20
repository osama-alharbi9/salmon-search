"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cx } from "./cx";

export type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  /** pill (default, text lines), circle (discs) or block (radius 16). */
  shape?: "pill" | "circle" | "block";
  className?: string;
  style?: CSSProperties;
};

/** One grey placeholder block with the shimmer (none under reduced motion). */
export function Skeleton({ width = "100%", height = 12, shape = "pill", className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("skel", shape === "circle" && "skel-circle", shape === "block" && "skel-block", className)}
      style={{ width, height, ...style }}
    />
  );
}

/**
 * Renders children only after `delay` ms (default 150), so fast answers never
 * flash a skeleton (DESIGN.md 5.14). Remount it (or change `key`) per load.
 */
export function Delayed({ delay = 150, children }: { delay?: number; children: ReactNode }) {
  const [show, setShow] = useState(delay <= 0);
  useEffect(() => {
    if (delay <= 0) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return show ? <>{children}</> : null;
}

/** Skeleton of a result card (5.6): disc, two lines, meter, three tags. */
export function ResultCardSkeleton() {
  return (
    <li className="rc" aria-hidden="true">
      <Skeleton shape="circle" width={40} height={40} className="rank" />
      <div style={{ display: "grid", gap: 8, paddingTop: 6 }}>
        <Skeleton height={14} width="40%" />
        <Skeleton height={10} width="25%" />
      </div>
      <div className="cov">
        <Skeleton height={12} width={48} />
        <Skeleton height={6} width={96} />
      </div>
      <Skeleton shape="circle" width={40} height={40} />
      <div className="tags">
        <Skeleton height={28} width={150} />
        <Skeleton height={28} width={110} />
        <Skeleton height={28} width={120} />
      </div>
    </li>
  );
}

/** Skeleton of a 72 px list row (5.15): disc, title and one line. */
export function ListRowSkeleton() {
  return (
    <li className="row" aria-hidden="true">
      <Skeleton shape="circle" width={48} height={48} />
      <div style={{ display: "grid", gap: 8, flex: 1 }}>
        <Skeleton height={14} width="45%" />
        <Skeleton height={10} width="30%" />
      </div>
    </li>
  );
}
