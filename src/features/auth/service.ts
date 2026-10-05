import type { SessionOperations } from "../../contracts/session";
import type { OperationFailure } from "../../contracts/failures";
import { guardOperation } from "../../session/guard-operation";
import type { SessionRuntime } from "../../session/session-runtime";

export interface AuthCallbacks {
  readonly onSuccess: () => void;
  readonly onFailure: (failure: OperationFailure) => void;
}

/** Transport is injected. Login completion alone never establishes identity. */
export function createAuthService(operations: SessionOperations, runtime: SessionRuntime) {
  function perform(action: "resolve" | "login" | "logout", callbacks: AuthCallbacks, signal?: AbortSignal) {
    const state = runtime.getSnapshot();
    // Resolving the still-valid cookie must not restore access during uncertain logout.
    if (action !== "logout" && state.status === "pending" && state.reason === "logout") {
      return Promise.resolve("discarded" as const);
    }
    if (action === "logout") runtime.beginLogout();
    // A fresh authoritative check must withhold old identity/access on any failure.
    if (action === "resolve" && state.status === "authenticated") runtime.invalidate("pending");
    const context = runtime.capture(signal);
    const options = {
      requireAuthenticated: false,
      onFailure: callbacks.onFailure,
      onRejected: () => { callbacks.onFailure({ kind: "service-failure", message: "The session service is unavailable. Try again." }); },
    };
    if (action === "resolve") {
      return guardOperation(runtime, context, () => operations.resolveSession(context), {
        ...options,
        onSuccess: (resolution) => { runtime.setResolution(resolution); callbacks.onSuccess(); },
      });
    }
    return guardOperation(runtime, context, () => action === "login" ? operations.beginLogin(context) : operations.logout(context), {
      ...options, onSuccess: () => {
        if (action === "logout") runtime.invalidate();
        if (action === "logout") operations.completeLogout?.();
        callbacks.onSuccess();
      },
    });
  }
  return { perform };
}
