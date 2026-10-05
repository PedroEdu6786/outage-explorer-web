import type { CatalogOperations, DateRange } from "../../contracts/catalog";
import type { ObservationOperations } from "../../contracts/observations";
import type { SessionRuntime } from "../../session/session-runtime";
import { guardOperation } from "../../session/guard-operation";

export type OverviewOperations = CatalogOperations & ObservationOperations;
export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validRange(range: DateRange): boolean {
  return validCalendarDate(range.start) && validCalendarDate(range.end) && range.start <= range.end;
}
export function createOverviewService(runtime: SessionRuntime, operations: OverviewOperations) {
  return { runtime, operations, guard: guardOperation };
}
