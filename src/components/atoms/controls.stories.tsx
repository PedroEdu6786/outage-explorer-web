import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Checkbox } from "./Checkbox";
import { Input } from "./Input";
import { Select } from "./Select";
import { Textarea } from "./Textarea";

const meta = {
  title: "Atoms/Controls",
  component: Input,
  parameters: {
    docs: {
      description: {
        component: "A2: V3 date/filter fields and V4 search/code field. Native compare checkbox replaces the prototype's hidden switch (D5). Focus, invalid and disabled states are accessibility extensions; examples are synthetic.",
      },
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DateFilters: Story = {
  render: () => (
    <div className="flex max-w-lg flex-wrap gap-[10px] rounded-panel bg-surface-muted p-[18px]">
      <div className="grid w-[155px] gap-[5px]">
        <label htmlFor="start-date" className="text-[10px] font-semibold text-text-muted">Start date</label>
        <Input id="start-date" name="startDate" type="date" defaultValue="2026-09-01" />
      </div>
      <div className="grid w-[155px] gap-[5px]">
        <label htmlFor="end-date" className="text-[10px] font-semibold text-text-muted">End date</label>
        <Input id="end-date" name="endDate" type="date" defaultValue="2026-09-30" />
      </div>
    </div>
  ),
};

export const SchemaSearch: Story = {
  render: () => (
    <div className="grid max-w-xs gap-[5px] p-3">
      <label htmlFor="schema-search" className="text-[10px] font-semibold text-text-muted">Search datasets</label>
      <Input id="schema-search" name="search" type="search" placeholder="Search datasets" aria-describedby="search-help" />
      <p id="search-help" className="text-[11px] text-text-muted">Enter text to inspect the native search field.</p>
    </div>
  ),
};

export const FilterSelect: Story = {
  render: () => (
    <div className="grid max-w-xs gap-[5px] p-3">
      <label htmlFor="filter-option" className="text-[10px] font-semibold text-text-muted">Filter option</label>
      <Select id="filter-option" name="filter" defaultValue="all">
        <option value="all">All options</option>
        <option value="a">Synthetic option A</option>
        <option value="b">Synthetic option B</option>
      </Select>
    </div>
  ),
};

export const CodeEntry: Story = {
  render: () => (
    <div className="grid max-w-2xl gap-[5px] p-3">
      <label htmlFor="code-entry" className="text-[11px] font-semibold text-text">Query</label>
      <Textarea id="code-entry" name="code" rows={8} aria-describedby="code-help" defaultValue={"SELECT 'synthetic example' AS label;"} />
      <p id="code-help" className="text-[11px] text-text-muted">Editable code field; this preview does not execute statements.</p>
    </div>
  ),
};

export const CompareCheckbox: Story = {
  render: () => (
    <div className="p-3">
      <label htmlFor="compare" className="flex min-h-8 w-fit cursor-pointer items-center gap-2 text-[11px] text-text-muted">
        <Checkbox id="compare" name="compare" defaultChecked aria-describedby="compare-help" />
        Compare reported percentage
      </label>
      <p id="compare-help" className="text-[11px] text-text-muted">Toggle with Space or select the label.</p>
    </div>
  ),
};

export const Invalid: Story = {
  render: () => (
    <div className="grid max-w-sm gap-3 p-3">
      <label htmlFor="invalid-date" className="text-[11px] text-text">Start date</label>
      <Input id="invalid-date" type="date" aria-invalid="true" aria-describedby="date-error" />
      <p id="date-error" className="text-[11px] text-error">Choose a start date.</p>
      <label htmlFor="invalid-select" className="text-[11px] text-text">Filter option</label>
      <Select id="invalid-select" aria-invalid="true" aria-describedby="select-error" defaultValue="">
        <option value="">Choose an option</option>
        <option value="a">Synthetic option A</option>
      </Select>
      <p id="select-error" className="text-[11px] text-error">Choose an option.</p>
      <label htmlFor="invalid-code" className="text-[11px] text-text">Query</label>
      <Textarea id="invalid-code" rows={3} aria-invalid="true" aria-describedby="code-error" />
      <p id="code-error" className="text-[11px] text-error">Enter a statement.</p>
      <label htmlFor="invalid-compare" className="flex min-h-8 items-center gap-2 text-[11px] text-text">
        <Checkbox id="invalid-compare" aria-invalid="true" aria-describedby="checkbox-error" />
        Compare option
      </label>
      <p id="checkbox-error" className="text-[11px] text-error">Synthetic checkbox validation message.</p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="grid max-w-sm gap-3 p-3">
      <label htmlFor="disabled-search" className="text-[11px] text-text">Search datasets</label>
      <Input id="disabled-search" type="search" disabled placeholder="Search datasets" />
      <label htmlFor="disabled-select" className="text-[11px] text-text">Filter option</label>
      <Select id="disabled-select" disabled><option>Synthetic option A</option></Select>
      <label htmlFor="disabled-code" className="text-[11px] text-text">Query</label>
      <Textarea id="disabled-code" disabled rows={3} defaultValue="SELECT 'synthetic example';" />
      <label htmlFor="disabled-compare" className="flex min-h-8 items-center gap-2 text-[11px] text-text-muted">
        <Checkbox id="disabled-compare" disabled defaultChecked />
        Compare reported percentage
      </label>
    </div>
  ),
};

function ControlMotionStates() {
  const [invalid, setInvalid] = useState(false);
  return (
    <div className="grid max-w-sm gap-3 p-3">
      <label htmlFor="motion-unchecked" className="flex min-h-8 w-fit cursor-pointer items-center gap-2 text-[11px] text-text-muted">
        <Checkbox id="motion-unchecked" />
        Unchecked, toggle with Space
      </label>
      <label htmlFor="motion-checked" className="flex min-h-8 w-fit cursor-pointer items-center gap-2 text-[11px] text-text-muted">
        <Checkbox id="motion-checked" defaultChecked />
        Checked, toggle with Space
      </label>
      <label htmlFor="motion-field" className="text-[11px] text-text">Start date</label>
      <Input id="motion-field" type="date" aria-invalid={invalid ? "true" : undefined} aria-describedby={invalid ? "motion-field-error" : undefined} />
      {invalid && <p id="motion-field-error" className="animate-fade-in text-[11px] text-error">Choose a start date.</p>}
      <button type="button" className="w-fit rounded-control border border-border-strong px-2 py-1 text-[11px]" onClick={() => { setInvalid((value) => !value); }}>{invalid ? "Mark valid" : "Mark invalid"}</button>
    </div>
  );
}

/** Synthetic checked/unchecked checkbox and valid-to-invalid input for motion review. */
export const MotionReview: Story = { render: () => <ControlMotionStates /> };
