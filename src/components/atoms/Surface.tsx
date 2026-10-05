import type { HTMLAttributes } from "react";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "section" | "article";
}

/**
 * A3: shared V2/V3 light panels. Consumers own headings, spacing and separators.
 * Source clipping is opt-in via className to keep child focus rings visible.
 */
export function Surface({ as: Element = "div", className = "", ...props }: SurfaceProps) {
  return (
    <Element
      {...props}
      className={`rounded-panel border border-border bg-surface shadow-panel ${className}`}
    />
  );
}
