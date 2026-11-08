import type { IconName } from "../../ui/Icon";

export type NavItem = { href: string; label: string; icon: IconName };

/** The three app destinations (DESIGN.md 5.7). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app", label: "Search", icon: "search" },
  { href: "/saved", label: "Saved", icon: "bookmark" },
  { href: "/history", label: "History", icon: "clock" },
];

/** Which item is active for a pathname. Work pages count as Search. */
export function activeHref(pathname: string | null): string | null {
  if (!pathname) return null;
  if (pathname === "/app" || pathname.startsWith("/app/") || pathname.startsWith("/work/")) return "/app";
  if (pathname === "/saved" || pathname.startsWith("/saved/")) return "/saved";
  if (pathname === "/history" || pathname.startsWith("/history/")) return "/history";
  return null;
}
