import type { ComponentPropsWithRef } from "react";

export type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type">;

/** Native checkbox implements the accepted compare-control semantics (D5). */
export function Checkbox({ className = "", ...props }: CheckboxProps) {
  return (
    <input
      {...props}
      type="checkbox"
      className={`size-4 shrink-0 accent-accent disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}
