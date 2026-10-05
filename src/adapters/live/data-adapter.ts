import type { CatalogOperations } from "../../contracts/catalog";
import type { OperationFailure, OperationResult, UnknownExecutionOutcome } from "../../contracts/failures";
import type { ObservationOperations } from "../../contracts/observations";
import type { PreviewOperations } from "../../contracts/preview";
import type { QueryOperations } from "../../contracts/query";
import type { OperationContext } from "../../contracts/session";
import { dateSchema, datasetIdSchema } from "./data-schema";
import { decodeCatalog, decodePreview, decodeQuery } from "./data-mapping";
import { mapNationalRows } from "./metric-mapping";

/** HTTP transport is injected. No fetch, credentials, retries or fixture imports here. */
export interface DataTransport {
  request(context: OperationContext, path: string, options?: { readonly method: "POST"; readonly body: { readonly sql: string } }): Promise<OperationResult<unknown, OperationFailure | UnknownExecutionOutcome>>;
  isCurrent(context: OperationContext): boolean;
}
const fail = (kind: OperationFailure["kind"], message: string): { ok: false; failure: OperationFailure } => ({ ok: false, failure: { kind, message } });
const invalid = () => fail("invalid-input", "Invalid request parameters.");
const malformed = () => fail("service-failure", "The backend response could not be validated. Try again deliberately.");
const pageSizeValid = (size: number) => Number.isSafeInteger(size) && size > 0 && size <= 500;
function boundsValid(bounds: { readonly start?: string; readonly end?: string } | undefined) {
  return !bounds || ((bounds.start === undefined || dateSchema.safeParse(bounds.start).success)
    && (bounds.end === undefined || dateSchema.safeParse(bounds.end).success)
    && (bounds.start === undefined || bounds.end === undefined || bounds.start <= bounds.end));
}

export function createDataAdapter(transport: DataTransport): CatalogOperations & PreviewOperations & ObservationOperations & QueryOperations {
  async function get<T>(context: OperationContext, path: string, decode: (raw: unknown) => T): Promise<OperationResult<T>> {
    if (!transport.isCurrent(context)) return fail("unauthenticated", "Session context changed.");
    try {
      const response = await transport.request(context, path);
      if (!transport.isCurrent(context)) return fail("unauthenticated", "Session context changed.");
      if (!response.ok) return response.failure.kind === "unknown-execution-outcome" ? malformed() : { ok: false, failure: response.failure };
      return { ok: true, value: decode(response.value) };
    } catch { return malformed(); }
  }
  const catalog = (context: OperationContext) => get(context, "/api/datasets", decodeCatalog);
  const adapter: CatalogOperations & PreviewOperations & ObservationOperations & QueryOperations = {
    async listDatasets(context) { const result = await catalog(context); return result.ok ? { ok: true, value: result.value.datasets } : result; },
    async readSchema(context, datasetId) {
      const result = await catalog(context);
      if (!result.ok) return result;
      const schema = result.value.schemas.find((item) => item.datasetId === datasetId);
      return schema ? { ok: true, value: schema } : fail("data-unavailable", "Dataset unavailable.");
    },
    startPreview(context, selection) {
      if (!datasetIdSchema.safeParse(selection.datasetId).success || selection.filters.facilityId !== undefined || !pageSizeValid(selection.pageSize) || !boundsValid(selection.filters.dates)) return Promise.resolve(invalid());
      const params = new URLSearchParams({ page_size: String(selection.pageSize) });
      if (selection.filters.dates?.start !== undefined) params.set("start_date", selection.filters.dates.start);
      if (selection.filters.dates?.end !== undefined) params.set("end_date", selection.filters.dates.end);
      return get(context, `/api/datasets/${encodeURIComponent(selection.datasetId)}/preview?${params.toString()}`, (raw) => decodePreview(raw, selection));
    },
    continuePreview(context, input) {
      if (!datasetIdSchema.safeParse(input.sequence.selection.datasetId).success) return Promise.resolve(invalid());
      const params = new URLSearchParams({ cursor: input.cursor });
      return get(context, `/api/datasets/${encodeURIComponent(input.sequence.selection.datasetId)}/preview?${params.toString()}`, (raw) => {
        const page = decodePreview(raw, input.sequence.selection);
        if (page.sequence.snapshotId !== input.sequence.snapshotId || page.sequence.expiresAt !== input.sequence.expiresAt) throw new Error("Preview sequence changed");
        return page;
      });
    },
    async readNationalSeries(context, range) {
      if (!boundsValid(range)) return invalid();
      const metadata = await catalog(context);
      if (!metadata.ok) return metadata;
      const national = metadata.value.datasets.find((item) => item.id === "national");
      if (!national) return fail("data-unavailable", "National dataset unavailable.");
      let result = await adapter.startPreview(context, { datasetId: national.id, filters: { dates: range }, pageSize: 100 });
      if (!result.ok) return result;
      const first = result.value;
      const observations = [];
      const seen = new Set<string>();
      try {
        for (;;) {
          if (!transport.isCurrent(context)) return fail("unauthenticated", "Session context changed.");
          const page = result.value;
          if (JSON.stringify(page.table.columns) !== JSON.stringify(first.table.columns)) return malformed();
          observations.push(...mapNationalRows(page.table));
          if (page.nextCursor === null) break;
          if (seen.has(page.nextCursor)) return malformed();
          seen.add(page.nextCursor);
          result = await adapter.continuePreview(context, { sequence: first.sequence, cursor: page.nextCursor });
          if (!result.ok) return result;
        }
        if (new Set(observations.map((item) => item.date)).size !== observations.length
          || observations.some((item) => (range.start !== undefined && item.date < range.start) || (range.end !== undefined && item.date > range.end))) return malformed();
        observations.sort((a, b) => a.date.localeCompare(b.date));
        return { ok: true, value: { range, coverage: national.coverage, provenance: { source: "EIA national observations", snapshotId: first.sequence.snapshotId }, observations } };
      } catch { return malformed(); }
    },
    async executeQuery(context, input) {
      if (!input.sql.trim() || new TextEncoder().encode(input.sql).byteLength > 65_536 || !pageSizeValid(input.pageSize) || !Number.isSafeInteger(input.page) || input.page < 1) return invalid();
      if (!transport.isCurrent(context)) return fail("unauthenticated", "Session context changed.");
      try {
        const response = await transport.request(context, `/api/query?${new URLSearchParams({ page: String(input.page), page_size: String(input.pageSize) }).toString()}`, { method: "POST", body: { sql: input.sql } });
        if (!transport.isCurrent(context)) return fail("unauthenticated", "Session context changed.");
        if (!response.ok) return response.failure.kind !== "unknown-execution-outcome" && response.failure.retainedQuery
          ? { ok: false, failure: { ...response.failure, retainedQuery: { ...response.failure.retainedQuery, pageSize: input.pageSize } } } : response;
        const page = decodeQuery(response.value);
        if (page.page !== input.page || page.execution.pageSize !== input.pageSize) throw new Error("Query request mismatch");
        return { ok: true, value: page };
      } catch { return { ok: false, failure: { kind: "unknown-execution-outcome", message: "A valid execution response was not received. The query may have executed; use Run deliberately." } }; }
    },
    readQueryPage(context, input) {
      if ("sql" in input || !pageSizeValid(input.pageSize) || !Number.isSafeInteger(input.page) || input.page < 1) return Promise.resolve(invalid());
      return get(context, `/api/query?${new URLSearchParams({ query_id: input.queryId, page: String(input.page), page_size: String(input.pageSize) }).toString()}`, (raw) => {
        const page = decodeQuery(raw);
        if (page.execution.queryId !== input.queryId || page.execution.pageSize !== input.pageSize || page.page !== input.page) throw new Error("Retained page mismatch");
        return page;
      });
    },
  };
  return adapter;
}
