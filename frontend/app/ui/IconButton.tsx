import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from "react";
import { cx } from "./cx";
import { Icon, ICON_NAMES, type IconName } from "./Icon";

type CommonProps = {
  icon: IconName;
  /** Required accessible name, e.g. "Back to results", "Save Firefly". */
  label: string;
  /** "s" 32 (overflow, chip remove in rows), "m" 40 (close, save; default), "l" 48 (back, account). */
  size?: "s" | "m" | "l";
  /** "neutral" grey disc (default) or "ghost" transparent until hover. */
  tone?: "neutral" | "ghost";
  className?: string;
};

export type IconButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps | "children" | "aria-label"> & {
    href?: undefined;
    /**
     * Toggle state (sets aria-pressed). Pressed draws a deep disc with a
     * --salmon-50 icon, and switches to the "-filled" icon when one exists
     * (bookmark -> bookmark-filled). Change `label` with the state too.
     */
    pressed?: boolean;
    ref?: Ref<HTMLButtonElement>;
  };

export type IconButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "children" | "aria-label" | "href"> & {
    /** Renders a Next <Link> (e.g. save when signed out -> /login?next=…). */
    href: string;
    ref?: Ref<HTMLAnchorElement>;
  };

export type IconButtonProps = IconButtonAsButton | IconButtonAsLink;

function filledVariant(icon: IconName): IconName {
  const filled = `${icon}-filled` as IconName;
  return ICON_NAMES.includes(filled) ? filled : icon;
}

/** Round icon-only button (DESIGN.md 5.1). Always has an aria-label. */
export function IconButton(props: IconButtonProps) {
  const { icon, label, size = "m", tone = "neutral", className } = props;
  const cls = cx(
    "ibtn",
    size === "s" && "ibtn-s",
    size === "l" && "ibtn-l",
    tone === "ghost" && "ibtn-ghost",
    className,
  );
  const iconSize = size === "l" ? 24 : size === "s" ? 16 : 20;

  if (props.href !== undefined) {
    const { href, icon: _i, label: _l, size: _s, tone: _t, className: _c, ...rest } = props;
    void [_i, _l, _s, _t, _c];
    return (
      <Link {...rest} href={href} className={cls} aria-label={label}>
        <Icon name={icon} size={iconSize} />
      </Link>
    );
  }

  const {
    pressed,
    type = "button",
    icon: _i,
    label: _l,
    size: _s,
    tone: _t,
    className: _c,
    href: _h,
    ...rest
  } = props;
  void [_i, _l, _s, _t, _c, _h];
  return (
    <button
      {...rest}
      type={type}
      className={cls}
      aria-label={label}
      aria-pressed={pressed === undefined ? undefined : pressed}
    >
      <Icon name={pressed ? filledVariant(icon) : icon} size={iconSize} />
    </button>
  );
}
