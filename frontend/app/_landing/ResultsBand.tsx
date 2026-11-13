import Link from "next/link";
import { Icon, ResultCard, type IconName } from "../ui";
import { appHref, formatCount } from "../lib/query";
import { EXAMPLE_ITEMS, EXAMPLE_QUERY, EXAMPLE_ROWS, EXAMPLE_TOTAL } from "./data";

// Real results, the one deep band (DESIGN.md 9.1 #5, m10, m09): heading and
// intro on the left, the real top 5 on the right in a white card, then three
// ranking rules with icon discs.

const RULES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "chevron-up",
    title: "More tropes, higher up.",
    body: "A work with all of your tropes ranks above one with two of them.",
  },
  {
    icon: "minus",
    title: "Near fits stay in.",
    body: "Works missing a trope stay in the list, below fuller ones, and the missing trope is named.",
  },
  {
    icon: "book",
    title: "Ties go to fuller pages.",
    body: "When two works match the same number, the one with the longer trope list goes first.",
  },
];

export function ResultsBand() {
  return (
    <section className="lp-band on-deep lp-deep" id="examples" aria-labelledby="examples-title">
      <div className="mk-container">
        <div className="lp-deep-grid">
          <div className="lp-deep-text">
            <h2 id="examples-title" className="heading-xl lp-deep-h">
              Every result is a real work with a TVTropes page
            </h2>
            <p className="body-l lp-deep-intro">
              This is the actual top of the list for true companions + the caper + anti-hero. Firefly, Highlander and
              Quadrilateral Cowboy have all 3. <span className="num">4,232</span> works have at least 1.
            </p>
          </div>
          <div className="lp-deep-media">
            <div className="lp-deep-card">
              <div className="lp-deep-card-head">
                <p className="lp-deep-q">
                  <Icon name="search" size={20} />
                  <span>{EXAMPLE_QUERY}</span>
                </p>
                <p className="lp-deep-count num">{formatCount(EXAMPLE_TOTAL)} works</p>
              </div>
              <ol className="results" aria-label={`Top 5 results for ${EXAMPLE_QUERY}`}>
                {EXAMPLE_ROWS.map((r, i) => (
                  <ResultCard
                    key={r.work.id}
                    rank={i + 1}
                    work={r.work}
                    matched={r.matched}
                    missing={r.missing}
                    wanted={3}
                  />
                ))}
              </ol>
            </div>
            <p className="lp-deep-open">
              <Link className="link" href={appHref(EXAMPLE_ITEMS)}>
                Open this search
              </Link>
            </p>
          </div>
        </div>
        <ul className="lp-rules">
          {RULES.map((r) => (
            <li className="lp-rule" key={r.title}>
              <span className="lp-rule-disc" aria-hidden="true">
                <Icon name={r.icon} size={32} />
              </span>
              <h3 className="h3 lp-rule-title">{r.title}</h3>
              <p className="body-m lp-rule-body">{r.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
