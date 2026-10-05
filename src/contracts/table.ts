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

export interface RationalValue {
  /** Exact percentage supplied by the backend; never replace with rounded decimal. */
  readonly numerator: string;
  readonly denominator: string;
  readonly rounded: string;
  readonly display: string;
}

export type PercentageValue = DecimalValue | RationalValue;
export type TableValueKind = "text" | "identifier" | "date" | "integer" | "decimal" | "boolean"
  | "rational" | "float" | "time" | "timestamp" | "timestamp_tz" | "binary" | "list" | "struct" | "map" | "null";

export interface TableColumn {
  /** Stable per projection position; repeated labels are allowed. */
  readonly id: string;
  readonly label: string;
  readonly kind: TableValueKind;
  readonly unit: string | null;
  readonly nullable: boolean | null;
}

export type TableCell =
  | { readonly kind: "null" }
  | { readonly kind: "text"; readonly value: string }
  | { readonly kind: "identifier"; readonly value: OpaqueIdentifier }
  | { readonly kind: "date"; readonly value: CalendarDate }
  | { readonly kind: "integer"; readonly exact: string; readonly display: string }
  | ({ readonly kind: "decimal" } & DecimalValue)
  | { readonly kind: "boolean"; readonly value: boolean }
  | ({ readonly kind: "rational" } & RationalValue)
  | { readonly kind: "float"; readonly value: number | "NaN" | "Infinity" | "-Infinity" }
  | { readonly kind: "time" | "timestamp" | "timestamp_tz" | "binary"; readonly value: string }
  | { readonly kind: "list"; readonly items: readonly TableCell[] }
  | { readonly kind: "struct"; readonly fields: readonly { readonly name: string; readonly value: TableCell }[] }
  | { readonly kind: "map"; readonly entries: readonly { readonly key: TableCell; readonly value: TableCell }[] };

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
