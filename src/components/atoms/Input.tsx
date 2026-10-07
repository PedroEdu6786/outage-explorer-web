import type { ComponentPropsWithRef } from "react";

export type InputProps = ComponentPropsWithRef<"input">;

/** Native input; labels and descriptions are associated by the caller's IDs. */
export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`motion-field h-(--control-height) w-full min-w-0 rounded-control border border-border-strong bg-surface px-(--control-padding-inline) py-(--control-padding-block) text-[11px] font-normal text-text placeholder:text-text-muted disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-50 aria-[invalid=true]:animate-nudge aria-[invalid=true]:border-error ${className}`}
    />
  );
}
