"use client";

import { useLayoutEffect, useRef, useState } from "react";
import type { DateBounds } from "../../contracts/catalog";
import { chartZoomAvailability, moveChartWindow, zoomChartWindow, type ChartWindow } from "./chart-viewport";
import { dayCoordinate } from "./presentation";

const PLOT = { left: 60, right: 870, top: 65, bottom: 250 };
const PLOT_WIDTH = PLOT.right - PLOT.left;
const ZOOM_STEP = 1.25;
const WHEEL_THRESHOLD = 4;
const TOUCH_THRESHOLD = 8;

/** SVG-space coordinates include CSS scaling and the scrollable ancestor offset. */
function svgPoint(svg: SVGSVGElement, x: number, y: number) {
  try {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = x;
    point.y = y;
    const mapped = point.matrixTransform(matrix.inverse());
    return Number.isFinite(mapped.x) && Number.isFinite(mapped.y) ? mapped : null;
  } catch {
    return null;
  }
}

function inPlot(point: { x: number; y: number }): boolean {
  return point.x >= PLOT.left && point.x <= PLOT.right && point.y >= PLOT.top && point.y <= PLOT.bottom;
}

interface ViewportState {
  readonly identity: string;
  readonly enabled: boolean;
  readonly window: ChartWindow | null;
}

export function useChartViewport(full: ChartWindow | null, applied: DateBounds, interactive: boolean) {
  const identity = `${applied.start ?? ""}/${applied.end ?? ""}/${full?.start ?? ""}/${full?.end ?? ""}`;
  const initial = { identity, enabled: false, window: full };
  const [stored, setStored] = useState<ViewportState>(initial);
  // Adjust before children commit, including standalone consumers without a key.
  const state = stored.identity === identity ? stored : initial;
  if (stored.identity !== identity) setStored(initial);

  const svgRef = useRef<SVGSVGElement>(null);
  const regionRef = useRef<HTMLDivElement>(null);
  const current = useRef(state);
  const cancelInput = useRef<() => void>(() => undefined);
  const available = interactive && full !== null;

  useLayoutEffect(() => { current.current = state; });

  function update(window: ChartWindow, enabled = current.current.enabled) {
    const next = { identity, enabled, window };
    current.current = next;
    setStored(next);
  }

  function setEnabled(enabled: boolean) {
    if (!available || !current.current.window) return;
    cancelInput.current();
    update(current.current.window, enabled);
  }

  function zoom(factor: number) {
    if (!available || !state.enabled || !current.current.window) return;
    cancelInput.current();
    update(zoomChartWindow(full, current.current.window, factor));
  }

  function reset() {
    if (!available) return;
    cancelInput.current();
    update(full);
  }

  useLayoutEffect(() => {
    const svg = svgRef.current;
    const region = regionRef.current;
    if (!available || !state.enabled || !svg || !region) return;
    let frame: number | null = null;
    let zoomPixels = 0;
    let movementDays = 0;
    let anchor = 0.5;
    let live = true;
    const pointers = new Set<number>();
    let gesture: { id: number; x: number; y: number; previousX: number; committed: boolean } | null = null;

    function releaseGesture() {
      const released = gesture;
      gesture = null;
      if (released && svg?.hasPointerCapture(released.id)) svg.releasePointerCapture(released.id);
    }

    function cancel() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      zoomPixels = 0;
      movementDays = 0;
      releaseGesture();
      pointers.clear();
    }
    cancelInput.current = cancel;

    function commit(window: ChartWindow) {
      if (!live) return;
      const next = { identity, enabled: true, window };
      current.current = next;
      setStored(next);
    }

    function schedule() {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const previous = current.current.window;
        if (!live || !previous || !full) return;
        let next = previous;
        if (Math.abs(zoomPixels) >= WHEEL_THRESHOLD) {
          const factor = Math.exp(Math.max(-Math.log(2), Math.min(Math.log(2), zoomPixels / 400)));
          next = zoomChartWindow(full, next, factor, anchor);
          zoomPixels = 0;
        }
        const wholeDays = Math.trunc(movementDays);
        if (wholeDays !== 0) {
          next = moveChartWindow(full, next, wholeDays);
          movementDays -= wholeDays;
        }
        if (next !== previous) commit(next);
      });
    }

    function pan(pixels: number) {
      const window = current.current.window;
      if (!window) return;
      movementDays += pixels / PLOT_WIDTH * (dayCoordinate(window.end) - dayCoordinate(window.start) + 1);
      schedule();
    }

    function wheel(event: WheelEvent) {
      if (!live || event.ctrlKey || event.metaKey || !event.cancelable || !svg) return;
      const point = svgPoint(svg, event.clientX, event.clientY);
      if (!point || !inPlot(point)) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? region?.clientHeight ?? 300 : 1;
      const dx = event.deltaX * unit;
      const dy = event.deltaY * unit;
      if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) return;
      event.preventDefault();
      if (Math.abs(dx) > Math.abs(dy)) {
        const displaced = svgPoint(svg, event.clientX + dx, event.clientY);
        if (displaced) pan(displaced.x - point.x);
      } else {
        zoomPixels += dy;
        anchor = (point.x - PLOT.left) / PLOT_WIDTH;
        schedule();
      }
    }

    function key(event: KeyboardEvent) {
      if (event.target !== region || document.activeElement !== region || event.ctrlKey || event.metaKey || event.altKey) return;
      const window = current.current.window;
      if (!window || !full) return;
      if (!["+", "-", "−", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      cancel();
      if (event.key === "+" || event.key === "-" || event.key === "−") {
        commit(zoomChartWindow(full, window, event.key === "+" ? 1 / ZOOM_STEP : ZOOM_STEP));
      } else {
        const days = Math.max(1, Math.round((dayCoordinate(window.end) - dayCoordinate(window.start) + 1) / 10));
        commit(moveChartWindow(full, window, event.key === "ArrowRight" ? days : -days));
      }
    }

    function pointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch" || !svg) return;
      pointers.add(event.pointerId);
      if (pointers.size !== 1) {
        releaseGesture();
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null;
        movementDays = 0;
        return;
      }
      const point = svgPoint(svg, event.clientX, event.clientY);
      if (point && inPlot(point)) gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, previousX: point.x, committed: false };
    }

    function pointerMove(event: PointerEvent) {
      if (gesture?.id !== event.pointerId || pointers.size !== 1 || !svg) return;
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      if (!gesture.committed) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < TOUCH_THRESHOLD) return;
        if (Math.abs(dy) >= Math.abs(dx)) { releaseGesture(); return; }
        gesture.committed = true;
        svg.setPointerCapture(event.pointerId);
      }
      const point = svgPoint(svg, event.clientX, event.clientY);
      if (!point) return;
      if (event.cancelable) event.preventDefault();
      pan(gesture.previousX - point.x);
      gesture.previousX = point.x;
    }

    function pointerEnd(event: PointerEvent) {
      pointers.delete(event.pointerId);
      if (gesture?.id === event.pointerId) releaseGesture();
    }

    function pointerCancel(event: PointerEvent) {
      pointerEnd(event);
      cancel();
    }

    function lostCapture(event: PointerEvent) {
      if (gesture?.id === event.pointerId) cancel();
    }

    svg.addEventListener("wheel", wheel, { passive: false });
    region.addEventListener("keydown", key);
    svg.addEventListener("pointerdown", pointerDown);
    svg.addEventListener("pointermove", pointerMove);
    svg.addEventListener("pointerup", pointerEnd);
    svg.addEventListener("pointercancel", pointerCancel);
    svg.addEventListener("lostpointercapture", lostCapture);
    return () => {
      live = false;
      cancel();
      cancelInput.current = () => undefined;
      svg.removeEventListener("wheel", wheel);
      region.removeEventListener("keydown", key);
      svg.removeEventListener("pointerdown", pointerDown);
      svg.removeEventListener("pointermove", pointerMove);
      svg.removeEventListener("pointerup", pointerEnd);
      svg.removeEventListener("pointercancel", pointerCancel);
      svg.removeEventListener("lostpointercapture", lostCapture);
    };
  }, [available, state.enabled, identity, full?.start, full?.end]);

  return {
    window: state.window, enabled: state.enabled, available, svgRef, regionRef,
    ...(full && state.window ? chartZoomAvailability(full, state.window) : { canZoomIn: false, canZoomOut: false }),
    setEnabled, zoomIn: () => { zoom(1 / ZOOM_STEP); }, zoomOut: () => { zoom(ZOOM_STEP); }, reset,
  };
}
