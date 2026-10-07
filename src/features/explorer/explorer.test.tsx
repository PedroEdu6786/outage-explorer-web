import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createFixtureOperations, type FixtureOptions } from "../../../tests/fixtures/operations";
import { syntheticSettings } from "../../../tests/fixtures/scenarios";
import { createSessionRuntime } from "../../session/session-runtime";
import { ExplorerFeature } from "./ExplorerFeature";
import { DatasetPreview } from "./DatasetPreview";
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
  it("truncates preview decimals while retaining source precision, identifiers and missing values", async () => {
    const { controller } = setup(); await ready(controller);
    const state = controller.getSnapshot();
    const page = state.pages[0];
    if (!page) throw new Error("Preview page required");
    const table = {
      columns: [
        { id: "mw", label: "Capacity", kind: "decimal" as const, unit: "MW", nullable: true },
        { id: "id", label: "Facility", kind: "identifier" as const, unit: null, nullable: false },
      ],
      rows: [
        { position: 0, cells: [{ kind: "decimal" as const, exact: "9007199254740993.99999", display: "9007199254740993.99999" }, { kind: "identifier" as const, value: "0012" }] },
        { position: 1, cells: [{ kind: "decimal" as const, exact: "0", display: "0" }, { kind: "identifier" as const, value: "A1" }] },
        { position: 2, cells: [{ kind: "null" as const }, { kind: "identifier" as const, value: "A2" }] },
      ],
    };
    render(<DatasetPreview state={{ ...state, pages: [{ ...page, table }], pageIndex: 0 }} onNext={vi.fn()} onPrevious={vi.fn()} onRestart={vi.fn()} />);
    expect(screen.getByText("9007199254740993.99")).toBeVisible();
    expect(screen.queryByText("9007199254740993.99999")).toBeNull();
    expect(screen.getByText("0012")).toBeVisible();
    expect(screen.getByText("0")).toBeVisible();
    expect(screen.getByLabelText("Missing value")).toBeVisible();
    expect(table.rows[0]?.cells[0]).toEqual({ kind: "decimal", exact: "9007199254740993.99999", display: "9007199254740993.99999" });
  });
  it.each(["catalog", "schema"] as const)("revokes the sequence after %s denial before delayed protected successes arrive", async (source) => {
    for (const failure of [{ kind: "forbidden", message: "Denied" }, { kind: "data-unavailable", code: "dataset_unavailable", message: "Unavailable" }] as const) {
      const { controller, fixture, runtime } = setup(); await ready(controller);
      const schemaDelay = source === "catalog" ? fixture.deferNext("readSchema") : null;
      const previewDelay = fixture.deferNext("startPreview");
      if (source === "schema") fixture.failNext("readSchema", failure);
      controller.select("synthetic-generator");
      if (source === "catalog") { fixture.failNext("listDatasets", failure); controller.retryCatalog(); }
      await waitFor(() => { expect(controller.getSnapshot().failure?.kind).toBe(failure.kind); });
      expect(controller.getSnapshot().schema).toBeNull();
      expect(controller.getSnapshot().selected).toBeNull();
      schemaDelay?.release(); previewDelay.release();
      await waitFor(() => { expect(fixture.callLog.read().filter((call) => call.outcome === "pending")).toHaveLength(0); });
      expect(controller.getSnapshot().catalog).toEqual([]);
      expect(controller.getSnapshot().pages).toEqual([]);
      expect(controller.getSnapshot().schema).toBeNull();
      expect(controller.sqlIntent()).toBeNull();
      expect(runtime.getSnapshot().status).toBe("authenticated");
    }
  });
  it("keeps Viewer metadata national-only and uses returned coverage", async () => {
    const { controller, fixture } = setup({ persona: "viewer" });
    await ready(controller);
    expect(controller.getSnapshot().catalog.map((dataset) => dataset.grain)).toEqual(["national"]);
    expect(controller.getSnapshot().selected?.coverage).toEqual({ status: "available", range: { start: "2026-09-01", end: "2026-09-04" } });
    controller.select("synthetic-facility");
    expect(fixture.callLog.read().filter((call) => call.operation === "readSchema").map((call) => call.input)).toEqual([{ datasetId: "synthetic-national" }]);
    expect(controller.getSnapshot().schema?.columns.some((column) => column.kind === "identifier")).toBe(false);
  });
  it("starts at 10 by default and refuses invalid calendars, ranges, unsupported facilities and sizes", async () => {
    const fixture = createFixtureOperations();
    const runtime = createSessionRuntime();
    runtime.setResolution(fixture.sessionResolution());
    const controller = createExplorerController({ operations: fixture.operations, runtime });
    releases.push(() => { runtime.dispose(); }, controller.connect());
    await ready(controller);
    expect(controller.getSnapshot().selection?.pageSize).toBe(10);
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

describe("Explorer loading treatments (FR4, AC3, AC5)", () => {
  function mount(options: FixtureOptions = { persona: "analyst" }) {
    const fixture = createFixtureOperations(options);
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); releases.push(() => { runtime.dispose(); });
    const view = render(<ExplorerFeature operations={fixture.operations} runtime={runtime} initialPageSize={1} {...(options.now ? { now: options.now } : {})} />);
    return { fixture, runtime, view };
  }
  const dimmed = () => document.querySelector("[inert][aria-busy=true]");

  it("shows hidden skeleton rows above the single preview banner while the first page loads, then the exact table", async () => {
    const fixture = createFixtureOperations({ persona: "analyst" });
    const hold = fixture.deferNext("startPreview"); releases.push(() => { hold.release(); });
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); releases.push(() => { runtime.dispose(); });
    render(<ExplorerFeature operations={fixture.operations} runtime={runtime} initialPageSize={1} />);
    const banner = await screen.findByText("Loading preview");
    expect(screen.getAllByText("Loading preview")).toHaveLength(1);
    expect(banner.closest("[role=status]")).not.toBeNull();
    const skeleton = document.querySelector("[aria-busy=true] > div[aria-hidden=true]");
    expect(skeleton).not.toBeNull();
    expect(skeleton).toHaveTextContent("");
    expect(skeleton?.querySelector("table, [role]")).toBeNull();
    expect(screen.queryByRole("table", { name: "Synthetic national observations preview" })).not.toBeInTheDocument();
    expect(screen.queryByText("Unavailable")).not.toBeInTheDocument();
    await act(async () => { hold.release(); await Promise.resolve(); });
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(screen.queryByText("Loading preview")).not.toBeInTheDocument();
    expect(dimmed()).toBeNull();
    expect(document.querySelector("[aria-busy=true]")).toBeNull();
  });

  it("shows skeleton rows with the schema banner while the schema loads", async () => {
    const user = userEvent.setup();
    const fixture = createFixtureOperations({ persona: "analyst" });
    const schemaHold = fixture.deferNext("readSchema"); releases.push(() => { schemaHold.release(); });
    const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution()); releases.push(() => { runtime.dispose(); });
    render(<ExplorerFeature operations={fixture.operations} runtime={runtime} initialPageSize={1} />);
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    await user.click(screen.getByRole("tab", { name: "Schema" }));
    const panel = screen.getByRole("tabpanel", { name: "Schema" });
    expect(within(panel).getByText("Loading schema")).toBeVisible();
    expect(within(panel).getAllByRole("status")).toHaveLength(1);
    expect(panel.querySelector("div[aria-hidden=true] > div")).not.toBeNull();
    expect(within(panel).queryByRole("table")).not.toBeInTheDocument();
    await act(async () => { schemaHold.release(); await Promise.resolve(); });
    await within(panel).findByRole("table", { name: "Authorized dataset schema" });
    expect(within(panel).queryByText("Loading schema")).not.toBeInTheDocument();
  });

  it("dims the retained page during next(), then replaces it without leaving the dim", async () => {
    const user = userEvent.setup();
    const { fixture } = mount();
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    const first = Array.from(screen.getByRole("table", { name: "Synthetic national observations preview" }).querySelectorAll("td")).map((cell) => cell.textContent);
    const hold = fixture.deferNext("continuePreview"); releases.push(() => { hold.release(); });
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Loading preview");
    const stale = dimmed();
    expect(stale).not.toBeNull();
    expect(stale).toHaveAttribute("aria-hidden", "true");
    // Stale rows are retained byte-for-byte but are neither exposed nor interactive.
    expect(Array.from(stale?.querySelectorAll("tbody td") ?? []).map((cell) => cell.textContent)).toEqual(first);
    expect(screen.queryByRole("table", { name: "Synthetic national observations preview" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Loading preview")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    await act(async () => { hold.release(); await Promise.resolve(); });
    await waitFor(() => { expect(dimmed()).toBeNull(); });
    const table = await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(table.closest("[aria-busy=true]")).toBeNull();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("removes the dimmed page with the session state on logout and ignores a late response", async () => {
    const user = userEvent.setup();
    const { fixture, runtime } = mount();
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    const hold = fixture.deferNext("continuePreview");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Loading preview");
    expect(dimmed()).not.toBeNull();
    act(() => { runtime.invalidate(); });
    // Same commit as the session change: nothing from the retained page remains.
    expect(dimmed()).toBeNull();
    expect(document.querySelector("table")).toBeNull();
    expect(document.querySelector("tbody")).toBeNull();
    expect(screen.queryByText("Synthetic national observations")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in to explore datasets")).toBeVisible();
    await act(async () => { hold.release(); await Promise.resolve(); });
    expect(dimmed()).toBeNull();
    expect(document.querySelector("table")).toBeNull();
    expect(screen.queryByText("Loading preview")).not.toBeInTheDocument();
  });

  it("removes the dimmed page on session expiry (invalidate) and never restores it", async () => {
    const user = userEvent.setup();
    const { fixture, runtime } = mount();
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    const hold = fixture.deferNext("continuePreview");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Loading preview");
    act(() => { runtime.invalidate("expired"); });
    expect(dimmed()).toBeNull();
    expect(document.querySelector("table")).toBeNull();
    expect(screen.getByText("Session expired")).toBeVisible();
    await act(async () => { hold.release(); await Promise.resolve(); });
    expect(document.querySelector("table")).toBeNull();
    expect(screen.getByText("Session expired")).toBeVisible();
  });

  it("removes the dimmed page when capabilities shrink and does not restore it from a late response", async () => {
    const user = userEvent.setup();
    const { fixture, runtime } = mount();
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(screen.getByText("Synthetic facility observations")).toBeVisible();
    const hold = fixture.deferNext("continuePreview");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Loading preview");
    expect(dimmed()).not.toBeNull();
    act(() => { fixture.setPersona("viewer"); runtime.setResolution(fixture.sessionResolution()); });
    expect(dimmed()).toBeNull();
    expect(screen.queryByText("Synthetic facility observations")).not.toBeInTheDocument();
    await act(async () => { hold.release(); await Promise.resolve(); });
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    expect(dimmed()).toBeNull();
    expect(screen.queryByText("Synthetic facility observations")).not.toBeInTheDocument();
    expect(fixture.callLog.read().filter((call) => call.operation === "continuePreview")).toHaveLength(1);
  });

  it("removes the dimmed page when the preview expires during next() and ignores the late response", async () => {
    const user = userEvent.setup();
    const start = Date.now(); let time = start;
    const { fixture } = mount({ persona: "analyst", now: () => time });
    await screen.findByRole("table", { name: "Synthetic national observations preview" });
    const expiry = start + syntheticSettings.previewLifetimeMs;
    time = expiry - 80;
    const hold = fixture.deferNext("continuePreview");
    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Loading preview");
    expect(dimmed()).not.toBeNull();
    time = expiry + 1000;
    await screen.findByText("Preview expired");
    expect(dimmed()).toBeNull();
    expect(screen.queryByRole("table", { name: "Synthetic national observations preview" })).not.toBeInTheDocument();
    await act(async () => { hold.release(); await Promise.resolve(); });
    expect(screen.queryByRole("table", { name: "Synthetic national observations preview" })).not.toBeInTheDocument();
    expect(screen.queryByText("Loading preview")).not.toBeInTheDocument();
    expect(dimmed()).toBeNull();
    expect(screen.getByRole("button", { name: "Restart browsing" })).toBeEnabled();
  });
});
