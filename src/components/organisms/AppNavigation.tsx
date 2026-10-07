"use client";

import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent, type RefObject } from "react";
import { BrandMark } from "../atoms/BrandMark";
import { Icon, type IconName } from "../atoms/Icon";
import { IconButton } from "../atoms/IconButton";
import { useSlidingIndicator } from "../atoms/useSlidingIndicator";
import { NavigationItem } from "../molecules/NavigationItem";
import { UserSummary, type UserSummaryProps } from "../molecules/UserSummary";

export interface NavigationDestination {
  id: string;
  label: string;
  href: string;
  icon: IconName;
  active?: boolean;
}

export type NavigationData =
  | { status: "pending" }
  | {
    status: "ready";
    /** Caller changes this key whenever identity or authorized access changes. */
    revision: string | number;
    identity: Omit<UserSummaryProps, "action">;
    destinations: readonly NavigationDestination[];
    coverage?: { availableThrough: string; updated?: string };
  };

export interface AppNavigationProps {
  data: NavigationData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
  returnFocusRef?: RefObject<HTMLButtonElement | null>;
}

const mobileQuery = "(width <= 1000px)";
function subscribeViewport(notify: () => void) {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", notify);
  return () => { query.removeEventListener("change", notify); };
}
function narrowSnapshot() { return window.matchMedia(mobileQuery).matches; }
function serverSnapshot() { return null; }

/** Supplied presentation only. Native modal dialog excludes background interaction. */
export function AppNavigation({ data, open, onOpenChange, onSignOut, returnFocusRef }: AppNavigationProps) {
  const narrow = useSyncExternalStore<boolean | null>(subscribeViewport, narrowSnapshot, serverSnapshot);
  const dialog = useRef<HTMLDialogElement>(null);
  const desktop = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const desktopNavigation = useRef<HTMLElement>(null);
  const revision = data.status === "ready" ? data.revision : null;
  const previousRevision = useRef(revision);
  const activeDestination = data.status === "ready" ? data.destinations.find((destination) => destination.active)?.id ?? "" : null;
  // Measurement only; the indicator never affects drawer, focus or return-focus logic.
  useSlidingIndicator({
    containerRef: desktopNavigation,
    activeKey: revision === null ? null : `${String(revision)}:${activeDestination ?? ""}`,
    enabled: data.status === "ready",
  });

  useEffect(() => {
    if (previousRevision.current !== revision) {
      previousRevision.current = revision;
      onOpenChange(false);
    }
  }, [revision, onOpenChange]);

  useEffect(() => {
    const element = dialog.current;
    if (!element || narrow === null) return;
    let restoreFrame: number | undefined;
    if (narrow && open && data.status === "ready") {
      if (!element.open) {
        element.showModal();
        closeButton.current?.focus();
      }
    } else if (element.open) {
      const focusWasInside = element.contains(document.activeElement);
      element.close();
      if (narrow && returnFocusRef?.current?.isConnected) {
        returnFocusRef.current.focus();
        // Hash navigation's default action can move focus after the click effect.
        restoreFrame = requestAnimationFrame(() => {
          const active = document.activeElement;
          if (!element.open && returnFocusRef.current?.isConnected && (active === document.body || active === returnFocusRef.current)) returnFocusRef.current.focus();
        });
      }
      else if (!narrow && focusWasInside) {
        const target = desktop.current?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ?? desktop.current?.querySelector<HTMLAnchorElement>("a");
        target?.focus();
      }
    }
    if ((!narrow || data.status !== "ready") && open) onOpenChange(false);
    return () => { if (restoreFrame !== undefined) cancelAnimationFrame(restoreFrame); };
  }, [narrow, open, data.status, onOpenChange, returnFocusRef]);

  useEffect(() => () => { if (dialog.current?.open) dialog.current.close(); }, []);

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first && last) {
      event.preventDefault(); last.focus();
    } else if (!event.shiftKey && document.activeElement === last && first) {
      event.preventDefault(); first.focus();
    }
  }

  function content(mobile: boolean) {
    return (
      <>
        <div className="flex h-(--brand-header-height) shrink-0 items-center gap-[10px] border-b border-white/[.09] px-[20px] font-[650] tracking-[-.01em] text-white">
          <BrandMark /><span>Outage Explorer</span>
          {mobile && <IconButton ref={closeButton} label="Close navigation" onClick={() => { onOpenChange(false); }} className="ml-auto text-white enabled:hover:bg-white/10 focus-visible:outline-[#55bfc2]"><Icon name="close" /></IconButton>}
        </div>
        {data.status === "ready" ? (
          <>
            <nav ref={mobile ? undefined : desktopNavigation} aria-label="Main navigation" className="relative isolate grid gap-[3px] px-[10px] py-[16px]">
              {!mobile && <span aria-hidden="true" data-sliding-indicator className="sliding-indicator -z-10 rounded-brand bg-[#23a1a62e] shadow-[inset_2px_0_#55bfc2]" />}
              {data.destinations.map((destination) => (
                <NavigationItem key={destination.id} {...destination} icon={<Icon name={destination.icon} />} onClick={() => { onOpenChange(false); }} className="focus-visible:outline-[#55bfc2]" />
              ))}
            </nav>
            <div className="mt-auto">
              {data.coverage && (
                <div className="m-[12px] flex gap-[9px] rounded-[7px] border border-white/10 bg-white/[.035] p-[12px]">
                  <span aria-hidden="true" className="mt-[3px] size-[7px] shrink-0 animate-dot-pulse rounded-full bg-[#51b88c]" />
                  <div className="grid gap-[3px] text-[11px]">
                    <strong className="text-[10px] font-medium tracking-[.04em] text-[#91a5ad] uppercase">Data available through</strong>
                    <span className="font-semibold text-white">{data.coverage.availableThrough}</span>
                    {data.coverage.updated && <small className="text-[10px] text-[#8fa1aa]">{data.coverage.updated}</small>}
                  </div>
                </div>
              )}
              <UserSummary {...data.identity} action={<IconButton label="Sign out" onClick={() => { onOpenChange(false); onSignOut(); }} className="enabled:hover:bg-white/10 focus-visible:outline-[#55bfc2]"><Icon name="logout" /></IconButton>} />
            </div>
          </>
        ) : <p role="status" className="p-4 text-[13px] text-white">Resolving session…</p>}
      </>
    );
  }

  return (
    <>
      <aside ref={desktop} hidden={narrow ?? false} aria-label="Application navigation" className="fixed inset-y-0 left-0 z-30 hidden w-(--sidebar-width) flex-col bg-sidebar text-[#d8e2e5] min-[1001px]:flex">
        {content(false)}
      </aside>
      <dialog
        ref={dialog}
        aria-label="Application navigation"
        onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
        onKeyDown={containFocus}
        onClick={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}
        className="motion-drawer fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-(--sidebar-width) max-w-full border-0 bg-sidebar p-0 text-[#d8e2e5] shadow-[8px_0_28px_#0003] backdrop:bg-[#0a191f61]"
      >
        <div className="flex min-h-full flex-col">{content(true)}</div>
      </dialog>
    </>
  );
}
