import type { DatasetSchema as Schema } from "../../contracts/catalog";
import type { TableData } from "../../contracts/table";
import { DataTable } from "../../components/organisms/DataTable";

export function DatasetSchema({ schema }: { readonly schema: Schema }) {
  const table: TableData = {
    columns: [
      { id: "column", label: "Column name", kind: "text", unit: null, nullable: false },
      { id: "type", label: "Type", kind: "text", unit: null, nullable: false },
      { id: "unit", label: "Unit", kind: "text", unit: null, nullable: true },
      { id: "nullable", label: "Nullable", kind: "boolean", unit: null, nullable: false },
    ],
    rows: schema.columns.map((column, position) => ({ position, cells: [
      { kind: "text", value: column.label }, { kind: "text", value: column.sqlType },
      column.unit === null ? { kind: "null" } : { kind: "text", value: column.unit },
      column.nullable === null ? { kind: "text", value: "Unknown" } : { kind: "boolean", value: column.nullable },
    ] })),
  };
  return <DataTable data={table} caption="Authorized dataset schema" emptyTitle="No schema columns available" />;
}
