import Link from "next/link";
import { useId } from "react";

// The salmon mark, a glossy coral toy salmon (DESIGN.md 4.6), plus the
// lowercase wordmark in the Newsreader serif. FISH_BODY is the older pixel fish,
// still used as a small motif on the deck's card backs.

export const FISH_BODY =
  "M6 0h2v1h-2zM14 0h1v1h-1zM3 1h6v1h-6zM13 1h2v1h-2zM1 2h10v1h-10zM12 2h2v1h-2zM0 3h13v1h-13zM0 4h12v1h-12zM0 5h12v1h-12zM0 6h13v1h-13zM1 7h10v1h-10zM12 7h2v1h-2zM3 8h6v1h-6zM13 8h2v1h-2zM6 9h2v1h-2zM14 9h1v1h-1z";

/** The fish mark alone: a glossy toy salmon. Decorative; size it with CSS (default 42 x 26). */
export function FishMark({ className }: { className?: string }) {
  // gradient ids are per instance, so two logos on one page never share them
  const u = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="22 16 210 132"
      className={["logo-fish", className ?? ""].filter(Boolean).join(" ")}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id={`${u}body`} cx="0.36" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#ffc2ad"/>
          <stop offset="0.35" stopColor="#ff8f73"/>
          <stop offset="0.75" stopColor="#f2634f"/>
          <stop offset="1" stopColor="#c9423a"/>
        </radialGradient>
        <linearGradient id={`${u}belly`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe3d8" stopOpacity="0"/>
          <stop offset="0.55" stopColor="#ffd6c8" stopOpacity="0.55"/>
          <stop offset="1" stopColor="#f4a892" stopOpacity="0.6"/>
        </linearGradient>
        <linearGradient id={`${u}fin`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff9a80"/>
          <stop offset="1" stopColor="#d4493f"/>
        </linearGradient>
        <linearGradient id={`${u}tail`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e65a49"/>
          <stop offset="1" stopColor="#ff9a80"/>
        </linearGradient>
        <radialGradient id={`${u}gloss`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85"/>
          <stop offset="1" stopColor="#ffffff" stopOpacity="0"/>
        </radialGradient>
        <radialGradient id={`${u}shade`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#0b2a6b" stopOpacity="0.32"/>
          <stop offset="1" stopColor="#0b2a6b" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id={`${u}under`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#7a1f2a" stopOpacity="0"/>
          <stop offset="1" stopColor="#7a1f2a" stopOpacity="0.35"/>
        </linearGradient>
        <radialGradient id={`${u}eye`} cx="0.4" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#3a3f55"/>
          <stop offset="1" stopColor="#0d0f1a"/>
        </radialGradient>
      </defs>
      <path d="M168 86 C182 72 196 52 214 40 C226 36 230 46 226 58 C220 74 210 84 202 92 C210 100 220 110 226 126 C230 138 226 148 214 144 C196 132 182 112 168 98 Z" fill={`url(#${u}tail)`}/>
      <path d="M190 70 C200 62 208 54 216 50" stroke="#ffb59f" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7"/>
      <path d="M92 50 C100 28 124 18 146 26 C156 30 160 40 156 48 C136 50 112 52 92 54 Z" fill={`url(#${u}fin)`}/>
      <path d="M26 92 C26 60 62 42 108 42 C146 42 176 62 184 92 C176 122 146 140 108 140 C62 140 26 124 26 92 Z" fill={`url(#${u}body)`}/>
      <path d="M34 104 C52 126 84 136 110 136 C142 136 166 124 178 106 C150 116 120 118 92 116 C70 114 50 110 34 104 Z" fill={`url(#${u}belly)`}/>
      <path d="M26 92 C26 60 62 42 108 42 C146 42 176 62 184 92 C176 122 146 140 108 140 C62 140 26 124 26 92 Z" fill={`url(#${u}under)`}/>
      <g fill="#b23b33" opacity="0.45">
      <circle cx="118" cy="56" r="3"/><circle cx="134" cy="62" r="2.4"/><circle cx="150" cy="66" r="2.8"/>
      <circle cx="126" cy="72" r="2"/><circle cx="160" cy="78" r="2.2"/><circle cx="104" cy="62" r="2.2"/>
      </g>
      <path d="M74 66 C66 80 66 102 74 116" stroke="#c9423a" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.55"/>
      <path d="M90 104 C100 100 116 104 122 116 C114 124 98 122 90 112 Z" fill={`url(#${u}fin)`} opacity="0.95"/>
      <ellipse cx="88" cy="58" rx="38" ry="11" fill={`url(#${u}gloss)`} transform="rotate(-10 88 58)"/>
      <ellipse cx="146" cy="58" rx="12" ry="5" fill={`url(#${u}gloss)`} opacity="0.7" transform="rotate(14 146 58)"/>
      <circle cx="54" cy="80" r="11" fill="#ffffff"/>
      <circle cx="52" cy="81" r="7" fill={`url(#${u}eye)`}/>
      <circle cx="49.5" cy="78" r="2.4" fill="#ffffff"/>
      <path d="M32 98 C37 103 44 103 48 99" stroke="#a8352f" strokeWidth="2.6" strokeLinecap="round" fill="none"/>
      <ellipse cx="62" cy="100" rx="7" ry="4" fill="#ff6f6f" opacity="0.35"/>
    </svg>
  );
}

export type LogoProps = {
  /** Where the logo links. Defaults to "/". Pass null for a plain, unlinked logo. */
  href?: string | null;
  /** "m": 28 px wordmark (sidebar, nav). "s": 24 px (mobile top bar). */
  size?: "m" | "s";
  /** Hide the wordmark and show only the fish. */
  markOnly?: boolean;
  className?: string;
};

/** Fish mark + "salmon" wordmark. Links to / with the name "salmon home". */
export function Logo({ href = "/", size = "m", markOnly, className }: LogoProps) {
  const cls = ["logo", size === "s" ? "logo-s" : "", className ?? ""].filter(Boolean).join(" ");
  const inner = (
    <>
      <FishMark />
      {!markOnly && (
        <span className="logo-wm" aria-hidden={href ? true : undefined}>
          salmon
        </span>
      )}
    </>
  );
  if (href === null) {
    return (
      <span className={cls} role={markOnly ? "img" : undefined} aria-label={markOnly ? "salmon" : undefined}>
        {inner}
      </span>
    );
  }
  return (
    <Link href={href} className={cls} aria-label="salmon home">
      {inner}
    </Link>
  );
}
