import type { NationalObservation } from "../../contracts/observations";
import type { DecimalValue, PercentageValue, TableCell, TableData } from "../../contracts/table";

/** Truncate MW display text without coercing or changing the exact source value. */
export function capacityLabel(value: DecimalValue | null): string | null {
  return value?.display.replace(/(\.\d{2})\d+$/, "$1") ?? null;
}

/** Exact values remain untouched; Number conversion is confined to SVG coordinates. */
export function observationTable(observations: readonly NationalObservation[]): TableData {
  const decimal = (value: PercentageValue | null): TableCell => value === null ? { kind: "null" } : "numerator" in value ? { kind: "rational", ...value } : { kind: "decimal", ...value };
  const capacity = (value: DecimalValue | null): TableCell => value === null ? { kind: "null" } : { kind: "decimal", ...value, display: capacityLabel(value) ?? value.display };
  return {
    columns: [
      { id: "date", label: "Date", kind: "date", unit: null, nullable: false },
      { id: "calculated", label: "Offline capacity", kind: "decimal", unit: "%", nullable: true },
      { id: "outage", label: "Offline capacity", kind: "decimal", unit: "MW", nullable: true },
      { id: "capacity", label: "Fleet capacity", kind: "decimal", unit: "MW", nullable: true },
      { id: "reported", label: "EIA reported", kind: "decimal", unit: "%", nullable: true },
    ],
    rows: observations.map((row, position) => ({ position, cells: [
      { kind: "date", value: row.date },
      decimal(row.status === "available" ? row.calculatedPercentage : null),
      capacity(row.status === "available" ? row.outageMw : null),
      capacity(row.status === "available" ? row.capacityMw : null),
      decimal(row.status === "available" ? row.reportedPercentage : null),
    ] })),
  };
}
export function percentageLabel(value: PercentageValue | null): string {
  return value === null ? "Unavailable" : `${value.display}%`;
}
export function dayCoordinate(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / 86_400_000;
}
export function plotSegments(observations: readonly NationalObservation[], key: "calculatedPercentage" | "reportedPercentage") {
  const segments: { date: string; value: number; label: string }[][] = [];
  let current: { date: string; value: number; label: string }[] = [];
  for (const row of observations) {
    const value = row.status === "available" ? row[key] : null;
    const coordinate = value === null ? NaN : "numerator" in value ? Number(value.numerator) / Number(value.denominator) : Number(value.exact);
    const previous = current.at(-1);
    if (previous && dayCoordinate(row.date) !== dayCoordinate(previous.date) + 1) {
      segments.push(current); current = [];
    }
    if (value === null || !Number.isFinite(coordinate)) {
      if (current.length) segments.push(current);
      current = [];
    } else current.push({ date: row.date, value: coordinate, label: percentageLabel(value) });
  }
  if (current.length) segments.push(current);
  return segments;
}
