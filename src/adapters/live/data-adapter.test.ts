import { createResourceRepository } from "../../resources/resource-repository";
import { createSessionRuntime } from "../../session/session-runtime";
import { syntheticResourcePolicy } from "../../../tests/fixtures/operations";
import { describe, expect, it, vi } from "vitest";
import fixtures from "../../../docs/specs/web-client/contracts/data-api-v1/fixtures.json";
import { decodeCatalog, decodePreview, decodeQuery } from "./data-mapping";
import { createDataAdapter, type DataTransport } from "./data-adapter";
import { decodeFailure } from "./error-mapping";
import { mapNationalRows } from "./metric-mapping";
import { plotSegments } from "../../features/overview/presentation";

const example = (name: string) => {
  const entry = fixtures.fixtures.find((fixture) => fixture.name === name);
  if (!entry) throw new Error(`Missing fixture ${name}`);
  return structuredClone(entry.body);
};
const context = { generation: 1 };
const beforePreviewExpiry = () => Date.parse("2026-10-05T12:00:00Z");
const selection = { datasetId: "national", filters: {}, pageSize: 100 };
const previewExample = () => {
  const fixture = fixtures.fixtures.find((item) => item.schema === "Preview" && item.status === 200 && "dataset" in item.body && item.body.dataset === "national");
  if (!fixture) throw new Error("National preview fixture missing");
  return structuredClone(fixture.body);
};
function transport(responses: unknown[]) {
  const request = vi.fn<DataTransport["request"]>().mockImplementation(() => Promise.resolve({ ok: true, value: responses.shift() }));
  return { request, isCurrent: () => true };
}

describe("Data API v1 frontend adaptation (controlled responses only)", () => {
  it("reads authorized embedded schemas without inventing a schema route or hidden dataset", async () => {
    const backend = transport([example("catalog_viewer"), example("catalog_viewer"), example("catalog_viewer")]);
    const adapter = createDataAdapter(backend);
    expect(await adapter.listDatasets(context)).toMatchObject({ ok: true, value: [{ id: "national" }] });
    const schema = await adapter.readSchema(context, "national");
    if (!schema.ok) throw new Error("Expected national schema");
    expect(schema.value.datasetId).toBe("national");
    expect(schema.value.columns[0]?.label).toBe("period");
    expect(await adapter.readSchema(context, "facilities")).toMatchObject({ ok: false, failure: { kind: "data-unavailable" } });
    expect(backend.request.mock.calls.map((call) => call[1])).toEqual(Array<string>(3).fill("/api/datasets"));
  });
  it("keeps optional-date and preview/query size choices independent with cursor-only revisits", async () => {
    const raw = previewExample();
    const backend = transport([{ ...raw, page_size: 500 }, { ...raw, page_size: 500 }, { ...raw, page_size: 500 }, { ...raw, page_size: 1, rows: [] }, example("query_reference_free")]);
    const adapter = createDataAdapter(backend);
    const selection = { datasetId: "national", filters: { dates: { start: "2026-09-01" } }, pageSize: 500 };
    const first = await adapter.startPreview(context, selection);
    if (!first.ok || !first.value.pageCursor) throw new Error("Expected first preview with revisit cursor");
    await adapter.continuePreview(context, { sequence: first.value.sequence, cursor: "opaque/+?" });
    await adapter.continuePreview(context, { sequence: first.value.sequence, cursor: first.value.pageCursor });
    expect(await adapter.startPreview(context, { datasetId: "national", filters: { dates: { end: "2025-01-01" } }, pageSize: 1 })).toMatchObject({ ok: true, value: { table: { rows: [] } } });
    expect((await adapter.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 })).ok).toBe(true);
    const calls = backend.request.mock.calls.map((call) => call[1]);
    expect(calls[0]).toBe("/api/datasets/national/preview?page_size=500&start_date=2026-09-01");
    for (const path of calls.slice(1, 3)) expect([...new URL(path, "https://example.invalid").searchParams.keys()]).toEqual(["cursor"]);
    const before = backend.request.mock.calls.length;
    for (const pageSize of [0, 501, 1.5]) {
      expect((await adapter.startPreview(context, { ...selection, pageSize })).ok).toBe(false);
      expect((await adapter.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize })).ok).toBe(false);
    }
    expect(backend.request).toHaveBeenCalledTimes(before);
  });
  it.each(["generation", "expiry", "size", "dataset"] as const)("rejects changed preview sequence %s without starting over", async (field) => {
    const raw = { ...previewExample(), page_size: 100 };
    const first = decodePreview(raw, selection);
    const changed = { ...raw, ...(field === "generation" ? { generation_id: "new" } : field === "expiry" ? { expires_at: "2026-10-05T12:16:00Z" } : field === "size" ? { page_size: 500 } : { dataset: "facilities" }) };
    const backend = transport([changed]);
    expect(await createDataAdapter(backend).continuePreview(context, { sequence: first.sequence, cursor: "next" })).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
    expect(backend.request).toHaveBeenCalledTimes(1);
  });
  it.each(["failure", "expired", "final-expiry", "cycle", "duplicate", "range"] as const)("withholds national partial output on %s", async (scenario) => {
    const raw = previewExample();
    if (!("rows" in raw) || !raw.rows[0]) throw new Error("Missing national row");
    const row = [...raw.rows[0]]; row[0] = "2026-09-29";
    const first = { ...raw, page_size: 100, page_cursor: "first", next_cursor: "next", has_more: true };
    const second = { ...raw, page_size: 100, rows: scenario === "duplicate" ? raw.rows : [row], page_cursor: "next", next_cursor: null, has_more: false };
    const backend = transport([example("catalog_viewer"), first, scenario === "cycle" ? { ...second, page_cursor: "another", next_cursor: "next", has_more: true } : second]);
    if (scenario === "failure") backend.request.mockImplementationOnce(() => Promise.resolve({ ok: true, value: example("catalog_viewer") })).mockImplementationOnce(() => Promise.resolve({ ok: true, value: first })).mockResolvedValueOnce({ ok: false, failure: { kind: "preview-expired", message: "Expired" } });
    let ticks = 0;
    const now = () => ++ticks >= (scenario === "final-expiry" ? 3 : 2) && (scenario === "expired" || scenario === "final-expiry") ? Date.parse("2026-10-05T12:15:00Z") : beforePreviewExpiry();
    expect(await createDataAdapter(backend, now).readNationalSeries(context, scenario === "range" ? { start: "2026-09-30" } : {})).toMatchObject({ ok: false });
    expect(backend.request).toHaveBeenCalledTimes(3);
  });
  it("preserves measured zero and an omitted date as a gap across a newer complete generation", async () => {
    const raw = previewExample();
    if (!("rows" in raw) || !raw.rows[0]) throw new Error("Missing national row");
    const zero = [...raw.rows[0]]; zero[0] = "2026-09-29";
    for (const index of [2, 3, 4, 5, 7, 8]) zero[index] = index === 5 ? "0" : "0.00";
    zero[6] = "1";
    const backend = transport([example("catalog_viewer"), { ...raw, generation_id: "new-preview-generation", page_size: 100, page_cursor: "first", next_cursor: "next", has_more: true }, { ...raw, generation_id: "new-preview-generation", rows: [zero], page_size: 100, page_cursor: "next", next_cursor: null, has_more: false }]);
    const result = await createDataAdapter(backend, beforePreviewExpiry).readNationalSeries(context, {});
    if (!result.ok) throw new Error("Complete national result required");
    expect(result.value.provenance.snapshotId).toBe("new-preview-generation");
    expect(result.value.observations.map((row) => row.date)).toEqual(["2026-09-29", "2026-10-01"]);
    expect(result.value.observations[0]).toMatchObject({ status: "available", calculatedPercentage: { numerator: "0", denominator: "1", display: "0.00" } });
    expect(plotSegments(result.value.observations, "calculatedPercentage")).toHaveLength(2);
  });
  it("preserves owned out-of-range GET recovery and all documented data errors without replay", async () => {
    const expected: Record<string, string> = { invalid_request: "invalid-input", invalid_sql: "invalid-input", unsupported_sql: "unsupported-sql", page_out_of_range: "invalid-input", page_size_mismatch: "invalid-input", unauthenticated: "unauthenticated", forbidden: "forbidden", dataset_unavailable: "data-unavailable", preview_unavailable: "preview-expired", query_resource_limit: "resource-limit", query_busy: "busy", query_timeout: "execution-timeout", result_capacity_exhausted: "capacity-exhausted", data_unavailable: "data-unavailable", service_unavailable: "service-failure" };
    for (const fixture of fixtures.fixtures.filter((item) => item.name.startsWith("error_"))) {
      if (!("error" in fixture.body)) continue;
      const code = fixture.body.error.code;
      const kind = code === "query_unavailable" ? fixture.status === 410 ? "result-expired" : "result-lost" : expected[code];
      if (!kind) continue;
      const failure = decodeFailure(fixture.status, fixture.body);
      expect(failure.kind).toBe(kind);
      const backend = transport([]); backend.request.mockResolvedValueOnce({ ok: false, failure });
      const result = await createDataAdapter(backend).executeQuery(context, { sql: "SELECT 1", page: 3, pageSize: 1 });
      expect(result).toMatchObject({ ok: false, failure: { kind } });
      expect(backend.request).toHaveBeenCalledTimes(1);
    }
    const failure = decodeFailure(400, { error: { code: "page_out_of_range", message: "private", details: { query_id: "query-synthetic-1", expires_at: "2026-10-05T12:15:00Z" } } });
    const backend = transport([]); backend.request.mockResolvedValueOnce({ ok: false, failure }).mockResolvedValueOnce({ ok: true, value: example("query_reference_free") });
    const adapter = createDataAdapter(backend);
    const initial = await adapter.executeQuery(context, { sql: "SELECT 1", page: 3, pageSize: 1 });
    if (initial.ok || initial.failure.kind === "unknown-execution-outcome" || !initial.failure.retainedQuery) throw new Error("Owned recovery required");
    expect(initial.failure.retainedQuery.pageSize).toBe(1);
    expect((await adapter.readQueryPage(context, { ...initial.failure.retainedQuery, page: 1, pageSize: 1 })).ok).toBe(true);
    expect(backend.request.mock.calls[1]?.slice(1)).toEqual(["/api/query?query_id=query-synthetic-1&page=1&page_size=1"]);
  });
  it.each(["a", "é", "😀"])("enforces UTF-8 SQL byte boundaries for %s without rewriting", async (character) => {
    const byteSize = new TextEncoder().encode(character).byteLength;
    const accepted = character.repeat(65_536 / byteSize);
    const backend = transport([example("query_reference_free"), example("query_reference_free")]);
    const adapter = createDataAdapter(backend);
    expect((await adapter.executeQuery(context, { sql: accepted, page: 1, pageSize: 1 })).ok).toBe(true);
    expect((await adapter.executeQuery(context, { sql: accepted.slice(0, -character.length) + "a".repeat(byteSize - 1), page: 1, pageSize: 1 })).ok).toBe(true);
    expect(await adapter.executeQuery(context, { sql: accepted + "a", page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    expect(backend.request).toHaveBeenCalledTimes(2);
    expect(backend.request.mock.calls[0]?.[2]?.body.sql).toBe(accepted);
  });

  it("maps every catalog and supports date-only schemas embedded in the catalog", () => {
    const viewer = decodeCatalog(example("catalog_viewer"));
    expect(viewer.datasets.map((dataset) => dataset.id)).toEqual(["national"]);
    expect(viewer.datasets[0]?.filters).toEqual({ dates: true, facilities: [] });
    expect(viewer.schemas[0]?.columns[1]?.sqlType).toBe("decimal(38,12)");
    expect(decodeCatalog(example("catalog_analyst")).datasets).toHaveLength(3);
  });
  it("preserves rich positional cells, duplicate labels, unknown nullability and numeric precision", () => {
    const page = decodeQuery(example("query_lossless_types"));
    expect(page.table.columns.slice(0, 2).map((column) => column.label)).toEqual(["x", "x"]);
    expect(page.table.columns[0]?.nullable).toBeNull();
    expect(page.table.rows[0]?.cells[0]).toEqual({ kind: "integer", exact: "9007199254740993", display: "9007199254740993" });
    expect(page.table.rows[0]?.cells[14]).toMatchObject({ kind: "struct", fields: [{ name: "label", value: { kind: "text", value: "é" } }, { name: "amount", value: { kind: "decimal", exact: "1.25" } }] });
    expect(page.table.rows[0]?.cells[15]).toMatchObject({ kind: "map", entries: [{ key: { value: "one" }, value: { exact: "1" } }, { key: { value: "two" }, value: { kind: "null" } }] });
  });
  it("accepts every corrected successful query example and retains the actual row cap", () => {
    for (const fixture of fixtures.fixtures.filter((item) => item.schema === "QueryResult")) {
      expect(() => decodeQuery(fixture.body)).not.toThrow();
    }
    const capped = decodeQuery(example("query_row_limit"));
    expect(capped).toMatchObject({ execution: { retainedRowCount: 1000, totalPages: 1000, truncation: { truncated: true, reason: "row-limit" } }, table: { rows: [{ cells: [{ exact: "9007199254740993" }, { exact: "0.123456789012" }] }] } });
    expect(() => decodeQuery({ ...example("query_row_limit"), retained_row_count: 2, total_pages: 2 })).toThrow("Inconsistent row-limit");
    expect(decodeQuery(example("query_first")).table.columns.map((column) => column.label)).toEqual(["x", "x_copy"]);
    expect(decodeQuery(example("query_duplicate_labels")).table.columns.map((column) => column.label)).toEqual(["x", "x"]);
  });
  it("retains null SQL generation through one unchanged POST and subsequent retained-only GET", async () => {
    const first = example("query_reference_free");
    const second = { ...example("query_second"), generation_id: null };
    const backend = transport([first, second]);
    const adapter = createDataAdapter(backend);
    const sql = "  SELECT 1 AS expression\n";
    const execution = await adapter.executeQuery(context, { sql, page: 1, pageSize: 1 });
    expect(execution).toMatchObject({ ok: true, value: { execution: { queryId: "query-synthetic-1", snapshotId: null }, table: { rows: [{ cells: [{ exact: "9007199254740993" }, { exact: "0.123456789012" }] }] } } });
    const page = await adapter.readQueryPage(context, { queryId: "query-synthetic-1", page: 2, pageSize: 1 });
    expect(page).toMatchObject({ ok: true, value: { page: 2, execution: { snapshotId: null, pageSize: 1, expiresAt: "2026-10-05T12:15:00Z" } } });
    expect(backend.request.mock.calls.map((call) => call.slice(1))).toEqual([
      ["/api/query?page=1&page_size=1", { method: "POST", body: { sql } }],
      ["/api/query?query_id=query-synthetic-1&page=2&page_size=1"],
    ]);
  });
  it("rejects missing SQL generation and null or missing catalog/preview generations", () => {
    const query = { ...example("query_reference_free"), generation_id: undefined };
    expect(() => decodeQuery(query)).toThrow();
    for (const generation_id of [null, undefined]) {
      expect(() => decodeCatalog({ ...example("catalog_viewer"), generation_id })).toThrow();
      expect(() => decodePreview({ ...previewExample(), page_size: 100, generation_id }, selection)).toThrow();
    }
  });
  it("fails closed on malformed null-generation results without retrying or leaking diagnostics", async () => {
    const malformed = { ...example("query_reference_free"), encoding_version: "internal-spool-version" };
    const backend = transport([malformed, malformed]);
    const adapter = createDataAdapter(backend);
    expect(await adapter.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "unknown-execution-outcome" } });
    expect(await adapter.readQueryPage(context, { queryId: "query-synthetic-1", page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
    expect(backend.request).toHaveBeenCalledTimes(2);
  });
  it("distinguishes successful empty output from empty whole-result byte truncation", () => {
    const empty = decodeQuery(example("query_empty"));
    const truncated = decodeQuery(example("query_oversized_first"));
    expect(empty.table.rows).toEqual([]);
    expect(empty.execution.truncation).toEqual({ truncated: false });
    expect(truncated.table.rows).toEqual([]);
    expect(truncated.execution).toMatchObject({ retainedRowCount: 0, truncation: { truncated: true, reason: "byte-limit" }, limits: { maxRows: 1000, maxBytes: 1048576 } });
  });
  it("rejects malformed rows, unsafe numeric coercion, wrong type encoding and paging counters", () => {
    const original = example("query_lossless_types");
    expect(() => decodeQuery({ ...original, rows: [[1]] })).toThrow();
    expect(() => decodeQuery({ ...original, total_pages: 2 })).toThrow();
    const body = JSON.parse(JSON.stringify(original)) as { columns: { encoding: string }[]; rows: unknown[][] };
    if (body.rows[0]) body.rows[0][0] = 9007199254740992;
    expect(() => decodeQuery(body)).toThrow();
    if (body.columns[0]) body.columns[0].encoding = "string";
    expect(() => decodeQuery(body)).toThrow();
  });
  it("keeps exact percentage fractions and authoritative labels; only plot coordinates approximate", () => {
    const raw = previewExample();
    const page = decodePreview({ ...raw, page_size: 100 }, selection);
    const observations = mapNationalRows(page.table);
    const row = observations[0];
    expect(row).toMatchObject({ status: "available", calculatedPercentage: { numerator: "10", denominator: "3", rounded: "3.33", display: "3.33" } });
    expect(plotSegments(observations, "calculatedPercentage")[0]?.[0]).toMatchObject({ value: 10 / 3, label: "3.33%" });
  });
  it("collects a complete same-generation national series through cursor-only GETs before publishing", async () => {
    const raw = previewExample();
    if (!("rows" in raw) || !raw.rows[0]) throw new Error("Missing preview rows");
    const firstRow = raw.rows[0];
    const secondRow = [...firstRow]; secondRow[0] = "2026-09-30";
    const backend = transport([example("catalog_viewer"), { ...raw, rows: [firstRow], page_size: 100, page_cursor: "first", next_cursor: "next", has_more: true }, { ...raw, rows: [secondRow], page_size: 100, page_cursor: "next", next_cursor: null, has_more: false }]);
    const result = await createDataAdapter(backend, beforePreviewExpiry).readNationalSeries(context, {});
    expect(result).toMatchObject({ ok: true, value: { observations: [{ date: "2026-09-30" }, { date: "2026-10-01" }] } });
    expect(backend.request.mock.calls.map((call) => call[1])).toEqual(["/api/datasets", "/api/datasets/national/preview?page_size=100", "/api/datasets/national/preview?cursor=next"]);
    expect(backend.request.mock.calls.every((call) => call[2] === undefined)).toBe(true);
  });
  it("does not publish a partial chart after generation change or failed continuation", async () => {
    const raw = previewExample();
    const backend = transport([example("catalog_viewer"), { ...raw, page_size: 100, page_cursor: "first", next_cursor: "next", has_more: true }, { ...raw, page_size: 100, generation_id: "different", page_cursor: "next", next_cursor: null, has_more: false }]);
    expect(await createDataAdapter(backend, beforePreviewExpiry).readNationalSeries(context, {})).toMatchObject({ ok: false });
    expect(backend.request).toHaveBeenCalledTimes(3);
  });
  it("sends optional bounds but rejects facility inputs and invalid calendars before dispatch", async () => {
    const backend = transport([{ ...previewExample(), page_size: 100 }]);
    const adapter = createDataAdapter(backend);
    await adapter.startPreview(context, { ...selection, filters: { dates: { end: "2026-10-01" } } });
    expect(backend.request.mock.calls[0]?.[1]).toBe("/api/datasets/national/preview?page_size=100&end_date=2026-10-01");
    expect(await adapter.startPreview(context, { ...selection, filters: { facilityId: "0012" } })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    expect(await adapter.startPreview(context, { ...selection, filters: { dates: { start: "2026-02-30" } } })).toMatchObject({ ok: false });
    expect(backend.request).toHaveBeenCalledTimes(1);
  });
  it("never repeats a POST after a lost response; retained pages contain no SQL", async () => {
    const backend = transport([]);
    backend.request.mockRejectedValueOnce(new Error("unavailable"));
    const adapter = createDataAdapter(backend);
    const sql = "  SELECT 1\n";
    expect(await adapter.executeQuery(context, { sql, page: 1, pageSize: 100 })).toMatchObject({ ok: false, failure: { kind: "unknown-execution-outcome" } });
    expect(backend.request).toHaveBeenCalledTimes(1);
    expect(backend.request.mock.calls[0]?.slice(1)).toEqual(["/api/query?page=1&page_size=100", { method: "POST", body: { sql } }]);
    await adapter.readQueryPage(context, { queryId: "opaque/id", page: 2, pageSize: 100 });
    expect(backend.request.mock.calls[1]?.slice(1)).toEqual(["/api/query?query_id=opaque%2Fid&page=2&page_size=100"]);
  });
  it("maps resource, capacity, expiry and recovery metadata without exposing server internals", () => {
    expect(decodeFailure(422, { error: { code: "query_resource_limit", message: "private backend message" } })).toMatchObject({ kind: "resource-limit" });
    expect(decodeFailure(429, { error: { code: "result_capacity_exhausted", message: "private", retry_after_seconds: 30 } })).toMatchObject({ kind: "capacity-exhausted", retryAfterSeconds: 30 });
    expect(decodeFailure(410, { error: { code: "query_unavailable", message: "private" } })).toMatchObject({ kind: "result-expired" });
    const failure = decodeFailure(400, { error: { code: "page_out_of_range", message: "private", details: { query_id: "retained", expires_at: "2026-10-05T15:00:00Z" } } });
    expect(failure.retainedQuery).toEqual({ queryId: "retained", expiresAt: "2026-10-05T15:00:00Z" });
    expect(failure.message).not.toContain("private");
  });
});


describe("decoded catalog reuse only (explicit synthetic policy)", () => {
  function owned() {
    const runtime = createSessionRuntime();
    runtime.setResolution({ status: "authenticated", session: { identity: { subject: "synthetic", displayName: "Synthetic" }, capabilities: { datasetIds: ["national", "facilities", "generators"], canReadNationalSeries: true, canExploreDatasets: true, canExecuteQuery: true, canRefreshDatasets: false }, expiresAt: new Date(Date.now() + 3600_000).toISOString() } });
    return { runtime, resources: createResourceRepository({ runtime, policy: syntheticResourcePolicy }) };
  }
  it("shares listing, embedded schemas and hidden national metadata while row reads repeat", async () => {
    const { runtime, resources } = owned();
    try {
      const raw = { ...previewExample(), page_size: 100, generation_id: "newer-preview", next_cursor: null, has_more: false };
      const backend = transport([example("catalog_analyst"), raw, raw, example("query_reference_free"), example("query_reference_free")]);
      const adapter = createDataAdapter(backend, beforePreviewExpiry, resources); const context = runtime.capture();
      const [listing, schema, national] = await Promise.all([adapter.listDatasets(context), adapter.readSchema(context, "national"), adapter.readNationalSeries(context, {})]);
      expect(listing.ok && schema.ok && national.ok).toBe(true);
      const again = await adapter.readSchema(context, "national"); expect(again).toEqual(schema);
      expect(await adapter.readSchema(context, "hidden")).toMatchObject({ ok: false, failure: { kind: "data-unavailable" } });
      expect(await adapter.readNationalSeries(context, {})).toEqual(national);
      await adapter.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 });
      await adapter.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 });
      const paths = backend.request.mock.calls.map((call) => call[1]);
      expect(paths.filter((path) => path === "/api/datasets")).toHaveLength(1);
      expect(paths.filter((path) => path.includes("/preview"))).toHaveLength(2);
      expect(backend.request.mock.calls.filter((call) => call[2]?.method === "POST")).toHaveLength(2);
      expect(resources.accounting().entries).toBe(1);
    } finally { resources.dispose(); runtime.dispose(); }
  });
  it("does not retain malformed catalog responses and permits deliberate retry", async () => {
    const { runtime, resources } = owned();
    try {
      const backend = transport([{ private: "invalid" }, example("catalog_viewer")]); const adapter = createDataAdapter(backend, beforePreviewExpiry, resources);
      expect(await adapter.listDatasets(runtime.capture())).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
      expect((await adapter.readSchema(runtime.capture(), "national")).ok).toBe(true);
      expect((await adapter.listDatasets(runtime.capture())).ok).toBe(true);
      expect(backend.request).toHaveBeenCalledTimes(2);
    } finally { resources.dispose(); runtime.dispose(); }
  });
  it("retains successful empty catalog and explicit invalidation fetches the next generation", async () => {
    const { runtime, resources } = owned();
    try {
      const backend = transport([{ ...example("catalog_viewer"), datasets: [] }, example("catalog_viewer")]); const adapter = createDataAdapter(backend, beforePreviewExpiry, resources);
      expect(await adapter.listDatasets(runtime.capture())).toEqual({ ok: true, value: [] });
      expect(await adapter.readSchema(runtime.capture(), "national")).toMatchObject({ ok: false, failure: { kind: "data-unavailable" } });
      expect(backend.request).toHaveBeenCalledTimes(1);
      resources.invalidate({ reason: "published-refresh", kind: "catalog" });
      expect((await adapter.readSchema(runtime.capture(), "national")).ok).toBe(true); expect(backend.request).toHaveBeenCalledTimes(2);
    } finally { resources.dispose(); runtime.dispose(); }
  });
  it("leaves repeated retained SQL page reads and preview requests uncached", async () => {
    const { runtime, resources } = owned();
    try {
      const backend = transport([example("query_reference_free"), example("query_reference_free"), { ...previewExample(), page_size: 100 }, { ...previewExample(), page_size: 100 }]);
      const adapter = createDataAdapter(backend, beforePreviewExpiry, resources); const context = runtime.capture();
      await Promise.all([adapter.readQueryPage(context, { queryId: "query-synthetic-1", page: 1, pageSize: 1 }), adapter.readQueryPage(context, { queryId: "query-synthetic-1", page: 1, pageSize: 1 })]);
      await Promise.all([adapter.startPreview(context, selection), adapter.startPreview(context, selection)]);
      expect(backend.request).toHaveBeenCalledTimes(4); expect(resources.accounting().entries).toBe(0);
    } finally { resources.dispose(); runtime.dispose(); }
  });
  it("a current unavailable dataset invalidates catalog metadata for deliberate revalidation", async () => {
    const { runtime, resources } = owned();
    try {
      const backend = transport([]); backend.request.mockResolvedValueOnce({ ok: true, value: example("catalog_viewer") }).mockResolvedValueOnce({ ok: false, failure: { kind: "data-unavailable", message: "Unavailable" } }).mockResolvedValueOnce({ ok: true, value: example("catalog_viewer") });
      const adapter = createDataAdapter(backend, beforePreviewExpiry, resources);
      await adapter.listDatasets(runtime.capture());
      expect(await adapter.startPreview(runtime.capture(), selection)).toMatchObject({ ok: false, failure: { kind: "data-unavailable" } });
      expect(resources.accounting().entries).toBe(0);
      expect((await adapter.readSchema(runtime.capture(), "national")).ok).toBe(true);
      expect(backend.request.mock.calls.filter((call) => call[1] === "/api/datasets")).toHaveLength(2);
    } finally { resources.dispose(); runtime.dispose(); }
  });

});
