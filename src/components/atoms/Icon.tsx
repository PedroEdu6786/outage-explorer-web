import type { ReactNode } from "react";

// Exact geometry from published index-mB5q-oe1.js, source markers 69–84.
// Asset provenance and consumer mapping: docs/specs/web-client/assets.md.
const geometry = {
  overview: <path d="M4 13h6V4H4v9Zm0 7h6v-3H4v3Zm10 0h6v-9h-6v9Zm0-16v3h6V4h-6Z" />,
  datasets: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></>,
  sql: <path d="m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14" />,
  calendar: <path d="M6 3v3M18 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.2" /></>,
  chevron: <path d="m9 18 6-6-6-6" />,
  play: <path d="m9 7 8 5-8 5V7Z" />,
  copy: <><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  logout: <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  check: <path d="m5 12 4 4L19 6" />,
  warning: <><path d="M12 4 3 20h18L12 4Z" /><path d="M12 9v5M12 17.5v.2" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 4v16" /></>,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof geometry;
export type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
} & (
  | { decorative?: true; label?: never }
  | { decorative: false; label: string }
);

export function Icon({ name, size = 18, className, decorative = true, label }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      className={["shrink-0", className].filter(Boolean).join(" ")}
    >
      {geometry[name]}
    </svg>
  );
}
