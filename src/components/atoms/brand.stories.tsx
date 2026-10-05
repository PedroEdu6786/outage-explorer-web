import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BrandMark } from "./BrandMark";
import { Icon, type IconName } from "./Icon";

const meta = {
  title: "Atoms/Brand",
  component: BrandMark,
  parameters: {
    docs: {
      description: {
        component: "A1/S1/V1: unchanged CSS tile and inline SVG geometry from the inspected published prototype. See assets.md for bundle/source locators; unknown Make PNGs are unassigned. Refresh is excluded because its only consumer is deferred.",
      },
    },
  },
} satisfies Meta<typeof BrandMark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {
  render: () => (
    <div className="flex items-center gap-[10px] bg-sidebar p-5 text-white">
      <BrandMark /><strong className="font-[650] tracking-[-.01em]">Outage Explorer</strong>
    </div>
  ),
};

export const Meaningful: Story = {
  args: { decorative: false, label: "Outage Explorer" },
};

const names: IconName[] = ["overview", "datasets", "sql", "calendar", "info", "chevron", "play", "copy", "logout", "menu", "close", "check", "warning", "search", "table"];

export const Icons: Story = {
  render: () => (
    <section aria-label="Published icon vocabulary" className="grid grid-cols-3 gap-4 rounded-panel border border-border bg-surface p-4 sm:grid-cols-5">
      {names.map((name) => (
        <div key={name} className="flex items-center gap-2 text-text">
          <Icon name={name} /><span>{name}</span>
        </div>
      ))}
      <Icon name="info" decorative={false} label="Information" />
    </section>
  ),
};
