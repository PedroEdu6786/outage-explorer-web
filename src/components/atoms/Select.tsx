import type { ComponentPropsWithRef } from "react";

export type SelectProps = ComponentPropsWithRef<"select">;

/** Native options preserve platform keyboard, selection and form behavior. */
export function Select({ className = "", children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`min-h-(--control-height) w-full min-w-0 rounded-control border border-border-strong bg-surface px-(--control-padding-inline) py-(--control-padding-block) text-[11px] font-normal text-text disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 aria-[invalid=true]:border-error ${className}`}
    >
      {children}
    </select>
  );
}
