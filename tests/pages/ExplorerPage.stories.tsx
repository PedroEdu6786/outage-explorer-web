import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageDemo } from "./PageDemo";
const meta = { title: "Pages/Explorer", component: PageDemo, parameters: { layout: "fullscreen" }, args: { initialPath: "/datasets" } } satisfies Meta<typeof PageDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = { args: { mode: "ready" } };
export const Viewer: Story = { args: { mode: "viewer" } };
