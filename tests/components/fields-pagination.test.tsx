import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../../src/components/atoms/Input";
import { FormField } from "../../src/components/molecules/FormField";
import { DateRangeField } from "../../src/components/molecules/DateRangeField";
import { SearchField } from "../../src/components/molecules/SearchField";
import { PaginationControls } from "../../src/components/molecules/PaginationControls";

describe("caller-owned field compositions", () => {
  it("associates independent generated labels/help/errors and preserves external descriptions", () => {
    const { rerender } = render(<><p id="external">External context.</p><FormField label="First field" description="First help." error="Supplied error." describedBy="external">{(props) => <Input {...props} />}</FormField><FormField label="Second field">{(props) => <Input {...props} />}</FormField></>);
    const first = screen.getByRole("textbox", { name: "First field" });
    expect(first).toHaveAccessibleDescription("External context. First help. Supplied error.");
    expect(first).toBeInvalid();
    expect(first.id).not.toBe(screen.getByRole("textbox", { name: "Second field" }).id);
    rerender(<FormField label="First field" description="First help.">{(props) => <Input {...props} />}</FormField>);
    expect(screen.getByRole("textbox", { name: "First field" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("textbox", { name: "First field" })).toHaveAccessibleDescription("First help.");
  });

  it("keeps aria-invalid, aria-describedby and error text unchanged for inputs, search and form fields", () => {
    const { rerender } = render(<><FormField label="Plain field" error="Plain error.">{(props) => <Input {...props} />}</FormField><SearchField label="Find" value="" onValueChange={() => undefined} error="Search error." /></>);
    const plain = screen.getByRole("textbox", { name: "Plain field" });
    expect(plain).toHaveAttribute("aria-invalid", "true");
    expect(plain).toHaveAccessibleDescription("Plain error.");
    expect(plain.getAttribute("aria-describedby")).toBe(`${plain.id}-error`);
    expect(screen.getByText("Plain error.").id).toBe(`${plain.id}-error`);
    expect(screen.getByText("Plain error.").tagName).toBe("P");
    const search = screen.getByRole("searchbox", { name: "Find" });
    expect(search).toHaveAttribute("aria-invalid", "true");
    expect(search).toHaveAccessibleDescription("Search error.");
    rerender(<><FormField label="Plain field">{(props) => <Input {...props} />}</FormField><SearchField label="Find" value="" onValueChange={() => undefined} /></>);
    expect(screen.getByRole("textbox", { name: "Plain field" })).not.toHaveAttribute("aria-invalid");
    expect(screen.getByRole("searchbox", { name: "Find" })).not.toHaveAttribute("aria-invalid");
    expect(screen.queryByText("Plain error.")).not.toBeInTheDocument();
  });

  it("passes calendar strings and empty dates unchanged without enforcing date order", () => {
    const start = vi.fn();
    const end = vi.fn();
    render(<DateRangeField start="2026-09-30" end="2026-09-01" onStartChange={start} onEndChange={end} />);
    const startInput = screen.getByLabelText("Start date");
    const endInput = screen.getByLabelText("End date");
    expect(startInput).toHaveValue("2026-09-30");
    expect(endInput).toHaveValue("2026-09-01");
    expect(startInput).not.toHaveAttribute("min");
    expect(endInput).not.toHaveAttribute("max");
    fireEvent.change(startInput, { target: { value: "2026-10-01" } });
    fireEvent.change(endInput, { target: { value: "" } });
    expect(start).toHaveBeenCalledExactlyOnceWith("2026-10-01");
    expect(end).toHaveBeenCalledExactlyOnceWith("");
  });

  it("retains accessible hidden compact labels, supplied errors, and disabled values", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    render(<DateRangeField variant="compact" start="2026-09-01" end="2026-09-30" onStartChange={change} onEndChange={change} startError="Caller-owned start error." disabled />);
    expect(screen.getByRole("group", { name: "Date range" })).toBeInTheDocument();
    const start = screen.getByLabelText("Start date");
    expect(start).toHaveAccessibleDescription("Caller-owned start error.");
    expect(start).toBeDisabled();
    await user.type(start, "2026-10-01");
    expect(start).toHaveValue("2026-09-01");
    expect(change).not.toHaveBeenCalled();
  });

  it("keeps validation messaging, invalid state and association unchanged in both variants", () => {
    for (const variant of ["fields", "compact"] as const) {
      const { unmount, rerender } = render(<DateRangeField variant={variant} start="2026-09-04" end="2026-09-01" onStartChange={() => undefined} onEndChange={() => undefined} startError="Start is after end." />);
      const start = screen.getByLabelText("Start date");
      expect(start).toHaveAttribute("aria-invalid", "true");
      expect(start).toHaveAccessibleDescription("Start is after end.");
      expect(screen.getByLabelText("End date")).not.toHaveAttribute("aria-invalid");
      expect(screen.getAllByText("Start is after end.")).toHaveLength(1);
      rerender(<DateRangeField variant={variant} start="2026-09-01" end="2026-09-04" onStartChange={() => undefined} onEndChange={() => undefined} />);
      expect(screen.getByLabelText("Start date")).not.toHaveAttribute("aria-invalid");
      expect(screen.queryByText("Start is after end.")).not.toBeInTheDocument();
      unmount();
    }
  });

  it("reports controlled search changes and clearing; caller rerenders the value", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    function ControlledSearch() {
      const [value, setValue] = useState("");
      return <SearchField label="Search datasets" value={value} description="Supplied search help." onValueChange={(next) => { change(next); setValue(next); }} />;
    }
    render(<ControlledSearch />);
    const input = screen.getByRole("searchbox", { name: "Search datasets" });
    expect(input).toHaveAccessibleDescription("Supplied search help.");
    await user.type(input, "001A");
    expect(input).toHaveValue("001A");
    await user.clear(input);
    expect(input).toHaveValue("");
    expect(change).toHaveBeenLastCalledWith("");
  });
});

describe("supplied pagination actions", () => {
  it("does not run actions on render/rerender and forwards explicit activation only", async () => {
    const user = userEvent.setup();
    const next = vi.fn();
    const previous = vi.fn();
    const { rerender } = render(<PaginationControls label="Preview navigation" summary="6 supplied rows" next={{ label: "Continue", onSelect: next }} />);
    expect(next).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();
    await user.tab();
    await user.keyboard("{Enter}");
    expect(next).toHaveBeenCalledTimes(1);
    rerender(<PaginationControls label="Preview navigation" previous={{ label: "Previous", onSelect: previous, disabled: true }} next={{ label: "Continue", onSelect: next }} disabled />);
    await user.click(screen.getByRole("button", { name: "Previous" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(previous).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("renders only supplied numbered actions and current state without deriving totals", async () => {
    const user = userEvent.setup();
    const select = vi.fn();
    render(<PaginationControls label="Result navigation" summary="Retained page 4" pages={[{ key: "opaque-four", label: "4", current: true, onSelect: select }, { key: "opaque-seven", label: "7", onSelect: select }]} />);
    expect(screen.getByRole("navigation", { name: "Result navigation" })).toHaveTextContent("Retained page 4");
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("button")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "5" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "7" }));
    expect(select).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "4" })).toHaveAttribute("aria-current", "page");
  });

  it("keeps the current-page marker and disabled semantics when the current page changes", async () => {
    const user = userEvent.setup();
    function Pages() {
      const [current, setCurrent] = useState(1);
      return <PaginationControls label="Result navigation" disabled={current === 3} pages={[1, 2, 3].map((page) => ({ key: String(page), label: String(page), current: page === current, onSelect: () => { setCurrent(page); } }))} />;
    }
    render(<Pages />);
    await user.click(screen.getByRole("button", { name: "2" }));
    expect(screen.getByRole("button", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "1" })).not.toHaveAttribute("aria-current");
    expect(screen.getAllByRole("button").filter((button) => button.getAttribute("aria-current") === "page")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "3" }));
    for (const button of screen.getAllByRole("button")) expect(button).toBeDisabled();
  });
});
