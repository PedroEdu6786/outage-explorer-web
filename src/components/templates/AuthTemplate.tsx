import type { ReactNode } from "react";
import { BrandMark } from "../atoms/BrandMark";

export interface AuthTemplateProps {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
}

/** V1's centered branded composition; the caller supplies entry/state content. */
export function AuthTemplate({ title, description, children, actions, footer }: AuthTemplateProps) {
  return (
    <main className="relative grid min-h-screen place-items-center bg-background p-[30px] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-accent before:content-[''] [@media(width<=760px)]:p-[18px]">
      <section className="grid w-full max-w-[390px] gap-[15px] rounded-auth border border-border bg-surface p-[30px] shadow-auth [@media(width<=760px)]:p-[23px]">
        <div className="flex items-center gap-[10px] border-b border-border pb-[18px]">
          <BrandMark />
          <div className="grid gap-[2px]">
            <strong className="text-[14px] font-[650]">Outage Explorer</strong>
            <span className="text-[10px] uppercase tracking-[.05em] text-text-muted">U.S. nuclear outage data</span>
          </div>
        </div>
        <div className="mb-[3px] mt-1">
          <h1 className="text-[20px]">{title}</h1>
          {description && <div className="mt-[6px] text-[11px] leading-normal text-text-muted">{description}</div>}
        </div>
        {children}
        {actions && <div className="mt-[3px] grid gap-2">{actions}</div>}
        {footer && <div className="text-center text-[11px] text-text-muted">{footer}</div>}
      </section>
    </main>
  );
}
