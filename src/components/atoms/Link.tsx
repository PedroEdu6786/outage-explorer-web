import type { ComponentProps } from "react";

export type LinkProps = ComponentProps<"a">;

/** Native navigation semantics; routing adapters can compose this presentation. */
export function Link({ className, ...props }: LinkProps) {
  return (
    <a
      {...props}
      className={[
        "motion-colors text-accent-dark underline underline-offset-2 hover:text-accent",
        className,
      ].filter(Boolean).join(" ")}
    />
  );
}
