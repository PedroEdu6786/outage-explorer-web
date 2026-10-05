"use client";

import { useRef, type KeyboardEvent, type ReactNode } from "react";

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
      <div role="tablist" aria-label={label} className="flex border-b border-border px-[18px]">
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
            disabled={item.disabled}
            onClick={() => { onSelectionChange(item.id); }}
            onKeyDown={(event) => { navigate(event, item.id); }}
            className={`border-0 border-b-2 bg-transparent px-[13px] py-[10px] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${selectedId === item.id && !item.disabled ? "border-b-accent text-accent-dark" : "border-b-transparent text-text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${item.id}-panel`}
          aria-labelledby={`${item.id}-tab`}
          hidden={selected?.id !== item.id}
          tabIndex={0}
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
