import type { OperationResult } from "./failures";
import type { OperationContext } from "./session";
import type { CalendarDate, OpaqueIdentifier, TableColumn } from "./table";

/** Proposed frontend catalog, not EIA routes or transport DTOs. */
export type DatasetId = OpaqueIdentifier;
export type DatasetGrain = "national" | "facility" | "generator";

export interface DateRange {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

export type DatasetCoverage =
  | { readonly status: "available"; readonly range: DateRange }
  | { readonly status: "unavailable" };

export interface FacilityOption {
  readonly id: OpaqueIdentifier;
  readonly label: string;
}

export interface DatasetFilters {
  readonly dates: boolean;
  /** Only authorized choices; absent detail access must never leak into autocomplete. */
  readonly facilities: readonly FacilityOption[];
}

export interface DatasetSummary {
  readonly id: DatasetId;
  readonly label: string;
  readonly description: string;
  readonly grain: DatasetGrain;
  /** Agreed authorized SQL name, never inferred from the source route or dataset ID. */
  readonly sqlName: string;
  readonly coverage: DatasetCoverage;
  readonly filters: DatasetFilters;
}

export interface DatasetSchemaColumn extends TableColumn {
  /** Authorized backend SQL type label, separate from the normalized cell display kind. */
  readonly sqlType: string;
}

export interface DatasetSchema {
  readonly datasetId: DatasetId;
  readonly columns: readonly DatasetSchemaColumn[];
}

export interface CatalogOperations {
  listDatasets(context: OperationContext): Promise<OperationResult<readonly DatasetSummary[]>>;
  readSchema(context: OperationContext, datasetId: DatasetId): Promise<OperationResult<DatasetSchema>>;
}
