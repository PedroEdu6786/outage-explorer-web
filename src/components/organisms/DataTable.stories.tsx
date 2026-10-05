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
