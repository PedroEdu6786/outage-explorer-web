import type { ReactNode } from "react";
import { Spinner } from "../atoms/Spinner";

export interface StatusMessageProps {
  title: string;
  description?: ReactNode;
  tone?: "neutral" | "success" | "warning" | "error";
  announcement?: "polite" | "assertive" | "off";
  pending?: boolean;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

const tones = {
  neutral: "border-border",
  success: "border-[#c9e2d4]",
  warning: "border-warning",
  error: "border-[#ebceca]",
};

/** M2/V4 query-status geometry; D1 extension: title 10→12px, detail 9→11px. */
export function StatusMessage({
  title,
  description,
  tone = "neutral",
  announcement = "polite",
  pending = false,
  icon,
  actions,
  className = "",
}: StatusMessageProps) {
  return (
    <div className={`flex min-h-[48px] flex-wrap items-center gap-[9px] rounded-[6px] border bg-surface px-3 py-[9px] ${tones[tone]} ${className}`}>
      {(pending || icon) && <span aria-hidden="true" className="flex shrink-0 items-center text-text-muted">{pending ? <Spinner decorative /> : icon}</span>}
      <div
        role={announcement === "assertive" ? "alert" : announcement === "polite" ? "status" : undefined}
        aria-live={announcement === "off" ? undefined : announcement}
        aria-atomic={announcement === "off" ? undefined : true}
        className="grid min-w-0 flex-1 gap-[2px]"
      >
        <strong className="text-[12px]">{title}</strong>
        {description && <div className="text-[11px] text-text-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
