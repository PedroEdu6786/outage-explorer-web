import type { NationalObservation } from "../../contracts/observations";
import { MetricValue } from "../../components/molecules/MetricValue";
import { Skeleton } from "../../components/atoms/Skeleton";
import { Surface } from "../../components/atoms/Surface";
import { capacityLabel, percentageLabel } from "./presentation";

/** Cards enter with a capped stagger on mount; values are present immediately. */
const cardStagger = ["[--stagger-index:0]", "[--stagger-index:1]", "[--stagger-index:2]"] as const;
const card = (index: 0 | 1 | 2) => `motion-stagger p-[18px] ${cardStagger[index]}`;

/**
 * First-load cards keep the label text and the real card geometry but never render
 * a value, date or "Unavailable": placeholders only, announced by the page banner.
 */
export function NationalMetricCards({ observation, loading }: { readonly observation?: NationalObservation | undefined; readonly loading?: boolean }) {
  if (loading) {
    const placeholder = (lines: number) => <>{Array.from({ length: lines }, (_, line) => <span key={line}>{line > 0 && <br />}<Skeleton className="h-[.8em] w-[14ch]" /></span>)}</>;
    return <div className="grid grid-cols-3 gap-[14px] [@media(width<=760px)]:grid-cols-1">
      <Surface className={card(0)}><MetricValue loading label="Fleet capacity offline" value={null} metadata={placeholder(2)} /></Surface>
      <Surface className={card(1)}><MetricValue loading label="Offline capacity" value={null} metadata={placeholder(1)} /></Surface>
      <Surface className={card(2)}><MetricValue loading label="Reported fleet capacity" value={null} metadata={placeholder(1)} /></Surface>
    </div>;
  }
  const row = observation?.status === "available" ? observation : null;
  const metadata = <>{observation?.date ?? "No observation"}</>;
  return <div className="grid grid-cols-3 gap-[14px] [@media(width<=760px)]:grid-cols-1">
    <Surface className={card(0)}><MetricValue loading={false} label="Fleet capacity offline" value={row?.calculatedPercentage?.display ?? null} unit="%" metadata={<>{metadata}<br />EIA reported: {percentageLabel(row?.reportedPercentage ?? null)}</>} /></Surface>
    <Surface className={card(1)}><MetricValue loading={false} label="Offline capacity" value={capacityLabel(row?.outageMw ?? null)} unit="MW" metadata={metadata} /></Surface>
    <Surface className={card(2)}><MetricValue loading={false} label="Reported fleet capacity" value={capacityLabel(row?.capacityMw ?? null)} unit="MW" metadata={metadata} /></Surface>
  </div>;
}
