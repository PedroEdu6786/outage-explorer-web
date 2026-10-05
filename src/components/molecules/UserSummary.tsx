import type { ReactNode } from "react";
import { Badge, type BadgeTone } from "../atoms/Badge";

export interface UserSummaryProps {
  name: string;
  initials: string;
  roleLabel?: string;
  roleTone?: BadgeTone;
  action?: ReactNode;
}

/** Display-only identity supplied by a resolved caller; role tone grants nothing. */
export function UserSummary({ name, initials, roleLabel, roleTone = "neutral", action }: UserSummaryProps) {
  return (
    <div className="flex min-h-[67px] items-center gap-[9px] border-t border-white/[.09] px-[12px] py-[11px]">
      <span aria-hidden="true" className="grid size-[31px] shrink-0 place-items-center rounded-full bg-accent-light text-[12px] font-bold text-accent-dark">{initials}</span>
      <div className="flex min-w-0 flex-wrap items-center gap-[6px]">
        <strong className="min-w-0 break-words text-[12px] text-white">{name}</strong>
        {roleLabel && <Badge tone={roleTone}>{roleLabel}</Badge>}
      </div>
      {action && <div className="ml-auto shrink-0 text-[#91a4ac]">{action}</div>}
    </div>
  );
}
