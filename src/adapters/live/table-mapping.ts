import { z } from "zod";
import type { DatasetSchemaColumn } from "../../contracts/catalog";
import type { TableCell, TableData } from "../../contracts/table";
import { dateSchema, type Descriptor, type WireColumn } from "./data-schema";

const integer = z.string().regex(/^-?(0|[1-9]\d*)$/);

const decimal = z.string().regex(/^-?\d+(\.\d+)?$/);

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?$/);

function child(descriptor: Descriptor, index: number): Descriptor {
  const value = descriptor.children?.[index];

  if (!value) {
    throw new Error("Missing type descriptor");
  }

  return value;
}

/** Validate descriptor-dependent values, preserving positional nested structures. */
export function mapCell(
  descriptor: Descriptor,
  raw: unknown,
  nullable: boolean | null = null,
): TableCell {
  if (raw === null) {
    if (nullable === false && descriptor.type !== "null") {
      throw new Error("Unexpected null");
    }

    return { kind: "null" };
  }

  switch (descriptor.type) {
    case "null":
      throw new Error("Expected null");
    case "integer": {
      const exact = integer.parse(raw);

      return { kind: "integer", exact, display: exact };
    }
    case "decimal": {
      const exact = decimal.parse(raw);
      const [whole = "", fraction = ""] = exact.replace(/^-/, "").split(".");

      const wholeDigits = whole.replace(/^0+/, "").length;
      const allowedWholeDigits = (descriptor.precision ?? 0) - (descriptor.scale ?? 0);
      const exceedsScale = fraction.length > (descriptor.scale ?? 0);

      if (exceedsScale || wholeDigits > allowedWholeDigits) {
        throw new Error("Decimal exceeds descriptor");
      }

      return { kind: "decimal", exact, display: exact };
    }
    case "float":
      return {
        kind: "float",
        value: z.union([z.number(), z.enum(["NaN", "Infinity", "-Infinity"])]).parse(raw),
      };
    case "boolean":
      return { kind: "boolean", value: z.boolean().parse(raw) };
    case "string":
      return { kind: "text", value: z.string().parse(raw) };
    case "date":
      return { kind: "date", value: dateSchema.parse(raw) };
    case "time":
      return { kind: "time", value: time.parse(raw) };
    case "timestamp":
    case "timestamp_tz": {
      const value = z.string().parse(raw);
      const local = descriptor.type === "timestamp_tz" ? value.replace(/Z$/, "") : value;
      const [day, clock, extra] = local.split("T");

      dateSchema.parse(day);
      time.parse(clock);
      if (extra !== undefined || (descriptor.type === "timestamp_tz" && !value.endsWith("Z"))) {
        throw new Error("Invalid timestamp");
      }

      return { kind: descriptor.type, value };
    }
    case "binary":
      return {
        kind: "binary",
        value: z
          .string()
          .regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
          .parse(raw),
      };
    case "list":
      return {
        kind: "list",
        items: z
          .array(z.unknown())
          .parse(raw)
          .map((item) => mapCell(child(descriptor, 0), item)),
      };
    case "struct": {
      const values = z.array(z.unknown()).parse(raw);

      if (values.length !== descriptor.children?.length) {
        throw new Error("Struct width mismatch");
      }

      return {
        kind: "struct",
        fields: values.map((value, index) => ({
          name: child(descriptor, index).name,
          value: mapCell(child(descriptor, index), value),
        })),
      };
    }
    case "map":
      return {
        kind: "map",
        entries: z
          .array(z.tuple([z.unknown(), z.unknown()]))
          .parse(raw)
          .map(([key, value]) => ({
            key: mapCell(child(descriptor, 0), key),
            value: mapCell(child(descriptor, 1), value),
          })),
      };
  }
}

/** These are descriptor display labels, not invented raw engine type names. */
export function typeLabel(column: Descriptor): string {
  if (column.type === "decimal") {
    return `decimal(${String(column.precision)},${String(column.scale)})`;
  }

  if (column.children) {
    return `${column.type}<${column.children.map((item) => `${item.name}: ${typeLabel(item)}`).join(", ")}>`;
  }

  return column.type;
}

export function mapColumns(columns: readonly WireColumn[]): readonly DatasetSchemaColumn[] {
  return columns.map((column) => ({
    id: String(column.index),
    label: column.name,
    kind: column.type === "string" ? "text" : column.type,
    nullable: column.nullable,
    unit: column.unit,
    sqlType: typeLabel(column),
  }));
}

export function mapTable(
  columns: readonly WireColumn[],
  rows: readonly (readonly unknown[])[],
): TableData {
  return {
    columns: mapColumns(columns),
    rows: rows.map((row, position) => {
      if (row.length !== columns.length) {
        throw new Error("Row width mismatch");
      }

      return {
        position,
        cells: columns.map((column, index) => mapCell(column, row[index], column.nullable)),
      };
    }),
  };
}
