import type { CatalogOperations, DateBounds } from "../../contracts/catalog";
import type { ObservationOperations } from "../../contracts/observations";
import { isCalendarDate } from "../../lib/calendar-date";

export type OverviewOperations = CatalogOperations & ObservationOperations;
export function validRange(range: DateBounds): boolean {
  return (range.start === undefined || isCalendarDate(range.start)) && (range.end === undefined || isCalendarDate(range.end)) && (range.start === undefined || range.end === undefined || range.start <= range.end);
}
