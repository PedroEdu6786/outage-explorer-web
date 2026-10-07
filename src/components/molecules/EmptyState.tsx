import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
}

/** M2: source empty-state spacing; caller owns context, recovery and announcements. B9: icon, title and description fade in with a short stagger. */
export function EmptyState({ title, description, actions, icon, headingLevel = 2, className = "" }: EmptyStateProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={`flex min-h-[290px] flex-col items-center justify-center p-[30px] text-center ${className}`}>
      {icon && <span aria-hidden="true" className="motion-stagger [--stagger-index:0] mb-[11px] grid size-[38px] place-items-center rounded-full bg-[#eef3f5] text-text-muted">{icon}</span>}
      <Heading className="motion-stagger [--stagger-index:1] text-[16px] font-[650]">{title}</Heading>
      {description && <div className="motion-stagger [--stagger-index:2] mt-[7px] mb-[15px] text-[11px] text-text-muted">{description}</div>}
      {actions && <div className="flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  );
}
