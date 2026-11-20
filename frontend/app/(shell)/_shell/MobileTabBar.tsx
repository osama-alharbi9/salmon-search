"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../../ui/Icon";
import { activeHref, NAV_ITEMS } from "./nav";

/** Bottom tab bar below 1024 px (DESIGN.md 5.7): 64 px plus the safe area. */
export function MobileTabBar() {
  const active = activeHref(usePathname());
  return (
    <nav aria-label="App" className="tabbar">
      {NAV_ITEMS.map((item) => {
        const current = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="tabbar-item"
            aria-current={current ? "page" : undefined}
          >
            <span className="tabbar-pill">
              <Icon name={item.icon} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
