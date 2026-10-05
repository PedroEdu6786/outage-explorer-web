"use client";
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

export interface OverviewFeatureProps { readonly operations: OverviewOperations; readonly runtime: SessionRuntime; readonly onNavigate?: (intent: NavigationIntent) => void }
export function OverviewFeature(props: OverviewFeatureProps) {
  return <SessionProvider runtime={props.runtime}><OverviewContent {...props} /></SessionProvider>;
}
function OverviewContent({ operations, onNavigate }: OverviewFeatureProps) {
  const model = useOverview(operations, onNavigate);
  if (model.session.status !== "authenticated") return <StatusMessage title={model.session.status === "pending" ? "Resolving session" : "Sign in to view national observations"} pending={model.session.status === "pending"} />;
  if (!model.session.session.capabilities.canReadNationalSeries) return <StatusMessage tone="error" title="National data access denied" />;
  return <OverviewTemplate
    heading={<div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-[25px] font-[650] tracking-[-.025em]">U.S. Nuclear Outage Overview</h1><p className="mt-1 text-[13px] text-text-muted">Explore daily offline capacity across the U.S. nuclear fleet.</p></div><DateRangeField variant="compact" start={model.range.start ?? ""} end={model.range.end ?? ""} onStartChange={(start) => { model.changeRange({ ...(start ? { start } : {}), ...(model.range.end ? { end: model.range.end } : {}) }); }} onEndChange={(end) => { model.changeRange({ ...(model.range.start ? { start: model.range.start } : {}), ...(end ? { end } : {}) }); }} /></div>}
    notice={model.invalidRange ? <StatusMessage tone="error" title="Choose valid calendar dates in chronological order" /> : model.failure ? <StatusMessage tone="error" title={model.failure.kind === "forbidden" ? "National data access denied" : model.failure.message} actions={model.failure.kind !== "forbidden" && <Button onClick={model.retry}>Retry</Button>} /> : model.loading || !model.dataset ? <StatusMessage title="Loading national observations" pending /> : undefined}
    metrics={model.series && <NationalMetricCards observation={[...model.series.observations].sort((a, b) => a.date.localeCompare(b.date)).at(-1)} />}
    trend={model.series && model.series.observations.length > 0 && <NationalTrend key={`${String(model.session.generation)}:${model.series.range.start ?? "open"}:${model.series.range.end ?? "open"}:${model.series.provenance.snapshotId}`} series={model.series} />}
    observations={model.series && (model.series.observations.length === 0 ? <EmptyState title="No observations in this range" /> : <DailyObservations observations={model.series.observations} {...(onNavigate ? { onExplore: model.explore } : {})} />)}
  />;
}
