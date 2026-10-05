"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DatasetSummary, DateRange } from "../../contracts/catalog";
import type { OperationFailure } from "../../contracts/failures";
import type { NationalSeries } from "../../contracts/observations";
import type { NavigationIntent } from "../../contracts/navigation";
import { useSessionRuntime, useSessionState } from "../../session/SessionProvider";
import { guardCurrent, guardOperation } from "../../session/guard-operation";
import { createOverviewService, validRange, type OverviewOperations } from "./service";

export function useOverview(operations: OverviewOperations, onNavigate?: (intent: NavigationIntent) => void) {
  const runtime = useSessionRuntime();
  const session = useSessionState();
  const service = useMemo(() => createOverviewService(runtime, operations), [runtime, operations]);
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [series, setSeries] = useState<NationalSeries | null>(null);
  const [range, setRange] = useState<DateRange>({ start: "", end: "" });
  const [failure, setFailure] = useState<OperationFailure | null>(null);
  const [loading, setLoading] = useState(false);
  const [revision, setRevision] = useState(0);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const selection = useRef(0);
  const activeSeries = useRef<AbortController | null>(null);
  useEffect(() => runtime.registerCleanup(() => {
    activeSeries.current?.abort(); selection.current += 1; setDataset(null); setSeries(null); setRange({ start: "", end: "" }); setFailure(null); setLoading(false);
  }), [runtime]);
  useEffect(() => {
    if (session.status !== "authenticated" || !session.session.capabilities.canReadNationalSeries) return;
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    void guardOperation(runtime, context, () => service.operations.listDatasets(context), {
      onSuccess: (catalog) => {
        const currentSession = runtime.getSnapshot();
        const national = catalog.find((item) => item.grain === "national" && currentSession.status === "authenticated" && currentSession.session.capabilities.datasetIds.includes(item.id)) ?? null;
        setDataset(national);
        if (national?.coverage.status === "available") setRange(national.coverage.range);
        else setFailure({ kind: "data-unavailable", message: "National observations are unavailable." });
      },
      onFailure: setFailure,
      onRejected: () => { setFailure({ kind: "service-failure", message: "Unable to load national dataset metadata." }); },
    });
    return () => { abort.abort(); };
  }, [runtime, service, session.generation, session.status, catalogRevision]);
  useEffect(() => {
    if (session.status !== "authenticated" || !session.session.capabilities.canReadNationalSeries || !dataset || !validRange(range)) return;
    if (dataset.coverage.status === "available" && (range.start < dataset.coverage.range.start || range.end > dataset.coverage.range.end)) return;
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    activeSeries.current?.abort();
    activeSeries.current = abort;
    const sequence = ++selection.current;
    setLoading(true); setSeries(null); setFailure(null);
    const current = () => sequence === selection.current;
    void guardOperation(runtime, context, () => service.operations.readNationalSeries(context, range), {
      onSuccess: (value) => { if (current()) { setSeries(value); setLoading(false); } },
      onFailure: (error) => { if (current()) { setFailure(error); setLoading(false); if (error.kind === "forbidden") setDataset(null); } },
      onRejected: () => { if (current()) { setFailure({ kind: "service-failure", message: "Unable to load national observations. Retry deliberately." }); setLoading(false); } },
    });
    return () => { abort.abort(); };
  }, [dataset, range, revision, runtime, service, session.generation, session.status]);
  function changeRange(next: DateRange) {
    activeSeries.current?.abort(); selection.current += 1; setSeries(null); setFailure(null); setLoading(false); setRange(next);
  }
  const renderedSelection = selection.current;
  function explore() {
    const context = runtime.capture();
    const currentSession = runtime.getSnapshot();
    if (!dataset || !series || !validRange(range) || session.status !== "authenticated" || !onNavigate
      || renderedSelection !== selection.current || session.generation !== context.generation || currentSession.status !== "authenticated"
      || !currentSession.session.capabilities.canReadNationalSeries || !currentSession.session.capabilities.datasetIds.includes(dataset.id)) return;
    guardCurrent(runtime, context, () => { onNavigate({ target: "explorer", generation: context.generation, datasetId: dataset.id, filters: { dates: range } }); });
  }
  return { dataset, series, range, failure, loading, session, changeRange, explore, retry: () => { if (dataset) setRevision((value) => value + 1); else setCatalogRevision((value) => value + 1); }, invalidRange: range.start !== "" && (!validRange(range) || (dataset?.coverage.status === "available" && (range.start < dataset.coverage.range.start || range.end > dataset.coverage.range.end))) };
}
