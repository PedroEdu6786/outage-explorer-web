import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
