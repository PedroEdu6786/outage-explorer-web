"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DatasetSummary, DateBounds } from "../../contracts/catalog";
import type { OperationFailure } from "../../contracts/failures";
import type { NationalSeries } from "../../contracts/observations";
import type { NavigationIntent } from "../../contracts/navigation";
import { useSessionRuntime, useSessionState } from "../../session/SessionProvider";
import { guardCurrent, guardOperation } from "../../session/guard-operation";
import { createOverviewService, validRange, type OverviewOperations } from "./service";

/**
 * Presentation-only memory of the series a range change is replacing. It is
 * stored with the session generation it was fetched under and is exposed only
 * through the guarded `retainedSeries` below.
 */
interface RetainedSeries { readonly series: NationalSeries; readonly generation: number }

export function useOverview(operations: OverviewOperations, onNavigate?: (intent: NavigationIntent) => void) {
  const runtime = useSessionRuntime();
  const session = useSessionState();
  const service = useMemo(() => createOverviewService(runtime, operations), [runtime, operations]);
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [series, setSeries] = useState<NationalSeries | null>(null);
  const [range, setRange] = useState<DateBounds>({});
  const [failure, setFailure] = useState<OperationFailure | null>(null);
  const [loading, setLoading] = useState(false);
  const [retained, setRetained] = useState<RetainedSeries | null>(null);
  const [revision, setRevision] = useState(0);
  const [catalogRevision, setCatalogRevision] = useState(0);
  const selection = useRef(0);
  const preserveRange = useRef(false);
  const activeSeries = useRef<AbortController | null>(null);
  useEffect(() => runtime.registerCleanup(() => {
    preserveRange.current = false;
    activeSeries.current?.abort(); selection.current += 1; setDataset(null); setSeries(null); setRange({}); setFailure(null); setLoading(false); setRetained(null);
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
        if (national?.coverage.status === "available") {
          if (!preserveRange.current) setRange(national.coverage.range);
        }
        else setFailure({ kind: "data-unavailable", message: "National observations are unavailable." });
      },
      onFailure: setFailure,
      onRejected: () => { setFailure({ kind: "service-failure", message: "Unable to load national dataset metadata." }); },
    });
    return () => { abort.abort(); };
  }, [runtime, service, session.generation, session.status, catalogRevision]);
  useEffect(() => {
    if (session.status !== "authenticated" || !session.session.capabilities.canReadNationalSeries || !dataset || !validRange(range)) { setRetained(null); return; }
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    activeSeries.current?.abort();
    activeSeries.current = abort;
    const sequence = ++selection.current;
    setLoading(true); setSeries(null); setFailure(null);
    const current = () => sequence === selection.current;
    void guardOperation(runtime, context, () => service.operations.readNationalSeries(context, range), {
      onSuccess: (value) => { if (current()) { setSeries(value); setLoading(false); setRetained(null); } },
      onFailure: (error) => { if (current()) { setFailure(error); setLoading(false); setRetained(null); if (error.kind === "forbidden") setDataset(null); } },
      onRejected: () => { if (current()) { setFailure({ kind: "service-failure", message: "Unable to load national observations. Retry deliberately." }); setLoading(false); setRetained(null); } },
    });
    return () => { abort.abort(); };
  }, [dataset, range, revision, runtime, service, session.generation, session.status]);
  function changeRange(next: DateBounds) {
    activeSeries.current?.abort(); selection.current += 1; setSeries(null); setFailure(null); setLoading(false); setRange(next);
    // Remember what this change replaces (only a current, readable series) for the dimmed loading view; an invalid range is not loading.
    const current = runtime.getSnapshot();
    const readable = current.status === "authenticated" && current.session.capabilities.canReadNationalSeries && validRange(next);
    setRetained((previous) => readable ? (series ? { series, generation: current.generation } : previous) : null);
  }
  const renderedSelection = selection.current;
  function explore() {
    const context = runtime.capture();
    const currentSession = runtime.getSnapshot();
    if (!dataset || !series || !validRange(range) || session.status !== "authenticated" || !onNavigate
      || renderedSelection !== selection.current || session.generation !== context.generation || currentSession.status !== "authenticated"
      || !currentSession.session.capabilities.canExploreDatasets || !currentSession.session.capabilities.canReadNationalSeries || !currentSession.session.capabilities.datasetIds.includes(dataset.id)) return;
    guardCurrent(runtime, context, () => { onNavigate({ target: "explorer", generation: context.generation, datasetId: dataset.id, filters: { dates: range } }); });
  }
  function reloadMetadata() {
    // Publication changes catalog coverage; preserve the currently selected dates.
    preserveRange.current = true;
    activeSeries.current?.abort(); selection.current += 1;
    setDataset(null); setSeries(null); setFailure(null); setLoading(false); setRetained(null);
    setCatalogRevision((value) => value + 1);
  }
  // Non-null only while a refetch is loading under the generation it was fetched in; never feeds `series`, `explore()` or guards.
  const retainedSeries = retained !== null && loading && !failure && session.status === "authenticated" && session.session.capabilities.canReadNationalSeries && retained.generation === session.generation ? retained.series : null;
  return { dataset, series, retainedSeries, range, failure, loading, session, changeRange, explore, reloadMetadata, retry: () => { if (dataset) setRevision((value) => value + 1); else setCatalogRevision((value) => value + 1); }, invalidRange: !validRange(range) };
}
