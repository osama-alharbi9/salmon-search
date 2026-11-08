import type { ReactNode } from "react";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type EmptyStateProps = {
  /** Outline icon in the 64 px grey disc (48 px when compact). */
  icon: IconName;
  /** Title, 20/28 600 (18/28 when compact). */
  title: ReactNode;
  /** Heading level for the title. Default h2. */
  titleAs?: "h1" | "h2" | "h3" | "p";
  /** Body 16/24 secondary, max 400 wide: what appears here and how. */
  children?: ReactNode;
  /** One action (primary or secondary M), or two for the signed-out state. */
  action?: ReactNode;
  /** Smaller version for inside a bordered card. */
  compact?: boolean;
  className?: string;
};

/** Centred empty state (DESIGN.md 5.13). */
export function EmptyState({ icon, title, titleAs = "h2", children, action, compact, className }: EmptyStateProps) {
  const Title = titleAs;
  return (
    <div className={cx("empty", compact && "empty-compact", className)}>
      <span className="empty-disc" aria-hidden="true">
        <Icon name={icon} size={compact ? 24 : 32} />
      </span>
      <Title className="empty-title">{title}</Title>
      {children && <p className="empty-body">{children}</p>}
      {action && <div className="empty-actions">{action}</div>}
    </div>
  );
}
