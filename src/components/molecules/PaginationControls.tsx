import type { ReactNode } from "react";
import { Button } from "../atoms/Button";

export interface PaginationAction {
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

export type NumberedPageAction = PaginationAction & {
  key: string;
  current?: boolean;
};

export interface PaginationControlsProps {
  label: string;
  summary?: ReactNode;
  previous?: PaginationAction;
  next?: PaginationAction;
  pages?: readonly NumberedPageAction[];
  disabled?: boolean;
  className?: string;
}

/** Only renders supplied labels/actions; no page arithmetic or lifecycle. */
export function PaginationControls({ label, summary, previous, next, pages, disabled = false, className = "" }: PaginationControlsProps) {
  return (
    <nav aria-label={label} className={`flex min-w-0 items-center justify-between gap-2 border-t border-border px-[14px] py-[11px] text-[10px] text-text-muted [@media(width<=480px)]:flex-col [@media(width<=480px)]:items-stretch ${className}`}>
      {summary !== undefined && <p>{summary}</p>}
      <div className="ml-auto flex flex-wrap gap-[6px] [@media(width<=480px)]:ml-0 [&>button]:[@media(width<=480px)]:flex-1">
        {previous && <Button variant="secondary" onClick={previous.onSelect} disabled={disabled || previous.disabled}>{previous.label}</Button>}
        {pages?.map((page) => <Button key={page.key} variant={page.current ? "primary" : "secondary"} aria-current={page.current ? "page" : undefined} onClick={page.onSelect} disabled={disabled || page.disabled}>{page.label}</Button>)}
        {next && <Button variant="secondary" onClick={next.onSelect} disabled={disabled || next.disabled}>{next.label}</Button>}
      </div>
    </nav>
  );
}
