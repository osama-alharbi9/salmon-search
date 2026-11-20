import Link from "next/link";

// The salmon pixel fish (15 x 10 grid), recoloured to --salmon-500 with a
// --salmon-950 eye and no window frame (DESIGN.md 4.6), plus the lowercase
// wordmark in Archivo 900.

const FISH_BODY =
  "M6 0h2v1h-2zM14 0h1v1h-1zM3 1h6v1h-6zM13 1h2v1h-2zM1 2h10v1h-10zM12 2h2v1h-2zM0 3h13v1h-13zM0 4h12v1h-12zM0 5h12v1h-12zM0 6h13v1h-13zM1 7h10v1h-10zM12 7h2v1h-2zM3 8h6v1h-6zM13 8h2v1h-2zM6 9h2v1h-2zM14 9h1v1h-1z";

/** The fish mark alone. Decorative; size it with CSS (default 30 x 20). */
export function FishMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 10"
      className={["logo-fish", className ?? ""].filter(Boolean).join(" ")}
      aria-hidden="true"
      focusable="false"
    >
      <path d={FISH_BODY} fill="#00D0C0" />
      <rect x="2" y="3" width="1" height="1" fill="#052B28" />
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
