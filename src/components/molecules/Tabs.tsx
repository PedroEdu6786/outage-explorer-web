"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { useSlidingIndicator } from "../atoms/useSlidingIndicator";

export interface TabItem {
  /** Unique within the document; forms the tab and panel IDs. */
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  label: string;
  items: readonly TabItem[];
  selectedId: string;
  onSelectionChange: (id: string) => void;
  className?: string;
}

/** Controlled horizontal tabs, with automatic keyboard selection and owned relations. */
export function Tabs({ label, items, selectedId, onSelectionChange, className = "" }: TabsProps) {
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const enabled = items.filter((item) => !item.disabled);
  const selected = enabled.find((item) => item.id === selectedId);
  const focusableId = selected?.id ?? enabled[0]?.id;
  const tablist = useRef<HTMLDivElement>(null);
  useSlidingIndicator({ containerRef: tablist, activeKey: selected?.id ?? null });

  function navigate(event: KeyboardEvent<HTMLButtonElement>, id: string) {
    const current = enabled.findIndex((item) => item.id === id);
    let target: TabItem | undefined;
    if (event.key === "ArrowRight") target = enabled[(current + 1) % enabled.length];
    else if (event.key === "ArrowLeft") target = enabled[(current - 1 + enabled.length) % enabled.length];
    else if (event.key === "Home") target = enabled[0];
    else if (event.key === "End") target = enabled.at(-1);
    else return;
    if (!target) return;
    event.preventDefault();
    buttons.current.get(target.id)?.focus();
    onSelectionChange(target.id);
  }

  return (
    <div className={className}>
      <div ref={tablist} role="tablist" aria-label={label} className="relative flex border-b border-border px-[18px]">
        {items.map((item) => (
          <button
            key={item.id}
            ref={(element) => {
              if (element) buttons.current.set(item.id, element);
              else buttons.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${item.id}-tab`}
            aria-controls={`${item.id}-panel`}
            aria-selected={selectedId === item.id && !item.disabled}
            tabIndex={focusableId === item.id ? 0 : -1}
            data-indicator-active={selectedId === item.id && !item.disabled ? "" : undefined}
            disabled={item.disabled}
            onClick={() => { onSelectionChange(item.id); }}
            onKeyDown={(event) => { navigate(event, item.id); }}
            className={`motion-colors border-0 border-b-2 bg-transparent px-[13px] py-[10px] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 [[data-indicator=ready]_&]:border-b-transparent ${selectedId === item.id && !item.disabled ? "border-b-accent text-accent-dark" : "border-b-transparent text-text-muted"}`}
          >
            {item.label}
          </button>
        ))}
        <span aria-hidden="true" data-sliding-indicator className="sliding-underline bg-accent" />
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${item.id}-panel`}
          aria-labelledby={`${item.id}-tab`}
          hidden={selected?.id !== item.id}
          tabIndex={0}
          className="animate-fade-rise"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
