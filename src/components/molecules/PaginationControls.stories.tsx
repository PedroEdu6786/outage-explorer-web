import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PaginationControls } from "./PaginationControls";

const meta = {
  title: "Molecules/PaginationControls",
  component: PaginationControls,
  args: { label: "Synthetic navigation" },
  parameters: { docs: { description: { component: "M2: V3 footer action layout with caller-supplied summary. Numbered retained-page actions are a required C4 extension. This component never computes totals, starts requests or changes execution state." } } },
} satisfies Meta<typeof PaginationControls>;
export default meta;
type Story = StoryObj<typeof meta>;

function ActionExample({ disabled = false, numbered = false }: { disabled?: boolean; numbered?: boolean }) {
  const [selected, setSelected] = useState("No action selected");
  return <div className="max-w-2xl rounded-panel border border-border bg-surface">
    <PaginationControls label="Synthetic preview navigation" summary={numbered ? "Retained page 2" : "6 supplied rows"} disabled={disabled}
      previous={{ label: "Previous", onSelect: () => { setSelected("Previous selected"); }, disabled: !numbered }}
      next={{ label: "Next", onSelect: () => { setSelected("Next selected"); } }}
      {...(numbered ? { pages: [
        { key: "1", label: "1", onSelect: () => { setSelected("Page 1 selected"); } },
        { key: "2", label: "2", current: true, onSelect: () => { setSelected("Page 2 selected"); } },
        { key: "3", label: "3", onSelect: () => { setSelected("Page 3 selected"); } },
      ] } : {})}
    />
    <p aria-live="polite" className="px-[14px] pb-3 text-[11px] text-text-muted">{selected}</p>
  </div>;
}

export const ContinuationActions: Story = { render: () => <ActionExample /> };
export const NumberedActions: Story = { render: () => <ActionExample numbered /> };
export const DisabledActions: Story = { render: () => <ActionExample disabled numbered /> };
export const EndOfSequence: Story = {
  args: { label: "Synthetic preview navigation", summary: "No further rows supplied", next: { label: "Next", disabled: true, onSelect: () => { /* Disabled static specimen. */ } } },
};
export const LongSummary: Story = {
  args: { label: "Synthetic result navigation", summary: "This caller-supplied summary explains the current retained result without inventing a matching-record count.", next: { label: "Next", onSelect: () => { /* Static wrapping specimen. */ } } },
};
