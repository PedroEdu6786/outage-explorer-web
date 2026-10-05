import type { OperationFailure, OperationResult, UnknownExecutionOutcome } from "./failures";
import type { ExpiryInstant, OperationContext } from "./session";
import type { TableData } from "./table";

/** Data API v1 executes synchronously; pagination never submits SQL again. */
export type QueryId = string;

export interface ExecuteQueryInput {
  /** Captured submitted statement, passed unchanged; only an explicit Run calls this. */
  readonly sql: string;
  /** Positive 1-based page and agreed positive page size; adapters validate both. */
  readonly page: number;
  readonly pageSize: number;
}

export type QueryTruncation =
  | { readonly truncated: false }
  | { readonly truncated: true; readonly reason: "row-limit" | "byte-limit" };

export interface QueryExecution {
  readonly queryId: QueryId;
  readonly snapshotId: string;
  readonly pageSize: number;
  readonly expiresAt: ExpiryInstant;
  /** Count retained in this execution, not total source matches. */
  readonly retainedRowCount: number;
  readonly totalPages?: number;
  readonly limits?: { readonly maxRows: number; readonly maxBytes: number };
  readonly truncation: QueryTruncation;
}

export interface QueryPage {
  readonly execution: QueryExecution;
  readonly page: number;
  readonly hasMore?: boolean;
  readonly table: TableData;
}

export interface ReadQueryPageInput {
  readonly queryId: QueryId;
  readonly page: number;
  readonly pageSize: number;
  /** Prevent passing an execute request where a page request was intended. */
  readonly sql?: never;
}

export interface QueryOperations {
  executeQuery(context: OperationContext, input: ExecuteQueryInput): Promise<OperationResult<QueryPage, OperationFailure | UnknownExecutionOutcome>>;
  /** Use the retained execution ID and its fixed size. Never execute or replay SQL. */
  readQueryPage(context: OperationContext, input: ReadQueryPageInput): Promise<OperationResult<QueryPage>>;
}
