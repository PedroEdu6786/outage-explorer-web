import type { CatalogOperations, DateBounds } from "../../contracts/catalog";
import type { ObservationOperations } from "../../contracts/observations";

export type OverviewOperations = CatalogOperations & ObservationOperations;
export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validRange(range: DateBounds): boolean {
  return (range.start === undefined || validCalendarDate(range.start)) && (range.end === undefined || validCalendarDate(range.end)) && (range.start === undefined || range.end === undefined || range.start <= range.end);
}
