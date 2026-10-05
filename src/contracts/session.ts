import type { DatasetId } from "./catalog";
import type { OperationResult } from "./failures";

/** Frontend models. The live adapter maps the current user-confirmed backend DTO. */
export type SessionGeneration = number;
/** Backend-supplied instant, unlike an observation's timezone-free calendar date. */
export type ExpiryInstant = string;

export interface SessionIdentity {
  readonly subject: string;
  readonly displayName: string;
}

/** Presentation restrictions from backend identity; never authorization evidence. */
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
  | { readonly status: "pending"; readonly generation: SessionGeneration; readonly reason?: "logout" }
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
  /** Browser side effect, invoked only after guarded logout confirmation and local cleanup. */
  completeLogout?(): void;
}
