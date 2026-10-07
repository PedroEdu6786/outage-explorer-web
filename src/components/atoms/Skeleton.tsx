import type { ComponentPropsWithoutRef } from "react";

export interface SkeletonProps extends Omit<ComponentPropsWithoutRef<"span">, "children" | "role" | "aria-hidden" | "aria-label" | "aria-live"> {
  /** Optional shimmer (E1). Defaults to false and no call site enables it. */
  shimmer?: boolean;
}

/**
 * Static, decorative placeholder block (A2, E1). Size and shape come from
 * `className`; it never renders text, numbers or a status, so it can never imply
 * a value. Pair it with a banner that announces the loading state.
 */
export function Skeleton({ shimmer = false, className = "", ...props }: SkeletonProps) {
  return (
    <span
      {...props}
      aria-hidden="true"
      className={`inline-block rounded-badge bg-border align-middle ${shimmer ? "motion-shimmer" : ""} ${className}`}
    />
  );
}
