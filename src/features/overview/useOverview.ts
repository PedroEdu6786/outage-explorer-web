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
interface RetainedSeries {
  readonly series: NationalSeries;
  readonly generation: number;
}

export function useOverview(operations: OverviewOperations, onNavigate?: (intent: NavigationIntent) => void) {
  const runtime = useSessionRuntime();
  const session = useSessionState();
  const service = useMemo(() => createOverviewService(runtime, operations), [runtime, operations]);
  const [dataset, setDataset] = useState<DatasetSummary | null>(null);
  const [series, setSeries] = useState<NationalSeries | null>(null);
  const [range, setRange] = useState<DateBounds>({});
  const [draftRange, setDraftRange] = useState<DateBounds>({});
  const [failure, setFailure] = useState<OperationFailure | null>(null);
  const [loading, setLoading] = useState(false);
  const [previousSeries, setPreviousSeries] = useState<RetainedSeries | null>(null);
  const [seriesRetryRevision, setSeriesRetryRevision] = useState(0);
  const [catalogReloadRevision, setCatalogReloadRevision] = useState(0);
  const seriesRequestVersion = useRef(0);
  const preserveAppliedRange = useRef(false);
  const activeSeriesAbort = useRef<AbortController | null>(null);
  useEffect(() => runtime.registerCleanup(() => {
    preserveAppliedRange.current = false;
    activeSeriesAbort.current?.abort();
    seriesRequestVersion.current += 1;
    setDataset(null);
    setSeries(null);
    setRange({});
    setDraftRange({});
    setFailure(null);
    setLoading(false);
    setPreviousSeries(null);
  }), [runtime]);
  useEffect(() => {
    if (session.status !== "authenticated" || !session.session.capabilities.canReadNationalSeries) return;
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    void guardOperation(runtime, context, () => service.operations.listDatasets(context), {
      onSuccess: (catalog) => {
        const currentSession = runtime.getSnapshot();
        const national = catalog.find((item) => item.grain === "national"
          && currentSession.status === "authenticated"
          && currentSession.session.capabilities.datasetIds.includes(item.id)) ?? null;
        setDataset(national);
        if (national?.coverage.status === "available") {
          if (!preserveAppliedRange.current) {
            setRange(national.coverage.range);
            setDraftRange(national.coverage.range);
          }
        } else {
          setFailure({ kind: "data-unavailable", message: "National observations are unavailable." });
        }
      },
      onFailure: setFailure,
      onRejected: () => {
        setFailure({ kind: "service-failure", message: "Unable to load national dataset metadata." });
      },
    });
    return () => {
      abort.abort();
    };
  }, [runtime, service, session.generation, session.status, catalogReloadRevision]);
  useEffect(() => {
    if (session.status !== "authenticated" || !session.session.capabilities.canReadNationalSeries || !dataset || !validRange(range)) {
      setPreviousSeries(null);
      return;
    }
    const abort = new AbortController();
    const context = runtime.capture(abort.signal);
    activeSeriesAbort.current?.abort();
    activeSeriesAbort.current = abort;
    const requestVersion = ++seriesRequestVersion.current;
    setLoading(true);
    setSeries(null);
    setFailure(null);
    const isCurrentSeriesRequest = () => requestVersion === seriesRequestVersion.current;
    void guardOperation(runtime, context, () => service.operations.readNationalSeries(context, range), {
      onSuccess: (value) => {
        if (!isCurrentSeriesRequest()) return;
        setSeries(value);
        setLoading(false);
        setPreviousSeries(null);
      },
      onFailure: (error) => {
        if (!isCurrentSeriesRequest()) return;
        setFailure(error);
        setLoading(false);
        setPreviousSeries(null);
        if (error.kind === "forbidden") setDataset(null);
      },
      onRejected: () => {
        if (!isCurrentSeriesRequest()) return;
        setFailure({ kind: "service-failure", message: "Unable to load national observations. Retry deliberately." });
        setLoading(false);
        setPreviousSeries(null);
      },
    });
    return () => {
      abort.abort();
    };
  }, [dataset, range, seriesRetryRevision, runtime, service, session.generation, session.status]);
  function changeRange(next: DateBounds) {
    setDraftRange(next);
    if (next.start === range.start && next.end === range.end) return;
    activeSeriesAbort.current?.abort();
    seriesRequestVersion.current += 1;
    setSeries(null);
    setFailure(null);
    setLoading(false);
    setRange(next);
    // Remember what this change replaces (only a current, readable series) for the dimmed loading view; an invalid range is not loading.
    const currentSession = runtime.getSnapshot();
    const canRetainPreviousSeries = currentSession.status === "authenticated"
      && currentSession.session.capabilities.canReadNationalSeries && validRange(next);
    setPreviousSeries((previous) => {
      if (!canRetainPreviousSeries) return null;
      if (series) return { series, generation: currentSession.generation };
      return previous;
    });
  }
  const renderedSeriesRequestVersion = seriesRequestVersion.current;
  function explore() {
    const context = runtime.capture();
    const currentSession = runtime.getSnapshot();
    if (!dataset || !series || !validRange(range) || session.status !== "authenticated" || !onNavigate
      || renderedSeriesRequestVersion !== seriesRequestVersion.current
      || session.generation !== context.generation || currentSession.status !== "authenticated"
      || !currentSession.session.capabilities.canExploreDatasets
      || !currentSession.session.capabilities.canReadNationalSeries
      || !currentSession.session.capabilities.datasetIds.includes(dataset.id)) return;
    guardCurrent(runtime, context, () => {
      onNavigate({
        target: "explorer",
        generation: context.generation,
        datasetId: dataset.id,
        filters: { dates: range },
      });
    });
  }
  function reloadMetadata() {
    // Publication changes catalog coverage; preserve the currently selected dates.
    preserveAppliedRange.current = true;
    activeSeriesAbort.current?.abort();
    seriesRequestVersion.current += 1;
    setDataset(null);
    setSeries(null);
    setFailure(null);
    setLoading(false);
    setPreviousSeries(null);
    setCatalogReloadRevision((value) => value + 1);
  }
  // Non-null only while a refetch is loading under the generation it was fetched in; never feeds `series`, `explore()` or guards.
  const retainedSeries = previousSeries !== null && loading && !failure
    && session.status === "authenticated" && session.session.capabilities.canReadNationalSeries
    && previousSeries.generation === session.generation ? previousSeries.series : null;
  return {
    dataset,
    series,
    retainedSeries,
    range,
    draftRange,
    setDraftRange,
    invalidDraftRange: !validRange(draftRange),
    rangeChanged: draftRange.start !== range.start || draftRange.end !== range.end,
    applyRange: () => {
      if (validRange(draftRange)) changeRange(draftRange);
    },
    failure,
    loading,
    session,
    changeRange,
    explore,
    reloadMetadata,
    retry: () => {
      if (dataset) {
        setSeriesRetryRevision((value) => value + 1);
      } else {
        setCatalogReloadRevision((value) => value + 1);
      }
    },
    invalidRange: !validRange(range),
  };
}
