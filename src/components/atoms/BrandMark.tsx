export type BrandMarkProps = {
  className?: string;
} & (
  | { decorative?: true; label?: never }
  | { decorative: false; label: string }
);

/** CSS tile from published .brand-mark; not one of the unread Make PNGs. */
export function BrandMark({ className, decorative = true, label }: BrandMarkProps) {
  return (
    <span
      aria-hidden={decorative || undefined}
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      className={[
        "inline-flex size-[25px] shrink-0 items-end gap-[2px] rounded-brand bg-accent p-[5px]",
        className,
      ].filter(Boolean).join(" ")}
    >
      <span className="h-[6px] w-[3px] rounded-t-[2px] bg-white opacity-[.65]" />
      <span className="h-[11px] w-[3px] rounded-t-[2px] bg-white opacity-[.82]" />
      <span className="h-[15px] w-[3px] rounded-t-[2px] bg-white" />
    </span>
  );
}
