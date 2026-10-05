"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import type { SessionState } from "../contracts/session";
import type { SessionRuntime } from "./session-runtime";

const RuntimeContext = createContext<SessionRuntime | null>(null);
const pendingServerSnapshot: SessionState = { status: "pending", generation: 0 };

export interface SessionProviderProps {
  /** Composition owns creation/disposal; inject one runtime across all feature consumers. */
  readonly runtime: SessionRuntime;
  readonly children: ReactNode;
}

export function SessionProvider({ runtime, children }: SessionProviderProps) {
  return <RuntimeContext.Provider value={runtime}>{children}</RuntimeContext.Provider>;
}

export function useSessionRuntime(): SessionRuntime {
  const runtime = useContext(RuntimeContext);
  if (runtime === null) throw new Error("SessionProvider is required");
  return runtime;
}

export function useSessionState(): SessionState {
  const runtime = useSessionRuntime();
  // Server rendering always withholds protected identity/data until client resolution.
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, () => pendingServerSnapshot);
}
