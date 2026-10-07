import type { OperationFailure, OperationResult } from "../contracts/failures";
import type { OperationContext } from "../contracts/session";
import type { SessionRuntime } from "./session-runtime";

/** Guard any synchronous publication, including metadata and navigation intents. */
export function guardCurrent(runtime: SessionRuntime, context: OperationContext, publish: () => void): boolean {
  if (!runtime.isCurrent(context)) return false;
  publish();
  return true;
}

export interface GuardOperationOptions<T, F> {
  /** Session resolve/login/logout may run while unauthenticated. Protected reads may not. */
  readonly requireAuthenticated?: boolean;
  readonly onSuccess: (value: T) => void;
  readonly onFailure: (failure: F) => void;
  /** Unexpected adapter rejection is also generation-guarded. Never replay an operation. */
  readonly onRejected: (error: unknown) => void;
}

export type GuardedOperationOutcome = "published" | "discarded";

export async function guardOperation<T, F extends { readonly kind: string } = OperationFailure>(
  runtime: SessionRuntime,
  context: OperationContext,
  operation: () => Promise<OperationResult<T, F>>,
  options: GuardOperationOptions<T, F>,
): Promise<GuardedOperationOutcome> {
  const current = () => runtime.isCurrent(context)
    && (options.requireAuthenticated === false || runtime.getSnapshot().status === "authenticated");
  if (!current()) return "discarded";
  let result: OperationResult<T, F>;
  try {
    result = await operation();
  } catch (error) {
    if (!current()) return "discarded";
    options.onRejected(error);
    return "published";
  }
  if (!current()) return "discarded";
  if (result.ok) {
    options.onSuccess(result.value);
  } else {
    try {
      options.onFailure(result.failure);
    } finally {
      // Invalidation survives callback failure, but cannot affect a newer generation.
      if (result.failure.kind === "unauthenticated" && runtime.isCurrent(context)) {
        runtime.invalidate("unauthenticated");
      }
      // A feature may abort its own request while clearing denied content. Only a
      // new session generation, not that cleanup abort, supersedes this denial.
      if (result.failure.kind === "forbidden" && options.requireAuthenticated !== false
        && runtime.getSnapshot().generation === context.generation) {
        runtime.denyAccess();
      }
    }
  }
  return "published";
}
