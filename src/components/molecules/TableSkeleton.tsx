import { Skeleton } from "../atoms/Skeleton";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  className?: string;
}

const widths = ["w-3/4", "w-1/2", "w-2/3", "w-5/6"];

/**
 * Decorative stand-in for a `DataTable` (D3). Cell padding and the line-height
 * strut mirror the real table so the swap does not shift layout. It has no
 * table, caption or text semantics and is hidden from assistive technology.
 */
export function TableSkeleton({ rows = 6, columns = 4, className = "" }: TableSkeletonProps) {
  const cells = Array.from({ length: Math.max(1, columns) }, (_, column) => column);
  return (
    <div aria-hidden="true" className={`text-[11px] ${className}`}>
      <div className="flex border-b border-border bg-surface-muted">
        {cells.map((column) => <div key={column} className="min-w-0 flex-1 px-[13px] py-[9px]"><Skeleton className="h-[.8em] w-1/2" /></div>)}
      </div>
      {Array.from({ length: Math.max(1, rows) }, (_, row) => (
        <div key={row} className="flex border-b border-[#edf1f3] last:border-b-0">
          {cells.map((column) => <div key={column} className="min-w-0 flex-1 px-[13px] py-[10px]"><Skeleton className={`h-[.8em] ${widths[(row + column) % widths.length] ?? "w-3/4"}`} /></div>)}
        </div>
      ))}
    </div>
  );
}
