import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageDemo } from "./PageDemo";
const meta = { title: "Pages/Overview", component: PageDemo, parameters: { layout: "fullscreen" }, args: { initialPath: "/overview" } } satisfies Meta<typeof PageDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = { args: { mode: "ready" } };
export const Pending: Story = { args: { mode: "pending" } };
