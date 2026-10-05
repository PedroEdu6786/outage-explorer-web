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
    expect(screen.getByText("Synthetic Viewer")).toBeInTheDocument();
    expect(screen.getByText("Viewer")).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });
});
