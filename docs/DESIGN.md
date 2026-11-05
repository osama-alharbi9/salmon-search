# Cupertino '84 — Design System

**A 1-bit design system for *salmon*.**

| | |
|---|---|
| Version | 1.0 · 2026.05 |
| Product | salmon |
| Colours | 3 |
| Fonts | 2 |
| Radius | 0 |

---

## 01 · The system in 60 seconds

> Pure black on pure white. Bitmap type. Hard-cornered rectangles. One salmon
> accent used like punctuation. The Mac, if it had stayed weird.

- Monochrome + one accent (`#00D0C0`)
- Two open-source bitmap fonts: VT323 (body), Silkscreen (chrome)
- No anti-aliasing; everything snaps to a 4px grid
- No gradients except 1-bit dither; defiantly opaque; zero radius

## 02 · Principles
1. Pixels are a love language — integer grid, no half-pixels, no AA.
2. Opacity is a position — opaque, never glass.
3. One accent, used like a period — salmon for cursor, count, highlight, danger only.
4. Bitmap is a feature, not a constraint.
5. The past is unfinished — System 6 if it shipped in 2026, no nostalgia.

## 04 · Colour
| Token | Value | Purpose |
|---|---|---|
| `--ink` | `#000000` | text, borders, fills, title-bar stripes |
| `--paper` | `#FFFFFF` | surfaces, default backgrounds |
| `--salmon` | `#00D0C0` | cursor, count, primary highlight, destructive |

- Salmon ≤ 5% of any screen. Greys are dither, never fills. Never fade salmon.

## 05 · Type
| Role | Family | Size | LH | Case |
|---|---|---|---|---|
| Body / input | VT323 | 19px | 1.25 | mixed |
| Title bar | Silkscreen | 11px | 22px | UPPER |
| Section header | Silkscreen | 12px | 22px | UPPER |
| Status / meta | Silkscreen | 9.5px | 14px | UPPER |

- No italic, no bold (never synthesize). `-webkit-font-smoothing: none`.
- Silkscreen always UPPERCASE, tracked `+0.04em`. VT323 at `0`.

## 06 · Grid — base unit 4px. Multiples only: 4 / 8 / 12 / 16 / 24 / 32. Tight density.

## 07 · Borders / shadows / radii
- `--radius: 0` everywhere. `--border: 1px solid #000`.
- Shadows always hard, offset down-right, `#000`, never blurred:
  `--shadow-1: 1px 1px 0 #000` · `--shadow-2: 2px 2px 0 #000`.
- Title-bar stripes: `repeating-linear-gradient(to bottom,#000 0 1px,#fff 1px 3px)`.
- Dither 50%: `repeating-conic-gradient(#000 0 25%,#fff 0 50%)` at `2px 2px`.

## 08 · Components
- **Window**: 1px border, `2px 2px 0 #000` shadow, 22px striped title bar.
- **Button**: Silkscreen 11px UPPER, padding `5/14`. Secondary = white fill+1px
  border+1px shadow. Primary = black fill/white text. Destructive = salmon fill.
  `:active` → translate(1px,1px), shadow collapses. No hover state.
- **Input**: 1px border, white fill, VT323 19px, salmon block caret blinking `0.9s steps(2)`.

## 10 · Motion — no easing. Blink `steps(2,start)` 0.9s · Press instant · Reveal opacity 0→1 120ms linear. No tweens.

## 11 · Voice — terse, lowercase default, System-6 vocabulary, full stop ends every
system sentence, em dashes OK, no exclamation marks, no emoji. State, don't apologise.
Empty: `Nothing matched.` · Working: `Thinking.` · Ready: `READY.`

## 12 · Do / Don't
- DO snap to 4px, disable smoothing, dither for grey, keep opaque, trust short copy.
- DON'T add radius, use a Google sans fallback, fade salmon, blur/gradient/glow, apologise.

## 14 · Trade-offs — bitmap type tires on long text; divisive aesthetic; weak CJK/RTL
coverage; provide a "Smooth type" fallback (VT323 → Geneva) for low-vision users.

## 15 · Type sources
- VT323 — Google Fonts (OFL), Peter Hull. · Silkscreen — Google Fonts (OFL), Jason Kottke.
- Self-host for offline; CDN acceptable for dev.

---
**Cupertino '84 · v1.0 · May 2026 · 1-bit with salmon.**
