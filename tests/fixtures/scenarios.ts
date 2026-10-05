import type { DatasetSchema, DatasetSummary } from "../../src/contracts/catalog";
import type { NationalObservation } from "../../src/contracts/observations";
import type { TableCell, TableData, TableRow } from "../../src/contracts/table";

export type FixturePersona = "viewer" | "analyst" | "admin";
export type FixtureDataState = "ready" | "empty" | "unavailable" | "truncated";

/** SQL settings below are synthetic test choices, not approved live defaults/TTL. */
export const syntheticSettings = {
  sessionLifetimeMs: 3_600_000,
  previewLifetimeMs: 900_000,
  queryLifetimeMs: 60_000,
  queryMaximumPageSize: 100,
  queryDatasetIds: ["synthetic-national"],
} as const;

const coverage = { status: "available", range: { start: "2026-09-01", end: "2026-09-04" } } as const;
export const syntheticCatalog: readonly DatasetSummary[] = [
  { id: "synthetic-national", label: "Synthetic national observations", description: "Invented test data, not EIA findings.", grain: "national", sqlName: "synthetic_national", coverage, filters: { dates: true, facilities: [] } },
  { id: "synthetic-facility", label: "Synthetic facility observations", description: "Invented test data, not EIA findings.", grain: "facility", sqlName: "synthetic_facility", coverage, filters: { dates: true, facilities: [{ id: "0012", label: "Synthetic Facility 0012" }, { id: "A07", label: "Synthetic Facility A07" }] } },
  { id: "synthetic-generator", label: "Synthetic generator observations", description: "Invented test data, not EIA findings.", grain: "generator", sqlName: "synthetic_generator", coverage, filters: { dates: true, facilities: [{ id: "0012", label: "Synthetic Facility 0012" }] } },
];

export const syntheticObservations: readonly NationalObservation[] = [
  { status: "available", date: "2026-09-01", capacityMw: { exact: "100000", display: "100000.00" }, outageMw: { exact: "1005", display: "1005.00" }, reportedPercentage: { exact: "1.005", display: "1.01" }, calculatedPercentage: { exact: "1.005", display: "1.01" } },
  { status: "unavailable", date: "2026-09-02" },
  { status: "available", date: "2026-09-03", capacityMw: { exact: "100000", display: "100000.00" }, outageMw: { exact: "0", display: "0.00" }, reportedPercentage: { exact: "0", display: "0.00" }, calculatedPercentage: { exact: "0", display: "0.00" } },
  { status: "available", date: "2026-09-04", capacityMw: null, outageMw: null, reportedPercentage: null, calculatedPercentage: null },
];

export function syntheticSchema(datasetId: string): DatasetSchema {
  const columns: DatasetSchema["columns"] = [
    { id: "date", label: "Observation date", kind: "date", sqlType: "DATE", unit: null, nullable: false },
    { id: "capacity", label: "Capacity", kind: "decimal", sqlType: "DECIMAL", unit: "MW", nullable: true },
    { id: "outage", label: "Outage", kind: "decimal", sqlType: "DECIMAL", unit: "MW", nullable: true },
    { id: "reported", label: "Reported percentage", kind: "decimal", sqlType: "DECIMAL", unit: "%", nullable: true },
    { id: "calculated", label: "Calculated percentage", kind: "decimal", sqlType: "DECIMAL", unit: "%", nullable: true },
  ];
  return { datasetId, columns: datasetId === "synthetic-national" ? columns : [
    ...columns,
    { id: "facility", label: "Facility ID", kind: "identifier", sqlType: "VARCHAR", unit: null, nullable: false },
    ...(datasetId === "synthetic-generator" ? [{ id: "generator", label: "Generator ID", kind: "identifier", sqlType: "VARCHAR", unit: null, nullable: false } as const] : []),
  ] };
}

export function syntheticPreviewTable(datasetId: string): TableData {
  const rows: TableRow[] = syntheticObservations.filter((row) => row.status === "available").map((row, position) => {
    const cells: TableCell[] = [{ kind: "date", value: row.date }, ...[row.capacityMw, row.outageMw, row.reportedPercentage, row.calculatedPercentage].map((value): TableCell => value === null ? { kind: "null" } : { kind: "decimal", ...value })];
    if (datasetId !== "synthetic-national") cells.push({ kind: "identifier", value: "0012" });
    if (datasetId === "synthetic-generator") cells.push({ kind: "identifier", value: "G-01" });
    return { position, cells };
  });
  return { columns: syntheticSchema(datasetId).columns, rows };
}

/** Arbitrary positional SQL projection: duplicate labels/rows and lossless large values. */
export const syntheticQueryTable: TableData = {
  columns: [
    { id: "projection-0", label: "value", kind: "integer", unit: null, nullable: false },
    { id: "projection-1", label: "value", kind: "decimal", unit: null, nullable: false },
    { id: "projection-2", label: "opaque_id", kind: "identifier", unit: null, nullable: false },
    { id: "projection-3", label: "note", kind: "text", unit: null, nullable: true },
  ],
  rows: [0, 1, 2].map((position) => ({ position, cells: [
    { kind: "integer", exact: "9007199254740993", display: "9007199254740993" },
    { kind: "decimal", exact: "12345678901234567890.005", display: "12345678901234567890.01" },
    { kind: "identifier", value: "00A7" },
    position === 2 ? { kind: "text", value: "<script>synthetic text only</script>" } : { kind: "null" },
  ] })),
};
