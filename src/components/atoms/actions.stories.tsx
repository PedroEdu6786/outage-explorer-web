import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { Icon } from "./Icon";
import { Link } from "./Link";

const meta = {
  title: "Atoms/Actions",
  component: Button,
  parameters: {
    docs: {
      description: {
        component: "A1/V1–V4: observed primary, secondary and ghost actions. Loading, focus and text-link styling are documented behavior extensions; these previews use no live data.",
      },
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = { args: { children: "Apply filters" } };
export const Secondary: Story = { args: { variant: "secondary", children: "Next" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Reset" } };
export const Disabled: Story = { args: { variant: "secondary", disabled: true, children: "Previous" } };
export const Loading: Story = { args: { loading: true, loadingLabel: "Signing in…", children: "Sign in" } };

export const Vocabulary: Story = {
  render: () => (
    <section aria-label="Action vocabulary" className="flex flex-wrap items-center gap-4 rounded-panel border border-border bg-surface p-4">
      <Button>Apply filters</Button>
      <Button variant="secondary">Next</Button>
      <Button variant="ghost">Reset</Button>
      <Button disabled variant="secondary">Previous</Button>
      <Button loading loadingLabel="Signing in…">Sign in</Button>
      <IconButton label="Close preview"><Icon name="close" /></IconButton>
      <Link href="#action-destination">Explore dataset</Link>
      <span id="action-destination">Navigation destination</span>
    </section>
  ),
};

function MotionStates() {
  const [loading, setLoading] = useState(false);
  return (
    <section aria-label="Action motion states" className="grid gap-4 rounded-panel border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-4">
        <Button>Hover or press me</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button disabled variant="secondary">Disabled</Button>
        <IconButton label="Close preview"><Icon name="close" /></IconButton>
        <Link href="#action-destination">Explore dataset</Link>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button loading={loading} loadingLabel="Saving…">Save changes</Button>
        <Button variant="secondary" onClick={() => { setLoading((value) => !value); }}>{loading ? "Finish loading" : "Start loading"}</Button>
      </div>
      <span id="action-destination">Navigation destination</span>
    </section>
  );
}

/** Synthetic hover, press, loading and disabled states for motion review (toggle the toolbar Motion global on). */
export const MotionReview: Story = { render: () => <MotionStates /> };
