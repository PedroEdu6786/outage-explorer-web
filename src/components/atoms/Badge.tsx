import type { ComponentPropsWithoutRef } from "react";

export type BadgeTone = "neutral" | "info" | "success" | "warning" | "error";

export interface BadgeProps extends ComponentPropsWithoutRef<"span"> {
  /** Visual emphasis only; this never grants or checks permissions. */
  tone?: BadgeTone;
}

const tones: Record<BadgeTone, string> = {
  neutral: "bg-badge-light text-[color:var(--color-badge)]",
  info: "bg-info-light text-info",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
};

/** A3: published `.badge` geometry and palette, without status announcements. */
export function Badge({ tone = "neutral", className = "", ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={`inline-flex w-fit items-center gap-(--badge-gap) rounded-badge px-(--badge-padding-inline) py-(--badge-padding-block) text-[length:var(--text-badge)] font-[number:var(--text-badge--font-weight)] tracking-[.035em] uppercase ${tones[tone]} ${className}`}
    />
  );
}
