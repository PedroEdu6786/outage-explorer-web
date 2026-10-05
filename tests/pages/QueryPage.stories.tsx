import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageDemo } from "./PageDemo";
const meta = { title: "Pages/Query", component: PageDemo, parameters: { layout: "fullscreen" }, args: { initialPath: "/query" } } satisfies Meta<typeof PageDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ready: Story = { args: { mode: "ready" } };
