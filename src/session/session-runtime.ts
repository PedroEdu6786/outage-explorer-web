import type {
  OperationContext,
  SessionResolution,
  SessionState,
} from "../contracts/session";

export interface SessionClock {
  now(): number;
  /** Return a cancellation function; callbacks may still require a generation check. */
  schedule(callback: () => void, delayMs: number): () => void;
}

export interface SessionRuntime {
  readonly getSnapshot: () => SessionState;
  readonly subscribe: (listener: () => void) => () => void;
  registerCleanup(cleanup: () => void): () => void;
  capture(signal?: AbortSignal): OperationContext;
  isCurrent(context: OperationContext): boolean;
  /** Every authoritative resolution establishes a new generation. */
  setResolution(resolution: SessionResolution): void;
  /** Clear protected state without claiming backend logout; retries share this generation. */
  beginLogout(): void;
  /** Revoke protected state after a current denial, without claiming backend logout. */
  denyAccess(): void;
  /** Invalidate locally before dispatching logout or changing identity/access. */
  invalidate(status?: "pending" | "unauthenticated" | "expired"): void;
  /** Releases timer and protected state. The runtime is unusable after disposal. */
  dispose(): void;
}

const browserClock: SessionClock = {
  now: () => Date.now(),
  schedule(callback, delayMs) {
    const timer = globalThis.setTimeout(callback, delayMs);
    return () => { globalThis.clearTimeout(timer); };
  },
};

export function createSessionRuntime(clock: SessionClock = browserClock): SessionRuntime {
  let state: SessionState = { status: "pending", generation: 0 };
  let disposed = false;
  let cancelExpiry: (() => void) | undefined;
  const listeners = new Set<() => void>();
  const cleanups = new Set<() => void>();

  function transition(resolution: SessionResolution | { readonly status: "access-denied" } | { readonly status: "pending"; readonly reason?: "logout" }) {
    if (disposed) return;
    cancelExpiry?.();
    cancelExpiry = undefined;
    // Invalidate first so cleanup-triggered asynchronous completions cannot publish.
    state = { ...resolution, generation: state.generation + 1 };
    // Run every subscriber even if one cleanup fails; state removal is mandatory.
    const errors: unknown[] = [];
    for (const cleanup of [...cleanups]) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) throw new AggregateError(errors, "Session invalidation callbacks failed");
  }

  function expireIfNeeded() {
    if (state.status !== "authenticated") return;
    const expiry = Date.parse(state.session.expiresAt);
    if (!Number.isFinite(expiry) || expiry <= clock.now()) transition({ status: "expired" });
  }

  const runtime: SessionRuntime = {
    getSnapshot: () => state,
    subscribe(listener) {
      if (disposed) throw new Error("Session runtime is disposed");
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    registerCleanup(cleanup) {
      if (disposed) throw new Error("Session runtime is disposed");
      cleanups.add(cleanup);
      return () => { cleanups.delete(cleanup); };
    },
    capture(signal) {
      expireIfNeeded();
      return signal === undefined ? { generation: state.generation } : { generation: state.generation, signal };
    },
    isCurrent(context) {
      expireIfNeeded();
      return !disposed && !context.signal?.aborted && context.generation === state.generation;
    },
    setResolution(resolution) {
      if (disposed) return;
      if (resolution.status !== "authenticated") {
        transition(resolution);
        return;
      }
      const delay = Date.parse(resolution.session.expiresAt) - clock.now();
      if (!Number.isFinite(delay) || delay <= 0) {
        transition({ status: "expired" });
        return;
      }
      const context: OperationContext = { generation: state.generation + 1 };
      // Some timers fire early; always compare the supplied backend expiry again.
      const scheduleExpiry = () => {
        if (!runtime.isCurrent(context) || state.status !== "authenticated") return;
        const remaining = Date.parse(state.session.expiresAt) - clock.now();
        cancelExpiry = clock.schedule(scheduleExpiry, Math.min(remaining, 2_147_483_647));
      };
      try {
        transition(resolution);
      } finally {
        // Mandatory expiry scheduling survives failing cleanup/subscriber callbacks.
        // A reentrant callback establishing another generation owns its own timer.
        scheduleExpiry();
      }
    },
    invalidate: (status = "unauthenticated") => { transition({ status }); },
    denyAccess: () => { transition({ status: "access-denied" }); },
    beginLogout() {
      if (state.status !== "pending" || state.reason !== "logout") transition({ status: "pending", reason: "logout" });
    },
    dispose() {
      if (disposed) return;
      try {
        transition({ status: "unauthenticated" });
      } finally {
        disposed = true;
        cancelExpiry?.();
        cancelExpiry = undefined;
        listeners.clear();
        cleanups.clear();
      }
    },
  };
  return runtime;
}
