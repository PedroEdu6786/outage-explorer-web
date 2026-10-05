import type { ReactNode, RefObject } from "react";
import { Icon } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";

export interface AppHeaderProps {
  title: string;
  onOpenNavigation: () => void;
  navigationOpen: boolean;
  navigationButtonRef?: RefObject<HTMLButtonElement | null>;
  accessory?: ReactNode;
  pending?: boolean;
}

export function AppHeader({ title, onOpenNavigation, navigationOpen, navigationButtonRef, accessory, pending = false }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-(--topbar-height) items-center gap-[10px] border-b border-border bg-white/[.96] px-[28px] [@media(width<=760px)]:px-[14px]">
      {!pending && <IconButton ref={navigationButtonRef} label="Open navigation" aria-expanded={navigationOpen} aria-haspopup="dialog" onClick={onOpenNavigation} className="shrink-0 min-[1001px]:hidden"><Icon name="menu" /></IconButton>}
      <span title={pending ? undefined : title} className="min-w-0 truncate text-[12px] text-text-muted">{pending ? "Resolving session…" : title}</span>
      {!pending && accessory && <div className="ml-auto shrink-0">{accessory}</div>}
    </header>
  );
}
