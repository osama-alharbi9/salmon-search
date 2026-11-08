import type { ReactNode } from "react";
import { MobileTabBar } from "./_shell/MobileTabBar";
import { Sidebar } from "./_shell/Sidebar";
import { TopBar } from "./_shell/TopBar";

/**
 * App shell for /app, /work/…, /saved and /history (DESIGN.md 5.7, 5.8, 9.2):
 * sidebar from 1024 px, top bar, and the bottom tab bar below 1024 px. Pages
 * render inside <main id="content">, a column of max 880 px centred right of
 * the sidebar. Pages must not render their own <main>. Below 1024 px, where
 * the sidebar and its credit are hidden, a footer carries the TVTropes credit.
 */
export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shell">
      <Sidebar />
      <div className="shell-main">
        <TopBar />
        <main id="content" className="shell-content" tabIndex={-1}>
          {children}
        </main>
      </div>
      <MobileTabBar />
    </div>
  );
}
