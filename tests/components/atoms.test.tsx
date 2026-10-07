import { createRef, type SyntheticEvent } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/atoms/Button";
import { IconButton } from "../../src/components/atoms/IconButton";
import { Link } from "../../src/components/atoms/Link";
import { Input } from "../../src/components/atoms/Input";
import { Select } from "../../src/components/atoms/Select";
import { Textarea } from "../../src/components/atoms/Textarea";
import { Checkbox } from "../../src/components/atoms/Checkbox";
import { Badge } from "../../src/components/atoms/Badge";
import { Spinner } from "../../src/components/atoms/Spinner";
import { Surface } from "../../src/components/atoms/Surface";
import { Icon } from "../../src/components/atoms/Icon";
import { BrandMark } from "../../src/components/atoms/BrandMark";

describe("native action contracts", () => {
  it("activates once with Enter or Space and does not submit its parent by default", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const submit = vi.fn((event: SyntheticEvent) => { event.preventDefault(); });
    render(<form onSubmit={submit}><Button onClick={click}>Apply filters</Button></form>);
    await user.tab();
    expect(screen.getByRole("button", { name: "Apply filters" })).toHaveFocus();
    await user.keyboard("{Enter}");
    await user.keyboard(" ");
    expect(click).toHaveBeenCalledTimes(2);
    expect(submit).not.toHaveBeenCalled();
  });

  it("honors explicit form submission and caller accessible names", async () => {
    const user = userEvent.setup();
    const submit = vi.fn((event: SyntheticEvent) => { event.preventDefault(); });
    render(<form onSubmit={submit}><Button type="submit" aria-label="Submit filters">Apply</Button></form>);
    await user.click(screen.getByRole("button", { name: "Submit filters" }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it("blocks loading/disabled callbacks and restores the action after loading", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const { rerender } = render(<Button loading loadingLabel="Signing in…" onClick={click}>Sign in</Button>);
    const loading = screen.getByRole("button", { name: "Signing in…" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    await user.click(loading);
    rerender(<Button disabled onClick={click}>Sign in</Button>);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(click).not.toHaveBeenCalled();
    rerender(<Button onClick={click}>Sign in</Button>);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("keeps the loading name, disabled state, aria-busy and blocked clicks through label motion", async () => {
    const user = userEvent.setup();
    const click = vi.fn();
    const { container, rerender } = render(<Button onClick={click}>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).not.toHaveAttribute("aria-busy");
    rerender(<Button loading loadingLabel="Saving…" onClick={click}>Save</Button>);
    const loading = screen.getByRole("button", { name: "Saving…" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(loading).toHaveTextContent("Saving…");
    expect(loading).not.toHaveTextContent("Save Saving");
    await user.click(loading);
    expect(click).not.toHaveBeenCalled();
    expect(container.querySelectorAll("[role=status],[aria-live]")).toHaveLength(0);
    rerender(<Button onClick={click}><Icon name="close" />Save</Button>);
    expect(screen.getByRole("button", { name: "Save" }).children).toHaveLength(1);
  });

  it("names icon buttons independently of decorative glyphs and keeps links native", async () => {
    const user = userEvent.setup();
    const close = vi.fn();
    render(<><IconButton label="Close preview" onClick={close}><Icon name="close" /></IconButton><Link href="#destination">Explore dataset</Link></>);
    await user.tab();
    await user.keyboard("{Enter}");
    expect(close).toHaveBeenCalledTimes(1);
    await user.tab();
    expect(screen.getByRole("link", { name: "Explore dataset" })).toHaveFocus();
    expect(screen.getByRole("link")).toHaveAttribute("href", "#destination");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("native labeled controls", () => {
  it("preserves label, validation description, editable text and caller refs", async () => {
    const user = userEvent.setup();
    const inputRef = createRef<HTMLInputElement>();
    render(<><label htmlFor="search">Search datasets</label><Input ref={inputRef} id="search" aria-invalid="true" aria-describedby="help" /><p id="help">Enter a dataset name.</p></>);
    const input = screen.getByRole("textbox", { name: "Search datasets" });
    expect(input).toHaveAccessibleDescription("Enter a dataset name.");
    expect(input).toBeInvalid();
    await user.type(input, "synthetic");
    expect(input).toHaveValue("synthetic");
    expect(inputRef.current).toBe(input);
  });

  it("retains native option selection and code including whitespace", async () => {
    const user = userEvent.setup();
    render(<><label htmlFor="choice">Filter option</label><Select id="choice"><option value="all">All</option><option value="a">Synthetic A</option></Select><label htmlFor="code">Query</label><Textarea id="code" defaultValue="SELECT 1;" /></>);
    await user.selectOptions(screen.getByRole("combobox", { name: "Filter option" }), "a");
    expect(screen.getByRole("combobox")).toHaveValue("a");
    const code = screen.getByRole("textbox", { name: "Query" });
    await user.clear(code);
    await user.type(code, "SELECT\n  '001A';");
    expect(code).toHaveValue("SELECT\n  '001A';");
  });

  it("keeps the checkbox a native input operable by Space with an unchanged name and state", async () => {
    const user = userEvent.setup();
    const change = vi.fn();
    const { container } = render(<><label htmlFor="native-check">Native compare</label><Checkbox id="native-check" onChange={change} /></>);
    const checkbox = screen.getByRole("checkbox", { name: "Native compare" });
    expect(checkbox.tagName).toBe("INPUT");
    expect(checkbox).toHaveAttribute("type", "checkbox");
    expect(container.querySelectorAll("input,svg,canvas")).toHaveLength(1);
    await user.tab();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
    expect(change).toHaveBeenCalledTimes(1);
  });

  it("allows checkbox keyboard and label toggles; disabled controls retain values", async () => {
    const user = userEvent.setup();
    render(<><label htmlFor="compare">Compare reported percentage</label><Checkbox id="compare" /><label htmlFor="disabled">Disabled value</label><Input id="disabled" disabled defaultValue="retained" /></>);
    const checkbox = screen.getByRole("checkbox", { name: "Compare reported percentage" });
    await user.tab();
    expect(checkbox).toHaveFocus();
    await user.keyboard(" ");
    expect(checkbox).toBeChecked();
    await user.click(screen.getByText("Compare reported percentage"));
    expect(checkbox).not.toBeChecked();
    const input = screen.getByRole("textbox", { name: "Disabled value" });
    await user.type(input, "changed");
    expect(input).toHaveValue("retained");
  });
});

describe("status and asset semantics", () => {
  it("announces loading text once; decorative loading and visual badges stay quiet", () => {
    render(<><Spinner label="Loading preview" /><Spinner decorative /><Badge tone="success">Read only</Badge></>);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading preview");
    expect(screen.getByText("Read only")).not.toHaveAttribute("role");
  });

  it("announces a labelled spinner once and leaves badge and icon button output unchanged", () => {
    const { container } = render(<><Spinner label="Loading" /><Badge tone="error">Unavailable</Badge><IconButton label="Close preview"><Icon name="close" /></IconButton></>);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(container.querySelector("[aria-live=polite]")).toBe(screen.getByRole("status"));
    expect(container.querySelector("[aria-hidden=true]")).toBeInTheDocument();
    const badge = screen.getByText("Unavailable");
    expect(badge.tagName).toBe("SPAN");
    expect(badge).not.toHaveAttribute("role");
    expect(badge.textContent).toBe("Unavailable");
    const button = screen.getByRole("button", { name: "Close preview" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).not.toHaveAttribute("aria-busy");
    expect(button.children).toHaveLength(1);
  });

  it("keeps surface headings/regions and meaningful versus decorative assets", () => {
    render(<Surface as="section" aria-labelledby="panel-title"><h2 id="panel-title">Preview panel</h2><BrandMark /><BrandMark decorative={false} label="Outage Explorer" /><Icon name="info" decorative={false} label="Information" /><Icon name="table" /></Surface>);
    expect(screen.getByRole("region", { name: "Preview panel" })).toBeInTheDocument();
    expect(screen.getAllByRole("img")).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Information" })).toHaveAttribute("focusable", "false");
    expect(screen.getByRole("img", { name: "Outage Explorer" })).toBeInTheDocument();
  });
});
