"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "../../ui/Icon";
import { Logo } from "../../ui/Logo";
import { activeHref, NAV_ITEMS } from "./nav";

/** App sidebar (DESIGN.md 5.7), 1024 px and up: logo, three items, TVTropes credit. */
export function Sidebar() {
  const active = activeHref(usePathname());
  return (
    <aside className="sidebar">
      <Logo />
      <nav aria-label="App" className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const current = item.href === active;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="nav-item"
              aria-current={current ? "page" : undefined}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
