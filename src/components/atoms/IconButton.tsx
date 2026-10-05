import type { ComponentProps } from "react";

export type IconButtonProps = Omit<ComponentProps<"button">, "aria-label"> & {
  label: string;
  loading?: boolean;
};

export function IconButton({
  label,
  loading = false,
  disabled = false,
  type = "button",
  className,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      aria-label={label}
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={[
        "inline-grid size-[var(--control-height)] shrink-0 place-items-center rounded-control border-0 bg-transparent p-0 text-inherit enabled:hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-[.48]",
        className,
      ].filter(Boolean).join(" ")}
    >
      {children}
    </button>
  );
}
