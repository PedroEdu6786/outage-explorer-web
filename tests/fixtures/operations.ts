import type { CatalogOperations, DateBounds } from "../../src/contracts/catalog";
import type { OperationFailure, OperationResult, UnknownExecutionOutcome } from "../../src/contracts/failures";
import type { NavigationOperations } from "../../src/contracts/navigation";
import type { ObservationOperations } from "../../src/contracts/observations";
import type { PreviewOperations, PreviewSequence } from "../../src/contracts/preview";
import type { QueryExecution, QueryOperations, QueryPage } from "../../src/contracts/query";
import type { OperationContext, SessionOperations, SessionResolution } from "../../src/contracts/session";
import type { TableData } from "../../src/contracts/table";
import { createFixtureCallLog, type FixtureOperationName } from "./call-log";
import { syntheticCatalog, syntheticObservations, syntheticPreviewTable, syntheticQueryTable, syntheticSchema, syntheticSettings, type FixtureDataState, type FixturePersona } from "./scenarios";

export type FixtureOperations = SessionOperations & CatalogOperations & ObservationOperations & PreviewOperations & QueryOperations & NavigationOperations;

export interface FixtureOptions {
  readonly persona?: FixturePersona;
  readonly dataState?: FixtureDataState;
  readonly now?: () => number;
  /** Predetermined synthetic projection scope; this adapter does not parse or authorize SQL. */
  readonly queryDatasetIds?: readonly string[];
}

interface CursorRecord {
  readonly epoch: number;
  readonly sequence: PreviewSequence;
  readonly table: TableData;
  readonly offset: number;
}

interface ExecutionRecord {
  readonly epoch: number;
  readonly datasetIds: readonly string[];
  readonly execution: QueryExecution;
  readonly table: TableData;
}

const success = <T,>(value: T): OperationResult<T> => ({ ok: true, value });
const failure = (kind: OperationFailure["kind"]): { readonly ok: false; readonly failure: OperationFailure } => ({ ok: false, failure: { kind, message: `Synthetic fixture: ${kind}.` } });
const positiveInteger = (value: number) => Number.isSafeInteger(value) && value > 0;
/** Synthetic adapter checks syntax/order only; real calendar validation belongs to feature/live boundaries. */
const validRange = (range: DateBounds) => (range.start === undefined || /^\d{4}-\d{2}-\d{2}$/.test(range.start)) && (range.end === undefined || /^\d{4}-\d{2}-\d{2}$/.test(range.end)) && (range.start === undefined || range.end === undefined || range.start <= range.end);

export function createFixtureOperations(options: FixtureOptions = {}) {
  const now = options.now ?? Date.now;
  const callLog = createFixtureCallLog();
  let persona = options.persona ?? "analyst";
  let dataState = options.dataState ?? "ready";
  let signedIn = true;
  let epoch = 0;
  let snapshot = 1;
  let cursorId = 0;
  let executionId = 0;
  let expiresAt = now() + syntheticSettings.sessionLifetimeMs;
  const cursors = new Map<string, CursorRecord>();
  const executions = new Map<string, ExecutionRecord>();
  const deferred = new Map<FixtureOperationName, Promise<void>[]>();
  const failures = new Map<FixtureOperationName, OperationFailure[]>();
  const executeFailures: (OperationFailure | UnknownExecutionOutcome)[] = [];
  const queryDatasetIds = options.queryDatasetIds ?? syntheticSettings.queryDatasetIds;

  const allowed = (datasetId: string) => syntheticCatalog.some((dataset) => dataset.id === datasetId && (persona !== "viewer" || dataset.grain === "national"));
  const sessionFailure = () => !signedIn || expiresAt <= now() ? failure("unauthenticated") : undefined;
  const datasetFailure = (datasetId: string) => sessionFailure() ?? (allowed(datasetId) ? undefined : failure("forbidden"));

  function sessionResolution(): SessionResolution {
    if (!signedIn) return { status: "unauthenticated" };
    if (expiresAt <= now()) return { status: "expired" };
    return { status: "authenticated", session: {
      identity: { subject: `synthetic-${persona}-${String(epoch)}`, displayName: `Synthetic ${persona}` },
      capabilities: { datasetIds: syntheticCatalog.filter((item) => allowed(item.id)).map((item) => item.id), canReadNationalSeries: true, canExploreDatasets: persona !== "viewer", canExecuteQuery: persona !== "viewer" },
      expiresAt: new Date(expiresAt).toISOString(),
    } };
  }

  async function invoke<T, F extends { readonly kind: string } = OperationFailure>(operation: FixtureOperationName, context: OperationContext, input: unknown, produce: () => OperationResult<T, F>): Promise<OperationResult<T, F | OperationFailure>> {
    const id = callLog.start(operation, context.generation, input);
    // Capture response before releasing delay to model a real previous-session response.
    const forced = failures.get(operation)?.shift();
    const result = forced ? { ok: false as const, failure: forced } : produce();
    try {
      const pause = deferred.get(operation)?.shift();
      if (pause) await pause;
      callLog.finish(id, result.ok ? "success" : "failure");
      return structuredClone(result);
    } catch (error) {
      callLog.finish(id, "rejected");
      throw error;
    }
  }

  function previewPage(record: CursorRecord) {
    const size = record.sequence.selection.pageSize;
    const rows = record.table.rows.slice(record.offset, record.offset + size);
    const nextOffset = record.offset + size;
    let nextCursor: string | null = null;
    if (nextOffset < record.table.rows.length) {
      nextCursor = `synthetic-cursor-${String(++cursorId)}`;
      cursors.set(nextCursor, { ...record, offset: nextOffset });
    }
    return { sequence: record.sequence, table: { columns: record.table.columns, rows }, nextCursor };
  }

  function queryPage(record: ExecutionRecord, page: number) {
    const offset = (page - 1) * record.execution.pageSize;
    return { execution: record.execution, page, table: { columns: record.table.columns, rows: record.table.rows.slice(offset, offset + record.execution.pageSize) } };
  }

  const operations: FixtureOperations = {
    resolveSession: (context) => invoke("resolveSession", context, null, () => success(sessionResolution())),
    beginLogin: (context) => invoke("beginLogin", context, null, () => {
      signedIn = true;
      epoch += 1;
      expiresAt = now() + syntheticSettings.sessionLifetimeMs;
      return success(undefined);
    }),
    logout: (context) => invoke("logout", context, null, () => {
      signedIn = false;
      epoch += 1;
      return success(undefined);
    }),
    listDatasets: (context) => invoke("listDatasets", context, null, () => sessionFailure() ?? success(syntheticCatalog.filter((item) => allowed(item.id)))),
    readSchema: (context, datasetId) => invoke("readSchema", context, { datasetId }, () => datasetFailure(datasetId) ?? success(syntheticSchema(datasetId))),
    readNationalSeries: (context, range) => invoke("readNationalSeries", context, range, () => {
      const denied = datasetFailure("synthetic-national");
      if (denied) return denied;
      if (!validRange(range)) return failure("invalid-input");
      if (dataState === "unavailable") return failure("data-unavailable");
      return success({ range, coverage: syntheticCatalog[0]?.coverage ?? { status: "unavailable" }, provenance: { source: "Synthetic fixture, not EIA observations", snapshotId: `synthetic-snapshot-${String(snapshot)}` }, observations: dataState === "empty" ? [] : syntheticObservations.filter((row) => (!range.start || row.date >= range.start) && (!range.end || row.date <= range.end)) });
    }),
    startPreview: (context, selection) => invoke("startPreview", context, selection, () => {
      const denied = datasetFailure(selection.datasetId);
      if (denied) return denied;
      const dataset = syntheticCatalog.find((item) => item.id === selection.datasetId);
      if (!positiveInteger(selection.pageSize) || selection.pageSize > 500 || (selection.filters.dates && !validRange(selection.filters.dates)) || (selection.filters.facilityId && !dataset?.filters.facilities.some((option) => option.id === selection.filters.facilityId))) return failure("invalid-input");
      if (dataState === "unavailable") return failure("data-unavailable");
      const original = syntheticPreviewTable(selection.datasetId);
      const table = { ...original, rows: dataState === "empty" ? [] : original.rows.filter((row) => {
        const date = row.cells[0];
        const facility = row.cells[5];
        const matchesFacility = !selection.filters.facilityId || (facility?.kind === "identifier" && facility.value === selection.filters.facilityId);
        return matchesFacility && (!selection.filters.dates || (date?.kind === "date" && (!selection.filters.dates.start || date.value >= selection.filters.dates.start) && (!selection.filters.dates.end || date.value <= selection.filters.dates.end)));
      }) };
      const sequence: PreviewSequence = { selection: structuredClone(selection), snapshotId: `synthetic-snapshot-${String(snapshot)}`, expiresAt: new Date(now() + syntheticSettings.previewLifetimeMs).toISOString() };
      return success(previewPage({ epoch, sequence, table, offset: 0 }));
    }),
    continuePreview: (context, input) => invoke("continuePreview", context, input, () => {
      const denied = datasetFailure(input.sequence.selection.datasetId);
      if (denied) return denied;
      const record = cursors.get(input.cursor);
      if (record?.epoch !== epoch || JSON.stringify(record.sequence) !== JSON.stringify(input.sequence)) return failure("forbidden");
      if (Date.parse(record.sequence.expiresAt) <= now()) return failure("preview-expired");
      return success(previewPage(record));
    }),
    executeQuery: (context, input) => invoke<QueryPage, OperationFailure | UnknownExecutionOutcome>("executeQuery", context, input, () => {
      const denied = sessionFailure() ?? (queryDatasetIds.every(allowed) ? undefined : failure("forbidden"));
      if (denied) return denied;
      if (!input.sql.trim() || !positiveInteger(input.page) || !positiveInteger(input.pageSize) || input.pageSize > syntheticSettings.queryMaximumPageSize) return failure("invalid-input");
      const forced = executeFailures.shift();
      if (forced && forced.kind !== "unknown-execution-outcome") return { ok: false, failure: forced };
      if (dataState === "unavailable") return failure("data-unavailable");
      const table = { ...syntheticQueryTable, rows: dataState === "empty" ? [] : syntheticQueryTable.rows };
      const execution: QueryExecution = { queryId: `synthetic-query-${String(++executionId)}`, snapshotId: `synthetic-snapshot-${String(snapshot)}`, pageSize: input.pageSize, expiresAt: new Date(now() + syntheticSettings.queryLifetimeMs).toISOString(), retainedRowCount: table.rows.length, truncation: dataState === "truncated" ? { truncated: true, reason: "row-limit" } : { truncated: false } };
      const record = { epoch, datasetIds: [...queryDatasetIds], execution, table };
      executions.set(execution.queryId, record);
      // An execution can exist even when the caller never receives its identity.
      if (forced) return { ok: false, failure: forced };
      if (input.page > Math.max(1, Math.ceil(table.rows.length / input.pageSize))) return failure("invalid-input");
      return success(queryPage(record, input.page));
    }),
    readQueryPage: (context, input) => invoke("readQueryPage", context, input, () => {
      const denied = sessionFailure();
      if (denied) return denied;
      const record = executions.get(input.queryId);
      if (!record) return failure("result-lost");
      if (record.epoch !== epoch || !record.datasetIds.every(allowed)) return failure("forbidden");
      if (Date.parse(record.execution.expiresAt) <= now()) return failure("result-expired");
      if ("sql" in input || input.pageSize !== record.execution.pageSize || !positiveInteger(input.page) || input.page > Math.max(1, Math.ceil(record.table.rows.length / input.pageSize))) return failure("invalid-input");
      return success(queryPage(record, input.page));
    }),
    consumeNavigationIntent(context, intent) {
      const id = callLog.start("consumeNavigationIntent", context.generation, intent);
      const denied = datasetFailure(intent.datasetId);
      const dataset = syntheticCatalog.find((item) => item.id === intent.datasetId);
      const invalidFilters = (intent.filters.dates !== undefined && !validRange(intent.filters.dates)) || (intent.filters.facilityId !== undefined && !dataset?.filters.facilities.some((option) => option.id === intent.filters.facilityId));
      const result = denied ?? (intent.generation !== context.generation || !dataset ? failure("forbidden") : invalidFilters ? failure("invalid-input") : success(intent.target === "explorer" ? { target: "explorer" as const, datasetId: intent.datasetId, filters: intent.filters } : { target: "queries" as const, datasetId: intent.datasetId, filters: intent.filters, proposedDraft: `SELECT * FROM ${dataset.sqlName}` }));
      callLog.finish(id, result.ok ? "success" : "failure");
      return structuredClone(result);
    },
  };

  return {
    operations,
    callLog,
    sessionResolution,
    setPersona(next: FixturePersona) { persona = next; signedIn = true; epoch += 1; expiresAt = now() + syntheticSettings.sessionLifetimeMs; },
    setDataState(next: FixtureDataState) { dataState = next; },
    publishSnapshot() { snapshot += 1; },
    loseResults() { executions.clear(); },
    failNext(operation: FixtureOperationName, error: OperationFailure) {
      const queue = failures.get(operation) ?? [];
      queue.push(error);
      failures.set(operation, queue);
    },
    failNextExecution(error: OperationFailure | UnknownExecutionOutcome) { executeFailures.push(error); },
    deferNext(operation: FixtureOperationName) {
      let release = () => { /* assigned by promise constructor */ };
      let reject: (error: unknown) => void = () => { /* assigned by promise constructor */ };
      const promise = new Promise<void>((resolve, rejectPromise) => { release = resolve; reject = rejectPromise; });
      const queue = deferred.get(operation) ?? [];
      queue.push(promise);
      deferred.set(operation, queue);
      return { release, reject };
    },
  };
}

export type FixtureController = ReturnType<typeof createFixtureOperations>;
