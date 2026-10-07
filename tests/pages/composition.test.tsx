import { FixtureProvider, useFixtureController } from "../fixtures/FixtureProvider";
import { StrictMode } from "react";
import { createCatalogCache } from "../../src/resources/catalog-cache";
import { syntheticCatalogCachePolicy } from "../fixtures/operations";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ApplicationProvider, useApplication } from "../../src/composition/ApplicationProvider";
import { QueryEntry, OverviewEntry, ProtectedLayout } from "../../src/composition/PageEntries";
import { acceptsIntent, canAccessPath, navigationData } from "../../src/composition/navigation";
import { createProductionOperations } from "../../src/composition/production-operations";
import { createSessionRuntime, type SessionRuntime } from "../../src/session/session-runtime";
import { createFixtureOperations } from "../fixtures/operations";

const runtimes: SessionRuntime[] = [];
afterEach(() => { runtimes.splice(0).forEach((runtime) => { runtime.dispose(); }); vi.unstubAllGlobals(); });
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
  await screen.findByText("Query access denied");
  expect(screen.queryByRole("textbox", { name: "SQL statement" })).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByRole("button", { name: "synthetic_facility" })).toBeNull();
  expect(fixture.callLog.read().filter((call) => call.operation === "executeQuery")).toHaveLength(1);
  act(() => { fixture.setPersona("analyst"); runtime.setResolution(fixture.sessionResolution()); });
  await screen.findByRole("button", { name: "synthetic_national" });
  expect(screen.getByRole("textbox", { name: "SQL statement" })).toHaveValue("");
  expect(screen.queryByRole("table")).toBeNull();
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

it.each(["/datasets", "/query"] as const)("blocks Viewer direct %s before mounting its content and rejects current handoffs", (path) => {
  const { fixture, runtime } = setup();
  fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution());
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const go = vi.fn(); const mounted = vi.fn();
  function RestrictedContent() { mounted(); return <p>Restricted content</p>; }
  render(<ApplicationProvider operations={fixture.operations} runtime={runtime} path={path} go={go} querySettings={null}><ProtectedLayout><RestrictedContent /></ProtectedLayout></ApplicationProvider>);
  expect(mounted).not.toHaveBeenCalled();
  expect(go).toHaveBeenCalledWith("/overview");
  expect(screen.queryByRole("link", { name: "Dataset Explorer" })).toBeNull();
  expect(screen.queryByRole("link", { name: "SQL Workspace" })).toBeNull();
  expect(canAccessPath(runtime.getSnapshot(), "/overview")).toBe(true);
  for (const target of ["explorer", "queries"] as const) expect(acceptsIntent(runtime, { target, generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: {} })).toBe(false);
});
it.each(["analyst", "admin"] as const)("preserves %s Explorer and SQL page access", (persona) => {
  const { fixture, runtime } = setup();
  fixture.setPersona(persona); runtime.setResolution(fixture.sessionResolution());
  expect(canAccessPath(runtime.getSnapshot(), "/datasets")).toBe(true);
  expect(canAccessPath(runtime.getSnapshot(), "/query")).toBe(true);
  expect(navigationData(runtime.getSnapshot(), "/overview")).toMatchObject({ destinations: [{ href: "/overview" }, { href: "/datasets" }, { href: "/query" }] });
});

it.each(["/datasets", "/query"] as const)("removes mounted %s content immediately on access reduction", (path) => {
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  const { fixture, runtime } = setup(); const go = vi.fn();
  render(<ApplicationProvider operations={fixture.operations} runtime={runtime} path={path} go={go} querySettings={null}><ProtectedLayout><p>Restricted content</p></ProtectedLayout></ApplicationProvider>);
  expect(screen.getByText("Restricted content")).toBeVisible();
  act(() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); });
  expect(screen.queryByText("Restricted content")).toBeNull();
  expect(go).toHaveBeenCalledWith("/overview");
});

it("registers configured production data with current auth CSRF and independent settings", async () => {
  const runtime = createSessionRuntime(); runtimes.push(runtime);
  const fetch = vi.fn<typeof globalThis.fetch>(); vi.stubGlobal("fetch", fetch);
  const operations = createProductionOperations({ runtime, authEnabled: true });
  expect(await operations.listDatasets(runtime.capture())).toMatchObject({ ok: false, failure: { kind: "unauthenticated" } });
  expect(fetch).not.toHaveBeenCalled();
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ user: { id: "controlled", email: "controlled@example.invalid", role: "analyst" }, expires_at: new Date(Date.now() + 3600_000).toISOString(), csrf_token: "controlled-memory-token" }), { status: 200 }));
  const resolved = await operations.resolveSession(runtime.capture());
  if (!resolved.ok) throw new Error("Controlled auth resolution required");
  runtime.setResolution(resolved.value);
  fetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: "service_unavailable" }), { status: 503 }));
  expect(await operations.executeQuery(runtime.capture(), { sql: " SELECT 1\n", page: 1, pageSize: 100 })).toMatchObject({ ok: false });
  expect(fetch.mock.calls[1]?.[1]).toMatchObject({ method: "POST", headers: { "X-CSRF-Token": "controlled-memory-token" }, body: '{"sql":" SELECT 1\\n"}' });
  const intent = { target: "queries" as const, generation: runtime.getSnapshot().generation, datasetId: "national", filters: { dates: { start: "2026-09-01" } } };
  expect(operations.consumeNavigationIntent(runtime.capture(), intent)).toEqual({ ok: true, value: { target: "queries", datasetId: "national", filters: intent.filters, proposedDraft: "SELECT * FROM national" } });
  expect(operations.consumeNavigationIntent(runtime.capture(), { ...intent, target: "explorer" })).toMatchObject({ ok: true, value: { target: "explorer", filters: intent.filters } });
  for (const invalid of [{ ...intent, datasetId: "toString" }, { ...intent, generation: intent.generation - 1 }, { ...intent, filters: { dates: { start: "2026-02-30" } } }, { ...intent, filters: { facilityId: "detail" } }]) expect(operations.consumeNavigationIntent(runtime.capture(), invalid).ok).toBe(false);
  expect(fetch).toHaveBeenCalledTimes(2);
  runtime.invalidate("pending");
  expect(operations.consumeNavigationIntent(runtime.capture(), intent).ok).toBe(false);
});


it("keeps catalog ownership through route consumer remounts and aborts replacement work", async () => {
  const { runtime } = setup();
  const catalogCache = createCatalogCache({ runtime, policy: syntheticCatalogCachePolicy, attachOnCreate: false });
  const fixture = createFixtureOperations({ catalogCache });
  const observer: { app: ReturnType<typeof useApplication> | null } = { app: null };
  function Observe() { observer.app = useApplication(); return <p>Catalog consumer</p>; }
  function Root({ shown = true, replacement = false }: { shown?: boolean; replacement?: boolean }) {
    return <ApplicationProvider operations={replacement ? next.operations : fixture.operations} runtime={runtime} path={shown ? "/query" : "/overview"} go={vi.fn()} querySettings={null}>{shown ? <Observe /> : <p>Away</p>}</ApplicationProvider>;
  }
  const nextCatalogCache = createCatalogCache({ runtime, policy: syntheticCatalogCachePolicy, attachOnCreate: false });
  const next = createFixtureOperations({ catalogCache: nextCatalogCache });
  const view = render(<Root />); const delayed = fixture.deferNext("listDatasets");
  const first = fixture.operations.listDatasets(runtime.capture()); await Promise.resolve();
  view.rerender(<Root shown={false} />); view.rerender(<Root />);
  const schema = fixture.operations.readSchema(runtime.capture(), "synthetic-national");
  expect(observer.app?.catalogCache).toBe(catalogCache);
  delayed.release(); expect((await first).ok).toBe(true); expect((await schema).ok).toBe(true);
  expect(fixture.callLog.read().filter((call) => call.operation === "listDatasets")).toHaveLength(1);
  catalogCache.invalidate({ reason: "published-refresh" });
  const delayedOld = fixture.deferNext("listDatasets");
  const old = fixture.operations.listDatasets(runtime.capture()); await Promise.resolve();
  view.rerender(<Root replacement />);
  expect(observer.app?.catalogCache).toBe(nextCatalogCache); expect((await old).ok).toBe(false);
  expect(catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
  delayedOld.release(); await Promise.resolve(); expect(catalogCache.accounting().entries).toBe(0);
  expect((await next.operations.listDatasets(runtime.capture())).ok).toBe(true);
  view.unmount(); expect(nextCatalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
});

it("reattaches shared catalog cleanup under Strict Mode without retaining discarded ownership", async () => {
  const { runtime } = setup();
  const catalogCache = createCatalogCache({ runtime, policy: syntheticCatalogCachePolicy, attachOnCreate: false });
  const fixture = createFixtureOperations({ catalogCache });
  const view = render(<StrictMode><ApplicationProvider operations={fixture.operations} runtime={runtime} path="/overview" go={vi.fn()} querySettings={null}><p>Strict catalog</p></ApplicationProvider></StrictMode>);
  expect((await fixture.operations.listDatasets(runtime.capture())).ok).toBe(true);
  expect((await fixture.operations.readSchema(runtime.capture(), "synthetic-national")).ok).toBe(true);
  expect(fixture.callLog.read().filter((call) => call.operation === "listDatasets")).toHaveLength(1);
  act(() => { runtime.invalidate(); }); expect(catalogCache.accounting().entries).toBe(0);
  view.unmount(); expect(catalogCache.accounting().pending).toBe(0);
});


it("fixture ownership reattaches before route readers under Strict Mode and clears on unmount", async () => {
  const observed: { fixture: ReturnType<typeof useFixtureController> | null } = { fixture: null };
  function Observe() { observed.fixture = useFixtureController(); return <p>Fixture catalog</p>; }
  const view = render(<StrictMode><FixtureProvider><Observe /></FixtureProvider></StrictMode>);
  const fixture = observed.fixture; if (!fixture) throw new Error("Fixture dependencies required");
  expect((await fixture.controller.operations.listDatasets(fixture.runtime.capture())).ok).toBe(true);
  expect((await fixture.controller.operations.readSchema(fixture.runtime.capture(), "synthetic-national")).ok).toBe(true);
  expect(fixture.controller.callLog.read().filter((call) => call.operation === "listDatasets")).toHaveLength(1);
  view.unmount(); expect(fixture.catalogCache.accounting()).toEqual({ entries: 0, bytes: 0, pending: 0 });
});


it.each(["accepted", "running", "retained", "failed", "interrupted", "publication_unknown", "succeeded"] as const)("only published refresh status %s invalidates catalog before Overview reload", async (status) => {
  const runtime = createSessionRuntime(); runtimes.push(runtime);
  const catalogCache = createCatalogCache({ runtime, policy: syntheticCatalogCachePolicy, attachOnCreate: false });
  const fixture = createFixtureOperations({ catalogCache, persona: "admin" });
  runtime.setResolution(fixture.sessionResolution());
  const readSeries = vi.spyOn(fixture.operations, "readNationalSeries");
  const refresh = {
    admitRefresh: vi.fn(),
    readRefresh: vi.fn().mockResolvedValue({ ok: true, value: { runId: "synthetic-publication", status, interval: { start: "2026-09-01", end: "2026-09-04" } } }),
  };
  const operations = { ...fixture.operations, refresh };
  const invalidated = vi.fn(() => { expect(catalogCache.accounting().entries).toBe(0); });
  const unsubscribe = catalogCache.subscribe(invalidated);
  const view = render(<ApplicationProvider operations={operations} runtime={runtime} catalogCache={catalogCache} path="/overview" go={vi.fn()} querySettings={null}><OverviewEntry /></ApplicationProvider>);
  await screen.findByRole("table", { name: "Daily national observations" });
  fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
  fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
  await screen.findByRole("table", { name: "Daily national observations" });
  const beforeRows = readSeries.mock.calls.length;
  const catalogReads = () => fixture.callLog.read().filter((call) => call.operation === "listDatasets").length;
  expect(catalogReads()).toBe(1);
  fixture.publishSnapshot();
  fireEvent.click(screen.getByRole("button", { name: "Check refresh status" }));
  await waitFor(() => { expect(screen.getByRole("button", { name: "Check refresh status" })).toBeEnabled(); });
  if (status === "succeeded") {
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(invalidated).toHaveBeenCalledExactlyOnceWith({ reason: "published-refresh" });
    expect(catalogReads()).toBe(2);
    expect(readSeries).toHaveBeenCalledTimes(beforeRows + 1);
    expect(readSeries.mock.calls.at(-1)?.[1]).toEqual({ start: "2026-09-01", end: "2026-09-03" });
    expect(await readSeries.mock.results.at(-1)?.value).toMatchObject({ ok: true, value: { provenance: { snapshotId: "synthetic-snapshot-2" } } });
    await fixture.operations.readSchema(runtime.capture(), "synthetic-national");
    expect(catalogReads()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Check refresh status" }));
    await waitFor(() => { expect(refresh.readRefresh).toHaveBeenCalledTimes(2); expect(screen.getByRole("button", { name: "Check refresh status" })).toBeEnabled(); });
    expect(invalidated).toHaveBeenCalledTimes(1);
    expect(catalogReads()).toBe(2);
    expect(readSeries).toHaveBeenCalledTimes(beforeRows + 1);
  } else {
    expect(invalidated).not.toHaveBeenCalled();
    expect(catalogReads()).toBe(1);
    expect(readSeries).toHaveBeenCalledTimes(beforeRows);
  }
  expect(refresh.admitRefresh).not.toHaveBeenCalled();
  expect(fixture.callLog.read().some((call) => call.operation === "executeQuery")).toBe(false);
  unsubscribe(); view.unmount();
});
