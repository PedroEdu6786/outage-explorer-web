import type { DatasetSchema, DatasetSummary } from "../../contracts/catalog";
import type { PreviewPage, PreviewSelection } from "../../contracts/preview";
import type { QueryPage } from "../../contracts/query";
import { catalogSchema, previewSchema, querySchema } from "./data-schema";
import { mapColumns, mapTable } from "./table-mapping";

const grains = { national: "national", facilities: "facility", generators: "generator" } as const;
export function decodeCatalog(raw: unknown) {
  const wire = catalogSchema.parse(raw);
  const datasets: readonly DatasetSummary[] = wire.datasets.map((dataset) => ({
    id: dataset.id, sqlName: dataset.sql_name, label: dataset.label, grain: grains[dataset.id],
    // Client presentation text: not an undocumented server-returned description.
    description: `Daily ${grains[dataset.id]} observations`, filters: { dates: true, facilities: [] },
    coverage: dataset.coverage.start_date !== null && dataset.coverage.end_date !== null
      ? { status: "available", range: { start: dataset.coverage.start_date, end: dataset.coverage.end_date } } : { status: "unavailable" },
  }));
  const schemas: readonly DatasetSchema[] = wire.datasets.map((dataset) => ({ datasetId: dataset.id, columns: mapColumns(dataset.columns) }));
  return { generationId: wire.generation_id, datasets, schemas };
}
export function decodePreview(raw: unknown, selection: PreviewSelection): PreviewPage {
  const wire = previewSchema.parse(raw);
  if (wire.dataset !== selection.datasetId || wire.page_size !== selection.pageSize) throw new Error("Preview selection mismatch");
  return {
    sequence: { selection, snapshotId: wire.generation_id, expiresAt: wire.expires_at },
    table: mapTable(wire.columns, wire.rows), pageCursor: wire.page_cursor, nextCursor: wire.next_cursor, hasMore: wire.has_more,
  };
}
export function decodeQuery(raw: unknown): QueryPage {
  const wire = querySchema.parse(raw);
  // A row-limit result must retain the whole documented row cap.
  if (wire.truncation_reason === "row_limit" && wire.retained_row_count !== wire.limits.max_rows) throw new Error("Inconsistent row-limit result");
  return {
    execution: {
      queryId: wire.query_id, snapshotId: wire.generation_id, pageSize: wire.page_size, expiresAt: wire.expires_at,
      retainedRowCount: wire.retained_row_count, totalPages: wire.total_pages, limits: { maxRows: wire.limits.max_rows, maxBytes: wire.limits.max_bytes },
      truncation: wire.truncated ? { truncated: true, reason: wire.truncation_reason === "row_limit" ? "row-limit" : "byte-limit" } : { truncated: false },
    },
    page: wire.page, hasMore: wire.has_more, table: mapTable(wire.columns, wire.rows),
  };
}
