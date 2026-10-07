import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { TableData } from "../../src/contracts/table";
import { Button } from "../../src/components/atoms/Button";
import { DataTable } from "../../src/components/organisms/DataTable";
import { syntheticQueryTable } from "../fixtures/scenarios";

describe("lossless positional table", () => {
  it("preserves duplicate labels, row multiplicity and ordered large values", () => {
    render(<DataTable data={syntheticQueryTable} caption="Projection" />);
    expect(screen.getAllByRole("columnheader").slice(0, 2).map((header) => header.textContent)).toEqual(["value", "value"]);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(syntheticQueryTable.rows.length);
    const first = rows[0];
    const second = rows[1];
    if (!first || !second) throw new Error("Fixture requires duplicate rows");
    expect(within(first).getAllByRole("cell").map((cell) => cell.textContent)).toEqual(within(second).getAllByRole("cell").map((cell) => cell.textContent));
    expect(within(first).getAllByRole("cell")[0]).toHaveTextContent("9007199254740993");
    expect(within(first).getByText("00A7")).toBeInTheDocument();
  });

  it("renders provided displays, literal strings, dates, null and zero without coercion", () => {
    const data: TableData = {
      columns: ["text", "date", "decimal", "decimal", "boolean"].map((kind, index) => ({ id: String(index), label: `Field ${String(index)}`, kind: kind as "text" | "date" | "decimal" | "boolean", unit: null, nullable: true })),
      rows: [{ position: 0, cells: [{ kind: "text", value: "<img src=x onerror=alert(1)>" }, { kind: "date", value: "2026-10-01" }, { kind: "decimal", exact: "1.005", display: "1.01" }, { kind: "null" }, { kind: "boolean", value: false }] }, { position: 1, cells: [{ kind: "text", value: "Second record" }, { kind: "date", value: "2026-10-02" }, { kind: "decimal", exact: "0", display: "0.00" }, { kind: "decimal", exact: "2", display: "2.00" }, { kind: "boolean", value: true }] }],
    };
    const { container } = render(<DataTable data={data} caption="Typed projection" />);
    expect(screen.getByRole("table", { name: "Typed projection" })).toBeInTheDocument();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("2026-10-01")).toBeInTheDocument();
    expect(screen.getByText("1.01")).toBeInTheDocument();
    expect(screen.getByText("0.00")).toBeInTheDocument();
    expect(screen.getByText("false")).toBeInTheDocument();
    expect(screen.getByLabelText("Missing value")).toHaveTextContent("—");
    expect(screen.getAllByRole("cell")).toHaveLength(10);
  });

  it("offers a named keyboard scroll region and explicit empty-state recovery", async () => {
    const recover = vi.fn();
    render(<DataTable data={{ columns: syntheticQueryTable.columns, rows: [] }} caption="Empty projection" emptyTitle="No matches" emptyActions={<Button onClick={recover}>Reset filters</Button>} />);
    const user = userEvent.setup();
    await user.tab();
    expect(screen.getByRole("region", { name: "Empty projection: scrollable table" })).toHaveFocus();
    expect(screen.getAllByRole("columnheader")).toHaveLength(syntheticQueryTable.columns.length);
    expect(screen.queryAllByRole("cell")).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "No matches", level: 3 })).toBeInTheDocument();
    expect(recover).not.toHaveBeenCalled();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(recover).toHaveBeenCalledTimes(1);
  });

  it("dims retained rows while loading, marks them busy and removes them from interaction and the accessibility tree", () => {
    const { container, rerender } = render(<DataTable data={syntheticQueryTable} caption="Retained page" />);
    const root = container.firstElementChild as HTMLElement;
    const cellsBefore = screen.getAllByRole("cell").map((cell) => cell.textContent);
    // Default output: no busy/inert/hidden attributes, no dim.
    for (const attribute of ["aria-busy", "aria-hidden", "inert"]) expect(root).not.toHaveAttribute(attribute);
    expect(root.className).not.toContain("opacity-60");
    rerender(<DataTable data={syntheticQueryTable} caption="Retained page" loading />);
    expect(root).toBe(container.firstElementChild);
    expect(root).toHaveAttribute("aria-busy", "true");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("inert");
    expect(root.className).toContain("opacity-60");
    // The stale rows are not exposed to assistive technology or focusable while dimmed.
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(root.querySelectorAll("td").length).toBe(cellsBefore.length);
    expect(Array.from(root.querySelectorAll("td")).map((cell) => cell.textContent)).toEqual(cellsBefore);
    rerender(<DataTable data={syntheticQueryTable} caption="Retained page" loading={false} />);
    for (const attribute of ["aria-busy", "aria-hidden", "inert"]) expect(root).not.toHaveAttribute(attribute);
    expect(screen.getAllByRole("cell").map((cell) => cell.textContent)).toEqual(cellsBefore);
  });

  it("does not alter cell values, gaps or zero while loading", () => {
    const data: TableData = {
      columns: ["decimal", "decimal"].map((kind, index) => ({ id: String(index), label: `Field ${String(index)}`, kind: kind as "decimal", unit: null, nullable: true })),
      rows: [{ position: 0, cells: [{ kind: "decimal", exact: "0", display: "0.00" }, { kind: "null" }] }],
    };
    const { container, rerender } = render(<DataTable data={data} caption="Zero and gap" />);
    const before = container.querySelector("tbody")?.innerHTML;
    rerender(<DataTable data={data} caption="Zero and gap" loading />);
    expect(container.querySelector("tbody")?.innerHTML).toBe(before);
    expect(container.querySelector("[aria-label='Missing value']")).toHaveTextContent("—");
  });
});
