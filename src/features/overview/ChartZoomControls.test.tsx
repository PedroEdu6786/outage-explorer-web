import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChartZoomControls, type ChartZoomControlsProps } from "./ChartZoomControls";

function callbacks(): ChartZoomControlsProps {
  return { enabled: false, rangeLabel: "2026-06-01 to 2026-06-30", canZoomIn: true, canZoomOut: true,
    onEnabledChange: vi.fn(), onZoomIn: vi.fn(), onZoomOut: vi.fn(), onReset: vi.fn() };
}

function Harness() {
  const [enabled, setEnabled] = useState(false);
  const [range, setRange] = useState("2026-06-01 to 2026-06-30");
  return <ChartZoomControls enabled={enabled} rangeLabel={range} canZoomIn canZoomOut onEnabledChange={setEnabled}
    onZoomIn={() => { setRange("2026-06-08 to 2026-06-22"); }}
    onZoomOut={() => { setRange("2026-06-01 to 2026-06-30"); }}
    onReset={() => { setRange("2026-01-01 to 2026-12-31"); }} />;
}

describe("controlled chart zoom actions", () => {
  it("keeps reset available while mode is off, without dispatching disabled zoom actions", async () => {
    const user = userEvent.setup();
    const props = callbacks(); render(<ChartZoomControls {...props} />);
    expect(screen.getByRole("checkbox", { name: "Zoom mode" })).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("button", { name: "Zoom out" }));
    expect(props.onZoomIn).not.toHaveBeenCalled(); expect(props.onZoomOut).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(props.onReset).toHaveBeenCalledOnce();
    expect(screen.getByText("Visible dates: 2026-06-01 to 2026-06-30")).toBeVisible();
  });

  it("uses Tab and Space for mode and keyboard activation for enabled controls", async () => {
    const user = userEvent.setup(); render(<Harness />);
    await user.tab(); expect(screen.getByRole("checkbox")).toHaveFocus();
    await user.keyboard(" "); expect(screen.getByRole("checkbox")).toBeChecked();
    await user.tab(); expect(screen.getByRole("button", { name: "Zoom in" })).toHaveFocus();
    await user.keyboard("{Enter}"); expect(screen.getByText("Visible dates: 2026-06-08 to 2026-06-22")).toBeVisible();
    await user.tab(); expect(screen.getByRole("button", { name: "Zoom out" })).toHaveFocus();
    await user.keyboard(" "); expect(screen.getByText("Visible dates: 2026-06-01 to 2026-06-30")).toBeVisible();
    await user.tab(); expect(screen.getByRole("button", { name: "Reset zoom" })).toHaveFocus();
  });

  it("retains caller-supplied dates when mode is toggled off and resets only on request", async () => {
    const user = userEvent.setup(); render(<Harness />);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Zoom in" }));
    await user.click(screen.getByRole("checkbox"));
    expect(screen.getByText("Visible dates: 2026-06-08 to 2026-06-22")).toBeVisible();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Reset zoom" }));
    expect(screen.getByText("Visible dates: 2026-01-01 to 2026-12-31")).toBeVisible();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("accepts touch-pointer activation through native controls", async () => {
    const user = userEvent.setup(); render(<Harness />);
    await user.pointer([{ keys: "[TouchA]", target: screen.getByRole("checkbox") }]);
    expect(screen.getByRole("checkbox")).toBeChecked();
    await user.pointer([{ keys: "[TouchA]", target: screen.getByRole("button", { name: "Zoom in" }) }]);
    expect(screen.getByText("Visible dates: 2026-06-08 to 2026-06-22")).toBeVisible();
  });

  it("uses caller availability at limits and disables all actions when noninteractive", async () => {
    const user = userEvent.setup(); const props = callbacks();
    const { rerender } = render(<ChartZoomControls {...props} enabled canZoomIn={false} />);
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeEnabled();
    rerender(<ChartZoomControls {...props} enabled canZoomOut={false} />);
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Zoom out" })).toBeDisabled();
    rerender(<ChartZoomControls {...props} enabled interactive={false} />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
    for (const button of screen.getAllByRole("button")) { expect(button).toBeDisabled(); await user.click(button); }
    expect(props.onReset).not.toHaveBeenCalled();
    expect(props.onZoomIn).not.toHaveBeenCalled(); expect(props.onZoomOut).not.toHaveBeenCalled();
  });
});
