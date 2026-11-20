import { PlanetScene } from "./PlanetScene";

// A painterly planet above the hero card that turns on its own axis, with 8
// coral fish coins orbiting it (three.js, see PlanetScene). The CSS disc is the
// placeholder until the scene draws, and the fallback without WebGL.
// Decorative only: hidden from assistive tech.

export function Planet() {
  return (
    <div className="lp-planet-wrap" aria-hidden="true">
      <div className="lp-planet-stage">
        <div className="lp-planet-fallback">
          <div className="lp-planet-map" />
        </div>
        <PlanetScene />
      </div>
    </div>
  );
}
