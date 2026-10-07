import type { ComponentPropsWithRef } from "react";

export type TextareaProps = ComponentPropsWithRef<"textarea">;

/** A2's evidenced code field. Editor workflows belong to the feature owner. */
export function Textarea({ className = "", spellCheck = false, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      spellCheck={spellCheck}
      className={`motion-field block w-full min-w-0 resize-y rounded-control border border-transparent bg-editor p-[14px] font-mono text-[11px] leading-[1.65] text-[#d9e5e8] caret-[#67d0d2] [tab-size:2] disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:animate-nudge aria-[invalid=true]:border-error ${className}`}
    />
  );
}
