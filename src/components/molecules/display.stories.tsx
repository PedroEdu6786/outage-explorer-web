import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "../atoms/Button";
import { Surface } from "../atoms/Surface";
import { EmptyState } from "./EmptyState";
import { MetricValue } from "./MetricValue";
import { PanelHeader } from "./PanelHeader";
import { StatusMessage } from "./StatusMessage";

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
