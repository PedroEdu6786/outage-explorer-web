import type { ReactNode } from "react";

export interface ExplorerTemplateProps {
  heading: ReactNode;
  catalog: ReactNode;
  detail: ReactNode;
}

export function ExplorerTemplate({ heading, catalog, detail }: ExplorerTemplateProps) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <div className="motion-stagger mb-[22px] [--stagger-index:0]">{heading}</div>
    <div className="grid grid-cols-[var(--explorer-catalog-width)_minmax(0,1fr)] items-start gap-[16px] [@media(width<=1000px)]:grid-cols-[var(--compact-browser-width)_minmax(0,1fr)] [@media(width<=760px)]:grid-cols-1">
      <div className="motion-stagger min-w-0 [--stagger-index:1] [@media(width<=760px)]:max-h-[310px] [@media(width<=760px)]:overflow-y-auto">{catalog}</div>
      <div className="motion-stagger min-w-0 [--stagger-index:2]">{detail}</div>
    </div>
  </div>;
}
