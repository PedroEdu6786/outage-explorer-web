"use client";
import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { AuthFeature, type AuthControls } from "../features/auth";
import { createQueriesController, type QueriesController } from "../features/queries";
import type { NavigationIntent } from "../contracts/navigation";
import type { SessionState } from "../contracts/session";
import type { SessionRuntime } from "../session/session-runtime";
import { acceptsIntent, type ApplicationPath } from "./navigation";
import type { ApplicationOperations, QuerySettings } from "./production-operations";

interface ApplicationComposition {
  readonly operations: ApplicationOperations;
  readonly runtime: SessionRuntime;
  readonly path: ApplicationPath;
  readonly go: (path: ApplicationPath) => void;
  readonly intent: NavigationIntent | null;
  readonly navigate: (intent: NavigationIntent) => void;
  readonly queries: QueriesController | null;
  readonly querySettings: QuerySettings | null;
  readonly previewPageSize?: number | undefined;
}
const Context = createContext<ApplicationComposition | null>(null);
const Controls = createContext<AuthControls | null>(null);
const pending: SessionState = { status: "pending", generation: 0 };
export interface ApplicationProviderProps {
  readonly operations: ApplicationOperations;
  readonly runtime: SessionRuntime;
  readonly path: ApplicationPath;
  readonly go: (path: ApplicationPath) => void;
  readonly querySettings: QuerySettings | null;
  readonly previewPageSize?: number;
  readonly children: ReactNode;
}
/** One injected composition. Production root supplies only unavailable/approved live operations. */
export function ApplicationProvider({ children, ...props }: ApplicationProviderProps) {
  const [intent, setIntent] = useState<NavigationIntent | null>(null);
  const queries = useMemo(() => props.querySettings ? createQueriesController({ operations: props.operations, runtime: props.runtime, ...props.querySettings }) : null, [props.operations, props.runtime, props.querySettings]);
  useEffect(() => { queries?.attach(); return () => { queries?.dispose(); }; }, [queries]);
  useEffect(() => props.runtime.registerCleanup(() => { setIntent(null); }), [props.runtime]);
  const navigate = (next: NavigationIntent) => {
    if (!acceptsIntent(props.runtime, next)) return;
    setIntent(next);
    props.go(next.target === "explorer" ? "/datasets" : "/query");
  };
  // The query controller survives route unmounts; its session cleanup remains authoritative.
  return <Context.Provider value={{ ...props, intent, navigate, queries }}><AuthFeature operations={props.operations} runtime={props.runtime}>{(controls) => <Controls.Provider value={controls}>{children}</Controls.Provider>}</AuthFeature></Context.Provider>;
}
export function useApplication() {
  const value = useContext(Context);
  if (!value) throw new Error("Application composition is required");
  return value;
}
export function useApplicationSession() {
  const { runtime } = useApplication();
  return useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, () => pending);
}
export function useAuthControls() {
  const value = useContext(Controls);
  if (!value) throw new Error("Resolved authentication is required");
  return value;
}
