import type { NationalObservation } from "../../contracts/observations";
import { MetricValue } from "../../components/molecules/MetricValue";
import { Surface } from "../../components/atoms/Surface";
import { percentageLabel } from "./presentation";

export function NationalMetricCards({ observation }: { readonly observation: NationalObservation | undefined }) {
  const row = observation?.status === "available" ? observation : null;
  const metadata = <>{observation?.date ?? "No observation"}</>;
  return <div className="grid grid-cols-3 gap-[14px] [@media(width<=760px)]:grid-cols-1">
    <Surface className="p-[18px]"><MetricValue label="Fleet capacity offline" value={row?.calculatedPercentage?.display ?? null} unit="%" metadata={<>{metadata}<br />EIA reported: {percentageLabel(row?.reportedPercentage ?? null)}</>} /></Surface>
    <Surface className="p-[18px]"><MetricValue label="Offline capacity" value={row?.outageMw?.display ?? null} unit="MW" metadata={metadata} /></Surface>
    <Surface className="p-[18px]"><MetricValue label="Reported fleet capacity" value={row?.capacityMw?.display ?? null} unit="MW" metadata={metadata} /></Surface>
  </div>;
}
