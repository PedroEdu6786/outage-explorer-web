import type { DatasetCoverage, DateRange } from "./catalog";
import type { OperationResult } from "./failures";
import type { OperationContext } from "./session";
import type { CalendarDate, DecimalValue } from "./table";

/** Proposed national observation models; metrics are supplied by the backend. */
export type NationalObservation =
  | { readonly status: "unavailable"; readonly date: CalendarDate }
  | {
      readonly status: "available";
      readonly date: CalendarDate;
      readonly capacityMw: DecimalValue | null;
      readonly outageMw: DecimalValue | null;
      readonly reportedPercentage: DecimalValue | null;
      readonly calculatedPercentage: DecimalValue | null;
    };

export interface ObservationProvenance {
  readonly source: string;
  readonly snapshotId: string;
}

export interface NationalSeries {
  readonly range: DateRange;
  readonly coverage: DatasetCoverage;
  readonly provenance: ObservationProvenance;
  /** Missing dates remain gaps; no interpolation or facility-average reconstruction. */
  readonly observations: readonly NationalObservation[];
}

export interface ObservationOperations {
  readNationalSeries(context: OperationContext, range: DateRange): Promise<OperationResult<NationalSeries>>;
}
