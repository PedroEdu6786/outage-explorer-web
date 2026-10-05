import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { SessionProvider } from "../../session/SessionProvider";
import { createSessionRuntime } from "../../session/session-runtime";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { syntheticObservations } from "../../../tests/fixtures/scenarios";
import { useOverview } from "./useOverview";
import { OverviewFeature } from "./OverviewFeature";
import { NationalMetricCards } from "./NationalMetricCards";
import { NationalTrend } from "./NationalTrend";
import { observationTable, plotSegments } from "./presentation";
import { validCalendarDate, validRange } from "./service";
import type { NavigationIntent } from "../../contracts/navigation";

function setup(persona: "viewer" | "analyst" = "viewer") {
  const fixture = createFixtureOperations({ persona });
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  return { fixture, runtime };
}
describe("Overview exact observation behavior", () => {
  it("preserves half-up tie display and distinguishes zero/null in cards and table", () => {
    const { rerender } = render(<NationalMetricCards observation={syntheticObservations[0]} />);
    expect(screen.getByText("1.01")).toBeVisible();
    expect(screen.getByText(/EIA reported: 1.01%/)).toBeVisible();
    const table = observationTable(syntheticObservations);
    expect(table.rows[0]?.cells[1]).toEqual({ kind: "decimal", exact: "1.005", display: "1.01" });
    expect(table.rows[2]?.cells[1]).toEqual({ kind: "decimal", exact: "0", display: "0.00" });
    expect(table.rows[1]?.cells[1]).toEqual({ kind: "null" });
    rerender(<NationalMetricCards observation={syntheticObservations[2]} />);
    expect(screen.getAllByText("0.00")).toHaveLength(2);
    rerender(<NationalMetricCards observation={syntheticObservations[3]} />);
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
  });
  it("rejects nonexistent calendar dates and reversed ranges without timezone conversion", () => {
    expect(validCalendarDate("2026-02-29")).toBe(false);
    expect(validCalendarDate("2024-02-29")).toBe(true);
    expect(validCalendarDate("2026-09-01")).toBe(true);
    expect(validRange({ start: "2026-09-03", end: "2026-09-01" })).toBe(false);
  });
  it("breaks lines across explicit and omitted dates, never treats unavailable as zero", () => {
    expect(plotSegments(syntheticObservations, "calculatedPercentage").map((segment) => segment.map((point) => point.date))).toEqual([["2026-09-01"], ["2026-09-03"]]);
    expect(plotSegments(syntheticObservations.filter((row) => row.date !== "2026-09-02"), "calculatedPercentage")).toHaveLength(2);
  });
  it("supports keyboard comparison and exact accessible tooltip/table alternative", async () => {
    const user = userEvent.setup();
    render(<NationalTrend series={{ range: { start: "2026-09-01", end: "2026-09-04" }, coverage: { status: "unavailable" }, provenance: { source: "Synthetic", snapshotId: "fixture" }, observations: syntheticObservations }} />);
    const checkbox = screen.getByRole("checkbox", { name: "Compare EIA reported %" });
    checkbox.focus(); await user.keyboard(" "); expect(checkbox).toBeChecked();
    await user.selectOptions(screen.getByLabelText("Inspect observation"), "2026-09-01");
    expect(screen.getByText("Calculated offline: 1.01%")).toBeVisible();
    expect(screen.getByText("EIA reported: 1.01%")).toBeVisible();
    await user.selectOptions(screen.getByLabelText("Inspect observation"), "2026-09-03");
    expect(screen.getByText("Calculated offline: 0.00%")).toBeVisible();
  });
  it("ignores earlier ranges and emits only current authorized intent", async () => {
    const { runtime, fixture } = setup("analyst"); const user = userEvent.setup(); const intents: NavigationIntent[] = [];
    const deferred = fixture.deferNext("readNationalSeries");
    const view = render(<SessionProvider runtime={runtime}><OverviewFeature operations={fixture.operations} runtime={runtime} onNavigate={(intent) => { intents.push(intent); }} /></SessionProvider>);
    await waitFor(() => { expect(screen.getByLabelText("End date")).toHaveValue("2026-09-04"); });
    // Changing to a newer valid selection dispatches independently of the lost old request.
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
    await screen.findByRole("table", { name: "Daily national observations" });
    await act(async () => { deferred.release(); await Promise.resolve(); });
    expect(screen.queryByRole("cell", { name: "2026-09-04" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Explore dataset" }));
    expect(intents[0]).toMatchObject({ target: "explorer", datasetId: "synthetic-national", generation: runtime.getSnapshot().generation, filters: { dates: { start: "2026-09-01", end: "2026-09-03" } } });
    act(() => { runtime.invalidate(); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument(); view.unmount(); runtime.dispose();
  });
  it("starts with backend coverage and permits open or out-of-coverage bounds", async () => {
    const { runtime, fixture } = setup();
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(screen.getByLabelText("Start date")).toHaveValue("2026-09-01");
    expect(screen.getByLabelText("Start date")).not.toHaveAttribute("min");
    const before = fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries").length;
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-08-31" } });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries")).toHaveLength(before + 1);
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "" } });
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries").at(-1)?.input).toEqual({ end: "2026-09-04" });
    view.unmount(); runtime.dispose();
  });
  it("withholds protected content and requests for capability denial", () => {
    const { runtime, fixture } = setup();
    const resolution = fixture.sessionResolution();
    if (resolution.status !== "authenticated") throw new Error("Synthetic authenticated setup required");
    runtime.setResolution({ ...resolution, session: { ...resolution.session, capabilities: { ...resolution.session.capabilities, canReadNationalSeries: false } } });
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    expect(screen.getByText("National data access denied")).toBeVisible();
    expect(fixture.callLog.read()).toEqual([]);
    view.unmount(); runtime.dispose();
  });
  it("rejects a retained dataset action after a new identity generation", async () => {
    const { runtime, fixture } = setup(); const intents: NavigationIntent[] = [];
    const hook = renderHook(() => useOverview(fixture.operations, (intent) => { intents.push(intent); }), { wrapper: ({ children }) => <SessionProvider runtime={runtime}>{children}</SessionProvider> });
    await waitFor(() => { expect(hook.result.current.series).not.toBeNull(); });
    const staleAction = hook.result.current.explore;
    act(() => { hook.result.current.changeRange({ start: "2026-09-01", end: "2026-09-03" }); staleAction(); });
    expect(intents).toEqual([]);
    await waitFor(() => { expect(hook.result.current.series).not.toBeNull(); });
    const staleIdentityAction = hook.result.current.explore;
    act(() => { runtime.setResolution(fixture.sessionResolution()); staleIdentityAction(); });
    expect(intents).toEqual([]);
    hook.unmount(); runtime.dispose();
  });
  it("does not let an old-range unauthenticated failure invalidate the current session before rerender", async () => {
    const { runtime, fixture } = setup();
    const delayed = fixture.deferNext("readNationalSeries");
    fixture.failNext("readNationalSeries", { kind: "unauthenticated", message: "Old range error" });
    const hook = renderHook(() => useOverview(fixture.operations), { wrapper: ({ children }) => <SessionProvider runtime={runtime}>{children}</SessionProvider> });
    await waitFor(() => { expect(fixture.callLog.read().some((entry) => entry.operation === "readNationalSeries")).toBe(true); });
    await act(async () => { hook.result.current.changeRange({ start: "2026-09-01", end: "2026-09-03" }); delayed.release(); await Promise.resolve(); });
    expect(runtime.getSnapshot().status).toBe("authenticated");
    await waitFor(() => { expect(hook.result.current.series?.range.end).toBe("2026-09-03"); });
    hook.unmount(); runtime.dispose();
  });
  it("discards delayed protected data following logout", async () => {
    const { runtime, fixture } = setup(); const deferred = fixture.deferNext("readNationalSeries");
    const view = render(<SessionProvider runtime={runtime}><OverviewFeature operations={fixture.operations} runtime={runtime} /></SessionProvider>);
    await waitFor(() => { expect(fixture.callLog.read().some((entry) => entry.operation === "readNationalSeries")).toBe(true); });
    act(() => { runtime.invalidate(); });
    await act(async () => { deferred.release(); await Promise.resolve(); });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Sign in to view national observations")).toBeVisible(); view.unmount(); runtime.dispose();
  });
});
