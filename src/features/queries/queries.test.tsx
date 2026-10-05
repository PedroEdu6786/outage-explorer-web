import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { createSessionRuntime } from "../../session/session-runtime";
import { createQueriesController } from "./service";
import { QueriesFeature } from "./QueriesFeature";
const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach((cleanup) => { cleanup(); }); });
function setup(options: Parameters<typeof createFixtureOperations>[0] = {}) {
  const fixture = createFixtureOperations(options);
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  const controller = createQueriesController({ runtime, operations: fixture.operations, initialPageSize: 2, maximumPageSize: 100, ...(options.now ? { now: options.now } : {}) });
  controller.attach();
  cleanups.push(() => { controller.dispose(); runtime.dispose(); });
  return { fixture, runtime, controller };
}
const sql = "  WITH x AS (SELECT * FROM synthetic_national)\nSELECT * FROM x;\n";
describe("Queries explicit execution lifecycle", () => {
  it("keeps unchanged submission and fixed ID/size across edit, pages, focus/reconnect, expiry and explicit rerun", async () => {
    let now = Date.now();
    const { controller, fixture } = setup({ now: () => now });
    controller.editDraft(sql);
    await controller.run();
    const first = controller.getSnapshot().result;
    expect(first).not.toBeNull();
    controller.editDraft("SELECT 'edited'");
    controller.setPageSize(3);
    await controller.readPage(2);
    await controller.readPage(1);
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
    expect(controller.getSnapshot().submitted).toBe(sql);
    const calls = fixture.callLog.read();
    expect(calls.filter((call) => call.operation === "executeQuery").map((call) => call.input)).toEqual([{ sql, page: 1, pageSize: 2 }]);
    expect(calls.filter((call) => call.operation === "readQueryPage").map((call) => call.input)).toEqual([2, 1].map((page) => ({ queryId: first?.execution.queryId, page, pageSize: 2 })));
    now += 60_001;
    await controller.readPage(2);
    expect(controller.getSnapshot()).toMatchObject({ result: null, activity: "failure", failure: { kind: "result-expired" }, draft: "SELECT 'edited'" });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    await controller.run();
    expect(controller.getSnapshot().result?.execution.queryId).not.toBe(first?.execution.queryId);
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery").at(-1)?.input).toEqual({ sql: "SELECT 'edited'", page: 1, pageSize: 3 });
  });
  it("preserves unknown response and requires a separate explicit run", async () => {
    const { fixture, controller } = setup();
    fixture.failNextExecution({ kind: "unknown-execution-outcome", message: "Lost response" });
    controller.editDraft(sql); await controller.run();
    expect(controller.getSnapshot()).toMatchObject({ draft: sql, submitted: sql, result: null, failure: { kind: "unknown-execution-outcome" } });
    await controller.readPage(1);
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    await controller.run();
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(2);
  });
  it("recovers an owned first page after an execution error with GET only and its captured size", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    const operations = { ...fixture.operations, executeQuery: async (...args: Parameters<typeof fixture.operations.executeQuery>) => {
      const response = await fixture.operations.executeQuery(...args);
      if (!response.ok) return response;
      return { ok: false as const, failure: { kind: "invalid-input" as const, message: "Requested page unavailable", retainedQuery: { queryId: response.value.execution.queryId, expiresAt: response.value.execution.expiresAt, pageSize: response.value.execution.pageSize } } };
    } };
    const controller = createQueriesController({ runtime, operations, initialPageSize: 2, maximumPageSize: 100 });
    controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
    controller.editDraft(sql); await controller.run();
    expect(controller.getSnapshot().result).toBeNull();
    controller.setPageSize(5);
    fixture.failNext("readQueryPage", { kind: "service-failure", message: "Retry later" });
    await controller.recoverPage();
    expect(controller.getSnapshot().failure).toMatchObject({ retainedQuery: { pageSize: 2 } });
    await controller.recoverPage();
    expect(controller.getSnapshot().result).toMatchObject({ page: 1, execution: { pageSize: 2 } });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    expect(fixture.callLog.read().filter((call) => call.operation === "readQueryPage").map((call) => call.input)).toEqual([
      { queryId: "synthetic-query-1", page: 1, pageSize: 2 }, { queryId: "synthetic-query-1", page: 1, pageSize: 2 },
    ]);
  });
  it("clears lost results without silently returning page 1 or executing", async () => {
    const { fixture, controller } = setup(); controller.editDraft(sql); await controller.run(); await controller.readPage(2); fixture.loseResults(); await controller.readPage(1);
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-lost" } });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  });
  it.each(["busy", "execution-timeout", "unsupported-sql", "data-unavailable"] as const)("keeps %s distinct and never retries automatically", async (kind) => {
    const { fixture, controller } = setup(); fixture.failNextExecution({ kind, message: "Synthetic failure" }); controller.editDraft(sql); await controller.run();
    expect(controller.getSnapshot().failure?.kind).toBe(kind);
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  });
  it("rejects old-session successes and errors while a new Viewer owns the metadata", async () => {
    const { fixture, controller, runtime } = setup();
    const late = fixture.deferNext("executeQuery"); controller.editDraft(sql); const running = controller.run();
    fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); await controller.loadCatalog(); late.release(); await running;
    expect(controller.getSnapshot().result).toBeNull(); expect(controller.getSnapshot().draft).toBe(""); expect(controller.getSnapshot().catalog.map((item) => item.grain)).toEqual(["national"]);
    const stale = fixture.deferNext("readSchema"); fixture.failNext("readSchema", { kind: "unauthenticated", message: "Old identity" }); const schema = controller.selectDataset("synthetic-national");
    runtime.setResolution(fixture.sessionResolution()); await controller.loadCatalog(); stale.release(); await schema;
    expect(runtime.getSnapshot().status).toBe("authenticated"); expect(controller.getSnapshot().metadataFailure).toBeNull();
  });
  it("ignores obsolete schema selection and disposed responses", async () => {
    const { fixture, controller } = setup(); await controller.loadCatalog(); const late = fixture.deferNext("readSchema"); const old = controller.selectDataset("synthetic-facility"); await controller.selectDataset("synthetic-national"); late.release(); await old;
    expect(controller.getSnapshot().schema?.datasetId).toBe("synthetic-national");
    const catalogDelay = fixture.deferNext("listDatasets"); const catalog = controller.loadCatalog(); controller.dispose(); catalogDelay.release(); await catalog;
    expect(controller.getSnapshot().catalog).toEqual([]);
  });
  it("authorizes handoffs, confirms edited replacements, preserves context and never runs", () => {
    const { controller, fixture, runtime } = setup(); controller.editDraft("my edited text");
    const intent = { target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: { dates: { start: "2026-09-01", end: "2026-09-03" } } } as const;
    controller.receiveIntent(intent); expect(controller.getSnapshot().draft).toBe("my edited text"); expect(controller.getSnapshot().handoff).not.toBeNull(); controller.confirmHandoff();
    expect(controller.getSnapshot().draft).toBe("SELECT * FROM synthetic_national"); expect(controller.getSnapshot().context?.filters).toEqual(intent.filters);
    expect(fixture.callLog.read().some((call) => call.operation === "executeQuery")).toBe(false);
    runtime.invalidate(); controller.confirmHandoff(); controller.receiveIntent(intent); expect(controller.getSnapshot().context).toBeNull();
  });
  it("clears currently denied metadata/context and ignores obsolete catalog denial in the same session", async () => {
    const { fixture, controller, runtime } = setup(); await controller.loadCatalog(); await controller.selectDataset("synthetic-national");
    controller.receiveIntent({ target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: {} });
    fixture.failNext("readSchema", { kind: "forbidden", message: "Access removed" }); await controller.selectDataset("synthetic-national");
    expect(controller.getSnapshot()).toMatchObject({ catalog: [], schema: null, context: null, handoff: null, selectedDataset: null });
    await controller.loadCatalog(); await controller.selectDataset("synthetic-national"); controller.editDraft(sql); fixture.failNextExecution({ kind: "forbidden", message: "Query denied" }); await controller.run();
    expect(controller.getSnapshot()).toMatchObject({ catalog: [], schema: null, result: null, context: null, handoff: null });
    const pause = fixture.deferNext("listDatasets"); fixture.failNext("listDatasets", { kind: "unauthenticated", message: "Obsolete failure" }); const obsolete = controller.loadCatalog(); await controller.loadCatalog(); pause.release(); await obsolete;
    expect(runtime.getSnapshot().status).toBe("authenticated"); expect(controller.getSnapshot().catalog).toHaveLength(3); expect(controller.getSnapshot().metadataFailure).toBeNull();
  });
  it("renders duplicate positional values, exact large numbers, truncation on short page and literal source text", async () => {
    const { fixture, runtime } = setup({ dataState: "truncated" });
    render(<QueriesFeature runtime={runtime} operations={fixture.operations} initialPageSize={2} maximumPageSize={100} />);
    fireEvent.change(screen.getByRole("textbox", { name: "SQL statement" }), { target: { value: sql } }); fireEvent.click(screen.getByRole("button", { name: "Run query" }));
    await screen.findByText("Query succeeded"); const table = screen.getByRole("table", { name: "SQL query results" }); expect(within(table).getAllByRole("columnheader", { name: "value" })).toHaveLength(2); expect(within(table).getAllByText("9007199254740993")).toHaveLength(2); expect(within(table).getAllByText("00A7")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Next" })); await screen.findByText("Page 2 of 2 · Fixed 2 rows per page"); expect(screen.getByText("Whole execution truncated")).toBeVisible(); expect(screen.getByText("<script>synthetic text only</script>")).toBeVisible(); expect(table.querySelector("script")).toBeNull();
  });
  it("submits one keyboard activation including repeat suppression and withholds pending protected data", async () => {
    const { fixture, runtime } = setup(); render(<QueriesFeature runtime={runtime} operations={fixture.operations} initialPageSize={2} maximumPageSize={100} />);
    const editor = screen.getByRole("textbox", { name: "SQL statement" }); fireEvent.change(editor, { target: { value: sql } }); fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true }); fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true, repeat: true }); await screen.findByText("Query succeeded");
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    act(() => { runtime.invalidate("pending"); }); await waitFor(() => { expect(screen.queryByRole("textbox", { name: "SQL statement" })).not.toBeInTheDocument(); }); expect(screen.queryByText("9007199254740993")).not.toBeInTheDocument();
  });
});
