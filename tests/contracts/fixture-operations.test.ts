import { describe, expect, it } from "vitest";
import type { OperationResult } from "../../src/contracts/failures";
import type { OperationContext } from "../../src/contracts/session";
import { createFixtureOperations } from "../fixtures/operations";
import { syntheticSettings } from "../fixtures/scenarios";

const context: OperationContext = { generation: 1 };
const selection = { datasetId: "synthetic-national", filters: {}, pageSize: 1 };
function value<T, F>(result: OperationResult<T, F>): T {
  if (!result.ok) throw new Error("Expected successful fixture result");
  return result.value;
}

describe("shared synthetic operation behavior", () => {
  it.each(["viewer", "analyst", "admin"] as const)("returns role-authorized metadata for %s", async (persona) => {
    const fixture = createFixtureOperations({ persona });
    const datasets = value(await fixture.operations.listDatasets(context));
    expect(datasets.map((item) => item.grain)).toEqual(persona === "viewer" ? ["national"] : ["national", "facility", "generator"]);
    const schema = await fixture.operations.readSchema(context, "synthetic-facility");
    if (persona === "viewer") expect(schema).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    else expect(value(schema).columns.some((column) => column.kind === "identifier")).toBe(true);
  });

  it("denies Viewer direct detail preview and predetermined detail query scope", async () => {
    const fixture = createFixtureOperations({ persona: "viewer", queryDatasetIds: ["synthetic-facility"] });
    expect(await fixture.operations.startPreview(context, { ...selection, datasetId: "synthetic-facility" })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    expect(await fixture.operations.executeQuery(context, { sql: "synthetic projection", page: 1, pageSize: 2 })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
  });

  it("preserves original snapshot and expiry through publication, then expires", async () => {
    let now = Date.now();
    const fixture = createFixtureOperations({ now: () => now });
    const first = value(await fixture.operations.startPreview(context, selection));
    if (!first.nextCursor) throw new Error("Expected fixture cursor");
    fixture.publishSnapshot();
    now += 100;
    const second = value(await fixture.operations.continuePreview(context, { sequence: first.sequence, cursor: first.nextCursor }));
    expect(second.sequence).toEqual(first.sequence);
    const fresh = value(await fixture.operations.startPreview(context, selection));
    expect(fresh.sequence.snapshotId).not.toBe(first.sequence.snapshotId);
    now = Date.parse(first.sequence.expiresAt);
    expect(await fixture.operations.continuePreview(context, { sequence: first.sequence, cursor: first.nextCursor })).toMatchObject({ ok: false, failure: { kind: "preview-expired" } });
  });

  it("rejects changed filters/size on a cursor and old caller cursors after access changes", async () => {
    const fixture = createFixtureOperations();
    const first = value(await fixture.operations.startPreview(context, { ...selection, datasetId: "synthetic-facility" }));
    if (!first.nextCursor) throw new Error("Expected fixture cursor");
    expect(await fixture.operations.continuePreview(context, { sequence: { ...first.sequence, selection: { ...first.sequence.selection, pageSize: 2 } }, cursor: first.nextCursor })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    fixture.setPersona("viewer");
    expect(await fixture.operations.continuePreview(context, { sequence: first.sequence, cursor: first.nextCursor })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
  });

  it("distinguishes zero, missing dates, nulls and half-up decimal ties without shifting dates", async () => {
    const fixture = createFixtureOperations();
    const series = value(await fixture.operations.readNationalSeries(context, { start: "2026-09-01", end: "2026-09-04" }));
    expect(series.observations[0]).toMatchObject({ date: "2026-09-01", reportedPercentage: { exact: "1.005", display: "1.01" } });
    expect(series.observations[1]).toEqual({ status: "unavailable", date: "2026-09-02" });
    expect(series.observations[2]).toMatchObject({ outageMw: { exact: "0" }, calculatedPercentage: { display: "0.00" } });
    expect(series.observations[3]).toMatchObject({ capacityMw: null, outageMw: null });
    const narrowed = value(await fixture.operations.readNationalSeries(context, { start: "2026-09-03", end: "2026-09-03" }));
    expect(narrowed.observations).toHaveLength(1);
  });

  it("applies authorized date/facility preview filters and rejects unsupported choices", async () => {
    const fixture = createFixtureOperations();
    const filtered = value(await fixture.operations.startPreview(context, { datasetId: "synthetic-facility", filters: { dates: { start: "2026-09-03", end: "2026-09-03" }, facilityId: "0012" }, pageSize: 10 }));
    expect(filtered.table.rows).toHaveLength(1);
    expect(filtered.table.rows[0]?.cells[5]).toEqual({ kind: "identifier", value: "0012" });
    const absentFacility = value(await fixture.operations.startPreview(context, { datasetId: "synthetic-facility", filters: { facilityId: "A07" }, pageSize: 10 }));
    expect(absentFacility.table.rows).toEqual([]);
    expect(await fixture.operations.startPreview(context, { ...selection, filters: { facilityId: "0012" } })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
  });

  it("uses one unchanged execution for next/previous pages and keeps whole-result truncation", async () => {
    const fixture = createFixtureOperations({ dataState: "truncated" });
    const sql = "SELECT value, value FROM synthetic_national\n-- retain text unchanged";
    const first = value(await fixture.operations.executeQuery(context, { sql, page: 1, pageSize: 2 }));
    const request = { queryId: first.execution.queryId, page: 2, pageSize: 2 };
    const second = value(await fixture.operations.readQueryPage(context, request));
    const previous = value(await fixture.operations.readQueryPage(context, { ...request, page: 1 }));
    expect(second.execution).toEqual(first.execution);
    expect(second.table.rows).toHaveLength(1);
    expect(second.execution.truncation.truncated).toBe(true);
    expect(previous.table).toEqual(first.table);
    const calls = fixture.callLog.read();
    expect(calls.filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    expect(calls[0]?.input).toEqual({ sql, page: 1, pageSize: 2 });
    expect(calls.filter((call) => call.operation === "readQueryPage").every((call) => !Object.hasOwn(call.input as object, "sql"))).toBe(true);
  });

  it("requires fixed size and explicit new execution, never recovers lost results automatically", async () => {
    const fixture = createFixtureOperations();
    const input = { sql: "synthetic unchanged", page: 1, pageSize: 2 };
    const first = value(await fixture.operations.executeQuery(context, input));
    expect(await fixture.operations.readQueryPage(context, { queryId: first.execution.queryId, page: 1, pageSize: 1 })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    fixture.loseResults();
    expect(await fixture.operations.readQueryPage(context, { queryId: first.execution.queryId, page: 1, pageSize: 2 })).toMatchObject({ ok: false, failure: { kind: "result-lost" } });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    const rerun = value(await fixture.operations.executeQuery(context, input));
    expect(rerun.execution.queryId).not.toBe(first.execution.queryId);
  });

  it("expires retained results and rejects pages from a previous caller", async () => {
    let now = Date.now();
    const fixture = createFixtureOperations({ now: () => now });
    const first = value(await fixture.operations.executeQuery(context, { sql: "synthetic", page: 1, pageSize: 2 }));
    const input = { queryId: first.execution.queryId, page: 1, pageSize: 2 };
    now += syntheticSettings.queryLifetimeMs;
    expect(await fixture.operations.readQueryPage(context, input)).toMatchObject({ ok: false, failure: { kind: "result-expired" } });
    fixture.setPersona("viewer");
    expect(await fixture.operations.readQueryPage(context, input)).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
  });

  it("returns unknown execute outcome without fabricating an ID or replay", async () => {
    const fixture = createFixtureOperations();
    fixture.failNextExecution({ kind: "unknown-execution-outcome", message: "Synthetic lost response" });
    expect(await fixture.operations.executeQuery(context, { sql: "synthetic", page: 1, pageSize: 2 })).toEqual({ ok: false, failure: { kind: "unknown-execution-outcome", message: "Synthetic lost response" } });
    expect(fixture.callLog.read()).toHaveLength(1);
  });

  it("separates empty matches, absent data, busy and confirmed timeout", async () => {
    const fixture = createFixtureOperations({ dataState: "empty" });
    expect(value(await fixture.operations.startPreview(context, selection)).table.rows).toEqual([]);
    fixture.setDataState("unavailable");
    expect(await fixture.operations.startPreview(context, selection)).toMatchObject({ ok: false, failure: { kind: "data-unavailable" } });
    for (const kind of ["busy", "execution-timeout"] as const) {
      fixture.failNextExecution({ kind, message: "Synthetic failure" });
      expect(await fixture.operations.executeQuery(context, { sql: "synthetic", page: 1, pageSize: 2 })).toMatchObject({ ok: false, failure: { kind } });
    }
  });

  it("prepares only authorized unsent intents and rejects restricted filters or stale context", () => {
    const fixture = createFixtureOperations({ persona: "viewer" });
    const intent = { target: "queries" as const, generation: 1, datasetId: "synthetic-national", filters: {} };
    expect(value(fixture.operations.consumeNavigationIntent(context, intent))).toMatchObject({ proposedDraft: "SELECT * FROM synthetic_national" });
    expect(fixture.operations.consumeNavigationIntent(context, { ...intent, filters: { facilityId: "0012" } })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    expect(fixture.operations.consumeNavigationIntent(context, { ...intent, datasetId: "synthetic-facility" })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    expect(fixture.operations.consumeNavigationIntent(context, { ...intent, generation: 0 })).toMatchObject({ ok: false, failure: { kind: "forbidden" } });
    expect(fixture.operations.consumeNavigationIntent(context, { ...intent, filters: { dates: { start: "2026-09-04", end: "2026-09-01" } } })).toMatchObject({ ok: false, failure: { kind: "invalid-input" } });
    expect(fixture.callLog.read().some((call) => call.operation === "executeQuery")).toBe(false);
  });

  it("exercises logout, explicit login and session resolution without real auth claims", async () => {
    const fixture = createFixtureOperations();
    await fixture.operations.logout(context);
    expect(value(await fixture.operations.resolveSession(context)).status).toBe("unauthenticated");
    expect(await fixture.operations.listDatasets(context)).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
    await fixture.operations.beginLogin(context);
    expect(value(await fixture.operations.resolveSession(context)).status).toBe("authenticated");
    expect(fixture.callLog.read().map((call) => call.operation)).toEqual(["logout", "resolveSession", "listDatasets", "beginLogin", "resolveSession"]);
  });
});
