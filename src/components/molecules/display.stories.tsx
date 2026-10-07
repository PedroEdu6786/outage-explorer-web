import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../atoms/Button";
import { Surface } from "../atoms/Surface";
import { EmptyState } from "./EmptyState";
import { MetricValue } from "./MetricValue";
import { PanelHeader } from "./PanelHeader";
import { StatusMessage } from "./StatusMessage";
import { TableSkeleton } from "./TableSkeleton";

const meta = {
  title: "Molecules/Displays",
  component: StatusMessage,
  args: { title: "Status" },
  parameters: { docs: { description: { component: "Synthetic M2 specimens. V2 metric and panel-heading values; V4 status layout. D1 extensions: status title/detail 10/9→12/11px and metric metadata 10px faint→11px muted. C10 recovery layouts extend saved happy paths; announcements exclude action slots. Metric values are provided text, never calculated." } } },
} satisfies Meta<typeof StatusMessage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const StatusStates: Story = {
  render: () => (
    <div className="grid max-w-3xl gap-3">
      <StatusMessage title="Ready" description="Choose an action to begin." announcement="off" />
      <StatusMessage title="Loading preview" description="Waiting for the selected records." pending />
      <StatusMessage title="Complete" description="The requested content is available." tone="success" />
      <StatusMessage title="Unavailable" description="Your input has been retained." tone="error" announcement="assertive" actions={<Button variant="secondary">Try again</Button>} />
      <StatusMessage title="Partial result" description="Only retained records are shown." tone="warning" />
    </div>
  ),
};

export const Empty: Story = {
  render: () => <Surface><EmptyState title="No matching records" description="Change the supplied filters to browse again." actions={<Button variant="secondary">Clear filters</Button>} /></Surface>,
};

export const PreciseValues: Story = {
  render: () => (
    <div className="grid gap-[14px] min-[761px]:grid-cols-3">
      <Surface className="px-[18px] pt-[17px] pb-[15px]"><MetricValue label="Provided decimal" value="1.005000" unit="MW" metadata="Synthetic observation" /></Surface>
      <Surface className="px-[18px] pt-[17px] pb-[15px]"><MetricValue label="Observed zero" value="0.00" unit="%" /></Surface>
      <Surface className="px-[18px] pt-[17px] pb-[15px]"><MetricValue label="Missing observation" value={null} unit="%" /></Surface>
    </div>
  ),
};

export const Header: Story = {
  render: () => <Surface as="section" aria-labelledby="display-panel"><PanelHeader title="Records" titleId="display-panel" description="Synthetic panel with a caller-owned action." actions={<Button variant="secondary">Explore dataset</Button>} /><div className="p-[17px]">Panel content slot</div></Surface>,
};

export const TablePlaceholder: Story = {
  render: () => <Surface><TableSkeleton rows={5} columns={4} /></Surface>,
};

function MetricLoadingDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div className="grid max-w-sm gap-3">
      <Button variant="secondary" onClick={() => { setLoading((value) => !value); }}>{loading ? "Finish loading" : "Load again"}</Button>
      <Surface className="px-[18px] pt-[17px] pb-[15px]">
        <MetricValue loading={loading} label="Provided decimal" value={loading ? null : "1.005000"} unit="MW" metadata={loading ? <span className="inline-block h-[.8em] w-[14ch] rounded-badge bg-border align-middle" aria-hidden="true" /> : "Synthetic observation"} />
      </Surface>
    </div>
  );
}

/** Metric placeholder then the exact provided value fading in; never zero or "Unavailable". */
export const MetricLoadingReview: Story = { render: () => <MetricLoadingDemo /> };

type SwitchState = "ready" | "pending" | "success" | "warning" | "error";
const switchStates: readonly SwitchState[] = ["pending", "success", "warning", "error", "ready"];

function StatusSwitch() {
  const [index, setIndex] = useState(0);
  const state = switchStates[index] ?? "ready";
  const props = state === "pending" ? { title: "Loading preview", description: "Waiting for the selected records.", pending: true }
    : state === "success" ? { title: "Complete", description: "The requested content is available.", tone: "success" as const, icon: <span>✓</span> }
    : state === "warning" ? { title: "Partial result", description: "Only retained records are shown.", tone: "warning" as const, icon: <span>!</span> }
    : state === "error" ? { title: "Unavailable", description: "Your input has been retained.", tone: "error" as const, announcement: "assertive" as const }
    : { title: "Ready", description: "Choose an action to begin.", announcement: "off" as const };
  return (
    <div className="grid max-w-3xl gap-3">
      <Button variant="secondary" onClick={() => { setIndex((value) => (value + 1) % switchStates.length); }}>Next status</Button>
      <StatusMessage {...props} />
    </div>
  );
}

/** One banner moving between states to review icon crossfade and the success settle. */
export const StatusSwitchReview: Story = { render: () => <StatusSwitch /> };

export const EmptyStateReview: Story = {
  render: () => <Surface><EmptyState title="No matching records" description="Change the supplied filters to browse again." icon={<span>∅</span>} actions={<Button variant="secondary">Clear filters</Button>} /></Surface>,
};
