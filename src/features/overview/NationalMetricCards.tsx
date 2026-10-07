import type { NationalObservation } from "../../contracts/observations";
import { MetricValue } from "../../components/molecules/MetricValue";
import { Skeleton } from "../../components/atoms/Skeleton";
import { Surface } from "../../components/atoms/Surface";
import { percentageLabel } from "./presentation";

/**
 * First-load cards keep the label text and the real card geometry but never render
 * a value, date or "Unavailable": placeholders only, announced by the page banner.
 */
export function NationalMetricCards({ observation, loading }: { readonly observation?: NationalObservation | undefined; readonly loading?: boolean }) {
  if (loading) {
    const placeholder = (lines: number) => <>{Array.from({ length: lines }, (_, line) => <span key={line}>{line > 0 && <br />}<Skeleton className="h-[.8em] w-[14ch]" /></span>)}</>;
    return <div className="grid grid-cols-3 gap-[14px] [@media(width<=760px)]:grid-cols-1">
      <Surface className="p-[18px]"><MetricValue loading label="Fleet capacity offline" value={null} metadata={placeholder(2)} /></Surface>
      <Surface className="p-[18px]"><MetricValue loading label="Offline capacity" value={null} metadata={placeholder(1)} /></Surface>
      <Surface className="p-[18px]"><MetricValue loading label="Reported fleet capacity" value={null} metadata={placeholder(1)} /></Surface>
    </div>;
  }
  const row = observation?.status === "available" ? observation : null;
  const metadata = <>{observation?.date ?? "No observation"}</>;
  return <div className="grid grid-cols-3 gap-[14px] [@media(width<=760px)]:grid-cols-1">
    <Surface className="p-[18px]"><MetricValue loading={false} label="Fleet capacity offline" value={row?.calculatedPercentage?.display ?? null} unit="%" metadata={<>{metadata}<br />EIA reported: {percentageLabel(row?.reportedPercentage ?? null)}</>} /></Surface>
    <Surface className="p-[18px]"><MetricValue loading={false} label="Offline capacity" value={row?.outageMw?.display ?? null} unit="MW" metadata={metadata} /></Surface>
    <Surface className="p-[18px]"><MetricValue loading={false} label="Reported fleet capacity" value={row?.capacityMw?.display ?? null} unit="MW" metadata={metadata} /></Surface>
  </div>;
}
