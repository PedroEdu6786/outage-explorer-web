import type { DatasetId } from "./catalog";
import type { OperationResult } from "./failures";

/** Proposed frontend models only. No credential/session transport is selected. */
export type SessionGeneration = number;
/** Backend-supplied instant, unlike an observation's timezone-free calendar date. */
export type ExpiryInstant = string;

export interface SessionIdentity {
  readonly subject: string;
  readonly displayName: string;
}

/** Returned by the backend; these are presentation capabilities, not authorization. */
export interface SessionCapabilities {
  readonly datasetIds: readonly DatasetId[];
  readonly canReadNationalSeries: boolean;
  readonly canExecuteQuery: boolean;
}

export interface AuthenticatedSession {
  readonly identity: SessionIdentity;
  readonly capabilities: SessionCapabilities;
  readonly expiresAt: ExpiryInstant;
}

export type SessionResolution =
  | { readonly status: "unauthenticated" }
  | { readonly status: "expired" }
  | { readonly status: "authenticated"; readonly session: AuthenticatedSession };

export type SessionState =
  | { readonly status: "pending"; readonly generation: SessionGeneration }
  | (SessionResolution & { readonly generation: SessionGeneration });

/** Capture before dispatch; check before publishing any success/error or side effect. */
export interface OperationContext {
  readonly generation: SessionGeneration;
  readonly signal?: AbortSignal;
}

export interface SessionOperations {
  resolveSession(context: OperationContext): Promise<OperationResult<SessionResolution>>;
  beginLogin(context: OperationContext): Promise<OperationResult<void>>;
  logout(context: OperationContext): Promise<OperationResult<void>>;
}
