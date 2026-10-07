import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { TableData } from "../../contracts/table";
import { syntheticQueryTable } from "../../../tests/fixtures/scenarios";
import { Button } from "../atoms/Button";
import { Surface } from "../atoms/Surface";
import { DataTable } from "./DataTable";

const variedTable: TableData = {
  columns: [
    { id: "date", label: "Date", kind: "date", unit: null, nullable: false },
    { id: "id", label: "Identifier", kind: "identifier", unit: null, nullable: false },
    { id: "value", label: "Provided value", kind: "decimal", unit: "MW", nullable: true },
    { id: "text", label: "Source text", kind: "text", unit: null, nullable: false },
  ],
  rows: [
    { position: 0, cells: [{ kind: "date", value: "2026-10-01" }, { kind: "identifier", value: "001A" }, { kind: "decimal", exact: "0", display: "0.00" }, { kind: "text", value: "<em>Text is not HTML</em>" }] },
    { position: 1, cells: [{ kind: "date", value: "2026-10-02" }, { kind: "identifier", value: "00B7" }, { kind: "null" }, { kind: "text", value: "Synthetic missing value" }] },
  ],
};

const meta = {
  title: "Organisms/Data table",
  component: DataTable,
  args: { data: variedTable, caption: "Synthetic typed records" },
  decorators: [(Story) => <Surface><Story /></Surface>],
  parameters: { docs: { description: { component: "O1 positional table maps V2/V3/V4 published header/cell geometry. D4 keyboard scroll-region and hidden semantic caption are accessibility extensions. Duplicate labels/rows, supplied decimal text and missing values remain intact. These are synthetic records, not live findings." } } },
} satisfies Meta<typeof DataTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TypedValues: Story = {};
export const DuplicateColumnsAndRows: Story = { args: { data: syntheticQueryTable, caption: "Synthetic duplicate projection" } };
export const NarrowOverflow: Story = {
  decorators: [(Story) => <div className="max-w-[320px]"><Story /></div>],
};
export const Empty: Story = {
  args: { data: { columns: variedTable.columns, rows: [] }, caption: "Synthetic empty records", emptyTitle: "No matching records", emptyDescription: "Choose different filters to continue.", emptyActions: <Button variant="secondary">Change filters</Button> },
};

function LoadingDemo() {
  const [loading, setLoading] = useState(true);
  return (
    <div>
      <div className="border-b border-border p-3"><Button variant="secondary" onClick={() => { setLoading((value) => !value); }}>{loading ? "Finish loading" : "Load next page"}</Button></div>
      <DataTable data={variedTable} caption="Synthetic retained page" loading={loading} />
    </div>
  );
}

/** Retained rows dimmed while a caller replaces them: busy, inert and hidden from assistive technology. */
export const LoadingRetained: Story = { render: () => <LoadingDemo /> };

const manyRows: TableData = {
  columns: variedTable.columns,
  rows: Array.from({ length: 14 }, (_, position) => ({ position, cells: [
    { kind: "date", value: `2026-10-${String(position + 1).padStart(2, "0")}` }, { kind: "identifier", value: `ID-${String(position)}` },
    position % 5 === 3 ? { kind: "null" } : { kind: "decimal", exact: String(position), display: `${String(position)}.00` }, { kind: "text", value: `Synthetic row ${String(position + 1)}` },
  ] })),
};

function EntranceDemo({ entrance }: { entrance: "stagger" | "none" }) {
  const [replay, setReplay] = useState(0);
  return (
    <div>
      <div className="border-b border-border p-3"><Button variant="secondary" onClick={() => { setReplay((value) => value + 1); }}>Replay entrance</Button></div>
      <DataTable key={replay} data={manyRows} caption="Synthetic entrance rows" entrance={entrance} />
    </div>
  );
}

/** First ten rows fade in with a 20ms stagger on mount (cells untouched); rows past ten appear with the table. */
export const StaggeredRows: Story = { render: () => <EntranceDemo entrance="stagger" /> };
/** `entrance="none"` for tables inside Tabs panels, whose display toggles would replay the stagger. */
export const NoEntrance: Story = { render: () => <EntranceDemo entrance="none" /> };
