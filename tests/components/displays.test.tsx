import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../../src/components/atoms/Button";
import { Surface } from "../../src/components/atoms/Surface";
import { EmptyState } from "../../src/components/molecules/EmptyState";
import { MetricValue } from "../../src/components/molecules/MetricValue";
import { PanelHeader } from "../../src/components/molecules/PanelHeader";
import { StatusMessage } from "../../src/components/molecules/StatusMessage";

describe("shared displays", () => {
  it("announces pending/status updates once, with recovery outside the live region", async () => {
    const retry = vi.fn();
    const user = userEvent.setup();
    const { rerender } = render(<StatusMessage title="Loading" pending />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    rerender(<StatusMessage title="Unavailable" description="Input retained" announcement="assertive" actions={<Button onClick={retry}>Retry</Button>} />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Input retained");
    expect(screen.getByRole("alert")).not.toContainElement(screen.getByRole("button"));
    await user.tab();
    await user.keyboard("{Enter}");
    expect(retry).toHaveBeenCalledTimes(1);
    rerender(<StatusMessage title="Ready" announcement="off" />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps one live region with unchanged role and text as a status moves pending, success and warning", () => {
    const { container, rerender } = render(<StatusMessage title="Loading preview" pending />);
    const region = screen.getByRole("status");
    expect(region).toHaveTextContent("Loading preview");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(container.querySelectorAll("[role=status], [role=alert], [aria-live]")).toHaveLength(1);
    // The pending spinner icon is decorative: no second status, no accessible text.
    expect(container.querySelector("[aria-hidden=true] [role=status]")).toBeNull();
    rerender(<StatusMessage tone="success" title="Loaded" icon={<svg data-testid="check" />} />);
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("Loaded");
    expect(screen.getByTestId("check").closest("[aria-hidden=true]")).not.toBeNull();
    rerender(<StatusMessage tone="warning" title="Careful" description="Check input" icon={<svg data-testid="warn" />} />);
    expect(container.querySelectorAll("[role=status], [role=alert], [aria-live]")).toHaveLength(1);
    expect(screen.getByRole("status")).toHaveTextContent("CarefulCheck input");
    expect(screen.queryByTestId("check")).not.toBeInTheDocument();
  });

  it("keeps empty-state text, heading and caller recovery unchanged under staggered entrances", () => {
    render(<EmptyState title="Nothing here" description="Try another range." icon={<svg data-testid="icon" />} actions={<Button>Reset</Button>} />);
    expect(screen.getByRole("heading", { name: "Nothing here", level: 2 })).toBeVisible();
    expect(screen.getByText("Try another range.")).toBeVisible();
    expect(screen.getByTestId("icon").closest("[aria-hidden=true]")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Reset" })).toBeEnabled();
  });

  it("shows a placeholder, never zero or Unavailable, while a metric loads and then the exact value", () => {
    const { container, rerender } = render(<MetricValue loading label="Offline capacity" value={null} unit="MW" metadata="placeholder" />);
    const metric = container.querySelector("dl");
    expect(metric).toHaveAttribute("aria-busy", "true");
    expect(container.querySelector("dd [aria-hidden=true]")).not.toBeNull();
    expect(within(metric as HTMLElement).queryByText(/^0/)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Unavailable|MW|0\.00/);
    expect(screen.getByText("Offline capacity")).toBeVisible();
    rerender(<MetricValue loading={false} label="Offline capacity" value="1.005000" unit="MW" metadata="2026-09-01" />);
    expect(container.querySelector("dl")).not.toHaveAttribute("aria-busy");
    expect(screen.getByText("1.005000")).toBeVisible();
    expect(container.querySelector("dd [aria-hidden=true]")).toBeNull();
    rerender(<MetricValue loading={false} label="Offline capacity" value="0.00" unit="MW" />);
    expect(screen.getByText("0.00")).toBeVisible();
    rerender(<MetricValue loading={false} label="Offline capacity" value={null} unit="MW" />);
    expect(screen.getByText("Unavailable")).toBeVisible();
  });

  it("keeps the default MetricValue output when loading is not supplied", () => {
    const { container } = render(<MetricValue label="Capacity" value="2.00" unit="%" />);
    expect(container.querySelector("dl")).not.toHaveAttribute("aria-busy");
    expect(container.querySelector("dd")?.className).not.toContain("animate");
    expect(screen.getByText("2.00")).toBeVisible();
  });

  it("preserves provided precision, calendar text, missing values and valid zero", () => {
    const { rerender } = render(<MetricValue label="Capacity" value="1.005000" unit="MW" metadata="2026-10-01" />);
    expect(screen.getByText("1.005000")).toBeInTheDocument();
    expect(screen.getByText("2026-10-01")).toBeInTheDocument();
    rerender(<MetricValue label="Percentage" value="0.00" unit="%" />);
    expect(screen.getByText("0.00")).toBeInTheDocument();
    rerender(<MetricValue label="Percentage" value={null} unit="%" />);
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
    expect(screen.queryByText("0.00")).not.toBeInTheDocument();
    expect(screen.queryByText("%")).not.toBeInTheDocument();
  });

  it("keeps panel naming and empty-state recovery caller-controlled", async () => {
    const clear = vi.fn();
    render(<Surface as="section" aria-labelledby="records-title"><PanelHeader title="Records" titleId="records-title" /><EmptyState headingLevel={3} title="No rows" actions={<Button onClick={clear}>Clear filters</Button>} /></Surface>);
    expect(screen.getByRole("region", { name: "Records" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No rows", level: 3 })).toBeInTheDocument();
    expect(clear).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Clear filters" }));
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
