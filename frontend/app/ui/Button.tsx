"use client";
import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  MouseEvent,
  ReactNode,
  Ref,
} from "react";
import { buttonClass, type ButtonSize, type ButtonVariant } from "./buttonClass";
import { cx } from "./cx";
import { Icon, type IconName } from "./Icon";

export type { ButtonSize, ButtonVariant };

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon (20 px, 16 px on S). */
  icon?: IconName;
  /** Trailing icon. */
  iconEnd?: IconName;
  /** Loading: spinner + loadingLabel, aria-busy, clicks ignored, width locked. */
  loading?: boolean;
  /** The -ing verb shown while loading, e.g. "Searching". Defaults to the children. */
  loadingLabel?: ReactNode;
  /** Full width (form submits). */
  block?: boolean;
  className?: string;
  children?: ReactNode;
};

export type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
    ref?: Ref<HTMLButtonElement>;
  };

export type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps | "href"> & {
    /** Renders a Next <Link>; with `external`, a plain <a target="_blank">. */
    href: string;
    /** External link: new tab, rel="noopener", arrow icon, "(opens in a new tab)". */
    external?: boolean;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
    ref?: Ref<HTMLAnchorElement>;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Pill button (DESIGN.md 5.1). Renders a <button type="button"> by default, a
 * Next <Link> when given `href`, or an external <a> with `external`.
 */
export function Button(props: ButtonProps) {
  const {
    variant = "primary",
    size = "m",
    icon,
    iconEnd,
    loading = false,
    loadingLabel,
    block,
    className,
    children,
  } = props;
  const iconSize = size === "s" ? 16 : 20;
  const cls = buttonClass(variant, size, cx(block && "btn-block", className));

  const content = (
    <>
      {icon && <Icon name={icon} size={iconSize} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={iconSize} />}
    </>
  );
  // While loading, the idle label stays (hidden) in the same grid cell as the
  // busy label, so the button never shrinks.
  const body = (
    <span className="btn-stack">
      <span data-hidden={loading ? "true" : undefined}>{content}</span>
      {loading && (
        <span>
          <span className="spin" aria-hidden="true" />
          {loadingLabel ?? children}
        </span>
      )}
    </span>
  );

  if (props.href !== undefined) {
    const {
      href,
      external,
      prefetch,
      replace,
      scroll,
      onClick,
      variant: _v,
      size: _s,
      icon: _i,
      iconEnd: _ie,
      loading: _l,
      loadingLabel: _ll,
      block: _b,
      className: _c,
      children: _ch,
      ...rest
    } = props;
    void [_v, _s, _i, _ie, _l, _ll, _b, _c, _ch];
    const guard = (e: MouseEvent<HTMLAnchorElement>) => {
      if (loading) {
        e.preventDefault();
        return;
      }
      onClick?.(e);
    };
    if (external) {
      return (
        <a
          {...rest}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={cls}
          aria-busy={loading || undefined}
          onClick={guard}
        >
          {icon && <Icon name={icon} size={iconSize} />}
          {children}
          <Icon name="external" size={16} />
          <span className="visually-hidden"> (opens in a new tab)</span>
        </a>
      );
    }
    return (
      <Link
        {...rest}
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        className={cls}
        aria-busy={loading || undefined}
        aria-disabled={loading || undefined}
        onClick={guard}
      >
        {body}
      </Link>
    );
  }

  const {
    type = "button",
    onClick,
    variant: _v,
    size: _s,
    icon: _i,
    iconEnd: _ie,
    loading: _l,
    loadingLabel: _ll,
    block: _b,
    className: _c,
    children: _ch,
    href: _h,
    ...rest
  } = props;
  void [_v, _s, _i, _ie, _l, _ll, _b, _c, _ch, _h];
  return (
    <button
      {...rest}
      type={type}
      className={cls}
      aria-busy={loading || undefined}
      aria-disabled={loading || rest["aria-disabled"] || undefined}
      onClick={(e) => {
        if (loading) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    >
      {body}
    </button>
  );
}
