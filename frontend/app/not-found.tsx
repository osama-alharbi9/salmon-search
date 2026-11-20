import type { Metadata } from "next";
import Link from "next/link";
import { buttonClass } from "./ui";
import { HeroSearch } from "./_landing/HeroSearch";
import { MarketingNav } from "./_landing/MarketingNav";
import "./_landing/landing.css";

// Unknown route (DESIGN.md 9.7): marketing nav, a centred display-l line, the
// hero-style GET search to /app and a way home. Rendered inside the root
// layout, so it renders its own <main id="content">.

// The root layout's template does not apply to this segment, so set the whole title.
export const metadata: Metadata = {
  title: { absolute: "Page not found · salmon" },
};

export default function NotFound() {
  return (
    <div className="lp-page">
      <header>
        <MarketingNav anchorBase="/" />
      </header>
      <main id="content" tabIndex={-1} className="lp-main lp-404">
        <div className="mk-container">
          <h1 className="display-l">Nothing here</h1>
          <p className="body-l muted lp-404-sub">That page doesn&apos;t exist. Search for a trope or a title instead.</p>
          <HeroSearch id="nf-q" label="Search for a trope or a title" />
          <div className="lp-hero-actions">
            <Link className={buttonClass("tertiary", "l")} href="/">
              Go to the home page
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
