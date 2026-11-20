import Link from "next/link";
import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type DiscProps = {
  /** Icon inside the disc (24 px; 16 on size 32, 32 on size 64). */
  icon?: IconName;
  /** Text inside instead of an icon, e.g. initials or a rank. */
  children?: ReactNode;
  /** 32, 40, 48 (default) or 64. */
  size?: 32 | 40 | 48 | 64;
  /**
   * grey (default, --grey-100), white (1 px ring, for action rows),
   * salmon (full match), deep (pressed or selected), tint (--salmon-100).
   */
  tone?: "grey" | "white" | "salmon" | "deep" | "tint";
  className?: string;
};

/** Round disc that leads list rows, empty states and the account button (DESIGN.md 5.15). */
export function Disc({ icon, children, size = 48, tone = "grey", className }: DiscProps) {
  const iconSize = size === 32 ? 16 : size === 64 ? 32 : size === 40 ? 20 : 24;
  return (
    <span
      className={cx("disc", size !== 48 && `disc-${size}`, tone !== "grey" && `disc-${tone}`, className)}
      aria-hidden={children === undefined ? true : undefined}
    >
      {icon ? <Icon name={icon} size={iconSize} /> : children}
    </span>
  );
}

export type ListRowProps = {
  /** Leading disc: an icon name for a default 48 px grey disc, or any node (e.g. <Disc tone="white" …/>). */
  disc?: IconName | ReactNode;
  /** Title, 16/24 600. */
  title: ReactNode;
  /** One grey line under the title (14/20, ellipsis). */
  secondary?: ReactNode;
  /**
   * Makes the row clickable: the title becomes the link (it carries the focus
   * ring) and the whole row responds to clicks and hover.
   */
  href?: string;
  /** Show a chevron at the right of a clickable row. */
  chevron?: boolean;
  /** Right side: S buttons, an overflow icon button, a toggle. Clicks here never trigger the row link. */
  actions?: ReactNode;
  /** Element to render: li (default, put rows in <List>) or div. */
  as?: "li" | "div";
  className?: string;
};

/**
 * List row (DESIGN.md 5.15): disc, title over a grey line, actions on the
 * right, min-height 72, no dividers.
 */
export function ListRow({ disc, title, secondary, href, chevron, actions, as = "li", className }: ListRowProps) {
  const Tag = as;
  const discNode =
    typeof disc === "string" ? <Disc icon={disc as IconName} /> : disc;
  return (
    <Tag className={cx("row", href && "row-clickable", className)}>
      {discNode}
      <div className="row-body">
        {href ? (
          <Link href={href} className="row-link row-title">
            {title}
          </Link>
        ) : (
          <span className="row-title">{title}</span>
        )}
        {secondary && <span className="row-sub">{secondary}</span>}
      </div>
      {actions && <div className="row-actions">{actions}</div>}
      {href && chevron && <Icon name="chevron-right" size={24} className="row-chevron" />}
    </Tag>
  );
}

/** A plain <ul> for ListRows, with optional group label and hairline (5.15). */
export function List({
  label,
  children,
  className,
  labelId,
}: {
  /** Group label, e.g. "Today" or "Try one of these". */
  label?: ReactNode;
  /** id for the label, so the list can be aria-labelledby it. Auto when omitted. */
  labelId?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("list-group", className)}>
      {label && (
        <div className="list-group-label" id={labelId}>
          {label}
        </div>
      )}
      <ul className="list" aria-labelledby={label && labelId ? labelId : undefined}>
        {children}
      </ul>
    </div>
  );
}
