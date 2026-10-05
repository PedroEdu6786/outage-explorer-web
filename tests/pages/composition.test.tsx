import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApplicationProvider, useApplication } from "../../src/composition/ApplicationProvider";
import { QueryEntry, OverviewEntry } from "../../src/composition/PageEntries";
import { acceptsIntent, navigationData } from "../../src/composition/navigation";
import { createProductionOperations } from "../../src/composition/production-operations";
import { createSessionRuntime, type SessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations } from "../fixtures/operations";

const runtimes: SessionRuntime[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); });
function setup() {
  const fixture = createFixtureOperations(); const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution()); runtimes.push(runtime);
  return { fixture, runtime };
}
it("rejects stale, unauthorized and disallowed SQL handoffs and withholds unresolved destinations", () => {
  const { runtime } = setup();
  const intent = { target: "queries" as const, generation: runtime.getSnapshot().generation, datasetId: "synthetic-facility", filters: {} };
  expect(acceptsIntent(runtime, intent)).toBe(true);
  expect(acceptsIntent(runtime, { ...intent, datasetId: "unauthorized" })).toBe(false);
  runtime.invalidate("pending");
  expect(acceptsIntent(runtime, intent)).toBe(false);
  expect(navigationData(runtime.getSnapshot(), "/query")).toEqual({ status: "pending" });
});
it("all unavailable production operations fail closed including navigation", async () => {
  const operations = createProductionOperations(); const context = { generation: 0 };
  const results = await Promise.all([
    operations.resolveSession(context), operations.beginLogin(context), operations.logout(context), operations.listDatasets(context), operations.readSchema(context, "restricted"),
    operations.readNationalSeries(context, { start: "2026-09-01", end: "2026-09-03" }),
    operations.startPreview(context, { datasetId: "restricted", filters: {}, pageSize: 100 }),
    operations.executeQuery(context, { sql: "SELECT 1", page: 1, pageSize: 1 }), operations.readQueryPage(context, { queryId: "opaque", page: 1, pageSize: 1 }),
  ]);
  for (const result of results) expect(result).toMatchObject({ ok: false, failure: { kind: "service-failure" } });
  expect(operations.consumeNavigationIntent(context, { target: "queries", datasetId: "restricted", generation: 0, filters: {} })).toMatchObject({ ok: false });
});
it("retained controller clears draft/results while SQL route is absent and discards late old-generation execution", async () => {
  const { fixture, runtime } = setup(); const go = vi.fn();
  const settings = { initialPageSize: 2, maximumPageSize: 100 };
  function Root({ query }: { query: boolean }) { return <ApplicationProvider operations={fixture.operations} runtime={runtime} path={query ? "/query" : "/overview"} go={go} querySettings={settings}>{query ? <QueryEntry /> : <OverviewEntry />}</ApplicationProvider>; }
  const view = render(<Root query />);
  await screen.findByRole("button", { name: "synthetic_facility" });
  fireEvent.change(screen.getByRole("textbox", { name: "SQL statement" }), { target: { value: "SELECT 'protected'" } });
  const delayed = fixture.deferNext("executeQuery");
  fireEvent.click(screen.getByRole("button", { name: "Run query" }));
  await screen.findByText("Executing query");
  view.rerender(<Root query={false} />);
  act(() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); });
  await act(async () => { delayed.release(); await Promise.resolve(); });
  view.rerender(<Root query />);
  await screen.findByRole("button", { name: "synthetic_national" });
  expect(screen.getByRole("textbox", { name: "SQL statement" })).toHaveValue("");
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("button", { name: "synthetic_facility" })).toBeNull();
  expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
});
it("unmounting the composition aborts and resets its owned controller", async () => {
  const { fixture, runtime } = setup(); const owned: { controller: ReturnType<typeof useApplication>["queries"] } = { controller: null };
  function Observer() { owned.controller = useApplication().queries; return <QueryEntry />; }
  const view = render(<ApplicationProvider operations={fixture.operations} runtime={runtime} path="/query" go={vi.fn()} querySettings={{ initialPageSize: 2, maximumPageSize: 100 }}><Observer /></ApplicationProvider>);
  const controller = owned.controller; if (!controller) throw new Error("Missing test controller");
  fireEvent.change(screen.getByRole("textbox", { name: "SQL statement" }), { target: { value: "SELECT 'sensitive draft'" } });
  expect(controller.getSnapshot().draft).toBe("SELECT 'sensitive draft'");
  view.unmount(); expect(controller.getSnapshot().draft).toBe(""); expect(controller.getSnapshot().result).toBeNull();
  await Promise.resolve();
});
