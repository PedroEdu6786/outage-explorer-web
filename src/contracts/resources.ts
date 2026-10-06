import type { OperationFailure, OperationResult } from "./failures";
import type { OperationContext, SessionCapabilities } from "./session";

export type ResourceKind = "catalog";
export interface ResourceIdentity {
  readonly kind: ResourceKind;
  /** Canonical request identity; opaque identifiers must not be rewritten. */
  readonly requestKey: string;
}
export interface ResourceOwnership {
  readonly subject: string;
  readonly sessionGeneration: number;
  readonly capabilities: SessionCapabilities;
}
export interface ResourceMetadata {
  readonly identity: ResourceIdentity;
  readonly ownership: ResourceOwnership;
  readonly epoch: number;
  readonly dataGeneration?: string | null;
  readonly fetchedAt: number;
  readonly bytes: number;
}
export type ResourceDecision = "reuse" | "fetch";
export type ResourceInvalidation =
  | { readonly reason: "cleanup" | "denial" | "disposal" }
  | { readonly reason: "published-refresh" | "unavailable"; readonly kind?: ResourceKind; readonly requestKey?: string };
/** No production durations/budgets/eviction are implied by this contract. */
export type ResourcePolicy =
  | { readonly retention: "disabled" }
  | { readonly retention: "enabled"; readonly maximumEntries: number; readonly maximumBytes: number;
      readonly decide: (metadata: ResourceMetadata, now: number) => ResourceDecision };
export interface ResourceRead<T> {
  readonly context: OperationContext;
  readonly identity: ResourceIdentity;
  /** Called with repository-owned transport cancellation, never a consumer signal. */
  readonly load: (context: OperationContext) => Promise<OperationResult<T>>;
  readonly describe?: (value: T) => { readonly dataGeneration?: string | null };
}
export interface ResourceRepository {
  readonly policy: ResourcePolicy;
  read<T>(input: ResourceRead<T>): Promise<OperationResult<T>>;
  invalidate(event: ResourceInvalidation): void;
  /** Handle only failures from still-current requests; old denials cannot clear new owners. */
  reportFailure(context: OperationContext, failure: OperationFailure): void;
  subscribe(listener: (event: ResourceInvalidation) => void): () => void;
  accounting(): { readonly entries: number; readonly bytes: number; readonly pending: number };
  attach(): void;
  dispose(): void;
}
