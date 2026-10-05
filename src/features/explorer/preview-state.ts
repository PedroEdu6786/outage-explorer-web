import type { DatasetSummary, DatasetSchema } from "../../contracts/catalog";
import type { OperationFailure } from "../../contracts/failures";
import type { PreviewPage, PreviewSelection } from "../../contracts/preview";

export interface ExplorerState {
  readonly catalog: readonly DatasetSummary[];
  readonly catalogStatus: "idle" | "loading" | "ready" | "error";
  readonly selected: DatasetSummary | null;
  readonly selection: PreviewSelection | null;
  readonly schema: DatasetSchema | null;
  readonly schemaStatus: "idle" | "loading" | "ready" | "error";
  readonly schemaFailure: OperationFailure | null;
  readonly pages: readonly PreviewPage[];
  readonly pageIndex: number;
  readonly previewStatus: "idle" | "loading" | "ready" | "error" | "expired";
  readonly failure: OperationFailure | null;
}

export const emptyExplorerState: ExplorerState = {
  catalog: [], catalogStatus: "idle", selected: null, selection: null,
  schema: null, schemaStatus: "idle", schemaFailure: null, pages: [], pageIndex: 0,
  previewStatus: "idle", failure: null,
};

/** Calendar validation uses integer calendar rules, never timezone conversion. */
export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year = 0, month = 0, day = 0] = value.split("-").map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return year > 0 && month >= 1 && month <= 12 && day >= 1 && day <= (days[month - 1] ?? 0);
}

export function validateSelection(dataset: DatasetSummary, selection: PreviewSelection): string | null {
  if (selection.datasetId !== dataset.id) return "Choose an available dataset.";
  if (!Number.isInteger(selection.pageSize) || selection.pageSize < 1 || selection.pageSize > 500) return "Rows per page must be between 1 and 500.";
  const { dates, facilityId } = selection.filters;
  if (dates) {
    if (!dataset.filters.dates || (dates.start !== undefined && !isCalendarDate(dates.start)) || (dates.end !== undefined && !isCalendarDate(dates.end)) || (dates.start !== undefined && dates.end !== undefined && dates.start > dates.end)) return "Enter valid calendar dates with the start on or before the end.";
  }
  if (facilityId !== undefined) return "Facility filtering is not available in this version. Use date filters.";
  return null;
}

export function sameSelection(a: PreviewSelection, b: PreviewSelection): boolean {
  return a.datasetId === b.datasetId && a.pageSize === b.pageSize
    && a.filters.facilityId === b.filters.facilityId
    && a.filters.dates?.start === b.filters.dates?.start
    && a.filters.dates?.end === b.filters.dates?.end;
}
