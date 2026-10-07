import type { DateBounds, DateRange } from "../../contracts/catalog";
import type { CalendarDate } from "../../contracts/table";
import { isCalendarDate } from "../../lib/calendar-date";
import { dayCoordinate } from "./presentation";

export type ChartWindow = DateRange;

export const MINIMUM_CHART_DAYS = 15;
const MILLISECONDS_PER_DAY = 86_400_000;

function validWindow(window: ChartWindow): boolean {
  return isCalendarDate(window.start) && isCalendarDate(window.end) && window.start <= window.end;
}

function dayCount(window: ChartWindow): number {
  return dayCoordinate(window.end) - dayCoordinate(window.start) + 1;
}

function containedWindow(full: ChartWindow, window: ChartWindow): boolean {
  return validWindow(full)
    && validWindow(window)
    && window.start >= full.start
    && window.end <= full.end;
}

function calendarDate(day: number): CalendarDate {
  return new Date(day * MILLISECONDS_PER_DAY).toISOString().slice(0, 10);
}

/** Missing bounds use eligible observation dates; explicit bounds may include gaps. */
export function resolveChartWindow(
  range: DateBounds,
  observations: readonly { readonly date: CalendarDate }[],
): ChartWindow | null {
  if (
    (range.start !== undefined && !isCalendarDate(range.start))
    || (range.end !== undefined && !isCalendarDate(range.end))
    || (range.start !== undefined && range.end !== undefined && range.start > range.end)
  ) return null;

  let earliest: CalendarDate | undefined;
  let latest: CalendarDate | undefined;
  for (const { date } of observations) {
    if (!isCalendarDate(date)) return null;
    if (
      (range.start !== undefined && date < range.start)
      || (range.end !== undefined && date > range.end)
    ) continue;
    if (earliest === undefined || date < earliest) earliest = date;
    if (latest === undefined || date > latest) latest = date;
  }

  const start = range.start ?? earliest;
  const end = range.end ?? latest;
  return start !== undefined && end !== undefined ? { start, end } : null;
}

/** Integer day bounds are translated together, preserving span at either edge. */
function positionWindow(full: ChartWindow, requestedStart: number, days: number): ChartWindow {
  const start = Math.max(dayCoordinate(full.start), Math.min(requestedStart, dayCoordinate(full.end) - days + 1));
  return { start: calendarDate(start), end: calendarDate(start + days - 1) };
}

/** A factor below one narrows; the anchor is the fractional position across the plot. */
export function zoomChartWindow(
  full: ChartWindow,
  window: ChartWindow,
  factor: number,
  anchor = 0.5,
): ChartWindow {
  if (
    !containedWindow(full, window)
    || !Number.isFinite(factor) || factor <= 0
    || !Number.isFinite(anchor) || anchor < 0 || anchor > 1
    || factor === 1
  ) return window;

  const currentDays = dayCount(window);
  const fullDays = dayCount(full);
  const direction = factor < 1 ? -1 : 1;
  const scaledDays = Math.round(currentDays * factor);
  const requestedDays = scaledDays === currentDays ? currentDays + direction : scaledDays;
  const days = Math.max(Math.min(MINIMUM_CHART_DAYS, fullDays), Math.min(requestedDays, fullDays));
  if (days === currentDays) return window;

  const anchoredDay = dayCoordinate(window.start) + (currentDays - 1) * anchor;
  return positionWindow(full, Math.round(anchoredDay - (days - 1) * anchor), days);
}

export function moveChartWindow(full: ChartWindow, window: ChartWindow, displacementDays: number): ChartWindow {
  if (!containedWindow(full, window) || !Number.isFinite(displacementDays)) return window;
  return positionWindow(full, dayCoordinate(window.start) + Math.round(displacementDays), dayCount(window));
}

export function resetChartWindow(full: ChartWindow): ChartWindow {
  return full;
}

export function chartZoomAvailability(
  full: ChartWindow,
  window: ChartWindow,
): { readonly canZoomIn: boolean; readonly canZoomOut: boolean } {
  if (!containedWindow(full, window)) return { canZoomIn: false, canZoomOut: false };
  const days = dayCount(window);
  return { canZoomIn: days > Math.min(MINIMUM_CHART_DAYS, dayCount(full)), canZoomOut: days < dayCount(full) };
}
