import type { DatasetId } from "./catalog";
import type { OperationResult } from "./failures";
import type { AppliedFilters } from "./preview";
import type { OperationContext, SessionGeneration } from "./session";

/** Proposed in-memory handoffs. Never serialize credentials or draft SQL into URLs. */
export interface NavigationIntent {
  readonly target: "explorer" | "queries";
  readonly generation: SessionGeneration;
  readonly datasetId: DatasetId;
  readonly filters: AppliedFilters;
}

export type ConsumedNavigationIntent =
  | { readonly target: "explorer"; readonly datasetId: DatasetId; readonly filters: AppliedFilters }
  | {
      readonly target: "queries";
      readonly datasetId: DatasetId;
      readonly filters: AppliedFilters;
      /** Prepared unsent text; the query controller requires consent to replace an edited draft. */
      readonly proposedDraft: string;
    };

export interface NavigationOperations {
  /** Reject stale generations and unavailable dataset context before preparing a handoff. */
  consumeNavigationIntent(context: OperationContext, intent: NavigationIntent): OperationResult<ConsumedNavigationIntent>;
}
