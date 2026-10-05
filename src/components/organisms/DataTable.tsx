import type { ReactNode } from "react";
import type { TableCell, TableData } from "../../contracts/table";
import { EmptyState } from "../molecules/EmptyState";

export interface DataTableProps {
  data: TableData;
  caption: string;
  missingText?: string;
  missingLabel?: string;
  emptyTitle?: string;
  emptyDescription?: ReactNode;
  emptyActions?: ReactNode;
  className?: string;
}

function displayCell(cell: TableCell, missingText: string, missingLabel: string) {
  switch (cell.kind) {
    case "null": return <span aria-label={missingLabel} className="text-text-muted">{missingText}</span>;
    case "integer":
    case "decimal": return cell.display;
    case "boolean": return cell.value ? "true" : "false";
    case "date":
    case "identifier":
    case "text": return cell.value;
  }
}

/**
 * O1/V2–V4: positional cells and published table geometry. No sorting, parsing
 * or inferred rows. D4 extension: a named, keyboard-focusable scroll region;
 * the hidden caption names the table without adding a second visible heading.
 */
export function DataTable({
  data,
  caption,
  missingText = "—",
  missingLabel = "Missing value",
  emptyTitle = "No rows",
  emptyDescription,
  emptyActions,
  className = "",
}: DataTableProps) {
  return (
    <div className={className}>
      <div role="region" aria-label={`${caption}: scrollable table`} tabIndex={0} className="max-w-full overflow-x-auto">
        <table className="w-full border-separate border-spacing-0 text-[11px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th key={column.id} scope="col" className={`sticky top-0 border-b border-border bg-surface-muted px-[13px] py-[9px] font-semibold whitespace-nowrap text-text-muted ${column.kind === "integer" || column.kind === "decimal" ? "text-right tabular-nums" : "text-left"}`}>
                  {column.label}{column.unit !== null && <span> ({column.unit})</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.position} className="group">
                {row.cells.map((cell, index) => (
                  <td key={index} className={`border-b border-[#edf1f3] px-[13px] py-[10px] whitespace-nowrap text-[#3e5059] group-last:border-b-0 group-hover:bg-[#fbfcfc] ${data.columns[index]?.kind === "integer" || data.columns[index]?.kind === "decimal" ? "text-right tabular-nums" : "text-left"}`}>
                    {displayCell(cell, missingText, missingLabel)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.rows.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} actions={emptyActions} headingLevel={3} />}
    </div>
  );
}
