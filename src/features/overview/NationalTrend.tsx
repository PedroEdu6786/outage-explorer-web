"use client";
import { useId, useState } from "react";
import type { NationalSeries } from "../../contracts/observations";
import { Checkbox } from "../../components/atoms/Checkbox";
import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { percentageLabel, dayCoordinate, plotSegments } from "./presentation";

export function NationalTrend({ series }: { readonly series: NationalSeries }) {
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const rows = [...series.observations].sort((a, b) => a.date.localeCompare(b.date));
  const calculated = plotSegments(rows, "calculatedPercentage");
  const reported = plotSegments(rows, "reportedPercentage");
  const points = [...calculated.flat(), ...(compare ? reported.flat() : [])];
  const max = Math.max(1, ...points.map((point) => point.value));
  const min = Math.min(0, ...points.map((point) => point.value));
  const start = dayCoordinate(series.range.start);
  const span = Math.max(1, dayCoordinate(series.range.end) - start);
  const x = (date: string) => 60 + (dayCoordinate(date) - start) / span * 810;
  const y = (value: number) => 250 - (value - min) / (max - min) * 185;
  const active = rows.find((row) => row.date === selected);
  return <Surface>
    <PanelHeader title="Daily fleet capacity offline" description="Daily share of EIA-reported nuclear capacity out of service" actions={<label className="flex items-center gap-2 text-[12px]"><Checkbox checked={compare} onChange={(event) => { setCompare(event.currentTarget.checked); }} />Compare EIA reported %</label>} />
    <div className="p-[18px]">
      <div role="region" aria-label="National trend: scrollable chart" tabIndex={0} className="max-w-full overflow-x-auto">
      <svg role="img" aria-labelledby={id} viewBox="0 0 920 300" className="block w-full min-w-[920px]" data-chart="national-trend">
        <title id={id}>National offline capacity trend. Missing observations remain gaps; exact values are in the Daily observations table.</title>
        {[0, 1, 2, 3].map((index) => {
          const value = min + (max - min) * index / 3;
          return <g key={index}><line x1="60" x2="870" y1={y(value)} y2={y(value)} stroke="#dce3e7" /><text x="48" y={y(value) + 4} textAnchor="end" fontSize="11" fill="#5f707a">{value.toFixed(1)}%</text></g>;
        })}
        {([calculated, ...(compare ? [reported] : [])]).map((segments, seriesIndex) => <g key={seriesIndex} fill="none" stroke={seriesIndex === 0 ? "#087d82" : "#246b9e"} strokeWidth="2" data-series={seriesIndex === 0 ? "calculated" : "reported"}>
          {segments.map((segment, index) => <g key={index}><polyline data-segment="observed" points={segment.map((point) => `${String(x(point.date))},${String(y(point.value))}`).join(" ")} />{segment.map((point) => <circle key={point.date} cx={x(point.date)} cy={y(point.value)} r="4" fill="white" onMouseEnter={() => { setSelected(point.date); }}><title>{point.date}: {seriesIndex === 0 ? "Calculated" : "EIA reported"} {point.label}</title></circle>)}</g>)}
        </g>)}
        <text x="60" y="285" fontSize="11" fill="#5f707a">{series.range.start}</text><text x="870" y="285" textAnchor="end" fontSize="11" fill="#5f707a">{series.range.end}</text>
      </svg>
      </div>
      <p className="text-[11px] text-text-muted">Calculated offline %{compare && " · EIA reported %"} · Observation unavailable: a gap, never zero. Plot coordinates are approximate; labels preserve supplied decimal precision.</p>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">Inspect observation
        <select className="rounded border border-border bg-surface p-2" value={selected ?? ""} onChange={(event) => { setSelected(event.currentTarget.value); }}><option value="">Select date</option>{rows.map((row) => <option key={row.date} value={row.date}>{row.date}</option>)}</select>
      </label>
      {active && <div role="status" className="mt-2 rounded bg-sidebar p-3 text-[12px] text-white"><strong>{active.date}</strong><p>Calculated offline: {percentageLabel(active.status === "available" ? active.calculatedPercentage : null)}</p>{compare && <p>EIA reported: {percentageLabel(active.status === "available" ? active.reportedPercentage : null)}</p>}<p>Offline capacity: {active.status === "available" && active.outageMw ? `${active.outageMw.display} MW` : "Unavailable"}</p><p>Fleet capacity: {active.status === "available" && active.capacityMw ? `${active.capacityMw.display} MW` : "Unavailable"}</p></div>}
    </div>
  </Surface>;
}
