"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { SessionState } from "../../contracts/session";
const pendingServerSession: SessionState = { status: "pending", generation: 0 };
import { createQueriesController, type QueriesController, type QueriesDependencies } from "./service";
export function useQueries(dependencies: QueriesDependencies & { readonly controller?: QueriesController }) {
  const { runtime, operations, initialPageSize, maximumPageSize, now } = dependencies;
  const controller = useMemo(() => dependencies.controller ?? createQueriesController({ runtime, operations, initialPageSize, maximumPageSize, ...(now ? { now } : {}) }), [dependencies.controller, runtime, operations, initialPageSize, maximumPageSize, now]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const session = useSyncExternalStore(runtime.subscribe, runtime.getSnapshot, () => pendingServerSession);
  useEffect(() => { if (dependencies.controller) return; controller.attach(); return () => { controller.dispose(); }; }, [controller, dependencies.controller]);
  useEffect(() => { void controller.loadCatalog(); }, [controller, session.generation]);
  return { state, controller, session };
}
