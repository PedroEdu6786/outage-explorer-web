import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { syntheticZoomSeries } from "../../../tests/fixtures/overview-zoom";
import { createFixtureOperations } from "../../../tests/fixtures/operations";
import { NationalTrend } from "./NationalTrend";
import { dayCoordinate } from "./presentation";

const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;
let transform = { scale: 1, left: 0, top: 0 };
let missingGeometry = false;
const captures = new Set<number>();

beforeEach(() => {
  frames.clear(); captures.clear(); frameId = 0;
  transform = { scale: 1, left: 0, top: 0 }; missingGeometry = false;
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++frameId, callback); return frameId; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => { frames.delete(id); });
  Object.defineProperties(SVGSVGElement.prototype, {
    getScreenCTM: { configurable: true, value: () => missingGeometry ? null : { inverse: () => transform } },
    createSVGPoint: { configurable: true, value: () => ({ x: 0, y: 0, matrixTransform(this: { x: number; y: number }, matrix: typeof transform) {
      return { x: (this.x - matrix.left) / matrix.scale, y: (this.y - matrix.top) / matrix.scale };
    } }) },
    setPointerCapture: { configurable: true, value: (id: number) => { captures.add(id); } },
    hasPointerCapture: { configurable: true, value: (id: number) => captures.has(id) },
    releasePointerCapture: { configurable: true, value: (id: number) => { captures.delete(id); } },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  for (const name of ["getScreenCTM", "createSVGPoint", "setPointerCapture", "hasPointerCapture", "releasePointerCapture"]) {
    Reflect.deleteProperty(SVGSVGElement.prototype, name);
  }
});

function flushFrame() {
  act(() => { const pending = [...frames.values()]; frames.clear(); for (const callback of pending) callback(0); });
}
function chart() { return screen.getByRole("img"); }
function region() { return screen.getByRole("region", { name: "National trend: scrollable chart" }); }
function toggle() { fireEvent.click(screen.getByRole("checkbox", { name: "Zoom mode" })); }
function zoomIn() { fireEvent.click(screen.getByRole("button", { name: "Zoom in" })); }
function dates() {
  const label = screen.getByText(/^Visible dates:/).textContent;
  const found = /(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/.exec(label);
  if (!found?.[1] || !found[2]) throw new Error("Resolved visible dates required");
  return { start: found[1], end: found[2], days: dayCoordinate(found[2]) - dayCoordinate(found[1]) + 1 };
}
function wheel(options: WheelEventInit = {}) {
  const event = new WheelEvent("wheel", { bubbles: true, cancelable: true, clientX: 465, clientY: 150, deltaY: -100, ...options });
  act(() => { chart().dispatchEvent(event); });
  return event;
}
function pointer(type: string, options: Partial<PointerEvent> = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerType: "touch", pointerId: 1, clientX: 500, clientY: 150, ...options });
  act(() => { chart().dispatchEvent(event); });
  return event;
}
function key(key: string, options: KeyboardEventInit = {}) {
  fireEvent.keyDown(region(), { key, ...options });
}

describe("connected national chart viewport", () => {
  it("starts disabled, retains zoom on disable and resets without changing mode or SVG identity", () => {
    render(<NationalTrend series={syntheticZoomSeries()} />);
    const svg = chart();
    expect(screen.getByRole("checkbox", { name: "Zoom mode" })).not.toBeChecked();
    expect(wheel().defaultPrevented).toBe(false); flushFrame(); expect(dates().days).toBe(365);
    toggle(); zoomIn(); expect(dates().days).toBeLessThan(365);
    const narrowed = dates(); toggle();
    expect(wheel().defaultPrevented).toBe(false); flushFrame();
    region().focus(); key("+"); key("ArrowRight"); zoomIn();
    expect(dates()).toEqual(narrowed);
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(dates().days).toBe(365);
    expect(screen.getByRole("checkbox", { name: "Zoom mode" })).not.toBeChecked();
    expect(chart()).toBe(svg);
  });

  it("coalesces fine wheel input across frames, maps transformed anchors and preserves browser inputs", () => {
    render(<NationalTrend series={syntheticZoomSeries()} />); toggle();
    const original = dates();
    for (let index = 0; index < 3; index += 1) { expect(wheel({ deltaY: -1 }).defaultPrevented).toBe(true); flushFrame(); }
    expect(dates()).toEqual(original);
    wheel({ deltaY: -1 }); flushFrame(); expect(dates().days).toBeLessThan(365);
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" }));
    transform = { scale: 1.5, left: -240, top: 50 };
    const clientX = transform.left + (60 + 810 * 0.25) * transform.scale;
    wheel({ clientX, clientY: 200, deltaY: -100 }); wheel({ clientX, clientY: 200, deltaY: -100 });
    expect(frames.size).toBe(1); expect(dates().days).toBe(365);
    flushFrame();
    const zoomed = dates();
    expect(Math.abs(dayCoordinate(zoomed.start) + (zoomed.days - 1) * 0.25 - dayCoordinate(original.start) - 364 * 0.25)).toBeLessThanOrEqual(1);
    for (const options of [{ ctrlKey: true }, { metaKey: true }, { cancelable: false }, { clientX: -900 }]) {
      expect(wheel(options).defaultPrevented).toBe(false);
    }
    missingGeometry = true; expect(wheel().defaultPrevented).toBe(false); flushFrame(); expect(dates()).toEqual(zoomed);
  });

  it("uses dominant horizontal wheel for fixed-span movement and normalizes line/page deltas", () => {
    render(<NationalTrend series={syntheticZoomSeries()} />); toggle(); zoomIn(); zoomIn();
    const before = dates();
    wheel({ deltaX: 40, deltaY: 1 }); flushFrame();
    expect(dates().days).toBe(before.days); expect(dates().start > before.start).toBe(true);
    const moved = dates(); wheel({ deltaX: -1, deltaY: 0, deltaMode: 1 }); flushFrame();
    expect(dates().start < moved.start).toBe(true);
    wheel({ deltaY: -1, deltaMode: 1 }); flushFrame(); expect(dates().days).toBeLessThan(before.days);
    Object.defineProperty(region(), "clientHeight", { configurable: true, value: 300 });
    const small = dates(); wheel({ deltaY: 1, deltaMode: 2 }); flushFrame(); expect(dates().days).toBeGreaterThan(small.days);
  });

  it("limits zoom and pan, consuming owned wheel at the limit, and preserves short full ranges", () => {
    const series = syntheticZoomSeries();
    const view = render(<NationalTrend series={series} />); toggle();
    for (let i = 0; i < 20; i += 1) zoomIn();
    expect(dates().days).toBe(15); expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(wheel().defaultPrevented).toBe(true); flushFrame(); expect(dates().days).toBe(15);
    wheel({ deltaX: 1e6, deltaY: 0 }); flushFrame(); expect(dates().end).toBe("2026-12-31");
    wheel({ deltaX: -1e6, deltaY: 0 }); flushFrame(); expect(dates().start).toBe("2026-01-01");
    view.rerender(<NationalTrend series={series} range={{ start: "2026-06-01", end: "2026-06-14" }} />); toggle(); zoomIn();
    expect(dates().days).toBe(14); expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  });

  it("limits shortcuts to actual chart focus while keeping native button/toggle keyboard access", async () => {
    const user = userEvent.setup(); render(<NationalTrend series={syntheticZoomSeries()} />);
    screen.getByRole("checkbox", { name: "Zoom mode" }).focus(); await user.keyboard(" ");
    const initial = dates(); key("+"); expect(dates()).toEqual(initial);
    region().focus(); key("+"); const zoomed = dates(); expect(zoomed.days).toBeLessThan(initial.days);
    key("ArrowRight"); expect(dates().start > zoomed.start).toBe(true); expect(dates().days).toBe(zoomed.days);
    key("ArrowLeft"); expect(dates()).toEqual(zoomed);
    key("-", { ctrlKey: true }); key("+", { metaKey: true }); expect(dates()).toEqual(zoomed);
    const child = document.createElement("input"); region().append(child); child.focus(); fireEvent.keyDown(child, { key: "+" });
    expect(dates()).toEqual(zoomed); child.remove();
    screen.getByRole("combobox").focus(); fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowRight" }); expect(dates()).toEqual(zoomed);
    region().focus(); key("-"); expect(dates().days).toBeGreaterThan(zoomed.days);
    screen.getByRole("button", { name: "Zoom in" }).focus(); await user.keyboard("{Enter}"); expect(dates().days).toBeLessThan(initial.days);
  });

  it("pans on horizontal touch intent but yields vertical and multi-touch gestures", () => {
    render(<NationalTrend series={syntheticZoomSeries()} />); toggle(); zoomIn(); zoomIn();
    expect(chart()).toHaveStyle({ touchAction: "pan-y pinch-zoom" });
    const before = dates(); pointer("pointerdown");
    expect(pointer("pointermove", { clientX: 497, clientY: 154 }).defaultPrevented).toBe(false);
    expect(pointer("pointermove", { clientX: 400 }).defaultPrevented).toBe(true); flushFrame();
    expect(dates().start > before.start).toBe(true); expect(dates().days).toBe(before.days);
    pointer("pointerup"); expect(captures.size).toBe(0);
    const moved = dates(); pointer("pointerdown");
    expect(pointer("pointermove", { clientX: 498, clientY: 180 }).defaultPrevented).toBe(false);
    pointer("pointermove", { clientX: 200, clientY: 180 }); flushFrame(); expect(dates()).toEqual(moved);
    pointer("pointerup"); pointer("pointerdown"); pointer("pointermove", { clientX: 450 });
    pointer("pointerdown", { pointerId: 2 }); flushFrame(); expect(dates()).toEqual(moved);
    expect(pointer("pointermove", { clientX: 200 }).defaultPrevented).toBe(false);
    pointer("pointerup", { pointerId: 2 }); pointer("pointerup");
    toggle(); expect(chart()).toHaveStyle({ touchAction: "auto" });
  });

  it.each(["pointercancel", "lostpointercapture"])("discards captured pending movement on %s without replay", (event) => {
    render(<NationalTrend series={syntheticZoomSeries()} />); toggle(); zoomIn();
    const before = dates(); pointer("pointerdown"); pointer("pointermove", { clientX: 450 });
    expect(frames.size).toBe(1); pointer(event); flushFrame(); expect(dates()).toEqual(before);
    expect(captures.size).toBe(0);
    pointer("pointerdown"); pointer("pointermove", { clientX: 499 }); flushFrame(); expect(dates()).toEqual(before);
  });

  it("invalidates pending frames and fine deltas on reset, disable, unavailable, bounds change and unmount", () => {
    const series = syntheticZoomSeries(); const view = render(<NationalTrend series={series} />); toggle(); zoomIn();
    wheel(); fireEvent.click(screen.getByRole("button", { name: "Reset zoom" })); flushFrame(); expect(dates().days).toBe(365);
    wheel({ deltaY: -3 }); flushFrame(); toggle(); toggle(); wheel({ deltaY: -1 }); flushFrame(); expect(dates().days).toBe(365);
    wheel(); view.rerender(<NationalTrend series={series} interactive={false} />); flushFrame(); expect(dates().days).toBe(365);
    expect(screen.getByRole("checkbox", { name: "Zoom mode" })).toBeDisabled(); expect(wheel().defaultPrevented).toBe(false);
    view.rerender(<NationalTrend series={series} />); wheel({ deltaY: -1 }); flushFrame(); expect(dates().days).toBe(365);
    wheel(); view.rerender(<NationalTrend series={series} range={{ start: "2026-03-01", end: "2026-03-31" }} />); flushFrame();
    expect(dates()).toEqual({ start: "2026-03-01", end: "2026-03-31", days: 31 }); expect(screen.getByRole("checkbox", { name: "Zoom mode" })).not.toBeChecked();
    toggle(); wheel(); view.unmount(); expect(frames.size).toBe(0);
  });

  it("preserves compare values, zero and gaps, aligns inspection, clears departed selection and keeps SVG/vertical scale", () => {
    const series = syntheticZoomSeries(); const original = structuredClone(series);
    const { container } = render(<NationalTrend series={series} range={{ start: "2026-06-01", end: "2026-06-30" }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Compare EIA reported %" }));
    const svg = chart(); const grid = [...svg.querySelectorAll("text")].slice(0, 4).map((node) => node.textContent);
    expect(svg.querySelectorAll("g[data-series=calculated] polyline").length).toBeGreaterThan(1);
    expect(svg).toHaveTextContent("2026-06-09: Calculated 1.01%"); expect(svg).toHaveTextContent("2026-06-11: Calculated 0.00%");
    expect(svg).not.toHaveTextContent("2026-06-12:"); expect(svg).not.toHaveTextContent("2026-06-10:");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2026-06-01" } });
    expect(screen.getByRole("status")).toHaveTextContent("2026-06-01"); toggle(); zoomIn();
    expect(screen.queryByRole("status")).toBeNull(); expect(screen.getByRole("combobox")).toHaveValue("");
    expect([...svg.querySelectorAll("text")].slice(0, 4).map((node) => node.textContent)).toEqual(grid);
    const visible = dates();
    expect(svg).toHaveTextContent("2026-06-09: Calculated 1.01%");
    expect(svg).toHaveTextContent("2026-06-11: Calculated 0.00%");
    expect(svg).not.toHaveTextContent("2026-06-13: Calculated");
    expect(svg).not.toHaveTextContent("2026-06-14: EIA reported");
    const zeroPositions = [...svg.querySelectorAll("circle")].filter((circle) => circle.textContent.startsWith("2026-06-11:"));
    expect(zeroPositions).toHaveLength(2);
    expect(zeroPositions[0]?.getAttribute("cx")).toBe(zeroPositions[1]?.getAttribute("cx"));
    for (const option of within(screen.getByRole("combobox")).getAllByRole("option").slice(1)) {
      expect(option.textContent >= visible.start && option.textContent <= visible.end).toBe(true);
    }
    fireEvent.click(screen.getByRole("button", { name: "Reset zoom" })); expect(screen.queryByRole("status")).toBeNull();
    expect(chart()).toBe(svg); expect(container.querySelectorAll(".animate-chart-wipe")).toHaveLength(1); expect(series).toEqual(original);
  });

  it("keeps the same SVG and controls across a zoomed empty gap, allowing pan and reset recovery", () => {
    render(<NationalTrend series={syntheticZoomSeries()} range={{ start: "2026-06-15", end: "2026-08-15" }} />);
    const svg = chart(); toggle(); for (let i = 0; i < 8; i += 1) zoomIn();
    expect(screen.getByText("No observations in this chart range")).toBeVisible(); expect(chart()).toBe(svg);
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
    wheel({ deltaX: 1e5, deltaY: 0 }); flushFrame(); expect(screen.queryByText("No observations in this chart range")).toBeNull();
    expect(chart()).toBe(svg); fireEvent.click(screen.getByRole("button", { name: "Reset zoom" })); expect(dates().days).toBe(62);
  });

  it("keeps two-year data unaggregated and preserves opt-in fixture coverage, failures and deferred reads", async () => {
    const series = syntheticZoomSeries(2); const fixture = createFixtureOperations({ nationalSeries: series, persona: "viewer" });
    const context = { generation: 0, signal: new AbortController().signal };
    const catalog = await fixture.operations.listDatasets(context); expect(catalog.ok && catalog.value[0]?.coverage).toEqual(series.coverage);
    const held = fixture.deferNext("readNationalSeries"); const read = fixture.operations.readNationalSeries(context, {}); held.release();
    const result = await read; expect(result.ok && result.value.observations).toEqual(series.observations);
    fixture.failNext("readNationalSeries", { kind: "service-failure", message: "Synthetic failure" });
    expect((await fixture.operations.readNationalSeries(context, {})).ok).toBe(false);
    render(<NationalTrend series={series} />); expect(dates().days).toBe(730);
    expect(within(screen.getByRole("combobox")).getAllByRole("option")).toHaveLength(series.observations.length + 1);
    toggle(); zoomIn(); expect(dates().days).toBeLessThan(730);
    const defaults = createFixtureOperations(); const defaultSeries = await defaults.operations.readNationalSeries(context, {});
    expect(defaultSeries.ok && defaultSeries.value.observations).toHaveLength(4);
  });
});
