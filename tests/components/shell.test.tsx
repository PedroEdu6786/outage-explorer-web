import { useRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppNavigation, type NavigationData } from "../../src/components/organisms/AppNavigation";
import { AppHeader } from "../../src/components/organisms/AppHeader";

let narrow = true;
const subscribers = new Set<() => void>();
const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
function resize(matches: boolean) {
  act(() => { narrow = matches; subscribers.forEach((notify) => { notify(); }); });
}

const ready: NavigationData = {
  status: "ready", revision: 1,
  identity: { name: "Synthetic User", initials: "S", roleLabel: "Viewer" },
  destinations: [
    { id: "first", label: "First destination", href: "#first", icon: "datasets" },
    { id: "national", label: "National overview", href: "#national", icon: "overview", active: true },
  ],
  coverage: { availableThrough: "Synthetic coverage" },
};

function Harness({ data = ready }: { data?: NavigationData }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  return <>
    <AppHeader title="Protected title" pending={data.status === "pending"} onOpenNavigation={() => { setOpen(true); }} navigationOpen={open} navigationButtonRef={trigger} accessory="Protected metadata" />
    <AppNavigation data={data} open={open} onOpenChange={setOpen} onSignOut={() => { setOpen(false); }} returnFocusRef={trigger} />
  </>;
}

beforeEach(() => {
  narrow = true;
  subscribers.clear();
  vi.stubGlobal("matchMedia", () => ({
    get matches() { return narrow; },
    addEventListener: (_type: string, listener: () => void) => { subscribers.add(listener); },
    removeEventListener: (_type: string, listener: () => void) => { subscribers.delete(listener); },
  }));
  // jsdom has no native modal focus/inert implementation; Chromium verifies it later.
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});

afterEach(() => {
  for (const [key, descriptor] of [["showModal", originalShowModal], ["close", originalClose]] as const) {
    if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
  }
  vi.unstubAllGlobals();
});

describe("supplied shell navigation", () => {
  it("renders the desktop sliding indicator inertly in jsdom and keeps aria-current on the active destination", () => {
    narrow = false;
    const { container } = render(<Harness />);
    const desktopNav = container.querySelector("aside nav");
    expect(desktopNav).not.toHaveAttribute("data-indicator");
    expect(desktopNav?.querySelectorAll("[data-sliding-indicator][aria-hidden=true]")).toHaveLength(1);
    expect(container.querySelectorAll("dialog [data-sliding-indicator]")).toHaveLength(0);
    for (const link of container.querySelectorAll("a[aria-current=page]")) expect(link).toHaveTextContent("National overview");
  });

  it("opens a modal focused on close, handles Escape and restores the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Application navigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes on navigation and resets modal state through viewport changes", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    await user.click(screen.getByRole("link", { name: "National overview" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    resize(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "National overview" })).toHaveFocus();
    resize(true);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("withholds all identity/destinations/coverage while pending and closes on revision change", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Harness />);
    await user.click(screen.getByRole("button", { name: "Open navigation" }));
    rerender(<Harness data={{ ...ready, revision: 2 }} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(<Harness data={{ status: "pending" }} />);
    expect(screen.queryByText("Synthetic User")).not.toBeInTheDocument();
    expect(screen.queryByText("Synthetic coverage")).not.toBeInTheDocument();
    expect(screen.queryByText("Protected metadata")).not.toBeInTheDocument();
    expect(screen.queryByText("Protected title")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
  it("keeps the header trigger label, aria-expanded and aria-haspopup while the icon swaps decoratively", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    const closedIcon = trigger.querySelector("span[aria-hidden=true]");
    expect(closedIcon).toBeInTheDocument();
    expect(trigger.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(1);
    expect(trigger.textContent).toBe("");
    await user.click(trigger);
    // The icon wrapper is keyed by state (the swap); label and relationships are unchanged.
    expect(screen.getAllByRole("button", { name: "Open navigation", hidden: true })[0]).toBe(trigger);
    expect(trigger).toHaveAttribute("aria-label", "Open navigation");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    const openIcon = trigger.querySelector("span[aria-hidden=true]");
    expect(openIcon).not.toBe(closedIcon);
    expect(openIcon).toHaveClass("animate-icon-swap");
    expect(trigger.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(1);
  });

  it("leaves the coverage block text unchanged and marks the status dot decorative", () => {
    narrow = false;
    const { container } = render(<Harness />);
    const coverage = container.querySelector("aside")?.textContent ?? "";
    expect(coverage).toContain("Data available through");
    expect(coverage).toContain("Synthetic coverage");
    const dot = container.querySelector("aside span.animate-dot-pulse");
    expect(dot).toHaveAttribute("aria-hidden", "true");
    expect(dot?.textContent).toBe("");
    expect(container.querySelectorAll("[role=status]")).toHaveLength(0);
  });
});
