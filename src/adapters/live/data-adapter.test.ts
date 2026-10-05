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
  it("accepts declared successful query examples except the documented inconsistent row-limit fixture", () => {
    for (const fixture of fixtures.fixtures.filter((item) => item.schema === "QueryResult")) {
      if (fixture.name === "query_row_limit") expect(() => decodeQuery(fixture.body)).toThrow("Inconsistent row-limit");
      else expect(() => decodeQuery(fixture.body)).not.toThrow();
    }
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
    const result = await createDataAdapter(backend).readNationalSeries(context, {});
    expect(result).toMatchObject({ ok: true, value: { observations: [{ date: "2026-09-30" }, { date: "2026-10-01" }] } });
    expect(backend.request.mock.calls.map((call) => call[1])).toEqual(["/api/datasets", "/api/datasets/national/preview?page_size=100", "/api/datasets/national/preview?cursor=next"]);
    expect(backend.request.mock.calls.every((call) => call[2] === undefined)).toBe(true);
  });
  it("does not publish a partial chart after generation change or failed continuation", async () => {
    const raw = previewExample();
    const backend = transport([example("catalog_viewer"), { ...raw, page_size: 100, page_cursor: "first", next_cursor: "next", has_more: true }, { ...raw, page_size: 100, generation_id: "different", page_cursor: "next", next_cursor: null, has_more: false }]);
    expect(await createDataAdapter(backend).readNationalSeries(context, {})).toMatchObject({ ok: false });
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
