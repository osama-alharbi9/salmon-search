import type { ReactNode, Ref } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type BannerVariant = "info" | "warning" | "error" | "success";

export type BannerProps = {
  variant?: BannerVariant;
  /** 16/24 600. */
  title?: ReactNode;
  /** Body 14/20. */
  children?: ReactNode;
  /** Optional action on the right: an S <Button> or a text link. */
  action?: ReactNode;
  /** Shows a 32 px close button ("Dismiss"). */
  onClose?: () => void;
  /** Make the banner focusable (tabIndex -1) so code can move focus to it. */
  focusable?: boolean;
  ref?: Ref<HTMLDivElement>;
  id?: string;
  className?: string;
};

const DISC: Record<BannerVariant, ReactNode> = {
  info: "i",
  warning: "!",
  error: "!",
  success: <Icon name="check" size={20} />,
};

/**
 * In-page message (DESIGN.md 5.11). Error banners use role="alert", the others
 * role="status". Never put stack traces, status codes or env var names in one.
 */
export function Banner({
  variant = "info",
  title,
  children,
  action,
  onClose,
  focusable,
  ref,
  id,
  className,
}: BannerProps) {
  return (
    <div
      ref={ref}
      id={id}
      className={cx("banner", `banner-${variant}`, className)}
      role={variant === "error" ? "alert" : "status"}
      tabIndex={focusable ? -1 : undefined}
    >
      <span className="banner-disc" aria-hidden="true">
        {DISC[variant]}
      </span>
      <div className="banner-text">
        {title && <div className="banner-title">{title}</div>}
        {children && <div className="banner-body">{children}</div>}
      </div>
      {action && <div className="banner-action">{action}</div>}
      {onClose && <IconButton icon="close" label="Dismiss" size="s" className="banner-close" onClick={onClose} />}
    </div>
  );
}
