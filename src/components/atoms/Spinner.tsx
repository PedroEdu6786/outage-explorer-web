import type { ComponentPropsWithoutRef } from "react";

type SpinnerSemantics =
  | { decorative: true; label?: never }
  | { decorative?: false; label: string };

export type SpinnerProps = Omit<
  ComponentPropsWithoutRef<"span">,
  "children" | "role" | "aria-label" | "aria-hidden" | "aria-live"
> &
  SpinnerSemantics & {
    tone?: "accent" | "inverse";
  };

/**
 * A3: source 13px / 2px ring, 800ms linear rotation (the `spinner` animation token).
 * D5 extension: reduced motion (token-level) keeps a static ring and the same
 * accessible loading text.
 * Use decorative inside a button that already supplies its loading name.
 */
export function Spinner({
  decorative = false,
  label,
  tone = "accent",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      role={decorative ? undefined : "status"}
      aria-live={decorative ? undefined : "polite"}
      aria-hidden={decorative ? true : undefined}
      className={`inline-flex items-center ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block size-[13px] shrink-0 animate-spinner rounded-full border-2 ${tone === "accent" ? "border-accent/20 border-t-accent" : "border-white/40 border-t-white"}`}
      />
      {!decorative && <span className="sr-only">{label}</span>}
    </span>
  );
}
