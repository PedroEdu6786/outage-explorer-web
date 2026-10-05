import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./Badge";
import { Spinner } from "./Spinner";
import { Surface } from "./Surface";

const meta = {
  title: "Atoms/Status and surfaces",
  component: Badge,
  parameters: {
    docs: {
      description: {
        component:
          "A3 synthetic specimens map the published .badge, .panel and .spinner selectors. Badge tones have no permission authority. D5 extension: loading has accessible text and the ring stops rotating under prefers-reduced-motion. Compact 9px badges retain the observed baseline pending T2.6 readability review.",
      },
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Tones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Sample data</Badge>
      <Badge tone="info">National</Badge>
      <Badge tone="success">Read only</Badge>
      <Badge tone="warning">Truncated</Badge>
      <Badge tone="error">Unavailable</Badge>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Spinner label="Loading preview" />
        <span>Loading preview</span>
      </div>
      <div className="flex items-center gap-2 rounded-control bg-accent p-3 text-white">
        <Spinner decorative tone="inverse" />
        <span>Loading</span>
      </div>
    </div>
  ),
};

export const Panel: Story = {
  render: () => (
    <Surface as="section" aria-labelledby="surface-title" className="max-w-lg">
      <div className="border-b border-border px-[17px] py-[15px]">
        <h2 id="surface-title">Preview panel</h2>
        <p className="mt-1 text-[11px] text-text-muted">Synthetic panel content</p>
      </div>
      <div className="flex items-center gap-2 p-[17px]">
        <Spinner label="Loading panel content" />
        <span>Loading panel content</span>
      </div>
    </Surface>
  ),
};
