import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { ChartZoomControls } from "./ChartZoomControls";

function ControlsExample({ initiallyEnabled = false, minimum = false, interactive = true }: {
  initiallyEnabled?: boolean;
  minimum?: boolean;
  interactive?: boolean;
}) {
  const [enabled, setEnabled] = useState(initiallyEnabled);
  const [narrowed, setNarrowed] = useState(initiallyEnabled || minimum);
  const [action, setAction] = useState("No action selected");
  return <div className="mx-auto max-w-5xl p-3">
    <Surface>
      <PanelHeader title="Daily fleet capacity offline" description="Synthetic controls specimen — no chart attached" />
      <div className="p-[18px]">
        <ChartZoomControls enabled={enabled} interactive={interactive}
          rangeLabel={narrowed ? "2026-06-01 to 2026-06-15" : "2026-01-01 to 2026-12-31"}
          canZoomIn={!narrowed} canZoomOut={narrowed} onEnabledChange={setEnabled}
          onZoomIn={() => { setNarrowed(true); setAction("Zoom in selected"); }}
          onZoomOut={() => { setNarrowed(false); setAction("Zoom out selected"); }}
          onReset={() => { setNarrowed(false); setAction("Reset selected"); }} />
        <p role="status" className="mt-3 text-[12px] text-text-muted">{action}</p>
      </div>
    </Surface>
  </div>;
}

const meta = {
  title: "Features/Overview/ChartZoomControls",
  component: ControlsExample,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ControlsExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ModeOff: Story = {};
export const NarrowedWindow: Story = { args: { initiallyEnabled: true } };
export const RetainedZoomModeOff: Story = { args: { minimum: true } };
export const Unavailable: Story = { args: { interactive: false } };
