import { useRef, useState } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppHeader } from "../../src/components/organisms/AppHeader";
import { AppNavigation, type NavigationData } from "../../src/components/organisms/AppNavigation";
import { Tabs } from "../../src/components/molecules/Tabs";
import { NavigationItem } from "../../src/components/molecules/NavigationItem";
import { UserSummary } from "../../src/components/molecules/UserSummary";

describe("controlled presentation navigation", () => {
  it("skips disabled tabs, wraps arrows and links every visible panel to its tab", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [selectedId, select] = useState("preview");
      return <Tabs label="Dataset details" selectedId={selectedId} onSelectionChange={select} items={[
        { id: "preview", label: "Preview", content: "Preview rows" },
        { id: "disabled", label: "Unavailable", disabled: true, content: "Unavailable content" },
        { id: "schema", label: "Schema", content: "Schema columns" },
      ]} />;
    }
    render(<Harness />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    const schema = screen.getByRole("tab", { name: "Schema" });
    expect(schema).toHaveFocus();
    expect(schema).toHaveAttribute("aria-selected", "true");
    const panel = screen.getByRole("tabpanel", { name: "Schema" });
    expect(panel).toHaveTextContent("Schema columns");
    expect(schema).toHaveAttribute("aria-controls", panel.id);
    expect(screen.queryByRole("tabpanel", { name: "Preview" })).not.toBeInTheDocument();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(schema).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveFocus();
  });

  it("supports Arrow, Home, End and Space selection while every panel stays mounted", async () => {
    const user = userEvent.setup();
    function Harness() {
      const [selectedId, select] = useState("one");
      return <Tabs label="Sections" selectedId={selectedId} onSelectionChange={select} items={[
        { id: "one", label: "One", content: "First panel" },
        { id: "two", label: "Two", content: "Second panel" },
        { id: "three", label: "Three", content: "Third panel" },
      ]} />;
    }
    const { container } = render(<Harness />);
    await user.tab();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Three" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Three" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveFocus();
    await user.keyboard("{Home}");
    screen.getByRole("tab", { name: "Two" }).focus();
    await user.keyboard(" ");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    // All three panels exist; only the selected one is exposed.
    expect(container.querySelectorAll("[role=tabpanel]")).toHaveLength(3);
    expect(container.querySelectorAll("[role=tabpanel][hidden]")).toHaveLength(2);
    expect(screen.getByRole("tabpanel", { name: "Two" })).toHaveTextContent("Second panel");
  });

  it("renders an inert sliding underline without ResizeObserver (jsdom)", () => {
    const { container } = render(<Tabs label="Sections" selectedId="one" onSelectionChange={() => undefined} items={[
      { id: "one", label: "One", content: "First" },
      { id: "two", label: "Two", content: "Second" },
    ]} />);
    const tablist = screen.getByRole("tablist");
    expect(tablist).not.toHaveAttribute("data-indicator");
    expect(tablist.style.getPropertyValue("--indicator-width")).toBe("");
    const indicator = container.querySelector("[data-sliding-indicator]");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
    expect(screen.getAllByRole("tab")).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "One" })).toHaveAttribute("data-indicator-active");
  });

  it("notifies once per selection while leaving selected state under caller control", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<Tabs label="Details" selectedId="preview" onSelectionChange={select} items={[
      { id: "preview", label: "Preview", content: "Rows" },
      { id: "schema", label: "Schema", content: "Columns" },
    ]} />);
    await user.click(screen.getByRole("tab", { name: "Schema" }));
    expect(select).toHaveBeenCalledExactlyOnceWith("schema");
    expect(screen.getByRole("tab", { name: "Preview" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders only supplied links and resolved identity text without a persona selector", () => {
    render(<><nav aria-label="Authorized destinations"><NavigationItem label="National overview" href="/overview" active /></nav><UserSummary name="Synthetic Viewer" initials="S" roleLabel="Viewer" /></>);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "National overview" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "National overview" })).toHaveAttribute("data-indicator-active");
    expect(screen.getByText("Synthetic Viewer")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});

describe("drawer motion leaves the dialog logic unchanged (C2)", () => {
  const ready: NavigationData = {
    status: "ready", revision: 1,
    identity: { name: "Synthetic User", initials: "S", roleLabel: "Viewer" },
    destinations: [{ id: "first", label: "First destination", href: "#first", icon: "datasets", active: true }],
  };
  const originalShowModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "showModal");
  const originalClose = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");
  const calls: string[] = [];

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }));
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { calls.push("showModal"); this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { calls.push("close"); this.open = false; } });
  });
  afterEach(() => {
    for (const [key, descriptor] of [["showModal", originalShowModal], ["close", originalClose]] as const) {
      if (descriptor) Object.defineProperty(HTMLDialogElement.prototype, key, descriptor);
      else Reflect.deleteProperty(HTMLDialogElement.prototype, key);
    }
    vi.unstubAllGlobals();
  });

  function Harness() {
    const [open, setOpen] = useState(false);
    const trigger = useRef<HTMLButtonElement>(null);
    return <>
      <AppHeader title="Title" onOpenNavigation={() => { setOpen(true); }} navigationOpen={open} navigationButtonRef={trigger} />
      <AppNavigation data={ready} open={open} onOpenChange={setOpen} onSignOut={() => { setOpen(false); }} returnFocusRef={trigger} />
    </>;
  }

  it("opens once, focuses the close button, closes synchronously and restores the trigger without waiting for any animation", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const dialog = container.querySelector("dialog");
    expect(dialog).toHaveClass("motion-drawer");
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    expect(calls).toEqual(["showModal"]);
    expect(dialog?.open).toBe(true);
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
    // Focus order inside the drawer: close, destination, sign out (wrapping needs layout; tests/visual/shell.spec.ts covers it in Chromium).
    await user.tab();
    expect(screen.getByRole("link", { name: "First destination" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("button", { name: "Sign out" })).toHaveFocus();
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
    // Close is synchronous: closed and focus restored in the same act, no timers or events awaited.
    act(() => { fireEvent.click(screen.getByRole("button", { name: "Close navigation" })); });
    expect(calls).toEqual(["showModal", "close"]);
    expect(dialog?.open).toBe(false);
    expect(trigger).toHaveFocus();
  });

  it("treats cancel (Escape) as a deliberate close that restores the trigger and prevents the native default", async () => {
    const user = userEvent.setup();
    const { container } = render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open navigation" });
    await user.click(trigger);
    const cancel = new Event("cancel", { cancelable: true });
    act(() => { container.querySelector("dialog")?.dispatchEvent(cancel); });
    expect(cancel.defaultPrevented).toBe(true);
    expect(container.querySelector("dialog")?.open).toBe(false);
    expect(trigger).toHaveFocus();
    // Reopening works the same after the close; showModal ran once per open.
    await user.click(trigger);
    expect(calls).toEqual(["showModal", "close", "showModal"]);
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
  });
});
