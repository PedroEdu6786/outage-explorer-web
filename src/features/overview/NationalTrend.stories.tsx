import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fireEvent, within } from "storybook/test";
import { syntheticZoomSeries } from "../../../tests/fixtures/overview-zoom";
import { NationalTrend } from "./NationalTrend";

const meta = {
  title: "Features/Overview/NationalTrend",
  component: NationalTrend,
  args: { series: syntheticZoomSeries() },
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div className="mx-auto max-w-6xl p-3"><p className="mb-3 text-[12px] text-text-muted">Synthetic chart zoom data — not EIA observations</p><Story /></div>],
} satisfies Meta<typeof NationalTrend>;
export default meta;
type Story = StoryObj<typeof meta>;

export const OneYear: Story = {};
export const TwoYears: Story = { args: { series: syntheticZoomSeries(2) } };
export const NarrowedCompare: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole("checkbox", { name: "Zoom mode" }));
    await fireEvent.click(canvas.getByRole("checkbox", { name: "Compare EIA reported %" }));
    for (let step = 0; step < 5; step += 1) await fireEvent.click(canvas.getByRole("button", { name: "Zoom in" }));
  },
};
export const EmptyWindow: Story = { args: { range: { start: "2026-07-01", end: "2026-07-31" } } };
export const ShortRange: Story = { args: { range: { start: "2026-06-08", end: "2026-06-14" } } };
export const Unavailable: Story = { args: { interactive: false } };
