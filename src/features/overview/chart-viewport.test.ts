import { describe, expect, it, vi } from "vitest";
import { chartZoomAvailability, moveChartWindow, resetChartWindow, resolveChartWindow, zoomChartWindow, type ChartWindow } from "./chart-viewport";
import { dayCoordinate } from "./presentation";

const full: ChartWindow = Object.freeze({ start: "2026-01-01", end: "2026-12-31" });
const narrow: ChartWindow = Object.freeze({ start: "2026-06-01", end: "2026-06-30" });
const days = (window: ChartWindow) => dayCoordinate(window.end) - dayCoordinate(window.start) + 1;

describe("chart calendar windows", () => {
  it("resolves open bounds using only eligible dates without sorting or mutating input", () => {
    const observations = Object.freeze([
      Object.freeze({ date: "2026-10-01" }), Object.freeze({ date: "2026-01-01" }), Object.freeze({ date: "2026-06-15" }),
    ]);
    expect(resolveChartWindow({}, observations)).toEqual({ start: "2026-01-01", end: "2026-10-01" });
    expect(resolveChartWindow({ start: "2026-05-01" }, observations)).toEqual({ start: "2026-05-01", end: "2026-10-01" });
    expect(resolveChartWindow({ end: "2026-07-01" }, observations)).toEqual({ start: "2026-01-01", end: "2026-07-01" });
    expect(resolveChartWindow(full, observations)).toEqual(full);
    expect(observations.map((row) => row.date)).toEqual(["2026-10-01", "2026-01-01", "2026-06-15"]);
  });

  it("preserves explicitly selected empty dates but refuses to invent missing bounds", () => {
    expect(resolveChartWindow(full, [])).toEqual(full);
    expect(resolveChartWindow({}, [])).toBeNull();
    expect(resolveChartWindow({ start: "2027-01-01" }, [{ date: "2026-12-31" }])).toBeNull();
    expect(resolveChartWindow({ end: "2025-12-31" }, [{ date: "2026-01-01" }])).toBeNull();
  });

  it("rejects invalid, reversed and nonexistent dates instead of normalizing them", () => {
    for (const range of [
      { start: "2026-02-29", end: "2026-03-31" },
      { start: "2026-01-01", end: "2026-04-31" },
      { start: "2026-12-31", end: "2026-01-01" },
      { start: "2026-01-01T00:00:00Z" },
    ]) expect(resolveChartWindow(range, [])).toBeNull();
    expect(resolveChartWindow({}, [{ date: "bad-date" }])).toBeNull();
  });

  it.each([1, 14, 15])("keeps a full %i-day range intact at the minimum", (count) => {
    const window = { start: "2026-01-01", end: `2026-01-${String(count).padStart(2, "0")}` };
    expect(zoomChartWindow(window, window, 0.1, 0)).toEqual(window);
    expect(zoomChartWindow(window, window, 10, 1)).toEqual(window);
    expect(moveChartWindow(window, window, 100)).toEqual(window);
    expect(chartZoomAvailability(window, window)).toEqual({ canZoomIn: false, canZoomOut: false });
  });

  it("stops at 15 inclusive days and restores the exact full range", () => {
    const minimum = zoomChartWindow(full, narrow, 0.01);
    expect(days(minimum)).toBe(15);
    expect(zoomChartWindow(full, minimum, 0.8)).toEqual(minimum);
    expect(chartZoomAvailability(full, minimum)).toEqual({ canZoomIn: false, canZoomOut: true });
    expect(zoomChartWindow(full, minimum, 100)).toEqual(full);
    expect(resetChartWindow(full)).toEqual(full);
    expect(chartZoomAvailability(full, full)).toEqual({ canZoomIn: true, canZoomOut: false });
  });

  it("makes one-day progress for a rounded zoom step without violating limits", () => {
    expect(days(zoomChartWindow(full, narrow, 0.9999))).toBe(29);
    expect(days(zoomChartWindow(full, narrow, 1.0001))).toBe(31);
    expect(zoomChartWindow(full, narrow, 1)).toEqual(narrow);
  });

  it("anchors interior dates to within one day across different zoom sizes", () => {
    for (const anchor of [0, 0.1, 0.5, 0.73, 1]) {
      for (const factor of [0.01, 0.8, 1.25, 2]) {
        const result = zoomChartWindow(full, narrow, factor, anchor);
        const before = dayCoordinate(narrow.start) + (days(narrow) - 1) * anchor;
        const after = dayCoordinate(result.start) + (days(result) - 1) * anchor;
        expect(Math.abs(after - before)).toBeLessThanOrEqual(1);
        expect(result.start >= full.start && result.end <= full.end).toBe(true);
      }
    }
  });

  it("translates zoomed edge windows instead of clipping their requested span", () => {
    const left = { start: "2026-01-01", end: "2026-01-30" };
    const right = { start: "2026-12-02", end: "2026-12-31" };
    expect(zoomChartWindow(full, left, 2, 1)).toEqual({ start: "2026-01-01", end: "2026-03-01" });
    expect(zoomChartWindow(full, right, 2, 0)).toEqual({ start: "2026-11-02", end: "2026-12-31" });
  });

  it("moves the same calendar span through sparse data and clamps at both bounds", () => {
    const resolved = resolveChartWindow(full, [{ date: full.start }, { date: full.end }]);
    expect(resolved).toEqual(full);
    expect(moveChartWindow(full, narrow, 10)).toEqual({ start: "2026-06-11", end: "2026-07-10" });
    expect(moveChartWindow(full, narrow, -10)).toEqual({ start: "2026-05-22", end: "2026-06-20" });
    for (const delta of [-1e10, -300, -1, 0, 1, 300, 1e10]) {
      const moved = moveChartWindow(full, narrow, delta);
      expect(days(moved)).toBe(30);
      expect(moved.start >= full.start && moved.end <= full.end).toBe(true);
    }
    expect(moveChartWindow(full, narrow, -1e10).start).toBe(full.start);
    expect(moveChartWindow(full, narrow, 1e10).end).toBe(full.end);
  });

  it("leaves the current view unchanged for invalid gesture geometry", () => {
    for (const factor of [NaN, Infinity, -Infinity, 0, -1]) expect(zoomChartWindow(full, narrow, factor)).toEqual(narrow);
    for (const anchor of [NaN, Infinity, -0.1, 1.1]) expect(zoomChartWindow(full, narrow, 0.8, anchor)).toEqual(narrow);
    for (const delta of [NaN, Infinity, -Infinity]) expect(moveChartWindow(full, narrow, delta)).toEqual(narrow);
    const invalid = { start: "2026-02-30", end: "2026-03-31" };
    expect(zoomChartWindow(invalid, narrow, 0.8)).toEqual(narrow);
    expect(moveChartWindow(full, invalid, 10)).toEqual(invalid);
    expect(chartZoomAvailability(full, invalid)).toEqual({ canZoomIn: false, canZoomOut: false });
  });

  it.each(["UTC", "America/New_York", "Pacific/Auckland"])("preserves leap days and daylight-saving dates in %s", (timezone) => {
    vi.stubEnv("TZ", timezone);
    try {
      const leap = { start: "2024-02-20", end: "2024-03-05" };
      expect(days(leap)).toBe(15);
      expect(moveChartWindow({ start: "2024-01-01", end: "2024-12-31" }, leap, 9)).toEqual({ start: "2024-02-29", end: "2024-03-14" });
      expect(moveChartWindow(full, { start: "2026-03-01", end: "2026-03-15" }, 7)).toEqual({ start: "2026-03-08", end: "2026-03-22" });
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("retains four-digit years including zero at the calendar extremes", () => {
    const earliest = { start: "0000-01-01", end: "0000-12-31" };
    const latest = { start: "9999-01-01", end: "9999-12-31" };
    expect(moveChartWindow(earliest, { start: "0000-02-20", end: "0000-03-05" }, 9)).toEqual({ start: "0000-02-29", end: "0000-03-14" });
    expect(zoomChartWindow(latest, latest, 0.01, 1)).toEqual({ start: "9999-12-17", end: "9999-12-31" });
  });
});
