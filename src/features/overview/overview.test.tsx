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
import { DailyObservations } from "./DailyObservations";
import { NationalTrend } from "./NationalTrend";
import { observationTable, plotSegments } from "./presentation";
import { validCalendarDate, validRange } from "./service";
import type { NavigationIntent } from "../../contracts/navigation";
import type { NationalObservation } from "../../contracts/observations";

function setup(persona: "viewer" | "analyst" = "viewer") {
  const fixture = createFixtureOperations({ persona });
  const runtime = createSessionRuntime();
  runtime.setResolution(fixture.sessionResolution());
  return { fixture, runtime };
}
describe("Overview exact observation behavior", () => {
  it("truncates long MW displays in cards and daily rows without losing exact precision", () => {
    const observation: NationalObservation = {
      status: "available", date: "2026-09-01",
      outageMw: { exact: "1234.56789", display: "1234.56789" },
      capacityMw: { exact: "9007199254740993.99999", display: "9007199254740993.99999" },
      calculatedPercentage: { exact: "1.005", display: "1.01" },
      reportedPercentage: { exact: "1.005", display: "1.01" },
    };
    render(<><NationalMetricCards observation={observation} /><DailyObservations observations={[observation]} /></>);
    expect(screen.getAllByText("1234.56")).toHaveLength(2);
    expect(screen.getAllByText("9007199254740993.99")).toHaveLength(2);
    expect(screen.queryByText("1234.56789")).toBeNull();
    expect(screen.getAllByText("1.01")).toHaveLength(3);
    expect(observationTable([observation]).rows[0]?.cells[2]).toEqual({ kind: "decimal", exact: "1234.56789", display: "1234.56" });
    expect(observation.outageMw?.display).toBe("1234.56789");
  });
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
  it("uses the selected chart window for points, both series and inspection even when the supplied data is broader", async () => {
    const user = userEvent.setup();
    const series = { range: { start: "2026-09-01", end: "2026-09-04" }, coverage: { status: "unavailable" as const }, provenance: { source: "Synthetic", snapshotId: "fixture" }, observations: syntheticObservations };
    const { container, rerender } = render(<NationalTrend series={series} />);
    await user.click(screen.getByRole("checkbox", { name: "Compare EIA reported %" }));
    await user.selectOptions(screen.getByLabelText("Inspect observation"), "2026-09-01");
    rerender(<NationalTrend series={series} range={{ start: "2026-09-02", end: "2026-09-03" }} />);
    expect(container.querySelector("svg")).toHaveTextContent("2026-09-02");
    expect(container.querySelector("svg")).toHaveTextContent("2026-09-03");
    expect(screen.queryByRole("option", { name: "2026-09-01" })).toBeNull();
    expect(screen.queryByRole("option", { name: "2026-09-04" })).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    for (const name of ["calculated", "reported"]) {
      const circles = container.querySelectorAll(`g[data-series=${name}] circle`);
      expect(circles).toHaveLength(1);
      expect(circles[0]?.querySelector("title")).toHaveTextContent("2026-09-03");
    }
    // Removing a bound restores loaded observations; dates outside them stay empty.
    rerender(<NationalTrend series={series} range={{ end: "2026-09-03" }} />);
    expect(screen.getByRole("option", { name: "2026-09-01" })).toBeVisible();
    expect(container.querySelectorAll("g[data-series=calculated] polyline")).toHaveLength(2);
    rerender(<NationalTrend series={series} range={{ start: "2027-01-01" }} />);
    expect(screen.getByText("No observations in this chart range")).toBeVisible();
    expect(container.querySelector("svg")).toBeNull();
    expect(series.observations).toEqual(syntheticObservations);
  });
  it("updates plotted dates immediately while the selected range response is held", async () => {
    const { runtime, fixture } = setup();
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(document.querySelectorAll("g[data-series=calculated] circle")).toHaveLength(2);
    const deferred = fixture.deferNext("readNationalSeries");
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await waitFor(() => { expect(screen.getByRole("status")).toHaveTextContent("Loading national observations"); });
    const chart = document.querySelector("svg[data-chart=national-trend]");
    expect(chart?.closest("[inert][aria-hidden=true]")).not.toBeNull();
    expect(chart?.querySelectorAll("g[data-series=calculated] circle")).toHaveLength(1);
    expect(chart).not.toHaveTextContent("2026-09-03");
    expect(chart?.querySelectorAll("text")[4]).toHaveTextContent("2026-09-01");
    expect(chart?.querySelectorAll("text")[5]).toHaveTextContent("2026-09-01");
    await act(async () => { deferred.release(); await Promise.resolve(); });
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(document.querySelector("[inert]")).toBeNull();
    expect(document.querySelectorAll("g[data-series=calculated] circle")).toHaveLength(1);
    view.unmount(); runtime.dispose();
  });
  it("wipes only the persistent svg: points, segments and gaps are untouched by the wipe and the compare toggle", async () => {
    const user = userEvent.setup();
    const series = { range: { start: "2026-09-01", end: "2026-09-04" }, coverage: { status: "unavailable" as const }, provenance: { source: "Synthetic", snapshotId: "fixture" }, observations: syntheticObservations };
    const { container } = render(<NationalTrend series={series} />);
    const chart = container.querySelector("svg[data-chart=national-trend]");
    if (!chart) throw new Error("Chart required");
    expect(chart).toHaveClass("animate-chart-wipe");
    expect(container.querySelectorAll(".animate-chart-wipe")).toHaveLength(1);
    const observed = () => Array.from(container.querySelectorAll("polyline[data-segment=observed]")).map((line) => line.getAttribute("points"));
    const before = observed();
    // Unavailable observations break the line into separate segments: gaps are never bridged.
    expect(before).toHaveLength(plotSegments(syntheticObservations, "calculatedPercentage").length);
    expect(before.length).toBeGreaterThan(1);
    await user.click(screen.getByRole("checkbox", { name: "Compare EIA reported %" }));
    expect(container.querySelector("g[data-series=reported]")).toHaveClass("animate-fade-in");
    // Same svg element (no remount, so no replayed wipe); the calculated segments are byte-identical and the reported ones are added.
    expect(container.querySelector("svg[data-chart=national-trend]")).toBe(chart);
    expect(Array.from(container.querySelectorAll("g[data-series=calculated] polyline")).map((line) => line.getAttribute("points"))).toEqual(before);
    expect(container.querySelectorAll("g[data-series=reported] polyline[data-segment=observed]")).toHaveLength(plotSegments(syntheticObservations, "reportedPercentage").length);
    await user.click(screen.getByRole("checkbox", { name: "Compare EIA reported %" }));
    expect(container.querySelector("svg[data-chart=national-trend]")).toBe(chart);
    expect(observed()).toEqual(before);
    fireEvent.change(screen.getByRole("combobox", { name: "Inspect observation" }), { target: { value: "2026-09-01" } });
    expect(screen.getByRole("status")).toHaveClass("animate-fade-rise");
    expect(screen.getByRole("status")).toHaveTextContent("2026-09-01Calculated offline:");
    expect(observed()).toEqual(before);
  });
  it("remounts the chart (a new wipe) when the range changes, with the same points per range", async () => {
    const { runtime, fixture } = setup(); const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    const first = document.querySelector("svg[data-chart=national-trend]");
    expect(first).not.toBeNull();
    await userEvent.setup().click(screen.getByRole("checkbox", { name: "Compare EIA reported %" }));
    expect(document.querySelector("svg[data-chart=national-trend]")).toBe(first);
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await waitFor(() => { expect(screen.getByRole("table", { name: "Daily national observations" })).toBeVisible(); });
    await waitFor(() => { expect(document.querySelector("[inert]")).toBeNull(); });
    const second = document.querySelector("svg[data-chart=national-trend]");
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);
    // The dimmed superseded chart was never a second live chart afterwards.
    expect(document.querySelectorAll("svg[data-chart=national-trend]")).toHaveLength(1);
    view.unmount(); runtime.dispose();
  });
  it("ignores earlier ranges and emits only current authorized intent", async () => {
    const { runtime, fixture } = setup("analyst"); const user = userEvent.setup(); const intents: NavigationIntent[] = [];
    const deferred = fixture.deferNext("readNationalSeries");
    const view = render(<SessionProvider runtime={runtime}><OverviewFeature operations={fixture.operations} runtime={runtime} onNavigate={(intent) => { intents.push(intent); }} /></SessionProvider>);
    await waitFor(() => { expect(screen.getByLabelText("End date")).toHaveValue("2026-09-04"); });
    // Changing to a newer valid selection dispatches independently of the lost old request.
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
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
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries")).toHaveLength(before + 1);
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries").at(-1)?.input).toEqual({ end: "2026-09-04" });
    view.unmount(); runtime.dispose();
  });
  it("keeps edits local until Apply dates and ignores invalid or unchanged submissions", async () => {
    const { runtime, fixture } = setup("analyst"); const intents: NavigationIntent[] = [];
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} onNavigate={(intent) => { intents.push(intent); }} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    const reads = () => fixture.callLog.read().filter((entry) => entry.operation === "readNationalSeries");
    const before = reads().length;
    const table = screen.getByRole("table", { name: "Daily national observations" });
    const chart = document.querySelector("svg[data-chart=national-trend]");
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-09-05" } });
    expect(screen.getByRole("button", { name: "Apply dates" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Observation dates" }));
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-10" } });
    fireEvent.change(screen.getByLabelText("Start date"), { target: { value: "2026-09-02" } });
    await act(async () => { await Promise.resolve(); });
    expect(reads()).toHaveLength(before);
    expect(screen.getByRole("table", { name: "Daily national observations" })).toBe(table);
    expect(document.querySelector("svg[data-chart=national-trend]")).toBe(chart);
    fireEvent.click(screen.getByRole("button", { name: "Explore dataset" }));
    expect(intents[0]?.filters.dates).toEqual({ start: "2026-09-01", end: "2026-09-04" });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(reads()).toHaveLength(before + 1);
    expect(reads().at(-1)?.input).toEqual({ start: "2026-09-02", end: "2026-09-10" });
    expect(screen.getByRole("button", { name: "Apply dates" })).toBeDisabled();
    fireEvent.submit(screen.getByRole("form", { name: "Observation dates" }));
    await act(async () => { await Promise.resolve(); });
    expect(reads()).toHaveLength(before + 1);
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
  it("shows skeleton cards on first load without zero or Unavailable, one announcement, then exact values", async () => {
    const { runtime, fixture } = setup(); const deferred = fixture.deferNext("readNationalSeries");
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await waitFor(() => { expect(fixture.callLog.read().some((entry) => entry.operation === "readNationalSeries")).toBe(true); });
    const banners = screen.getAllByRole("status");
    expect(banners).toHaveLength(1);
    expect(banners[0]).toHaveTextContent("Loading national observations");
    const labels = ["Fleet capacity offline", "Offline capacity", "Reported fleet capacity"];
    for (const label of labels) {
      const metric = screen.getByText(label).closest("dl");
      expect(metric).toHaveAttribute("aria-busy", "true");
      expect(metric?.querySelector("[aria-hidden=true]")).not.toBeNull();
      expect(metric).not.toHaveTextContent(/Unavailable|No observation|EIA reported|\d|%|MW/);
    }
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await act(async () => { deferred.release(); await Promise.resolve(); });
    await screen.findByRole("table", { name: "Daily national observations" });
    // The latest synthetic observation (2026-09-04) is unavailable: unchanged presentation, no skeleton left behind.
    expect(screen.getAllByText("Unavailable")).toHaveLength(3);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(document.querySelector("[aria-busy=true]")).toBeNull();
    view.unmount(); runtime.dispose();
  });
  it("dims the superseded range inert and hidden from assistive technology while a new range loads, then shows exact values", async () => {
    const { runtime, fixture } = setup(); const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByRole("table", { name: "Daily national observations" });
    const deferred = fixture.deferNext("readNationalSeries");
    fireEvent.change(screen.getByLabelText("End date"), { target: { value: "2026-09-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply dates" }));
    await waitFor(() => { expect(screen.getByRole("status")).toHaveTextContent("Loading national observations"); });
    // The retained previous range (phase 3) is dimmed, inert and absent from the accessibility tree; it is not a skeleton.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    const retained = Array.from(document.querySelectorAll("[inert][aria-hidden=true]"));
    expect(retained).toHaveLength(3);
    // Cards and trend dim to 50%; the table keeps DataTable's shared loading dim (60%).
    for (const element of retained) expect(element.className).toMatch(/opacity-(?:50|60)/);
    expect(document.querySelectorAll("dl[aria-busy=true]")).toHaveLength(0);
    expect(screen.queryByRole("button", { name: "Explore dataset" })).not.toBeInTheDocument();
    await act(async () => { deferred.release(); await Promise.resolve(); });
    await screen.findByRole("table", { name: "Daily national observations" });
    expect(screen.getAllByText("0.00").length).toBeGreaterThanOrEqual(2);
    expect(document.querySelectorAll("dl[aria-busy=true]")).toHaveLength(0);
    view.unmount(); runtime.dispose();
  });
  it("leaves the empty, unavailable and failure presentations without skeleton cards", async () => {
    for (const dataState of ["empty", "unavailable"] as const) {
      const fixture = createFixtureOperations({ persona: "viewer", dataState }); const runtime = createSessionRuntime(); runtime.setResolution(fixture.sessionResolution());
      const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
      await waitFor(() => { expect(screen.queryByRole("status")?.textContent ?? "").not.toContain("Loading national observations"); });
      expect(document.querySelectorAll("dl[aria-busy=true]")).toHaveLength(0);
      view.unmount(); runtime.dispose();
    }
    const { runtime, fixture } = setup(); fixture.failNext("readNationalSeries", { kind: "service-failure", message: "Synthetic failure" });
    const view = render(<OverviewFeature operations={fixture.operations} runtime={runtime} />);
    await screen.findByText("Synthetic failure");
    expect(document.querySelectorAll("dl[aria-busy=true]")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
    view.unmount(); runtime.dispose();
  });
});
