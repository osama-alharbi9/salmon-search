import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";
import { Icon } from "./Icon";

export type ExternalLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "target" | "rel"> & {
  href: string;
  children: ReactNode;
  /** Hide the 16 px arrow-out icon (keeps the "(opens in a new tab)" text). */
  noIcon?: boolean;
};

/**
 * Text link to another site (DESIGN.md 5.1): opens in a new tab with
 * rel="noopener", adds the arrow-out icon and "(opens in a new tab)" for
 * screen readers. Styled as .link unless you pass your own className.
 */
export function ExternalLink({ href, children, noIcon, className, ...rest }: ExternalLinkProps) {
  return (
    <a {...rest} href={href} target="_blank" rel="noopener noreferrer" className={cx(className ?? "link")}>
      {children}
      {!noIcon && <Icon name="external" size={16} />}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

/** The TVTropes licence credit used in the sidebar, footers and work pages. */
export const TVTROPES_URL = "https://tvtropes.org";
export const CC_BY_NC_SA_URL = "https://creativecommons.org/licenses/by-nc-sa/3.0/";
