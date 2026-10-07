import type { CatalogBundle } from "./catalog";
import type { OperationFailure, OperationResult } from "./failures";
import type { OperationContext } from "./session";

/** One catalog at most; no TTL or durable storage. */
export type CatalogCachePolicy =
  | { readonly retention: "disabled" }
  | { readonly retention: "enabled"; readonly maximumBytes: number };

export interface CatalogInvalidation {
  readonly reason: "cleanup" | "denial" | "disposal" | "published-refresh" | "unavailable";
}

export interface CatalogRead {
  readonly context: OperationContext;
  /** The cache owns transport cancellation; a reader can detach independently. */
  readonly load: (context: OperationContext) => Promise<OperationResult<CatalogBundle>>;
}

export interface CatalogCache {
  readonly policy: CatalogCachePolicy;
  read(input: CatalogRead): Promise<OperationResult<CatalogBundle>>;
  invalidate(event: CatalogInvalidation): void;
  /** Old failures cannot revoke a newer session. */
  reportFailure(context: OperationContext, failure: OperationFailure): void;
  subscribe(listener: (event: CatalogInvalidation) => void): () => void;
  accounting(): { readonly entries: number; readonly bytes: number; readonly pending: number };
  attach(): void;
  dispose(): void;
}
