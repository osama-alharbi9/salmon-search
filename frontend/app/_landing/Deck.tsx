"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { FISH_BODY } from "../ui/Logo";
import { appHref } from "../lib/query";
import { PIXEL_COIN, PIXELS, pixelPath } from "./pixels";

// "Every story is a hand of tropes": four cards under the planet that a scroll
// deals out. A face-down deck fans open, spreads into a row and flips one card
// at a time to show a series, a still from it and four of its tropes.
//
// The section is tall and its stage sticks to the viewport; scroll progress
// through the section drives every card's transform (no scroll hijacking).
// Without JavaScript, and under reduced motion, the cards sit face up in a row.
//
// Tropes are real TVTropes trope names. For The Office, Silicon Valley and
// Detectorists they are on the work's page in the loaded data, so the card
// opens that work. Game of Thrones has no page in the dump, so its card runs a
// search for its four tropes instead. Stills and the 8.2 rating are TMDB's.

type Suit = "heart" | "bolt" | "star" | "coin";

type Card = {
  title: string;
  /** Short title for the upside-down corner. */
  short: string;
  meta: string;
  /** A TMDB backdrop: wide, without title text, so it crops well. */
  poster: string;
  tropes: string[];
  suit: Suit;
  href: string;
  badge?: string;
};

const IMG = "https://image.tmdb.org/t/p/w780";

const CARDS: Card[] = [
  {
    title: "The Office",
    short: "The Office",
    meta: "TV series · 2005 · 488 tropes",
    poster: `${IMG}/bY2J2Jq8rSrKm5xCFtzYzqFh44o.jpg`,
    tropes: [
      "Mockumentary",
      "Confession Cam",
      "Cringe Comedy",
      "The Alleged Boss",
    ],
    suit: "heart",
    href: "/work/Series/TheOfficeUS",
  },
  {
    title: "Silicon Valley",
    short: "Silicon Valley",
    meta: "TV series · 2014 · 194 tropes",
    poster: `${IMG}/lrf0p8RJdJWUlp2FjigpsCe5127.jpg`,
    tropes: [
      "Gadgeteer Genius",
      "Cringe Comedy",
      "Bad Boss",
      "Pyrrhic Victory",
    ],
    suit: "bolt",
    href: "/work/Series/SiliconValley",
  },
  {
    title: "Game of Thrones",
    short: "Thrones",
    meta: "TV series · 2011",
    poster: `${IMG}/wXSnajAZ5ppTKa8Z5zzWGOK85YH.jpg`,
    tropes: [
      "Anyone Can Die",
      "Decoy Protagonist",
      "Succession Crisis",
      "The Chessmaster",
    ],
    suit: "star",
    href: appHref([
      "anyone can die",
      "decoy protagonist",
      "succession crisis",
      "the chessmaster",
    ]),
  },
  {
    title: "Detectorists",
    short: "Detectorists",
    meta: "TV series · 2014 · 99 tropes",
    poster: `${IMG}/AcwI0dQaPEiU4a4l3kQqUI1070.jpg`,
    tropes: [
      "Heterosexual Life-Partners",
      "Gold Fever",
      "Scenery Porn",
      "Running Gag",
    ],
    suit: "coin",
    href: "/work/Series/Detectorists",
    badge: "Hidden gem · 8.2 on TMDB",
  },
];

function SuitMark({ suit, className }: { suit: Suit; className?: string }) {
  const art = suit === "coin" ? PIXEL_COIN : PIXELS[suit];
  const w = art.rows[0].length;
  const h = art.rows.length;
  return (
    <svg
      className={className}
      viewBox={`0 0 ${w} ${h}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={pixelPath(art.rows)} fill={art.hex} />
    </svg>
  );
}

/** An original line-art card back: frames, rays and a medallion with the pixel fish. */
function CardBack() {
  const rays = Array.from({ length: 12 }, (_, i) => (i * Math.PI) / 6);
  return (
    <svg
      viewBox="0 0 250 350"
      className="lp-card-art"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1"
        y="1"
        width="248"
        height="348"
        rx="18"
        fill="var(--deck-back)"
      />
      <g fill="none" stroke="#fff" strokeWidth="1.6">
        <rect
          x="12"
          y="12"
          width="226"
          height="326"
          rx="10"
          strokeWidth="2.4"
        />
        <rect x="22" y="22" width="206" height="306" rx="4" />
        {/* corner fans */}
        {[
          [22, 22, 0],
          [228, 22, 90],
          [228, 328, 180],
          [22, 328, 270],
        ].map(([x, y, r]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r})`}>
            <path d="M0 34 A34 34 0 0 0 34 0" />
            <path d="M0 22 A22 22 0 0 0 22 0" />
            <path d="M0 0 L24 24" />
          </g>
        ))}
        {/* rays out of the centre, clipped by the inner frame */}
        <clipPath id="deck-inner">
          <rect x="44" y="60" width="162" height="230" />
        </clipPath>
        <g clipPath="url(#deck-inner)">
          {rays.map((a) => (
            <line
              key={a}
              x1="125"
              y1="175"
              x2={Math.round(125 + Math.cos(a) * 220)}
              y2={Math.round(175 + Math.sin(a) * 220)}
            />
          ))}
        </g>
        <rect x="44" y="60" width="162" height="230" />
        {/* top and bottom lanterns */}
        {[48, 302].map((y) => (
          <g key={y}>
            <circle cx="125" cy={y} r="9" />
            <circle cx="125" cy={y} r="4" fill="#fff" />
          </g>
        ))}
        {/* side studs */}
        {[100, 125, 150, 200, 225, 250].map((y) => (
          <g key={y}>
            <circle cx="33" cy={y} r="2.6" />
            <circle cx="217" cy={y} r="2.6" />
          </g>
        ))}
        {/* medallion */}
        <path
          d="M125 113 L187 175 L125 237 L63 175 Z"
          fill="var(--deck-back)"
        />
        <path d="M125 125 L175 175 L125 225 L75 175 Z" />
        <circle cx="125" cy="175" r="34" fill="var(--deck-back)" />
        <circle cx="125" cy="175" r="28" />
      </g>
      <g transform="translate(110 165) scale(2)" fill="#fff">
        <path d={FISH_BODY} />
      </g>
      <rect x="114.5" y="171" width="2" height="2" fill="var(--deck-back)" />
    </svg>
  );
}

function CardFront({ card }: { card: Card }) {
  return (
    <div className="lp-card-front-in">
      <div className="lp-card-head">
        <span className="lp-card-title">{card.title}</span>
        <SuitMark suit={card.suit} className="lp-card-suit" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element -- TMDB serves sized posters already */}
      <img
        className="lp-card-poster"
        src={card.poster}
        alt=""
        loading="lazy"
        decoding="async"
      />
      <p className="lp-card-meta">{card.badge ?? card.meta}</p>
      <ul className="lp-card-tropes">
        {card.tropes.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      <div className="lp-card-foot" aria-hidden="true">
        <SuitMark suit={card.suit} className="lp-card-suit" />
        <span>{card.short}</span>
      </div>
    </div>
  );
}

// ── choreography ──────────────────────────────────────────────────────────────
//
// Scroll sets a target pose for every card; springs chase it. The springs are
// slightly underdamped, so a card that flips swings a little past face up and
// settles, and the deck keeps moving for a beat after the scroll stops. The
// table has perspective, so tilts and flips read as depth, not as a squash.

type Pose = {
  x: number;
  y: number;
  z: number;
  rz: number;
  ry: number;
  flip: number;
  s: number;
};
const KEYS = ["x", "y", "z", "rz", "ry", "flip", "s"] as const;

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progress of a phase that runs from `from` for `span` of the scroll. */
const phase = (p: number, from: number, span: number) =>
  smooth(clamp01((p - from) / span));

/** Where card i should be at scroll progress p (0 to 1 through the section). */
function poseAt(
  i: number,
  p: number,
  w: number,
  h: number,
  narrow: boolean,
): Pose {
  const k = i - 1.5;
  const gap = narrow ? 12 : 24;
  const jitter = [-4, 2, -2, 5][i];

  // 1. a squared-up deck, 2. a tight fan, 3. a row (a 2 by 2 grid on phones)
  const open = phase(p, 0.06, 0.2);
  const spread = phase(p, 0.26 + i * 0.03, 0.24);
  const deckX = k * 3;
  const fanX = k * w * (narrow ? 0.3 : 0.38);
  const rowX = narrow ? (i % 2 === 0 ? -0.5 : 0.5) * (w + gap) : k * (w + gap);
  const rowY = narrow ? (i < 2 ? -0.5 : 0.5) * (h + gap) : 0;

  let x = lerp(deckX, fanX, open);
  let y = lerp(-i * 3, k * k * 12, open);
  let rz = lerp(jitter, k * 10, open);
  let ry = lerp(0, -k * 8, open);
  x = lerp(x, rowX, spread);
  y = lerp(y, rowY, spread);
  rz = lerp(rz, 0, spread);
  ry = lerp(ry, 0, spread);

  // 4. a wave of flips from the first card to the last, each lifting off the table
  const flip = phase(p, 0.4 + i * 0.08, 0.18);
  const lift = Math.sin(flip * Math.PI);
  return {
    x,
    y: y - lift * h * 0.05,
    z: lift * (narrow ? 40 : 90),
    rz: rz + lift * (i % 2 ? 3 : -3),
    ry,
    flip: flip * 180,
    s: lerp(0.92, 1, open),
  };
}

export function Deck() {
  const section = useRef<HTMLElement>(null);
  const runway = useRef<HTMLDivElement>(null);
  const table = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const sec = section.current;
    const way = runway.current;
    const tab = table.current;
    const els = cards.current;
    if (!sec || !way || !tab) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduce.matches) return; // the static row from CSS stays

    sec.setAttribute("data-live", "");
    const cur: Pose[] = els.map(() => ({
      x: 0,
      y: 0,
      z: 0,
      rz: 0,
      ry: 0,
      flip: 0,
      s: 1,
    }));
    const vel: Pose[] = els.map(() => ({
      x: 0,
      y: 0,
      z: 0,
      rz: 0,
      ry: 0,
      flip: 0,
      s: 0,
    }));
    let cardW = 0;
    let cardH = 0;
    let narrow = false;
    let first = true;
    let raf = 0;
    let last = 0;

    const measure = () => {
      narrow = tab.clientWidth < 640;
      const roomH = tab.clientHeight - 32;
      cardW = narrow
        ? Math.min(176, (tab.clientWidth - 12) / 2, (roomH - 12) / 2 / 1.4)
        : Math.min(296, (tab.clientWidth - 3 * 24 - 48) / 4, roomH / 1.4);
      cardH = cardW * 1.4;
      tab.style.setProperty("--card-w", `${cardW}px`);
    };

    const frame = (now: number) => {
      raf = 0;
      // fixed physics steps, so a slow frame takes more steps instead of a
      // bigger one (and the springs stay stable)
      const steps = Math.min(
        30,
        Math.max(1, Math.round((last ? now - last : 16) / 8)),
      );
      last = now;
      const rect = way.getBoundingClientRect();
      const run = rect.height - window.innerHeight;
      const p = run > 0 ? clamp01(-rect.top / run) : 1;
      let moving = false;

      els.forEach((el, i) => {
        if (!el) return;
        const target = poseAt(i, p, cardW, cardH, narrow);
        const c = cur[i];
        const v = vel[i];
        // a touch stiffer for the first card, so the wave has some stagger even
        // when the page jumps
        const stiff = 150 - i * 12;
        for (const key of KEYS) {
          if (first) {
            c[key] = target[key];
            continue;
          }
          const damp =
            2 *
            Math.sqrt(stiff) *
            (key === "flip" || key === "rz" ? 0.62 : 0.8);
          for (let n = 0; n < steps; n++) {
            v[key] += (stiff * (target[key] - c[key]) - damp * v[key]) * 0.008;
            c[key] += v[key] * 0.008;
          }
          if (Math.abs(target[key] - c[key]) > 0.05 || Math.abs(v[key]) > 0.05)
            moving = true;
        }
        el.style.transform =
          `translate(-50%, -50%) translate3d(${c.x}px, ${c.y}px, ${c.z}px) ` +
          `rotateZ(${c.rz}deg) rotateY(${c.ry}deg) scale(${c.s})`;
        el.style.setProperty("--flip", `${c.flip}deg`);
        el.tabIndex = target.flip > 90 ? 0 : -1;
      });
      first = false;
      if (moving) raf = requestAnimationFrame(frame);
      else last = 0;
    };

    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      measure();
      first = true;
      kick();
    };

    measure();
    frame(performance.now());
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", kick);
      window.removeEventListener("resize", resize);
      sec.removeAttribute("data-live");
      tab.style.removeProperty("--card-w");
      els.forEach((el) => {
        if (!el) return;
        el.style.transform = "";
        el.style.removeProperty("--flip");
        el.tabIndex = 0;
      });
    };
  }, []);

  return (
    <section ref={section} className="lp-deck" aria-labelledby="deck-title">
      <div className="mk-container lp-deck-copy">
        <h2 id="deck-title" className="display-l lp-deck-h">
          Every story is a hand of tropes
        </h2>
      </div>
      <div ref={runway} className="lp-deck-runway">
        <div className="lp-deck-stage">
          <div ref={table} className="lp-deck-table">
            {CARDS.map((c, i) => (
              <Link
                key={c.title}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                href={c.href}
                className="lp-card"
                aria-label={`${c.title}: ${c.tropes.join(", ")}`}
                style={{ zIndex: i + 1 }}
              >
                <div className="lp-card-inner">
                  <div className="lp-card-face lp-card-back">
                    <CardBack />
                  </div>
                  <div className="lp-card-face lp-card-front">
                    <CardFront card={c} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
