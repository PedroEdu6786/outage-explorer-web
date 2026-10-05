import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FeatureHarness } from "./FeatureHarness";

const meta = { title: "Integration/Feature harness", component: FeatureHarness, parameters: { layout: "fullscreen" } } satisfies Meta<typeof FeatureHarness>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SharedSession: Story = {};
