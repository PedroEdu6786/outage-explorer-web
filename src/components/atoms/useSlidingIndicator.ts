"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

export interface SlidingIndicatorOptions {
  /** Positioned container whose direct children are the items plus one `data-sliding-indicator` child. */
  containerRef: RefObject<HTMLElement | null>;
  /** Changes whenever the active item changes; that move is transitioned. */
  activeKey: string | null;
  /** False while the container is not rendered (for example a pending session). */
  enabled?: boolean;
}

const ACTIVE = "[data-indicator-active]";
const INDICATOR = "data-sliding-indicator";
const READY = "data-indicator";
const ANIMATE = "data-indicator-animate";
const PROPERTIES = ["--indicator-x", "--indicator-y", "--indicator-width", "--indicator-height"] as const;

/**
 * Domain-free sliding indicator. JavaScript only measures the item marked
 * `data-indicator-active` and writes `--indicator-x|y|width|height` on the
 * container, which gets `data-indicator="ready"`; all motion is CSS
 * (`sliding-indicator`). The first placement and any placement after the
 * container was hidden or resized are untransitioned; only an `activeKey`
 * change slides. Without `ResizeObserver` (jsdom) nothing is written and the
 * caller's static active styling remains.
 */
export function useSlidingIndicator({ containerRef, activeKey, enabled = true }: SlidingIndicatorOptions) {
  const placement = useRef<((transitioned: boolean) => void) | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container || typeof ResizeObserver === "undefined") return;

    let placed = false;
    const observed = new Set<Element>();

    function clear(target: HTMLElement) {
      for (const name of PROPERTIES) target.style.removeProperty(name);
      target.removeAttribute(READY);
      target.removeAttribute(ANIMATE);
      placed = false;
    }

    function place(target: HTMLElement, transitioned: boolean) {
      // Items can move without the container resizing (font load, sibling width).
      const items = Array.from(target.children).filter((child) => !child.hasAttribute(INDICATOR));
      for (const item of observed) if (!items.includes(item)) { observer.unobserve(item); observed.delete(item); }
      for (const item of items) if (!observed.has(item)) { observer.observe(item); observed.add(item); }
      const active = target.querySelector<HTMLElement>(ACTIVE);
      const box = target.getBoundingClientRect();
      if (!active || box.width === 0 || box.height === 0) {
        // Hidden or no active item: the next visible placement is untransitioned.
        clear(target);
        return;
      }
      const item = active.getBoundingClientRect();
      const animate = transitioned && placed;
      if (!animate) target.removeAttribute(ANIMATE);
      target.style.setProperty("--indicator-x", `${String(item.left - box.left - target.clientLeft + target.scrollLeft)}px`);
      target.style.setProperty("--indicator-y", `${String(item.top - box.top - target.clientTop + target.scrollTop)}px`);
      target.style.setProperty("--indicator-width", `${String(item.width)}px`);
      target.style.setProperty("--indicator-height", `${String(item.height)}px`);
      target.setAttribute(READY, "ready");
      if (!animate) {
        // Flush so this placement is computed before transitions are enabled.
        target.getBoundingClientRect();
        target.setAttribute(ANIMATE, "true");
      }
      placed = true;
    }

    const observer = new ResizeObserver(() => { place(container, false); });
    observer.observe(container);
    placement.current = (transitioned) => { place(container, transitioned); };
    place(container, false);
    return () => { observer.disconnect(); placement.current = null; clear(container); };
  }, [containerRef, enabled]);

  useLayoutEffect(() => { placement.current?.(true); }, [activeKey]);
}
