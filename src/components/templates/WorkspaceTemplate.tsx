import type { ReactNode } from "react";

export interface WorkspaceTemplateProps {
  heading: ReactNode;
  browser: ReactNode;
  workspace: ReactNode;
}

export function WorkspaceTemplate({ heading, browser, workspace }: WorkspaceTemplateProps) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <div className="mb-[22px]">{heading}</div>
    <div className="grid grid-cols-[var(--sql-browser-width)_minmax(0,1fr)] items-start gap-[14px] [@media(width<=1000px)]:grid-cols-[var(--compact-browser-width)_minmax(0,1fr)] [@media(width<=760px)]:grid-cols-1">
      <div className="min-w-0 [@media(width<=760px)]:max-h-[330px] [@media(width<=760px)]:overflow-y-auto">{browser}</div>
      <div className="min-w-0">{workspace}</div>
    </div>
  </div>;
}
