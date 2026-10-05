/** Proposed lossless view values. Adapters validate encodings before constructing them. */
/** Validated YYYY-MM-DD calendar value, never converted through a timezone. */
export type CalendarDate = string;
export type OpaqueIdentifier = string;

export interface DecimalValue {
  /** Base-10 value retained as text, never silently coerced through a JS number. */
  readonly exact: string;
  /** Authoritative display text; percentage values require two-decimal half-up. */
  readonly display: string;
}

export type TableValueKind = "text" | "identifier" | "date" | "integer" | "decimal" | "boolean";

export interface TableColumn {
  /** Stable per projection position; repeated labels are allowed. */
  readonly id: string;
  readonly label: string;
  readonly kind: TableValueKind;
  readonly unit: string | null;
  readonly nullable: boolean;
}

export type TableCell =
  | { readonly kind: "null" }
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "identifier"; readonly value: OpaqueIdentifier }
  | { readonly kind: "date"; readonly value: CalendarDate }
  | { readonly kind: "integer"; readonly exact: string; readonly display: string }
  | ({ readonly kind: "decimal" } & DecimalValue)
  | { readonly kind: "boolean"; readonly value: boolean };

export interface TableRow {
  /** Position in this table page; scope rendering keys to its sequence/execution. */
  readonly position: number;
  /** Same order/length as columns; never index cells by a potentially repeated label. */
  readonly cells: readonly TableCell[];
}

export interface TableData {
  readonly columns: readonly TableColumn[];
  /** Preserve multiplicity; duplicate rows are not collapsed. */
  readonly rows: readonly TableRow[];
}
