import type { OperationFailure } from "../../contracts/failures";
import type { CatalogOperations } from "../../contracts/catalog";
import type { NavigationIntent, NavigationOperations } from "../../contracts/navigation";
import type { QueryOperations } from "../../contracts/query";
import { guardOperation } from "../../session/guard-operation";
import type { SessionRuntime } from "../../session/session-runtime";
import { initialQueryState, type QueryFailure, type QueryState } from "./query-state";
export interface QueriesDependencies {
  readonly runtime: SessionRuntime;
  readonly operations: CatalogOperations & QueryOperations & NavigationOperations;
  /** Composition must supply agreed settings; there are no production defaults. */
  readonly initialPageSize: number;
  readonly maximumPageSize: number;
  readonly now?: () => number;
}
export function createQueriesController({ runtime, operations, initialPageSize, maximumPageSize, now = Date.now }: QueriesDependencies) {
  if (!Number.isSafeInteger(initialPageSize) || initialPageSize < 1
    || !Number.isSafeInteger(maximumPageSize) || maximumPageSize < initialPageSize) {
    throw new Error("Invalid query page settings");
  }
  let state = initialQueryState(initialPageSize);
  // Schema selection and SQL execution can change independently.
  let schemaSelectionVersion = 0;
  let queryRequestVersion = 0;
  let consumedIntent: NavigationIntent | null = null;
  let lifetimeAbort = new AbortController();
  // Reset/denial blocks pending responses from publishing, even off the SQL route.
  let publicationAbort = new AbortController();
  let catalogAbort = new AbortController();
  let schemaAbort = new AbortController();
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<QueryState>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => {
      listener();
    });
  };
  const isAuthenticated = () => runtime.getSnapshot().status === "authenticated";
  const canExecuteQuery = () => {
    const session = runtime.getSnapshot();
    return session.status === "authenticated" && session.session.capabilities.canExecuteQuery;
  };
  const isBusy = () => state.activity === "running" || state.activity === "paging";
  let expiryTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelExpiry = () => {
    if (expiryTimer !== undefined) clearTimeout(expiryTimer);
    expiryTimer = undefined;
  };
  const reset = () => {
    cancelExpiry();
    publicationAbort.abort();
    publicationAbort = new AbortController();
    consumedIntent = null;
    catalogAbort.abort();
    schemaAbort.abort();
    schemaSelectionVersion++;
    queryRequestVersion++;
    state = initialQueryState(initialPageSize);
    listeners.forEach((listener) => {
      listener();
    });
  };
  let attached = false;
  let detachLifecycleListeners = () => { /* attached by lifecycle owner */ };
  function revokeAccess(failure: OperationFailure) {
    cancelExpiry();
    publicationAbort.abort();
    publicationAbort = new AbortController();
    catalogAbort.abort();
    schemaAbort.abort();
    schemaSelectionVersion++;
    queryRequestVersion++;
    consumedIntent = null;
    const denied: OperationFailure = {
      kind: "forbidden",
      message: failure.message,
      ...(failure.code ? { code: failure.code } : {}),
    };
    publish({
      activity: "failure",
      failure: denied,
      submitted: null,
      result: null,
      catalog: [],
      schema: null,
      schemaPending: false,
      catalogPending: false,
      selectedDataset: null,
      context: null,
      handoff: null,
      metadataFailure: denied,
    });
  }
  function publishFailure(failure: QueryFailure) {
    if (failure.kind === "forbidden") {
      revokeAccess(failure);
      return;
    }
    const clearResult = ["unauthenticated", "result-lost", "result-expired"].includes(failure.kind);
    if (clearResult) cancelExpiry();
    publish({
      activity: "failure",
      failure,
      ...(clearResult ? { result: null } : {}),
    });
    if (!clearResult && "retainedQuery" in failure) scheduleResultExpiry(failure.retainedQuery.expiresAt);
  }
  function expireResultIfNeeded() {
    const expiresAt = state.result?.execution.expiresAt
      ?? (state.failure && "retainedQuery" in state.failure ? state.failure.retainedQuery.expiresAt : undefined);
    if (!expiresAt) return false;
    if (Number.isFinite(Date.parse(expiresAt)) && Date.parse(expiresAt) > now()) return false;
    queryRequestVersion++;
    publishFailure({ kind: "result-expired", message: "Retained results expired. Run explicitly to create a new execution." });
    return true;
  }
  function scheduleResultExpiry(expiresAt: string) {
    cancelExpiry();
    const deadline = Date.parse(expiresAt);
    const check = () => {
      if (expireResultIfNeeded()) return;
      expiryTimer = setTimeout(check, Math.max(1, Math.min(deadline - now(), 2_147_483_647)));
    };
    if (!expireResultIfNeeded()) expiryTimer = setTimeout(check, Math.max(1, Math.min(deadline - now(), 2_147_483_647)));
  }
  async function selectDataset(datasetId: string) {
    if (!isAuthenticated() || !state.catalog.some((dataset) => dataset.id === datasetId)) return;
    const requestVersion = ++schemaSelectionVersion;
    schemaAbort.abort();
    schemaAbort = new AbortController();
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal, schemaAbort.signal]));
    publish({
      selectedDataset: datasetId,
      schema: null,
      schemaPending: true,
      metadataFailure: null,
    });
    await guardOperation(runtime, context, () => operations.readSchema(context, datasetId), {
      onSuccess: (schema) => {
        if (requestVersion === schemaSelectionVersion && schema.datasetId === datasetId) publish({ schema, schemaPending: false });
      },
      onFailure: (failure) => {
        if (requestVersion !== schemaSelectionVersion) return;
        if (failure.kind === "forbidden") {
          revokeAccess(failure);
          return;
        }
        publish({
          schema: null,
          schemaPending: false,
          metadataFailure: failure,
        });
      },
      onRejected: () => {
        if (requestVersion === schemaSelectionVersion) {
          publish({
            schemaPending: false,
            metadataFailure: { kind: "service-failure", message: "Schema could not be loaded." },
          });
        }
      },
    });
  }
  async function loadCatalog() {
    if (!isAuthenticated()) return;
    catalogAbort.abort();
    catalogAbort = new AbortController();
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal, catalogAbort.signal]));
    publish({ catalogPending: true, metadataFailure: null });
    await guardOperation(runtime, context, () => operations.listDatasets(context), {
      onSuccess: (catalog) => {
        const session = runtime.getSnapshot();
        if (session.status !== "authenticated") return;
        const authorized = catalog.filter((item) => session.session.capabilities.datasetIds.includes(item.id));
        publish({ catalog: authorized, catalogPending: false });
      },
      onFailure: (failure) => {
        if (failure.kind === "forbidden") {
          revokeAccess(failure);
          return;
        }
        schemaAbort.abort();
        schemaSelectionVersion++;
        publish({
          catalog: [],
          schema: null,
          schemaPending: false,
          selectedDataset: null,
          context: null,
          handoff: null,
          catalogPending: false,
          metadataFailure: failure,
        });
      },
      onRejected: () => {
        publish({ catalogPending: false, metadataFailure: { kind: "service-failure", message: "Catalog could not be loaded." } });
      },
    });
  }
  async function run() {
    if (!canExecuteQuery() || isBusy() || !state.draft.trim()) return;
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal]));
    const requestVersion = ++queryRequestVersion;
    const sql = state.draft;
    const pageSize = state.pageSize;
    cancelExpiry();
    publish({
      submitted: sql,
      activity: "running",
      result: null,
      failure: null,
    });
    await guardOperation(runtime, context, () => operations.executeQuery(context, {
      sql,
      page: 1,
      pageSize,
    }), {
      onSuccess: (result) => {
        if (requestVersion !== queryRequestVersion) return;
        if (!Number.isFinite(Date.parse(result.execution.expiresAt)) || Date.parse(result.execution.expiresAt) <= now()) {
          publishFailure({ kind: "result-expired", message: "Retained result expiry is invalid or elapsed. Run explicitly for a new execution." });
          return;
        }
        publish({ activity: "success", result });
        scheduleResultExpiry(result.execution.expiresAt);
      },
      onFailure: (failure) => {
        if (requestVersion === queryRequestVersion) publishFailure(failure);
      },
      onRejected: () => {
        if (requestVersion === queryRequestVersion) {
          publishFailure({
            kind: "unknown-execution-outcome",
            message: "The response was lost. The query may have executed; a new Run is a separate execution.",
          });
        }
      },
    });
  }
  async function readPage(page: number) {
    expireResultIfNeeded();
    const retained = state.result;
    if (!isAuthenticated() || !retained || isBusy() || !Number.isSafeInteger(page) || page < 1
      || page > Math.max(1, Math.ceil(retained.execution.retainedRowCount / retained.execution.pageSize))) return;
    if (!Number.isFinite(Date.parse(retained.execution.expiresAt)) || Date.parse(retained.execution.expiresAt) <= now()) {
      publishFailure({ kind: "result-expired", message: "Retained results expired. Run explicitly to create a new execution." });
      return;
    }
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal]));
    const requestVersion = ++queryRequestVersion;
    const execution = retained.execution;
    publish({ activity: "paging", failure: null });
    await guardOperation(runtime, context, () => operations.readQueryPage(context, {
      queryId: execution.queryId,
      page,
      pageSize: execution.pageSize,
    }), {
      onSuccess: (result) => {
        if (requestVersion !== queryRequestVersion || expireResultIfNeeded()) return;
        if (result.execution.queryId !== execution.queryId
          || result.execution.pageSize !== execution.pageSize
          || result.execution.snapshotId !== execution.snapshotId
          || result.execution.expiresAt !== execution.expiresAt || result.page !== page) {
          publishFailure({ kind: "result-lost", message: "Retained execution changed. Run explicitly to create a new execution." });
          return;
        }
        publish({ activity: "success", result });
      },
      onFailure: (failure) => {
        if (requestVersion !== queryRequestVersion) return;
        if (failure.kind === "forbidden" || !expireResultIfNeeded()) publishFailure(failure);
      },
      onRejected: () => {
        if (requestVersion === queryRequestVersion && !expireResultIfNeeded()) {
          publishFailure({
            kind: "service-failure",
            message: "Page could not be loaded. Choose the page again to retry; SQL was not rerun.",
          });
        }
      },
    });
  }
  async function recoverPage() {
    expireResultIfNeeded();
    const recovery = state.failure && "retainedQuery" in state.failure ? state.failure.retainedQuery : undefined;
    if (!isAuthenticated() || isBusy() || !recovery?.pageSize) return;
    if (!Number.isFinite(Date.parse(recovery.expiresAt)) || Date.parse(recovery.expiresAt) <= now()) {
      publishFailure({ kind: "result-expired", message: "Retained results expired. Use Run deliberately." });
      return;
    }
    const pageSize = recovery.pageSize;
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal]));
    const requestVersion = ++queryRequestVersion;
    publish({ activity: "paging" });
    await guardOperation(runtime, context, () => operations.readQueryPage(context, {
      queryId: recovery.queryId,
      page: 1,
      pageSize,
    }), {
      onSuccess: (result) => {
        if (requestVersion !== queryRequestVersion || expireResultIfNeeded()) return;
        if (result.execution.queryId !== recovery.queryId
          || result.execution.pageSize !== recovery.pageSize
          || result.execution.expiresAt !== recovery.expiresAt || result.page !== 1) {
          publishFailure({ kind: "result-lost", message: "Retained execution changed." });
          return;
        }
        publish({
          activity: "success",
          result,
          failure: null,
        });
        scheduleResultExpiry(result.execution.expiresAt);
      },
      onFailure: (failure) => {
        if (requestVersion !== queryRequestVersion) return;
        if (failure.kind === "forbidden" || !expireResultIfNeeded()) {
          publishFailure(["service-failure", "busy", "capacity-exhausted"].includes(failure.kind)
            ? { ...failure, retainedQuery: recovery }
            : failure);
        }
      },
      onRejected: () => {
        if (requestVersion === queryRequestVersion && !expireResultIfNeeded()) publishFailure({
          kind: "service-failure",
          message: "Could not load the retained page. Retry deliberately; SQL was not rerun.",
          retainedQuery: recovery,
        });
      },
    });
  }
  function receiveIntent(intent: NavigationIntent) {
    const context = runtime.capture(AbortSignal.any([lifetimeAbort.signal, publicationAbort.signal]));
    if (!isAuthenticated() || intent.generation !== context.generation || consumedIntent === intent) return;
    const result = operations.consumeNavigationIntent(context, intent);
    if (!runtime.isCurrent(context) || !result.ok || result.value.target !== "queries") return;
    consumedIntent = intent;
    if (state.edited) publish({ handoff: result.value });
    else publish({
      draft: result.value.proposedDraft,
      context: result.value,
      handoff: null,
      edited: false,
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

    attach() {
      if (attached) return;
      attached = true;
      if (lifetimeAbort.signal.aborted) lifetimeAbort = new AbortController();
      const resume = () => {
        expireResultIfNeeded();
      };
      window.addEventListener("pageshow", resume, { signal: lifetimeAbort.signal });
      window.addEventListener("focus", resume, { signal: lifetimeAbort.signal });
      window.addEventListener("online", resume, { signal: lifetimeAbort.signal });
      document.addEventListener("visibilitychange", resume, { signal: lifetimeAbort.signal });
      const unregister = runtime.registerCleanup(reset);
      detachLifecycleListeners = () => {
        unregister();
        attached = false;
        window.removeEventListener("pageshow", resume);
        window.removeEventListener("focus", resume);
        window.removeEventListener("online", resume);
        document.removeEventListener("visibilitychange", resume);
      };
      const expiresAt = state.result?.execution.expiresAt
        ?? (state.failure && "retainedQuery" in state.failure ? state.failure.retainedQuery.expiresAt : undefined);
      if (!expireResultIfNeeded() && expiresAt) scheduleResultExpiry(expiresAt);
    },

    dispose() {
      lifetimeAbort.abort();
      detachLifecycleListeners();
      reset();
    },

    loadCatalog,
    selectDataset,
    run,
    readPage,
    recoverPage,
    receiveIntent,

    editDraft(draft: string) {
      if (isAuthenticated()) publish({ draft, edited: true });
    },

    setPageSize(pageSize: number) {
      if (isAuthenticated() && Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= maximumPageSize) publish({ pageSize });
    },

    confirmHandoff() {
      if (isAuthenticated() && state.handoff) publish({
        draft: state.handoff.proposedDraft,
        context: state.handoff,
        handoff: null,
        edited: false,
      });
    },

    dismissHandoff() {
      publish({ handoff: null });
    },
  };
}
export type QueriesController = ReturnType<typeof createQueriesController>;
