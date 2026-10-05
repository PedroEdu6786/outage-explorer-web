import type { ReactNode } from "react";

export interface OverviewTemplateProps {
  heading: ReactNode;
  notice?: ReactNode;
  metrics: ReactNode;
  trend: ReactNode;
  observations: ReactNode;
}

/** V2's stacked sections; feature organisms supply all data and interactions. */
export function OverviewTemplate({ heading, notice, metrics, trend, observations }: OverviewTemplateProps) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <div className="mb-[22px]">{heading}</div>
    {notice && <div className="mb-[14px]">{notice}</div>}
    <div className="mb-[16px]">{metrics}</div>
    <div className="mb-[16px]">{trend}</div>
    {observations}
  </div>;
}
