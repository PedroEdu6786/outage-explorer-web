import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureOperations, type FixtureOptions } from "../../../tests/fixtures/operations";
import { createSessionRuntime } from "../../session/session-runtime";
import { ExplorerFeature } from "./ExplorerFeature";
import { isCalendarDate } from "./preview-state";
import { createExplorerController, type ExplorerOperations } from "./service";

const releases: (() => void)[] = [];
afterEach(() => { for (const release of releases.splice(0)) release(); });
function setup(options: FixtureOptions = {}, operationsOverride?: (operations: ExplorerOperations) => ExplorerOperations) {
  const fixture = createFixtureOperations(options);
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  const operations = operationsOverride?.(fixture.operations) ?? fixture.operations;
  const controller = createExplorerController({ operations, runtime, initialPageSize: 1, ...(options.now ? { now: options.now } : {}) });
  releases.push(() => { runtime.dispose(); });
  releases.push(controller.connect());
  return { fixture, runtime, controller, operations };
}
const ready = async (controller: ReturnType<typeof createExplorerController>) => { await waitFor(() => { expect(controller.getSnapshot().previewStatus).toBe("ready"); }); };

describe("Explorer authorized cursor lifecycle", () => {
  it("keeps Viewer metadata national-only and uses returned coverage", async () => {
    const { controller, fixture } = setup({ persona: "viewer" });
    await ready(controller);
    expect(controller.getSnapshot().catalog.map((dataset) => dataset.grain)).toEqual(["national"]);
    expect(controller.getSnapshot().selected?.coverage).toEqual({ status: "available", range: { start: "2026-09-01", end: "2026-09-04" } });
    controller.select("synthetic-facility");
    expect(fixture.callLog.read().filter((call) => call.operation === "readSchema").map((call) => call.input)).toEqual([{ datasetId: "synthetic-national" }]);
    expect(controller.getSnapshot().schema?.columns.some((column) => column.kind === "identifier")).toBe(false);
  });
  it("starts at 100 by default and refuses invalid calendars, ranges, unsupported facilities and sizes", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime();
    runtime.setResolution(fixture.sessionResolution());
    const controller = createExplorerController({ operations: fixture.operations, runtime });
    releases.push(() => { runtime.dispose(); }, controller.connect());
    await ready(controller);
    expect(controller.getSnapshot().selection?.pageSize).toBe(100);
    const count = fixture.callLog.read().length;
    for (const [filters, size] of [
      [{ dates: { start: "2026-02-30", end: "2026-09-03" } }, 100],
      [{ dates: { start: "2026-09-04", end: "2026-09-01" } }, 100],
      [{ facilityId: "0012" }, 100], [{}, 501], [{}, 0], [{}, 1.5],
    ] as const) controller.select("synthetic-national", filters, size);
    expect(fixture.callLog.read()).toHaveLength(count);
    expect(controller.getSnapshot().failure?.kind).toBe("invalid-input");
    expect(isCalendarDate("2024-02-29")).toBe(true);
    expect(isCalendarDate("2100-02-29")).toBe(false);
  });
  it("accepts optional bounds and empty results outside coverage while forbidding facility filters for Analysts", async () => {
    const { controller, fixture } = setup(); await ready(controller);
    controller.select("synthetic-facility", { dates: { start: "2026-09-03" } }); await ready(controller);
    expect(controller.getSnapshot().pages[0]?.table.rows).not.toHaveLength(0);
    const before = fixture.callLog.read().length;
    controller.select("synthetic-facility", { facilityId: "0012" });
    expect(fixture.callLog.read()).toHaveLength(before);
    controller.select("synthetic-facility", { dates: { end: "2025-12-31" } }); await ready(controller);
    expect(controller.getSnapshot().pages[0]?.table.rows).toHaveLength(0);
    controller.select("synthetic-facility", {}); await ready(controller);
    expect(controller.getSnapshot().failure).toBeNull();
  });
  it("rejects out-of-order schema, preview successes and forbidden errors for old selections", async () => {
    const { fixture, controller } = setup();
    await ready(controller);
    const oldSchema = fixture.deferNext("readSchema");
    const oldPreview = fixture.deferNext("startPreview");
    fixture.failNext("readSchema", { kind: "forbidden", message: "Old denied schema" });
    controller.select("synthetic-facility");
    controller.select("synthetic-generator");
    await ready(controller);
    oldSchema.release(); oldPreview.release();
    await Promise.resolve();
    expect(controller.getSnapshot().selected?.id).toBe("synthetic-generator");
    expect(controller.getSnapshot().schema?.datasetId).toBe("synthetic-generator");
    expect(controller.getSnapshot().failure).toBeNull();
    expect(controller.getSnapshot().pages[0]?.sequence.selection.datasetId).toBe("synthetic-generator");
  });
  it("resets rows and cursors on filter/page-size changes and preserves string identifiers", async () => {
    const { controller, fixture } = setup();
    await ready(controller);
    controller.next(); await ready(controller);
    controller.select("synthetic-generator", { dates: { start: "2026-09-01", end: "2026-09-03" } }, 2);
    expect(controller.getSnapshot().pages).toEqual([]);
    await ready(controller);
    expect(controller.getSnapshot().pages).toHaveLength(1);
    const cells = controller.getSnapshot().pages[0]?.table.rows[0]?.cells;
    expect(cells).toContainEqual({ kind: "identifier", value: "0012" });
    expect(cells).toContainEqual({ kind: "identifier", value: "G-01" });
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview").at(-1)?.input).toEqual({ datasetId: "synthetic-generator", filters: { dates: { start: "2026-09-01", end: "2026-09-03" } }, pageSize: 2 });
  });
  it("retains original snapshot/expiry across publication and cached backward navigation", async () => {
    const { controller, fixture } = setup();
    await ready(controller);
    const first = controller.getSnapshot().pages[0];
    fixture.publishSnapshot();
    controller.next(); await ready(controller);
    expect(controller.getSnapshot().pages[1]?.sequence).toEqual(first?.sequence);
    controller.previous(); controller.next();
    expect(controller.getSnapshot().pageIndex).toBe(1);
    const calls = fixture.callLog.read().filter((call) => call.operation === "continuePreview");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.input).toEqual({ sequence: first?.sequence, cursor: first?.nextCursor });
    controller.restart(); await ready(controller);
    expect(controller.getSnapshot().pages[0]?.sequence.snapshotId).not.toBe(first?.sequence.snapshotId);
  });
  it("expires at the original deadline, removes cached rows and requires an explicit restart", async () => {
    let time = Date.now();
    const { controller, fixture } = setup({ now: () => time });
    await ready(controller);
    const expiry = controller.getSnapshot().pages[0]?.sequence.expiresAt;
    time += 14 * 60 * 1000;
    controller.next(); await ready(controller);
    expect(controller.getSnapshot().pages[1]?.sequence.expiresAt).toBe(expiry);
    time += 60 * 1000;
    controller.previous();
    expect(controller.getSnapshot().previewStatus).toBe("expired");
    expect(controller.getSnapshot().pages).toEqual([]);
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(1);
    controller.restart(); await ready(controller);
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(2);
  });
  it("rejects changed snapshot or extended expiry from a continuation adapter", async () => {
    const { controller } = setup({}, (operations) => ({ ...operations, async continuePreview(context, input) {
      const result = await operations.continuePreview(context, input);
      return result.ok ? { ok: true, value: { ...result.value, sequence: { ...result.value.sequence, expiresAt: new Date(Date.parse(input.sequence.expiresAt) + 1000).toISOString() } } } : result;
    } }));
    await ready(controller);
    controller.next();
    await waitFor(() => { expect(controller.getSnapshot().previewStatus).toBe("error"); });
    expect(controller.getSnapshot().pages).toHaveLength(1);
    expect(controller.getSnapshot().failure?.message).toContain("sequence changed");
  });
  it("clears all protected data on access change and ignores old unauthorized responses", async () => {
    const { controller, fixture, runtime } = setup();
    await ready(controller);
    const delay = fixture.deferNext("startPreview");
    fixture.failNext("startPreview", { kind: "unauthenticated", message: "Old session expired" });
    controller.select("synthetic-facility");
    fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution());
    expect(controller.getSnapshot().schema).toBeNull();
    expect(controller.getSnapshot().pages).toEqual([]);
    await ready(controller);
    delay.release(); await Promise.resolve();
    expect(runtime.getSnapshot().status).toBe("authenticated");
    expect(controller.getSnapshot().catalog.map((dataset) => dataset.id)).toEqual(["synthetic-national"]);
    expect(controller.getSnapshot().selected?.id).toBe("synthetic-national");
  });
  it("ignores a stale catalog and late rejected preview after logout", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
    const delayedCatalog = fixture.deferNext("listDatasets");
    const controller = createExplorerController({ operations: fixture.operations, runtime });
    releases.push(() => { runtime.dispose(); }, controller.connect());
    runtime.invalidate(); delayedCatalog.release(); await Promise.resolve();
    expect(controller.getSnapshot().catalog).toEqual([]);
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(0);
    runtime.setResolution(fixture.sessionResolution()); await ready(controller);
    const delay = fixture.deferNext("startPreview"); controller.restart(); runtime.invalidate();
    delay.reject(new Error("sensitive internal error")); await Promise.resolve();
    expect(controller.getSnapshot().failure).toBeNull();
    expect(controller.getSnapshot().pages).toEqual([]);
    expect(controller.sqlIntent()).toBeNull();
  });
  it("removes revoked metadata after a current forbidden response", async () => {
    const { controller, fixture } = setup(); await ready(controller);
    fixture.failNext("continuePreview", { kind: "forbidden", message: "Access revoked" });
    controller.next();
    await waitFor(() => { expect(controller.getSnapshot().failure?.kind).toBe("forbidden"); });
    expect(controller.getSnapshot().catalog).toEqual([]);
    expect(controller.getSnapshot().schema).toBeNull();
    expect(controller.getSnapshot().selected).toBeNull();
    expect(controller.sqlIntent()).toBeNull();
  });
  it("creates only a generation-bound authorized SQL intent and never executes", async () => {
    const { controller, fixture, runtime } = setup(); await ready(controller);
    controller.select("synthetic-facility", { dates: { start: "2026-09-03" } }); await ready(controller);
    expect(controller.sqlIntent()).toEqual({ target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-facility", filters: { dates: { start: "2026-09-03" } } });
    expect(fixture.callLog.read().some((call) => call.operation === "executeQuery")).toBe(false);
    runtime.invalidate(); expect(controller.sqlIntent()).toBeNull();
  });
  it("ignores delayed schema success and preview success after capability reduction", async () => {
    const { controller, fixture, runtime } = setup(); await ready(controller);
    const schemaDelay = fixture.deferNext("readSchema");
    const previewDelay = fixture.deferNext("startPreview");
    controller.select("synthetic-generator");
    fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution());
    await ready(controller);
    schemaDelay.release(); previewDelay.release();
    await waitFor(() => { expect(fixture.callLog.read().filter((call) => call.outcome === "pending")).toHaveLength(0); });
    expect(controller.getSnapshot().schema?.datasetId).toBe("synthetic-national");
    expect(controller.getSnapshot().pages[0]?.sequence.selection.datasetId).toBe("synthetic-national");
    expect(controller.getSnapshot().catalog.flatMap((dataset) => dataset.filters.facilities)).toEqual([]);
  });
  it("clears current unauthenticated reads and sanitizes unexpected rejections without retry", async () => {
    const { controller, fixture, runtime } = setup(); await ready(controller);
    const rejected = fixture.deferNext("startPreview"); controller.restart();
    rejected.reject(new Error("secret adapter internals"));
    await waitFor(() => { expect(controller.getSnapshot().previewStatus).toBe("error"); });
    expect(controller.getSnapshot().failure?.message).not.toContain("secret");
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(2);
    fixture.failNext("readSchema", { kind: "unauthenticated", message: "Session ended" });
    controller.restart();
    await waitFor(() => { expect(runtime.getSnapshot().status).toBe("unauthenticated"); });
    expect(controller.getSnapshot().catalog).toEqual([]);
    expect(controller.getSnapshot().pages).toEqual([]);
  });
});

describe("Explorer feature interaction", () => {
  it("renders permitted schema tabs, exact/null values, validates inputs and emits SQL context", async () => {
    const user = userEvent.setup();
    const fixture = createFixtureOperations({ persona: "analyst" });
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); releases.push(() => { runtime.dispose(); });
    const onNavigate = vi.fn();
    render(<ExplorerFeature operations={fixture.operations} runtime={runtime} onNavigate={onNavigate} />);
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(screen.getByText("Synthetic facility observations")).toBeVisible();
    expect(screen.queryByLabelText("Facility")).not.toBeInTheDocument();
    expect(screen.getAllByText("0.00").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Missing value").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("tab", { name: "Schema" }));
    expect(screen.getByRole("table", { name: "Authorized dataset schema" })).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Preview" }));
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-09-04" } });
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-01" } });
    await user.click(screen.getByRole("button", { name: "Apply filters" }));
    expect(screen.getByRole("alert")).toHaveTextContent("valid calendar dates");
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Open in SQL Workspace" }));
    expect(onNavigate).toHaveBeenCalledWith({ target: "queries", generation: runtime.getSnapshot().generation, datasetId: "synthetic-national", filters: {} });
    act(() => { runtime.invalidate(); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });
  it("withholds protected metadata while pending and ignores stale inbound intent", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime(); releases.push(() => { runtime.dispose(); });
    const oldIntent = { target: "explorer", generation: 0, datasetId: "synthetic-facility", filters: { facilityId: "0012" } } as const;
    render(<ExplorerFeature operations={fixture.operations} runtime={runtime} intent={oldIntent} />);
    expect(screen.getByText("Resolving session")).toBeInTheDocument();
    expect(fixture.callLog.read()).toEqual([]);
    act(() => { runtime.setResolution(fixture.sessionResolution()); });
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(fixture.callLog.read().filter((call) => call.operation === "startPreview")).toHaveLength(1);
  });
  it.each(["empty", "unavailable"] as const)("distinguishes %s preview state", async (dataState) => {
    const fixture = createFixtureOperations({ dataState });
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); releases.push(() => { runtime.dispose(); });
    render(<ExplorerFeature operations={fixture.operations} runtime={runtime} />);
    if (dataState === "empty") {
      await screen.findByText("No records match these filters");
      expect(screen.queryByText("Published data unavailable")).not.toBeInTheDocument();
    } else {
      await screen.findByText("Published data unavailable");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Restart browsing" })).toBeInTheDocument();
    }
  });
});
