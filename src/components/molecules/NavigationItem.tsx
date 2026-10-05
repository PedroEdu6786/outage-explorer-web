import type { ComponentPropsWithoutRef, ReactNode } from "react";

export type NavigationItemProps = Omit<ComponentPropsWithoutRef<"a">, "children" | "aria-current"> & {
  href: string;
  label: string;
  icon?: ReactNode;
  active?: boolean;
};

/** Caller supplies an authorized destination; this component has no access policy. */
export function NavigationItem({ href, label, icon, active = false, className = "", ...props }: NavigationItemProps) {
  return (
    <a
      {...props}
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-[11px] rounded-brand border-0 px-[11px] py-[10px] text-left text-[13px] no-underline transition-colors ${active ? "bg-[#23a1a62e] text-white shadow-[inset_2px_0_#55bfc2]" : "bg-transparent text-[#9fb0b8] hover:bg-white/[.06] hover:text-white"} ${className}`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
