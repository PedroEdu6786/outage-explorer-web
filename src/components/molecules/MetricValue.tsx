import type { ReactNode } from "react";
import { Skeleton } from "../atoms/Skeleton";

export interface MetricValueProps {
  label: string;
  /** Already formatted precise text; null is unavailable, never zero. */
  value: string | null;
  unit?: string;
  missingText?: string;
  metadata?: ReactNode;
  /**
   * Awaiting the first value: a placeholder replaces the value slot (never zero
   * or `missingText`). Once explicitly `false` the real value fades in; leave it
   * undefined to keep the static output.
   */
  loading?: boolean;
  className?: string;
}

/** M2/V2 metric-label/value mapping. No parsing, rounding, thresholds or date shifts. B12: optional loading placeholder, no counting. */
export function MetricValue({ label, value, unit, missingText = "Unavailable", metadata, loading, className = "" }: MetricValueProps) {
  return (
    <dl aria-busy={loading ? true : undefined} className={className}>
      <dt className="text-[12px] font-medium text-text-muted">{label}</dt>
      <dd className={`mt-2 text-[29px] font-[650] tracking-[-.04em] tabular-nums${loading === false ? " animate-appear" : ""}`}>
        {loading ? <Skeleton className="h-[.72em] w-[4.5ch]" /> : value === null ? <span className="text-[14px] tracking-normal text-text-muted">{missingText}</span> : <>{value}{unit && <span className="ml-[6px] text-[14px] font-medium tracking-normal text-text-muted">{unit}</span>}</>}
      </dd>
      {metadata && <dd className="mt-[5px] text-[11px] text-text-muted">{metadata}</dd>}
    </dl>
  );
}
