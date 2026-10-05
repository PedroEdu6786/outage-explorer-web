/** Proposed frontend failure categories, not backend error codes or HTTP statuses. */
export type OperationFailureKind =
  | "unauthenticated"
  | "forbidden"
  | "invalid-input"
  | "unsupported-sql"
  | "data-unavailable"
  | "preview-expired"
  | "result-expired"
  | "result-lost"
  | "busy"
  | "resource-limit"
  | "capacity-exhausted"
  | "execution-timeout"
  | "service-failure";

export interface OperationFailure {
  readonly kind: OperationFailureKind;
  /** Safe user-facing text; adapters must exclude credentials and internal details. */
  readonly message: string;
  readonly code?: string;
  readonly retryAfterSeconds?: number;
  readonly retainedQuery?: { readonly queryId: string; readonly expiresAt: string; readonly pageSize?: number };
}

/** A lost execution response proves neither failure nor cancellation. */
export interface UnknownExecutionOutcome {
  readonly kind: "unknown-execution-outcome";
  readonly message: string;
}

export type OperationResult<T, F = OperationFailure> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly failure: F };
