"use client";
import type { ReactNode } from "react";
import type { RefreshOperations } from "../../contracts/refresh";
import { RefreshControl } from "./RefreshControl";
import { SessionProvider } from "../../session/SessionProvider";
import type { SessionRuntime } from "../../session/session-runtime";
import type { NavigationIntent } from "../../contracts/navigation";
import { OverviewTemplate } from "../../components/templates/OverviewTemplate";
import { DateRangeField } from "../../components/molecules/DateRangeField";
import { StatusMessage } from "../../components/molecules/StatusMessage";
import { EmptyState } from "../../components/molecules/EmptyState";
import { Button } from "../../components/atoms/Button";
import { NationalMetricCards } from "./NationalMetricCards";
import { NationalTrend } from "./NationalTrend";
import { DailyObservations } from "./DailyObservations";
import { useOverview } from "./useOverview";
import type { OverviewOperations } from "./service";

/** Dimmed, inert and hidden from assistive technology while its content is superseded; a stable wrapper so live content keeps its identity. */
function Retained({ stale, className, children }: { readonly stale: boolean; readonly className: string; readonly children: ReactNode }) {
  return <div inert={stale} aria-hidden={stale || undefined} className={`motion-colors ${className}`.trim()}>{children}</div>;
}

export interface OverviewFeatureProps { readonly operations: OverviewOperations; readonly runtime: SessionRuntime; readonly refreshOperations?: RefreshOperations; readonly onNavigate?: (intent: NavigationIntent) => void; readonly onPublished?: () => void }
export function OverviewFeature(props: OverviewFeatureProps) {
  return <SessionProvider runtime={props.runtime}><OverviewContent {...props} /></SessionProvider>;
}
function OverviewContent({ operations, onNavigate, refreshOperations, onPublished }: OverviewFeatureProps) {
  const model = useOverview(operations, onNavigate);
  if (model.session.status !== "authenticated") return <StatusMessage title={model.session.status === "pending" ? "Resolving session" : "Sign in to view national observations"} pending={model.session.status === "pending"} />;
  if (!model.session.session.capabilities.canReadNationalSeries) return <StatusMessage tone="error" title="National data access denied" />;
  // A superseded range's series is shown dimmed only while its replacement loads (guarded in useOverview); it never feeds actions.
  const stale = model.series === null && model.retainedSeries !== null;
  const shown = model.series ?? model.retainedSeries;
  // First load: the "Loading national observations" banner is showing and there is nothing to show yet.
  const firstLoad = !shown && !model.invalidRange && !model.failure && (model.loading || !model.dataset);
  const dim = stale ? "opacity-50" : "";
  return <OverviewTemplate
    heading={<><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[25px] font-[650] tracking-[-.025em]">U.S. Nuclear Outage Overview</h1><p className="mt-1 text-[13px] text-text-muted">Explore daily offline capacity across the U.S. nuclear fleet.</p></div><form aria-label="Observation dates" className="flex flex-wrap items-center gap-2" onSubmit={(event) => { event.preventDefault(); model.applyRange(); }}>
      <DateRangeField variant="compact" start={model.draftRange.start ?? ""} end={model.draftRange.end ?? ""}
        onStartChange={(start) => { model.setDraftRange({ ...(start ? { start } : {}), ...(model.draftRange.end ? { end: model.draftRange.end } : {}) }); }}
        onEndChange={(end) => { model.setDraftRange({ ...(model.draftRange.start ? { start: model.draftRange.start } : {}), ...(end ? { end } : {}) }); }}
        endError={model.invalidDraftRange ? "Choose valid dates in chronological order" : undefined} />
      <Button type="submit" disabled={!model.dataset || model.invalidDraftRange || !model.rangeChanged}>Apply dates</Button>
    </form></div><RefreshControl operations={refreshOperations} onPublished={() => { onPublished?.(); model.reloadMetadata(); }} /></>}
    notice={model.invalidRange ? <StatusMessage tone="error" title="Choose valid calendar dates in chronological order" /> : model.failure ? <StatusMessage tone="error" title={model.failure.kind === "forbidden" ? "National data access denied" : model.failure.message} actions={model.failure.kind !== "forbidden" && <Button onClick={model.retry}>Retry</Button>} /> : model.loading || !model.dataset ? <StatusMessage title="Loading national observations" pending /> : undefined}
    metrics={(firstLoad || shown) && <Retained stale={stale} className={dim}>{firstLoad ? <NationalMetricCards key="live" loading /> : shown && <NationalMetricCards key={stale ? "stale" : "live"} observation={[...shown.observations].sort((x, y) => x.date.localeCompare(y.date)).at(-1)} />}</Retained>}
    trend={shown && shown.observations.length > 0 && <Retained stale={stale} className={dim}><NationalTrend key={`${String(model.session.generation)}:${model.range.start ?? "open"}:${model.range.end ?? "open"}:${shown.provenance.snapshotId}`} series={shown} range={model.range} interactive={!stale} /></Retained>}
    observations={shown && (shown.observations.length === 0 ? <EmptyState title="No observations in this range" /> : <DailyObservations key={stale ? "stale" : "live"} observations={shown.observations} loading={stale} {...(!stale && onNavigate && model.session.session.capabilities.canExploreDatasets ? { onExplore: model.explore } : {})} />)}
  />;
}
