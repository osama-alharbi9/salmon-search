import type { ReactNode, SVGProps } from "react";

// salmon's own inline icon set: 24 px grid, 1.75 px stroke, round caps and
// joins (DESIGN.md 4.6). Filled variants exist only for the saved state.

const DOT = { fill: "currentColor", stroke: "none" } as const;

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </>
  ),
  bookmark: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" />,
  "bookmark-filled": <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" fill="currentColor" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  "chevron-right": <path d="M9.5 6l6 6-6 6" />,
  "chevron-left": <path d="M14.5 6l-6 6 6 6" />,
  "chevron-down": <path d="M6 9.5l6 6 6-6" />,
  "chevron-up": <path d="M6 14.5l6-6 6 6" />,
  back: <path d="M19 12H5M11 6l-6 6 6 6" />,
  "arrow-right": <path d="M5 12h14M13 6l6 6-6 6" />,
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M6.5 12h11" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <path d="M12 4l9 16H3z" />
      <path d="M12 10v4.5M12 17.3v.2" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5" />
    </>
  ),
  more: (
    <>
      <circle cx="6" cy="12" r="1.6" {...DOT} />
      <circle cx="12" cy="12" r="1.6" {...DOT} />
      <circle cx="18" cy="12" r="1.6" {...DOT} />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3.5 3.5l17 17" />
      <path d="M10.4 5.6c.5-.1 1-.1 1.6-.1 6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-2.7 3.4M6.6 6.6C4 8.3 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.3-.5 4.6-1.3" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  title: (
    <>
      <rect x="4" y="4.5" width="16" height="15" rx="2" />
      <path d="M8.5 4.5v15M15.5 4.5v15M4 9.5h4.5M4 14.5h4.5M15.5 9.5H20M15.5 14.5H20" />
    </>
  ),
  filter: <path d="M4 5.5h16l-6 7v6l-4 1.5v-7.5z" />,
  edit: <path d="M14.5 5.5l4 4M4.5 19.5l1-4.5L16 4.5l3.5 3.5L9 18.5z" />,
  trash: <path d="M4.5 7h15M10 7V4.5h4V7M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5" />,
  // media
  film: (
    <>
      <path d="M4 10h16v8.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5z" />
      <path d="M4 10l-.5-3a1.5 1.5 0 0 1 1.2-1.7l12-2a1.5 1.5 0 0 1 1.7 1.2L19 7.3z" />
      <path d="M8.3 5.3l2 3.3M13.3 4.5l2 3.3" />
    </>
  ),
  tv: (
    <>
      <rect x="3.5" y="7" width="17" height="12" rx="2" />
      <path d="M8.5 3.5L12 7l3.5-3.5M8 21.5h8" />
    </>
  ),
  anime: (
    <>
      <path d="M12 3.5l2.1 5.4 5.4 2.1-5.4 2.1L12 18.5l-2.1-5.4L4.5 11l5.4-2.1z" />
      <path d="M18.5 17v3.5M16.75 18.75h3.5" />
    </>
  ),
  game: (
    <>
      <path d="M7.5 8h9a4 4 0 0 1 3.9 3.1l.9 4a2.6 2.6 0 0 1-4.5 2.3L15 15.5H9l-1.8 1.9a2.6 2.6 0 0 1-4.5-2.3l.9-4A4 4 0 0 1 7.5 8z" />
      <path d="M8 10.5v3M6.5 12h3" />
      <circle cx="15.5" cy="11.2" r="1" {...DOT} />
      <circle cx="17.3" cy="13.2" r="1" {...DOT} />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5c-1.8-1.3-4.3-2-7.5-2v13c3.2 0 5.7.7 7.5 2 1.8-1.3 4.3-2 7.5-2v-13c-3.2 0-5.7.7-7.5 2z" />
      <path d="M12 6.5v13" />
    </>
  ),
  other: (
    <>
      <circle cx="8" cy="8.5" r="3.5" />
      <rect x="13" y="13" width="7" height="7" rx="1.2" />
      <path d="M16.5 3.5l3.5 6h-7zM4.5 15l3.5 5M8 15l-3.5 5" />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof PATHS;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export type IconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: IconName;
  /** 16, 20, 24 (default) or 32. */
  size?: 16 | 20 | 24 | 32;
  /** Heavier 2.25 stroke, used for the active nav item. */
  strong?: boolean;
  /** Accessible name. Without it the icon is decorative (aria-hidden). */
  label?: string;
};

/** One inline SVG icon from salmon's set. Decorative unless `label` is given. */
export function Icon({ name, size = 24, strong, label, className, ...rest }: IconProps) {
  const cls = ["icon", strong ? "icon-strong" : "", className ?? ""].filter(Boolean).join(" ");
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cls}
      focusable="false"
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
