import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

/**
 * Card variants (DESIGN.md 5.5). Cards never have shadows.
 * - large: radius 32, padding 40 (24 mobile). Step cards, who-it's-for cards.
 * - medium: radius 24, padding 24. About card, vibe panel.
 * - content: white, hairline, radius 16, padding 24. Bordered lists, result-like boxes.
 * - nav: grey, radius 16, padding 16, whole-card link (needs href); hover grey-200.
 * - add: grey-50, dashed soft border, radius 16. "Save your first search" prompts.
 */
export type CardVariant = "large" | "medium" | "content" | "nav" | "add";

export type CardProps = HTMLAttributes<HTMLElement> & {
  variant?: CardVariant;
  /** large and medium are grey on white; set onGrey for white cards on a grey band. */
  onGrey?: boolean;
  /** Element to render (div default). Ignored when href is set. */
  as?: "div" | "section" | "article" | "li" | "aside";
  /** Makes the whole card a Next <Link> (use with variant "nav"). */
  href?: string;
  children?: ReactNode;
};

export function Card({ variant = "content", onGrey, as = "div", href, className, children, ...rest }: CardProps) {
  const cls = cx("card", `card-${variant}`, onGrey && "card-on-grey", className);
  if (href !== undefined) {
    return (
      <Link href={href} className={cls} {...(rest as HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  const Tag = as;
  return (
    <Tag className={cls} {...rest}>
      {children}
    </Tag>
  );
}
