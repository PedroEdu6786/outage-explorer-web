import { z } from "zod";
import type { NationalObservation } from "../../contracts/observations";
import type { TableCell, TableData } from "../../contracts/table";

/** Uses the backend's prepared metric columns; no metric calculation in the client. */
export function mapNationalRows(table: TableData): readonly NationalObservation[] {
  const names = table.columns.map((column) => column.label);
  const required = [
    "period",
    "capacity_mw",
    "outage_mw",
    "reported_percentage",
    "calculated_percentage_rounded",
    "percentage_numerator",
    "percentage_denominator",
    "calculated_percentage_display",
    "reported_percentage_display",
  ];

  if (required.some((name) => names.filter((value) => value === name).length !== 1)) {
    throw new Error("Missing or ambiguous national metric columns");
  }

  const display = z.string().regex(/^-?\d+\.\d{2}$/);

  return table.rows.map((row) => {
    function cell(name: string): TableCell {
      const value = row.cells[names.indexOf(name)];

      if (!value || value.kind === "null") {
        throw new Error("Missing prepared metric value");
      }

      return value;
    }

    function text(name: string) {
      const value = cell(name);

      if (value.kind !== "text") {
        throw new Error("Expected metric string");
      }

      return value.value;
    }

    function decimal(name: string) {
      const value = cell(name);

      if (value.kind !== "decimal") {
        throw new Error("Expected metric decimal");
      }

      return { exact: value.exact, display: value.display };
    }

    const day = cell("period");

    if (day.kind !== "date") {
      throw new Error("Expected observation date");
    }

    const numerator = z
      .string()
      .regex(/^-?(0|[1-9]\d*)$/)
      .parse(text("percentage_numerator"));
    const denominator = z
      .string()
      .regex(/^[1-9]\d*$/)
      .parse(text("percentage_denominator"));
    const rounded = decimal("calculated_percentage_rounded").exact;
    const calculatedDisplay = display.parse(text("calculated_percentage_display"));

    if (rounded !== calculatedDisplay) {
      throw new Error("Inconsistent metric display");
    }

    return {
      status: "available",
      date: day.value,
      capacityMw: decimal("capacity_mw"),
      outageMw: decimal("outage_mw"),
      reportedPercentage: {
        ...decimal("reported_percentage"),
        display: display.parse(text("reported_percentage_display")),
      },
      calculatedPercentage: { numerator, denominator, rounded, display: calculatedDisplay },
    };
  });
}
