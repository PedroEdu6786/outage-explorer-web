import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
import { DateRangeField } from "./DateRangeField";
import { FormField } from "./FormField";
import { SearchField } from "./SearchField";

const meta = {
  title: "Molecules/Fields",
  component: DateRangeField,
  args: { start: "", end: "", onStartChange: () => { /* Caller-owned callback in render examples. */ }, onEndChange: () => { /* Caller-owned callback in render examples. */ } },
  parameters: { docs: { description: { component: "M1: labeled V3 filters, V2 compact date range, V4 searchable schema input. Caller-owned values and error messages; no data filtering or coverage policy. Synthetic previews." } } },
} satisfies Meta<typeof DateRangeField>;
export default meta;
type Story = StoryObj<typeof meta>;

function DateExample({ compact = false, disabled = false, invalid = false }: { compact?: boolean; disabled?: boolean; invalid?: boolean }) {
  const [start, setStart] = useState("2026-09-01");
  const [end, setEnd] = useState("2026-09-30");
  return (
    <div className="grid max-w-xl gap-3 p-[18px]">
      <DateRangeField start={start} end={end} onStartChange={setStart} onEndChange={setEnd} variant={compact ? "compact" : "fields"} disabled={disabled} startError={invalid ? "Synthetic error: choose a different start date." : undefined} />
      <p className="text-[11px] text-text-muted">Supplied values: {start || "empty"} to {end || "empty"}</p>
    </div>
  );
}

export const DateFilters: Story = { render: () => <DateExample /> };
export const CompactRange: Story = { render: () => <DateExample compact /> };
export const InvalidRange: Story = { render: () => <DateExample invalid /> };
export const DisabledRange: Story = { render: () => <DateExample disabled /> };

function SearchExample() {
  const [value, setValue] = useState("");
  return <div className="grid max-w-xs gap-3 p-3"><SearchField label="Search datasets" value={value} onValueChange={setValue} placeholder="Search datasets" description="Enter text to inspect this synthetic control." /><p className="text-[11px] text-text-muted">Supplied search: {value || "empty"}</p></div>;
}
export const SchemaSearch: Story = { render: () => <SearchExample /> };
export const InvalidSearch: Story = { render: () => <div className="max-w-xs p-3"><SearchField label="Search datasets" value="synthetic" onValueChange={() => { /* Error-state specimen retains its supplied value. */ }} error="Synthetic error: search unavailable." /></div> };

export const LabeledFields: Story = {
  render: () => <div className="grid max-w-sm gap-3 p-3">
    <FormField label="Filter option" description="These options are synthetic.">{(association) => <Select {...association} defaultValue="all"><option value="all">All options</option><option value="a">Synthetic option A</option></Select>}</FormField>
    <FormField label="Identifier" description="Input remains an opaque string." error="Synthetic validation message.">{(association) => <Input {...association} defaultValue="001A" />}</FormField>
  </div>,
};
