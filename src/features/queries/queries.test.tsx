import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { createSessionRuntime } from "../../session/session-runtime";
import { createQueriesController } from "./service";
import { QueriesFeature } from "./QueriesFeature";
import { SqlEditorPanel } from "./SqlEditorPanel";
import { SchemaBrowser } from "./SchemaBrowser";
import { QueryStatus } from "./QueryStatus";
import { QueryResults } from "./QueryResults";
import { initialQueryState } from "./query-state";
import { createDataAdapter } from "../../adapters/live/data-adapter";
import { decodeQuery } from "../../adapters/live/data-mapping";
import contractFixtures from "../../../docs/specs/web-client/contracts/data-api-v1/fixtures.json";
const cleanups: (() => void)[] = [];
afterEach(() => { cleanups.splice(0).forEach((cleanup) => { cleanup(); }); vi.useRealTimers(); });
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
  it("revokes metadata when a delayed page denial crosses expiry before the timer", async () => {
    vi.useFakeTimers(); const { fixture, runtime, controller } = setup();
    await controller.loadCatalog(); await controller.selectDataset("synthetic-national");
    controller.receiveIntent({ target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: {} });
    controller.editDraft(sql); await controller.run();
    const delayed = fixture.deferNext("readQueryPage"); fixture.failNext("readQueryPage", { kind: "forbidden", message: "Denied" });
    const pending = controller.readPage(2); vi.setSystemTime(Date.now() + 60_001);
    delayed.release(); await pending;
    expect(controller.getSnapshot()).toMatchObject({ result: null, catalog: [], schema: null, context: null, handoff: null, failure: { kind: "forbidden" } });
    expect(runtime.getSnapshot().status).toBe("authenticated");
  });

  it("keeps byte-bound validation under explicit Run and preserves the exact draft", async () => {
    const fixture = createFixtureOperations(); const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    const request = vi.fn().mockResolvedValue({ ok: false, failure: { kind: "busy", message: "Busy" } });
    const adapter = createDataAdapter({ request, isCurrent: () => true });
    const controller = createQueriesController({ runtime, operations: { ...fixture.operations, executeQuery: (...args: Parameters<typeof adapter.executeQuery>) => adapter.executeQuery(...args) }, initialPageSize: 2, maximumPageSize: 100 });
    controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
    const oversized = "😀".repeat(16_384) + "a";
    controller.editDraft(oversized); await controller.run();
    expect(request).not.toHaveBeenCalled();
    expect(controller.getSnapshot()).toMatchObject({ draft: oversized, submitted: oversized, failure: { kind: "invalid-input" } });
    const accepted = "😀".repeat(16_384);
    controller.editDraft(accepted); expect(request).not.toHaveBeenCalled(); await controller.run();
    expect(request).toHaveBeenCalledTimes(1);
    expect(request.mock.calls[0]?.[2]).toEqual({ method: "POST", body: { sql: accepted } });
    window.dispatchEvent(new Event("online")); window.dispatchEvent(new Event("focus"));
    expect(request).toHaveBeenCalledTimes(1);
  });
  it.each([["failure", false], ["rejection", false], ["failure", true], ["rejection", true]] as const)("expires late GET %s (recovery=%s) before a throttled timer can run", async (outcome, recovery) => {
    vi.useFakeTimers(); const fixture = createFixtureOperations(); const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    let release: () => void = () => { /* assigned on dispatch */ };
    const operations = { ...fixture.operations, executeQuery: async (...args: Parameters<typeof fixture.operations.executeQuery>) => {
      const response = await fixture.operations.executeQuery(...args);
      if (!recovery || !response.ok) return response;
      return { ok: false as const, failure: { kind: "invalid-input" as const, message: "Owned recovery", retainedQuery: { queryId: response.value.execution.queryId, expiresAt: response.value.execution.expiresAt, pageSize: 2 } } };
    }, readQueryPage: () => new Promise<Awaited<ReturnType<typeof fixture.operations.readQueryPage>>>((resolve, reject) => {
      release = () => { if (outcome === "rejection") reject(new Error("Lost GET")); else resolve({ ok: false, failure: { kind: "service-failure", message: "Unavailable" } }); };
    }) };
    const controller = createQueriesController({ runtime, operations, initialPageSize: 2, maximumPageSize: 100 }); controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
    controller.editDraft(sql); await controller.run(); const pending = recovery ? controller.recoverPage() : controller.readPage(2);
    vi.setSystemTime(Date.now() + 60_001); release(); await pending;
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-expired" } });
  });

  it.each(["listDatasets", "readSchema"] as const)("rejects delayed %s success after query denial", async (operation) => {
    const { fixture, controller, runtime } = setup(); await controller.loadCatalog();
    const delayed = fixture.deferNext(operation);
    const pending = operation === "listDatasets" ? controller.loadCatalog() : controller.selectDataset("synthetic-national");
    controller.editDraft(sql); fixture.failNextExecution({ kind: "forbidden", message: "Denied" }); await controller.run();
    delayed.release(); await pending;
    expect(controller.getSnapshot()).toMatchObject({ result: null, catalog: [], schema: null, schemaPending: false, catalogPending: false, submitted: null });
    expect(runtime.getSnapshot().status).toBe("authenticated");
  });
  it("expires idle route-persistent results at the original deadline without SQL replay", async () => {
    vi.useFakeTimers();
    const { fixture, controller, runtime } = setup();
    controller.editDraft(sql); await controller.run();
    const first = controller.getSnapshot().result;
    await vi.advanceTimersByTimeAsync(30_000); await controller.readPage(2);
    expect(controller.getSnapshot().result?.execution.expiresAt).toBe(first?.execution.expiresAt);
    const view = render(<QueriesFeature runtime={runtime} operations={fixture.operations} controller={controller} initialPageSize={2} maximumPageSize={100} />);
    view.unmount();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(controller.getSnapshot()).toMatchObject({ result: null, activity: "failure", failure: { kind: "result-expired" }, draft: sql });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    render(<QueriesFeature runtime={runtime} operations={fixture.operations} controller={controller} initialPageSize={2} maximumPageSize={100} />);
    expect(screen.getByRole("button", { name: "Run query" })).toBeEnabled();
    expect(screen.queryByRole("table", { name: "SQL query results" })).not.toBeInTheDocument();
  });
  it("rejects delayed pages and checks absolute deadlines on browser resume", async () => {
    vi.useFakeTimers();
    const { controller, fixture } = setup(); controller.editDraft(sql); await controller.run();
    const delayed = fixture.deferNext("readQueryPage"); const pending = controller.readPage(2);
    vi.setSystemTime(Date.now() + 60_001);
    delayed.release(); await pending;
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-expired" } });
    await controller.run(); vi.setSystemTime(Date.now() + 60_001);
    document.dispatchEvent(new Event("visibilitychange"));
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-expired" } });
    window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online"));
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(2);
    await controller.run(); vi.setSystemTime(Date.now() + 60_001);
    window.dispatchEvent(new Event("pageshow"));
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-expired" } });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(3);
  });
  it("cancels replaced and disposed deadlines", async () => {
    vi.useFakeTimers(); const { controller, fixture } = setup();
    controller.editDraft(sql); await controller.run();
    await vi.advanceTimersByTimeAsync(30_000); await controller.run();
    const replacement = controller.getSnapshot().result;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(controller.getSnapshot().result).toBe(replacement);
    expect(vi.getTimerCount()).toBe(2); // one session and one result deadline
    controller.dispose(); expect(vi.getTimerCount()).toBe(1);
    await vi.advanceTimersByTimeAsync(30_000);
    window.dispatchEvent(new Event("focus"));
    expect(controller.getSnapshot()).toEqual(initialQueryState(2));
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(2);
  });
  it("expires owned recovery and rejects recovery that arrives after its deadline", async () => {
    vi.useFakeTimers();
    const fixture = createFixtureOperations(); const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    const operations = { ...fixture.operations, executeQuery: async (...args: Parameters<typeof fixture.operations.executeQuery>) => {
      const response = await fixture.operations.executeQuery(...args);
      if (!response.ok) return response;
      return { ok: false as const, failure: { kind: "invalid-input" as const, message: "Owned recovery", retainedQuery: { queryId: response.value.execution.queryId, expiresAt: response.value.execution.expiresAt, pageSize: 2 } } };
    } };
    const controller = createQueriesController({ runtime, operations, initialPageSize: 2, maximumPageSize: 100 }); controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
    controller.editDraft(sql); await controller.run();
    const delayed = fixture.deferNext("readQueryPage"); const pending = controller.recoverPage();
    vi.setSystemTime(Date.now() + 60_001); delayed.release(); await pending;
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-expired" } });
    expect(controller.getSnapshot().failure).not.toHaveProperty("retainedQuery");
    await controller.run(); await vi.advanceTimersByTimeAsync(60_000);
    expect(controller.getSnapshot().failure?.kind).toBe("result-expired");
    await controller.recoverPage();
    expect(fixture.callLog.read().filter((call) => call.operation === "readQueryPage")).toHaveLength(1);
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(2);
  });

  it.each(["listDatasets", "readSchema"] as const)("revokes delayed Run/page/recovery publication after %s denial", async (metadataOperation) => {
    for (const activity of ["run", "page", "recovery"] as const) {
      const fixture = createFixtureOperations();
      const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
      const operations = { ...fixture.operations, executeQuery: async (...args: Parameters<typeof fixture.operations.executeQuery>) => {
        const response = await fixture.operations.executeQuery(...args);
        if (activity !== "recovery" || !response.ok) return response;
        return { ok: false as const, failure: { kind: "invalid-input" as const, message: "Owned recovery", retainedQuery: { queryId: response.value.execution.queryId, expiresAt: response.value.execution.expiresAt, pageSize: 2 } } };
      } };
      const controller = createQueriesController({ runtime, operations, initialPageSize: 2, maximumPageSize: 100 });
      controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
      await controller.loadCatalog(); await controller.selectDataset("synthetic-national");
      controller.receiveIntent({ target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: {} });
      controller.editDraft(sql);
      if (activity !== "run") await controller.run();
      const delayed = fixture.deferNext(activity === "run" ? "executeQuery" : "readQueryPage");
      const pending = activity === "run" ? controller.run() : activity === "page" ? controller.readPage(2) : controller.recoverPage();
      fixture.failNext(metadataOperation, { kind: "forbidden", message: "Denied" });
      await (metadataOperation === "listDatasets" ? controller.loadCatalog() : controller.selectDataset("synthetic-national"));
      delayed.release(); await pending;
      expect(controller.getSnapshot()).toMatchObject({ result: null, submitted: null, catalog: [], schema: null, context: null, handoff: null, draft: sql });
      expect(controller.getSnapshot().failure).not.toHaveProperty("retainedQuery");
      expect(controller.getSnapshot()).toMatchObject({ result: null, activity: "failure", failure: { kind: "forbidden" } });
      expect(runtime.getSnapshot().status).toBe("authenticated");
      expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    }
  });

  it.each([null, "<img src=x onerror=alert(1)>"])("renders generation %s honestly as inert result header text", (generationId) => {
    const example = contractFixtures.fixtures.find((fixture) => fixture.name === "query_reference_free");
    if (!example) throw new Error("Missing reference-free contract example");
    const result = decodeQuery({ ...example.body, generation_id: generationId });
    const { container } = render(<QueryResults state={{ ...initialQueryState(1), result, activity: "success", submitted: "SELECT 1", draft: "SELECT 1" }} onPage={() => { /* no interaction in header assertion */ }} />);
    const expected = generationId === null ? "Reference-free execution" : `Snapshot: ${generationId}`;
    expect(screen.getByText((_, element) => element?.textContent === `${expected} · 2 retained rows · Expires 2026-10-05T12:15:00Z`)).toBeVisible();
    expect(container.querySelector("img, script")).toBeNull();
    if (generationId === null) expect(container.textContent).not.toContain("Snapshot:");
  });

  it("preserves null generation across retained pages and rejects a changed generation without replay", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    let changedGeneration = false;
    const operations = {
      ...fixture.operations,
      executeQuery: async (...args: Parameters<typeof fixture.operations.executeQuery>) => {
        const result = await fixture.operations.executeQuery(...args);
        return result.ok ? { ok: true as const, value: { ...result.value, execution: { ...result.value.execution, snapshotId: null } } } : result;
      },
      readQueryPage: async (...args: Parameters<typeof fixture.operations.readQueryPage>) => {
        const result = await fixture.operations.readQueryPage(...args);
        return result.ok ? { ok: true as const, value: { ...result.value, execution: { ...result.value.execution, snapshotId: changedGeneration ? "unexpected-generation" : null } } } : result;
      },
    };
    const controller = createQueriesController({ runtime, operations, initialPageSize: 2, maximumPageSize: 100 });
    controller.attach(); cleanups.push(() => { controller.dispose(); runtime.dispose(); });
    controller.editDraft(sql); await controller.run();
    const retained = controller.getSnapshot().result?.execution;
    await controller.readPage(2);
    expect(controller.getSnapshot().result?.execution).toEqual(retained);
    expect(retained?.snapshotId).toBeNull();
    changedGeneration = true;
    await controller.readPage(1);
    expect(controller.getSnapshot()).toMatchObject({ result: null, failure: { kind: "result-lost" } });
    expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  });
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

  describe("paging dim (FR4, AC3, AC5)", () => {
    const dimmed = () => document.querySelector("[inert][aria-busy=true]");
    async function pagingFeature() {
      const { fixture, runtime } = setup(); render(<QueriesFeature runtime={runtime} operations={fixture.operations} initialPageSize={2} maximumPageSize={100} />);
      fireEvent.change(screen.getByRole("textbox", { name: "SQL statement" }), { target: { value: sql } }); fireEvent.click(screen.getByRole("button", { name: "Run query" }));
      await screen.findByText("Query succeeded");
      const cells = () => Array.from(screen.getByRole("table", { name: "SQL query results" }).querySelectorAll("td")).map((cell) => cell.textContent);
      return { fixture, runtime, firstPage: cells() };
    }
    it("dims the retained page and hides it from assistive technology only while paging, without changing cells", async () => {
      const { fixture, firstPage } = await pagingFeature();
      expect(dimmed()).toBeNull();
      const hold = fixture.deferNext("readQueryPage");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => { expect(dimmed()).not.toBeNull(); });
      const stale = dimmed();
      expect(stale).toHaveAttribute("aria-hidden", "true");
      expect(Array.from(stale?.querySelectorAll("td") ?? []).map((cell) => cell.textContent)).toEqual(firstPage);
      expect(screen.queryByRole("table", { name: "SQL query results" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
      expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
      await act(async () => { hold.release(); await Promise.resolve(); });
      await waitFor(() => { expect(dimmed()).toBeNull(); });
      await screen.findByText(/^Page 2 of/);
      expect(screen.getByRole("table", { name: "SQL query results" }).closest("[aria-busy=true]")).toBeNull();
      expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
    });
    it.each([["logout", "unauthenticated"], ["expiry", "expired"], ["access change", "pending"]] as const)("removes the dimmed result on %s during paging and a late page does not restore it", async (_name, reason) => {
      const { fixture, runtime } = await pagingFeature();
      const hold = fixture.deferNext("readQueryPage");
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => { expect(dimmed()).not.toBeNull(); });
      act(() => { runtime.invalidate(reason); });
      expect(dimmed()).toBeNull();
      expect(document.querySelector("table")).toBeNull();
      expect(screen.queryByText("Retained query results")).not.toBeInTheDocument();
      expect(screen.queryByRole("region", { name: "Retained query results" })).not.toBeInTheDocument();
      await act(async () => { hold.release(); await Promise.resolve(); });
      expect(dimmed()).toBeNull();
      expect(document.querySelector("table")).toBeNull();
      expect(screen.queryByRole("region", { name: "Retained query results" })).not.toBeInTheDocument();
    });
    it("removes the dimmed result when paging is forbidden mid-flight", async () => {
      const { fixture } = await pagingFeature();
      const hold = fixture.deferNext("readQueryPage"); fixture.failNext("readQueryPage", { kind: "forbidden", message: "Synthetic denial" });
      fireEvent.click(screen.getByRole("button", { name: "Next" }));
      await waitFor(() => { expect(dimmed()).not.toBeNull(); });
      await act(async () => { hold.release(); await Promise.resolve(); });
      await waitFor(() => { expect(dimmed()).toBeNull(); });
      expect(document.querySelector("table")).toBeNull();
    });
  });
});


describe("Query motion keeps interactions immediate", () => {
  it("swaps Copy for 1.5 seconds, restarts its single timer and cleans up on unmount", async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const props = { draft: "SELECT 1", onChange: vi.fn(), onRun: vi.fn(), busy: false, disabled: false };
    const view = render(<SqlEditorPanel {...props} />);
    const button = screen.getByRole("button", { name: "Copy" });
    const copyIcon = button.querySelector("svg")?.innerHTML;
    await act(async () => { fireEvent.click(button); await Promise.resolve(); });
    expect(screen.getByRole("status")).toHaveTextContent("SQL copied");
    expect(button.querySelector("svg")?.innerHTML).not.toBe(copyIcon);
    const check = button.querySelector("svg")?.innerHTML;
    act(() => { vi.advanceTimersByTime(1000); });
    await act(async () => { fireEvent.click(button); await Promise.resolve(); });
    act(() => { vi.advanceTimersByTime(1499); });
    expect(button.querySelector("svg")?.innerHTML).toBe(check);
    act(() => { vi.advanceTimersByTime(1); });
    expect(button.querySelector("svg")?.innerHTML).toBe(copyIcon);
    await act(async () => { fireEvent.click(button); await Promise.resolve(); });
    view.unmount(); expect(vi.getTimerCount()).toBe(0);
  });

  it("retains the clipboard failure message and removes the busy bar immediately", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("Unavailable")) } });
    const props = { draft: "SELECT 1", onChange: vi.fn(), onRun: vi.fn(), busy: true, disabled: false };
    const view = render(<SqlEditorPanel {...props} />);
    expect(view.container.querySelector(".animate-progress")?.parentElement).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    await screen.findByText("Copy unavailable. Select the SQL text to copy.");
    view.rerender(<SqlEditorPanel {...props} busy={false} />);
    expect(view.container.querySelector(".animate-progress")).toBeNull();
  });

  it("rotates a decorative chevron and removes collapsed schema in the same render", async () => {
    const { controller } = setup(); await controller.loadCatalog(); await controller.selectDataset("synthetic-national");
    const props = { onSelect: vi.fn(), onReload: vi.fn() };
    const view = render(<SchemaBrowser {...props} state={controller.getSnapshot()} />);
    const button = screen.getByRole("button", { name: "synthetic_national" });
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(button.querySelector(".motion-chevron")).toHaveClass("rotate-90");
    expect(button.querySelector(".motion-chevron")).toHaveAttribute("aria-hidden", "true");
    expect(view.container.querySelector(".animate-expand")).not.toBeNull();
    view.rerender(<SchemaBrowser {...props} state={{ ...controller.getSnapshot(), selectedDataset: null, schema: null }} />);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(view.container.querySelector(".animate-expand")).toBeNull();
    expect(screen.queryByText("Schema labels are a reference; no SQL is inserted or run.")).toBeNull();
  });

  it("keeps QueryStatus live-region identity from running to success", async () => {
    const { controller } = setup(); controller.editDraft(sql);
    const view = render(<QueryStatus state={{ ...controller.getSnapshot(), activity: "running" }} />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Executing query");
    await controller.run(); view.rerender(<QueryStatus state={controller.getSnapshot()} />);
    expect(screen.getByRole("status")).toBe(region);
    expect(region).toHaveTextContent("Query succeeded");
  });
});
