"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { emptyExplorerState } from "./preview-state";
import { createExplorerController, type ExplorerControllerOptions } from "./service";

export function useExplorer({ operations, runtime, now, initialPageSize }: ExplorerControllerOptions) {
  const controller = useMemo(() => createExplorerController({ operations, runtime, now, initialPageSize }), [operations, runtime, now, initialPageSize]);
  useEffect(() => controller.connect(), [controller]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, () => emptyExplorerState);
  return { state, controller };
}
