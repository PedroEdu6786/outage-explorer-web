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
  /**
   * The caller is replacing this retained content: it dims, is marked busy and,
   * being stale, becomes inert and hidden from assistive technology. The caller
   * owns what is retained and clears it on logout or access change.
   */
  loading?: boolean;
  className?: string;
}

function structuredText(cell: TableCell): string {
  switch (cell.kind) {
    case "null": return "null";
    case "integer": return cell.exact;
    case "decimal": return cell.exact;
    case "rational": return `${cell.numerator}/${cell.denominator}`;
    case "boolean":
    case "float": return String(cell.value);
    case "list": return `[${cell.items.map(structuredText).join(", ")}]`;
    case "struct": return `{${cell.fields.map((field) => `${JSON.stringify(field.name)}: ${structuredText(field.value)}`).join(", ")}}`;
    case "map": return `[${cell.entries.map((entry) => `[${structuredText(entry.key)}, ${structuredText(entry.value)}]`).join(", ")}]`;
    default: return JSON.stringify(cell.value);
  }
}

function displayCell(cell: TableCell, missingText: string, missingLabel: string) {
  switch (cell.kind) {
    case "null": return <span aria-label={missingLabel} className="text-text-muted">{missingText}</span>;
    case "integer":
    case "decimal": return cell.display;
    case "rational": return <span title={`Exact: ${cell.numerator}/${cell.denominator}`}>{cell.display}</span>;
    case "float": return String(cell.value);
    case "binary": return <span title="Base64 encoded binary">{cell.value}</span>;
    case "list":
    case "struct":
    case "map": return structuredText(cell);
    case "boolean": return cell.value ? "true" : "false";
    case "time":
    case "timestamp":
    case "timestamp_tz":
    case "date":
    case "identifier":
    case "text": return cell.value;
  }
}

/**
 * O1/V2–V4: positional cells and published table geometry. No sorting, parsing
 * or inferred rows. D4 extension: a named, keyboard-focusable scroll region;
 * the hidden caption names the table without adding a second visible heading.
 * C5: optional `loading` dims retained content; cells are never altered.
 */
export function DataTable({
  data,
  caption,
  missingText = "—",
  missingLabel = "Missing value",
  emptyTitle = "No rows",
  emptyDescription,
  emptyActions,
  loading = false,
  className = "",
}: DataTableProps) {
  return (
    <div
      aria-busy={loading || undefined}
      aria-hidden={loading || undefined}
      inert={loading}
      className={`motion-colors ${loading ? "opacity-60" : ""} ${className}`.trim()}
    >
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
