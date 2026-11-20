import type { CSSProperties } from "react";
import { FISH_BODY } from "../ui/Logo";

// A painterly planet under the hero card that turns on its own axis, with a
// ring of coral fish coins orbiting it in 3D. Decorative only: pure CSS
// animation, hidden from assistive tech, and still under reduced motion.

const COINS = 8;
const FACES = [-4, 4];
const RIM = [-2.5, -1, 0, 1, 2.5];

function Coin() {
  return (
    <div className="lp-coin">
      {RIM.map((z) => (
        <span key={`r${z}`} className="lp-coin-rim" style={{ "--z": `${z}px` } as CSSProperties} />
      ))}
      {FACES.map((z) => (
        <span key={`f${z}`} className="lp-coin-face" style={{ "--z": `${z}px` } as CSSProperties}>
          <svg viewBox="0 0 15 10" focusable="false">
            <path d={FISH_BODY} />
          </svg>
        </span>
      ))}
    </div>
  );
}

export function Planet() {
  return (
    <div className="lp-planet-wrap lp-grey" aria-hidden="true">
      <div className="lp-planet-scene">
        <div className="lp-planet">
          <div className="lp-planet-map" />
        </div>
        <div className="lp-orbit">
          <div className="lp-orbit-spin">
            {Array.from({ length: COINS }, (_, i) => (
              <div className="lp-coin-slot" key={i} style={{ "--i": i } as CSSProperties}>
                <Coin />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
