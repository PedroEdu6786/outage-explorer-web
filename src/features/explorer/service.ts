import type { CatalogOperations } from "../../contracts/catalog";
import type { OperationFailure, OperationResult } from "../../contracts/failures";
import type { NavigationIntent } from "../../contracts/navigation";
import type { PreviewOperations, PreviewPage, PreviewSelection } from "../../contracts/preview";
import type { OperationContext } from "../../contracts/session";
import type { SessionRuntime } from "../../session/session-runtime";
import { emptyExplorerState, sameSelection, validateSelection, type ExplorerState } from "./preview-state";

export type ExplorerOperations = CatalogOperations & PreviewOperations;
export interface ExplorerControllerOptions {
  readonly operations: ExplorerOperations;
  readonly runtime: SessionRuntime;
  readonly now?: (() => number) | undefined;
  readonly initialPageSize?: number | undefined;
}

/** The controller owns one cursor sequence; adapters own transport and permissions. */
export function createExplorerController({ operations, runtime, now = Date.now, initialPageSize = 10 }: ExplorerControllerOptions) {
  let state = emptyExplorerState;
  let selectionRequestVersion = 0;
  let catalogRequestVersion = 0;
  let connected = false;
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<ExplorerState>) => {
    state = { ...state, ...patch };
    for (const listener of listeners) listener();
  };
  const resetState = () => {
    selectionRequestVersion++;
    catalogRequestVersion++;
    clearTimeout(expiryTimer);
    state = emptyExplorerState;
    for (const listener of listeners) listener();
  };
  const isSelectionCurrent = (context: OperationContext, requestVersion: number) => connected && requestVersion === selectionRequestVersion
    && runtime.isCurrent(context) && runtime.getSnapshot().status === "authenticated";
  function handleFailure(failure: OperationFailure) {
    if (failure.kind === "unauthenticated") {
      runtime.invalidate("unauthenticated");
      return;
    }
    if (failure.kind === "forbidden" || failure.code === "dataset_unavailable") {
      resetState();
      publish({ catalogStatus: "error", failure });
      return;
    }
    const expired = failure.kind === "preview-expired";
    publish({
      failure,
      previewStatus: expired ? "expired" : "error",
      ...(expired ? { pages: [], pageIndex: 0 } : {}),
    });
  }
  async function requestIfCurrent<T>(
    isCurrentRequest: () => boolean,
    operation: () => Promise<OperationResult<T>>,
    onSuccess: (value: T) => void,
    onFailure: (failure: OperationFailure) => void = handleFailure,
  ) {
    if (!isCurrentRequest()) return;
    try {
      const result = await operation();
      if (!isCurrentRequest()) return;
      if (result.ok) {
        onSuccess(result.value);
      } else {
        onFailure(result.failure);
      }
    } catch {
      if (isCurrentRequest()) onFailure({ kind: "service-failure", message: "Could not load data. Try again deliberately." });
    }
  }
  function expirePreviewIfNeeded() {
    clearTimeout(expiryTimer);
    const sequence = state.pages[0]?.sequence;
    if (!sequence) return false;
    const remaining = Date.parse(sequence.expiresAt) - now();
    if (!Number.isFinite(remaining) || remaining <= 0) {
      selectionRequestVersion++;
      publish({
        pages: [],
        pageIndex: 0,
        previewStatus: "expired",
        failure: { kind: "preview-expired", message: "This preview has expired. Restart browsing to use a new snapshot." },
      });
      return true;
    }
    expiryTimer = setTimeout(expirePreviewIfNeeded, Math.min(remaining, 2_147_483_647));
    return false;
  }
  function acceptPage(page: PreviewPage, selection: PreviewSelection, continuation = false) {
    const first = state.pages[0];
    if (!sameSelection(page.sequence.selection, selection)
      || (continuation && (page.sequence.snapshotId !== first?.sequence.snapshotId || page.sequence.expiresAt !== first.sequence.expiresAt))) {
      handleFailure({ kind: "service-failure", message: "The preview sequence changed unexpectedly. Restart browsing." });
      return;
    }
    publish({
      pages: continuation ? [...state.pages, page] : [page],
      pageIndex: continuation ? state.pages.length : 0,
      previewStatus: "ready",
      failure: null,
    });
    expirePreviewIfNeeded();
  }
  function select(datasetId: string, filters: PreviewSelection["filters"] = {}, pageSize = initialPageSize) {
    const context = runtime.capture();
    if (!runtime.isCurrent(context) || runtime.getSnapshot().status !== "authenticated") return;
    const dataset = state.catalog.find((item) => item.id === datasetId);
    if (!dataset) return;
    const selection: PreviewSelection = {
      datasetId,
      filters: structuredClone(filters),
      pageSize,
    };
    const error = validateSelection(dataset, selection);
    if (error) {
      publish({ failure: { kind: "invalid-input", message: error } });
      return;
    }
    const requestVersion = ++selectionRequestVersion;
    clearTimeout(expiryTimer);
    publish({
      selected: dataset,
      selection,
      schema: null,
      schemaStatus: "loading",
      schemaFailure: null,
      pages: [],
      pageIndex: 0,
      previewStatus: "loading",
      failure: null,
    });
    const isCurrentRequest = () => isSelectionCurrent(context, requestVersion);
    void requestIfCurrent(isCurrentRequest, () => operations.readSchema(context, datasetId), (schema) => {
      if (schema.datasetId !== datasetId) {
        publish({ schemaStatus: "error", schemaFailure: { kind: "service-failure", message: "Schema belongs to a different dataset." } });
        return;
      }
      publish({ schema, schemaStatus: "ready" });
    }, (failure) => {
      if (failure.kind === "forbidden" || failure.kind === "unauthenticated" || failure.code === "dataset_unavailable") handleFailure(failure);
      else publish({ schemaStatus: "error", schemaFailure: failure });
    });
    void requestIfCurrent(isCurrentRequest, () => operations.startPreview(context, selection), (page) => {
      acceptPage(page, selection);
    });
  }
  function loadCatalog() {
    const context = runtime.capture();
    const session = runtime.getSnapshot();
    if (session.status !== "authenticated") return;
    const requestVersion = ++catalogRequestVersion;
    publish({ catalogStatus: "loading", failure: null });
    const isCurrentRequest = () => connected && runtime.isCurrent(context)
      && catalogRequestVersion === requestVersion && runtime.getSnapshot().status === "authenticated";
    void requestIfCurrent(isCurrentRequest, () => operations.listDatasets(context), (catalog) => {
      // Defense in depth: never retain metadata outside current backend capabilities.
      const authorized = catalog.filter((dataset) => session.session.capabilities.datasetIds.includes(dataset.id));
      publish({ catalog: authorized, catalogStatus: "ready" });
      if (authorized[0]) select(authorized[0].id);
    }, (failure) => {
      if (failure.kind === "unauthenticated" || failure.kind === "forbidden" || failure.code === "dataset_unavailable") handleFailure(failure);
      else publish({
        catalog: [],
        catalogStatus: "error",
        failure,
      });
    });
  }
  return {
    getSnapshot: () => state,

    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },

    connect() {
      connected = true;
      const removeCleanup = runtime.registerCleanup(resetState);
      const removeSession = runtime.subscribe(loadCatalog);
      loadCatalog();
      return () => {
        connected = false;
        removeCleanup();
        removeSession();
        resetState();
      };
    },

    select,
    retryCatalog: loadCatalog,

    restart() {
      if (state.selection) select(state.selection.datasetId, state.selection.filters, state.selection.pageSize);
    },

    previous() {
      if (!expirePreviewIfNeeded() && state.previewStatus === "ready" && state.pageIndex > 0) publish({ pageIndex: state.pageIndex - 1 });
    },

    next() {
      if (expirePreviewIfNeeded() || state.previewStatus !== "ready") return;
      if (state.pageIndex + 1 < state.pages.length) {
        publish({ pageIndex: state.pageIndex + 1 });
        return;
      }
      const page = state.pages[state.pageIndex];
      const selection = state.selection;
      if (page?.nextCursor == null || !selection) return;
      const context = runtime.capture();
      const cursor = page.nextCursor;
      const requestVersion = selectionRequestVersion;
      const isCurrentRequest = () => isSelectionCurrent(context, requestVersion);
      publish({ previewStatus: "loading", failure: null });
      void requestIfCurrent(isCurrentRequest, () => operations.continuePreview(context, { sequence: page.sequence, cursor }), (next) => {
        acceptPage(next, selection, true);
      });
    },

    sqlIntent(): NavigationIntent | null {
      const context = runtime.capture();
      const session = runtime.getSnapshot();
      if (!connected || !runtime.isCurrent(context) || session.status !== "authenticated"
        || !session.session.capabilities.canExecuteQuery || !state.selection
        || !session.session.capabilities.datasetIds.includes(state.selection.datasetId)) return null;
      return {
        target: "queries",
        generation: context.generation,
        datasetId: state.selection.datasetId,
        filters: structuredClone(state.selection.filters),
      };
    },
  };
}

export type ExplorerController = ReturnType<typeof createExplorerController>;
