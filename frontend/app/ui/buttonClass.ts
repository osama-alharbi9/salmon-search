import { cx } from "./cx";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "neutral"
  | "inverse"
  | "on-deep"
  | "destructive"
  | "destructive-solid";

/** S 32, M 40, L 48 (DESIGN.md 5.1). */
export type ButtonSize = "s" | "m" | "l";

/**
 * Class string for the button look on any element, usable from server
 * components: <button type="submit" className={buttonClass("primary", "l")}>.
 */
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "m",
  extra?: string | false,
): string {
  return cx("btn", `btn-${variant}`, size !== "l" && `btn-${size}`, extra);
}
