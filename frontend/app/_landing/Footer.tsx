import Link from "next/link";
import type { ReactNode } from "react";
import { CC_BY_NC_SA_URL, Logo, TVTROPES_URL } from "../ui";
import { appHref } from "../lib/query";
import { DATASET_URL, LICENSE_URL, MODEL_URL, README_URL, REPO_URL } from "./data";

// Landing footer (DESIGN.md 9.1 #12, m15, m16): four link columns, a hairline,
// the logo with the MIT line, then the centred TVTropes licence paragraph.

type FootLink = { label: string; href: string; external?: boolean };

const COLUMNS: { title: string; links: FootLink[] }[] = [
  {
    title: "salmon",
    links: [
      { label: "Search", href: "/app" },
      { label: "Saved", href: "/saved" },
      { label: "History", href: "/history" },
      { label: "Log in", href: "/login" },
    ],
  },
  {
    title: "Examples",
    links: [
      { label: "True companions + the caper + anti-hero", href: appHref(["true companions", "the caper", "anti-hero"]) },
      { label: "Like Cowboy Bebop, anime only", href: appHref(["like Cowboy Bebop", "anime only"]) },
      { label: "The office", href: appHref(["the office"]) },
      { label: "Unreliable narrator, no fanfic", href: appHref(["unreliable narrator", "no fanfic"]) },
    ],
  },
  {
    title: "Project",
    links: [
      { label: "Source code on GitHub", href: REPO_URL, external: true },
      { label: "README", href: README_URL, external: true },
      { label: "MIT license", href: LICENSE_URL, external: true },
    ],
  },
  {
    title: "Data",
    links: [
      { label: "TVTropes", href: TVTROPES_URL, external: true },
      { label: "TvTroper-Cleaned on Hugging Face", href: DATASET_URL, external: true },
      { label: "multilingual-e5-small", href: MODEL_URL, external: true },
    ],
  },
];

function ExtA({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="lp-foot-link" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="lp-footer">
      <div className="mk-container">
        <div className="lp-foot-cols">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="lp-foot-h">{col.title}</h2>
              <ul className="lp-foot-list">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.external ? (
                      <ExtA href={l.href}>{l.label}</ExtA>
                    ) : (
                      <Link className="lp-foot-link" href={l.href}>
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lp-foot-bottom">
          <Logo size="s" />
          <p className="body-s muted">salmon&apos;s code is MIT licensed.</p>
        </div>
        <p className="lp-foot-legal">
          Trope data comes from <ExtA href={TVTROPES_URL}>TVTropes.org</ExtA> and its contributors under a{" "}
          <ExtA href={CC_BY_NC_SA_URL}>
            Creative Commons Attribution-NonCommercial-ShareAlike (CC BY-NC-SA) license
          </ExtA>
          . Each work in salmon links back to its page on TVTropes. Use of the data must stay non-commercial, and anything
          built from it must be shared under the same license.
        </p>
      </div>
    </footer>
  );
}
