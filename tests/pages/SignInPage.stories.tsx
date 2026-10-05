import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageDemo } from "./PageDemo";
const meta = { title: "Pages/Sign in", component: PageDemo, parameters: { layout: "fullscreen" }, args: { initialPath: "/sign-in" } } satisfies Meta<typeof PageDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SignedOut: Story = { args: { mode: "signed-out" } };
export const Expired: Story = { args: { mode: "expired" } };
export const Pending: Story = { args: { mode: "pending" } };
export const Failure: Story = { args: { mode: "failure" } };
