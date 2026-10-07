import type { ReactNode } from "react";

export interface OverviewTemplateProps {
  heading: ReactNode;
  notice?: ReactNode;
  metrics: ReactNode;
  trend: ReactNode;
  observations: ReactNode;
}

/**
 * V2's stacked sections; feature organisms supply all data and interactions.
 * Slots enter with a capped stagger (index <= 3); content is in the DOM and
 * operable immediately, only its appearance is eased.
 */
export function OverviewTemplate({ heading, notice, metrics, trend, observations }: OverviewTemplateProps) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <div className="motion-stagger mb-[22px] [--stagger-index:0]">{heading}</div>
    {notice && <div className="mb-[14px]">{notice}</div>}
    <div className="motion-stagger mb-[16px] [--stagger-index:1]">{metrics}</div>
    <div className="motion-stagger mb-[16px] [--stagger-index:2]">{trend}</div>
    <div className="motion-stagger [--stagger-index:3]">{observations}</div>
  </div>;
}
