import type { ComponentProps } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";

export type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  loading?: boolean;
  loadingLabel?: string;
};

const variants: Record<ButtonVariant, string> = {
  primary: "border-accent bg-accent text-white enabled:hover:bg-accent-dark",
  secondary: "border-border-strong bg-surface text-text enabled:hover:bg-surface-muted",
  ghost: "border-transparent bg-transparent text-text-muted enabled:hover:bg-surface-muted enabled:hover:text-text",
};

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Loading…",
  disabled = false,
  type = "button",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "motion-control inline-flex min-h-[var(--control-height)] items-center justify-center gap-[var(--action-gap)] rounded-control border px-[var(--action-padding-inline)] py-[var(--action-padding-block)] text-action whitespace-nowrap enabled:active:translate-y-(--motion-press-shift) disabled:cursor-not-allowed disabled:opacity-[.48]",
        variants[variant],
        className,
      ].filter(Boolean).join(" ")}
    >
      {loading ? <span className="animate-fade-in">{loadingLabel}</span> : children}
    </button>
  );
}
