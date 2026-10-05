import type { ReactNode } from "react";

export interface PanelHeaderProps {
  title: string;
  titleId?: string;
  description?: ReactNode;
  actions?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

/** M2: source panel-heading; narrow stacking follows observed 480px rule. */
export function PanelHeader({ title, titleId, description, actions, headingLevel = 2, className = "" }: PanelHeaderProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={`flex min-h-[62px] items-center justify-between gap-[15px] border-b border-border px-[17px] py-[15px] [@media(width<=480px)]:flex-col [@media(width<=480px)]:items-start ${className}`}>
      <div className="min-w-0">
        <Heading id={titleId} className="text-[16px] leading-[1.3] font-[650]">{title}</Heading>
        {description && <div className="mt-1 text-[11px] text-text-muted">{description}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2 [@media(width<=480px)]:w-full">{actions}</div>}
    </div>
  );
}
