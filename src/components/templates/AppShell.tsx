"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AppHeader } from "../organisms/AppHeader";
import { AppNavigation, type NavigationData } from "../organisms/AppNavigation";

export interface AppShellProps {
  navigation: NavigationData;
  title: string;
  accessory?: ReactNode;
  children: ReactNode;
  onSignOut: () => void;
}

/** Caller resolves access/workflows; this template owns only local drawer state. */
export function AppShell({ navigation, title, accessory, children, onSignOut }: AppShellProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const pending = navigation.status === "pending";
  useEffect(() => { if (pending) setOpen(false); }, [pending]);

  return (
    <div className="min-h-dvh">
      {!pending && <AppNavigation data={navigation} open={open} onOpenChange={setOpen} onSignOut={onSignOut} returnFocusRef={trigger} />}
      <div className="min-w-0 min-[1001px]:ml-(--sidebar-width)">
        <AppHeader title={title} accessory={accessory} pending={pending} navigationOpen={!pending && open} navigationButtonRef={trigger} onOpenNavigation={() => { setOpen(true); }} />
        <main className="mx-auto w-full min-w-0 max-w-(--page-max-width) px-[32px] pt-[28px] pb-[50px] [@media(width<=1000px)]:p-[24px] [@media(width<=760px)]:px-[14px] [@media(width<=760px)]:pt-[20px] [@media(width<=760px)]:pb-[36px]">
          {pending ? <p role="status">Resolving session…</p> : children}
        </main>
      </div>
    </div>
  );
}
