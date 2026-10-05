import type { DatasetSchema, DatasetSummary } from "../../contracts/catalog";
import type { OperationFailure, UnknownExecutionOutcome } from "../../contracts/failures";
import type { ConsumedNavigationIntent } from "../../contracts/navigation";
import type { QueryPage } from "../../contracts/query";
export type QueryFailure = OperationFailure | UnknownExecutionOutcome;
export type QueryActivity = "ready" | "running" | "paging" | "success" | "failure";
export type QueryHandoff = Extract<ConsumedNavigationIntent, { target: "queries" }>;
export interface QueryState {
  readonly draft: string;
  readonly submitted: string | null;
  readonly edited: boolean;
  readonly pageSize: number;
  readonly activity: QueryActivity;
  readonly failure: QueryFailure | null;
  readonly result: QueryPage | null;
  readonly catalog: readonly DatasetSummary[];
  readonly catalogPending: boolean;
  readonly metadataFailure: OperationFailure | null;
  readonly selectedDataset: string | null;
  readonly schema: DatasetSchema | null;
  readonly schemaPending: boolean;
  readonly handoff: QueryHandoff | null;
  readonly context: QueryHandoff | null;
}
export const initialQueryState = (pageSize: number): QueryState => ({ draft: "", submitted: null, edited: false, pageSize, activity: "ready", failure: null, result: null, catalog: [], catalogPending: false, metadataFailure: null, selectedDataset: null, schema: null, schemaPending: false, handoff: null, context: null });
