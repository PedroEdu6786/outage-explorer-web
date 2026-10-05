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
  if (!Number.isSafeInteger(initialPageSize) || initialPageSize < 1 || !Number.isSafeInteger(maximumPageSize) || maximumPageSize < initialPageSize) throw new Error("Invalid query page settings");
  let state = initialQueryState(initialPageSize);
  let selection = 0;
  let request = 0;
  let consumedIntent: NavigationIntent | null = null;
  let lifetime = new AbortController();
  let catalogRequest = new AbortController();
  let schemaRequest = new AbortController();
  const listeners = new Set<() => void>();
  const publish = (patch: Partial<QueryState>) => { state = { ...state, ...patch }; listeners.forEach((listener) => { listener(); }); };
  const allowed = () => runtime.getSnapshot().status === "authenticated";
  const canRun = () => { const session = runtime.getSnapshot(); return session.status === "authenticated" && session.session.capabilities.canExecuteQuery; };
  const busy = () => state.activity === "running" || state.activity === "paging";
  const reset = () => { consumedIntent = null; catalogRequest.abort(); schemaRequest.abort(); selection++; request++; state = initialQueryState(initialPageSize); listeners.forEach((listener) => { listener(); }); };
  let cleanup = () => { /* attached by lifecycle owner */ };
  function fail(failure: QueryFailure) {
    if (failure.kind === "forbidden") { catalogRequest.abort(); schemaRequest.abort(); selection++; }
    const clear = ["forbidden", "unauthenticated", "result-lost", "result-expired"].includes(failure.kind);
    publish({ activity: "failure", failure, ...(clear ? { result: null } : {}), ...(failure.kind === "forbidden" ? { catalog: [], schema: null, schemaPending: false, catalogPending: false, selectedDataset: null, context: null, handoff: null } : {}) });
  }
  async function selectDataset(datasetId: string) {
    if (!allowed() || !state.catalog.some((dataset) => dataset.id === datasetId)) return;
    const version = ++selection;
    schemaRequest.abort();
    schemaRequest = new AbortController();
    const context = runtime.capture(AbortSignal.any([lifetime.signal, schemaRequest.signal]));
    publish({ selectedDataset: datasetId, schema: null, schemaPending: true, metadataFailure: null });
    await guardOperation(runtime, context, () => operations.readSchema(context, datasetId), {
      onSuccess: (schema) => { if (version === selection && schema.datasetId === datasetId) publish({ schema, schemaPending: false }); },
      onFailure: (failure) => { if (version !== selection) return; if (failure.kind === "forbidden") catalogRequest.abort(); publish({ schema: null, schemaPending: false, metadataFailure: failure, ...(failure.kind === "forbidden" ? { catalog: [], selectedDataset: null, context: null, handoff: null } : {}) }); },
      onRejected: () => { if (version === selection) publish({ schemaPending: false, metadataFailure: { kind: "service-failure", message: "Schema could not be loaded." } }); },
    });
  }
  async function loadCatalog() {
    if (!allowed()) return;
    catalogRequest.abort();
    catalogRequest = new AbortController();
    const context = runtime.capture(AbortSignal.any([lifetime.signal, catalogRequest.signal]));
    publish({ catalogPending: true, metadataFailure: null });
    await guardOperation(runtime, context, () => operations.listDatasets(context), {
      onSuccess: (catalog) => { const session = runtime.getSnapshot(); if (session.status !== "authenticated") return; const authorized = catalog.filter((item) => session.session.capabilities.datasetIds.includes(item.id)); publish({ catalog: authorized, catalogPending: false }); },
      onFailure: (failure) => { schemaRequest.abort(); selection++; publish({ catalog: [], schema: null, schemaPending: false, selectedDataset: null, context: null, handoff: null, catalogPending: false, metadataFailure: failure }); },
      onRejected: () => { publish({ catalogPending: false, metadataFailure: { kind: "service-failure", message: "Catalog could not be loaded." } }); },
    });
  }
  async function run() {
    if (!canRun() || busy() || !state.draft.trim()) return;
    const context = runtime.capture(lifetime.signal);
    const version = ++request;
    const sql = state.draft;
    const pageSize = state.pageSize;
    publish({ submitted: sql, activity: "running", result: null, failure: null });
    await guardOperation(runtime, context, () => operations.executeQuery(context, { sql, page: 1, pageSize }), {
      onSuccess: (result) => { if (version !== request) return; if (!Number.isFinite(Date.parse(result.execution.expiresAt)) || Date.parse(result.execution.expiresAt) <= now()) { fail({ kind: "result-expired", message: "Retained result expiry is invalid or elapsed. Run explicitly for a new execution." }); return; } publish({ activity: "success", result }); },
      onFailure: (failure) => { if (version === request) fail(failure); },
      onRejected: () => { if (version === request) fail({ kind: "unknown-execution-outcome", message: "The response was lost. The query may have executed; a new Run is a separate execution." }); },
    });
  }
  async function readPage(page: number) {
    const retained = state.result;
    if (!allowed() || !retained || busy() || !Number.isSafeInteger(page) || page < 1 || page > Math.max(1, Math.ceil(retained.execution.retainedRowCount / retained.execution.pageSize))) return;
    if (!Number.isFinite(Date.parse(retained.execution.expiresAt)) || Date.parse(retained.execution.expiresAt) <= now()) { fail({ kind: "result-expired", message: "Retained results expired. Run explicitly to create a new execution." }); return; }
    const context = runtime.capture(lifetime.signal);
    const version = ++request;
    const execution = retained.execution;
    publish({ activity: "paging", failure: null });
    await guardOperation(runtime, context, () => operations.readQueryPage(context, { queryId: execution.queryId, page, pageSize: execution.pageSize }), {
      onSuccess: (result) => { if (version !== request) return; if (result.execution.queryId !== execution.queryId || result.execution.pageSize !== execution.pageSize || result.execution.snapshotId !== execution.snapshotId || result.execution.expiresAt !== execution.expiresAt || result.page !== page) { fail({ kind: "result-lost", message: "Retained execution changed. Run explicitly to create a new execution." }); return; } publish({ activity: "success", result }); },
      onFailure: (failure) => { if (version === request) fail(failure); },
      onRejected: () => { if (version === request) fail({ kind: "service-failure", message: "Page could not be loaded. Choose the page again to retry; SQL was not rerun." }); },
    });
  }
  function receiveIntent(intent: NavigationIntent) {
    const context = runtime.capture(lifetime.signal);
    if (!allowed() || intent.generation !== context.generation || consumedIntent === intent) return;
    const result = operations.consumeNavigationIntent(context, intent);
    if (!runtime.isCurrent(context) || !result.ok || result.value.target !== "queries") return;
    consumedIntent = intent;
    if (state.edited) publish({ handoff: result.value });
    else publish({ draft: result.value.proposedDraft, context: result.value, handoff: null, edited: false });
  }
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    attach() { cleanup(); lifetime = new AbortController(); cleanup = runtime.registerCleanup(reset); },
    dispose() { lifetime.abort(); cleanup(); reset(); },
    loadCatalog, selectDataset, run, readPage, receiveIntent,
    editDraft(draft: string) { if (allowed()) publish({ draft, edited: true }); },
    setPageSize(pageSize: number) { if (allowed() && Number.isSafeInteger(pageSize) && pageSize > 0 && pageSize <= maximumPageSize) publish({ pageSize }); },
    confirmHandoff() { if (allowed() && state.handoff) publish({ draft: state.handoff.proposedDraft, context: state.handoff, handoff: null, edited: false }); },
    dismissHandoff() { publish({ handoff: null }); },
  };
}
export type QueriesController = ReturnType<typeof createQueriesController>;
