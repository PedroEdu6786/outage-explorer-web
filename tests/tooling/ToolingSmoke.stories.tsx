import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ToolingSmoke } from "./ToolingSmoke";

const meta = {
  title: "Tooling/Smoke",
  component: ToolingSmoke,
} satisfies Meta<typeof ToolingSmoke>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Interactive: Story = {};
