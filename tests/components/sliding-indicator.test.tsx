import { useRef, useState } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useSlidingIndicator } from "../../src/components/atoms/useSlidingIndicator";

interface Observer { callback: () => void; observed: Set<Element>; disconnected: boolean }
const observers: Observer[] = [];

class FakeResizeObserver {
  readonly state: Observer;
  constructor(callback: () => void) { this.state = { callback, observed: new Set(), disconnected: false }; observers.push(this.state); }
  observe(element: Element) { this.state.observed.add(element); }
  unobserve(element: Element) { this.state.observed.delete(element); }
  disconnect() { this.state.disconnected = true; }
}

/** `data-rect="left,top,width,height"` stands in for layout, which jsdom does not compute. */
function rectOf(element: Element) {
  const [left = 0, top = 0, width = 0, height = 0] = (element.getAttribute("data-rect") ?? "0,0,0,0").split(",").map(Number);
  return { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top, toJSON: () => ({}) } as DOMRect;
}

let setActive: (key: string) => void = () => undefined;
function Harness({ enabled = true }: { enabled?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [active, setKey] = useState("a");
  setActive = setKey;
  useSlidingIndicator({ containerRef: container, activeKey: active, enabled });
  return (
    <div ref={container} data-testid="container" data-rect="0,0,300,40">
      <button type="button" data-rect="10,0,80,40" {...(active === "a" ? { "data-indicator-active": "" } : {})}>A</button>
      <button type="button" data-rect="100,0,120,40" {...(active === "b" ? { "data-indicator-active": "" } : {})}>B</button>
      <span data-sliding-indicator aria-hidden="true" />
    </div>
  );
}

beforeEach(() => {
  observers.length = 0;
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) { return rectOf(this); });
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("useSlidingIndicator", () => {
  it("is a no-op without ResizeObserver (jsdom): no properties, no attributes", () => {
    const { getByTestId } = render(<Harness />);
    const container = getByTestId("container");
    expect(container).not.toHaveAttribute("data-indicator");
    expect(container).not.toHaveAttribute("data-indicator-animate");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("");
  });

  it("places the first measurement untransitioned, then slides on an active-key change", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const calls: string[] = [];
    const original: (name: string, value: string) => void = Reflect.get(Element.prototype, "setAttribute");
    vi.spyOn(HTMLElement.prototype, "setAttribute").mockImplementation(function (this: HTMLElement, name: string, value: string) {
      if (this.dataset.testid === "container") calls.push(`${name}=${value}`);
      original.call(this, name, value);
    });
    const { getByTestId } = render(<Harness />);
    const container = getByTestId("container");
    expect(container.style.getPropertyValue("--indicator-x")).toBe("10px");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("80px");
    expect(container.style.getPropertyValue("--indicator-height")).toBe("40px");
    expect(container).toHaveAttribute("data-indicator", "ready");
    // Transitions are enabled only after the first placement was written.
    expect(calls.indexOf("data-indicator=ready")).toBeLessThan(calls.indexOf("data-indicator-animate=true"));
    expect(container).toHaveAttribute("data-indicator-animate", "true");
    calls.length = 0;

    act(() => { setActive("b"); });
    expect(container.style.getPropertyValue("--indicator-x")).toBe("100px");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("120px");
    // The move keeps transitions enabled; it is not re-placed untransitioned.
    expect(container).toHaveAttribute("data-indicator-animate", "true");
    expect(calls).not.toContain("data-indicator-animate=true");
  });

  it("re-measures on resize without a transition and observes the container and items", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { getByTestId, getByText } = render(<Harness />);
    const container = getByTestId("container");
    const [observer] = observers;
    expect(observer?.observed.has(container)).toBe(true);
    expect(observer?.observed.has(getByText("A"))).toBe(true);
    expect([...(observer?.observed ?? [])].some((element) => element.hasAttribute("data-sliding-indicator"))).toBe(false);

    getByText("A").setAttribute("data-rect", "20,0,90,40");
    act(() => { observer?.callback(); });
    expect(container.style.getPropertyValue("--indicator-x")).toBe("20px");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("90px");
    expect(container).toHaveAttribute("data-indicator-animate", "true");
  });

  it("clears while hidden and places untransitioned again when shown", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const { getByTestId } = render(<Harness />);
    const container = getByTestId("container");
    const [observer] = observers;
    container.setAttribute("data-rect", "0,0,0,0");
    act(() => { observer?.callback(); });
    expect(container).not.toHaveAttribute("data-indicator");
    expect(container).not.toHaveAttribute("data-indicator-animate");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("");
    container.setAttribute("data-rect", "0,0,300,40");
    act(() => { observer?.callback(); });
    expect(container).toHaveAttribute("data-indicator", "ready");
    expect(container.style.getPropertyValue("--indicator-width")).toBe("80px");
  });

  it("does nothing while disabled and disconnects on unmount", () => {
    vi.stubGlobal("ResizeObserver", FakeResizeObserver);
    const disabled = render(<Harness enabled={false} />);
    expect(observers).toHaveLength(0);
    expect(disabled.getByTestId("container")).not.toHaveAttribute("data-indicator");
    disabled.unmount();
    const { unmount } = render(<Harness />);
    unmount();
    expect(observers[0]?.disconnected).toBe(true);
  });
});
