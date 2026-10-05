import type { OperationResult } from "./failures";
import type { OperationContext } from "./session";

export type RefreshStatus = "accepted" | "running" | "succeeded" | "retained" | "failed" | "interrupted" | "publication_unknown";
export interface RefreshSummary {
  readonly runId: string;
  readonly status: RefreshStatus;
  readonly interval: { readonly start: string; readonly end: string };
  readonly stage?: string;
}
export interface RefreshOperations {
  admitRefresh(context: OperationContext, idempotencyKey: string): Promise<OperationResult<RefreshSummary>>;
  /** No ID discovers the latest run, including after reloading the page. */
  readRefresh(context: OperationContext, runId?: string): Promise<OperationResult<RefreshSummary | null>>;
}
export function refreshActive(status: RefreshStatus) {
  return status === "accepted" || status === "running" || status === "publication_unknown";
}
