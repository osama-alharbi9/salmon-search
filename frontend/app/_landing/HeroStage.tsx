import { EXAMPLE_CHIPS, EXAMPLE_ROWS, EXAMPLE_TOTAL } from "./data";
import { PreviewChips, PreviewRows, PreviewSummary } from "./ResultPreview";

// The salmon stage under the hero (DESIGN.md 9.1 #2, m02, m03): a white app
// card rising out of a salmon block, cropped by the next band. It shows the
// real top 3 for true companions + the caper + anti-hero.

export function HeroStage() {
  return (
    <div className="mk-container">
      <figure className="lp-stage">
        <figcaption className="visually-hidden">
          Real results for true companions, the caper and anti-hero: Firefly, Highlander and Quadrilateral Cowboy have
          all 3 tropes. 4,232 works have at least 1 of them.
        </figcaption>
        <div className="lp-appcard" aria-hidden="true" inert>
          <div className="lp-appcard-chips">
            <PreviewChips chips={EXAMPLE_CHIPS} />
          </div>
          <PreviewSummary total={EXAMPLE_TOTAL} wanted={3} />
          <PreviewRows rows={EXAMPLE_ROWS.slice(0, 3)} wanted={3} />
        </div>
      </figure>
    </div>
  );
}
