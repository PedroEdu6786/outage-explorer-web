"use client";
import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import type { NationalSeries } from "../../contracts/observations";
import type { DateBounds } from "../../contracts/catalog";
import { Checkbox } from "../../components/atoms/Checkbox";
import { Surface } from "../../components/atoms/Surface";
import { PanelHeader } from "../../components/molecules/PanelHeader";
import { EmptyState } from "../../components/molecules/EmptyState";
import { ChartZoomControls } from "./ChartZoomControls";
import { resolveChartWindow } from "./chart-viewport";
import { useChartViewport } from "./useChartViewport";
import { percentageLabel, dayCoordinate, plotSegments } from "./presentation";

export function NationalTrend({ series, range = series.range, interactive = true }: {
  readonly series: NationalSeries;
  readonly range?: DateBounds;
  readonly interactive?: boolean;
}) {
  const [compare, setCompare] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const id = useId();
  const appliedRows = useMemo(() => series.observations.filter((row) => (range.start === undefined || row.date >= range.start)
    && (range.end === undefined || row.date <= range.end)).sort((a, b) => a.date.localeCompare(b.date)), [series.observations, range.start, range.end]);
  const full = useMemo(() => resolveChartWindow(range, appliedRows), [range.start, range.end, appliedRows]);
  const viewport = useChartViewport(full, range, interactive);
  const window = viewport.window;
  const rows = useMemo(() => window ? appliedRows.filter((row) => row.date >= window.start && row.date <= window.end) : [], [appliedRows, window]);
  const calculated = useMemo(() => plotSegments(appliedRows, "calculatedPercentage"), [appliedRows]);
  const reported = useMemo(() => plotSegments(appliedRows, "reportedPercentage"), [appliedRows]);
  const scale = useMemo(() => {
    const points = [...plotSegments(appliedRows, "calculatedPercentage").flat(), ...(compare ? plotSegments(appliedRows, "reportedPercentage").flat() : [])];
    return { max: Math.max(1, ...points.map((point) => point.value)), min: Math.min(0, ...points.map((point) => point.value)) };
  }, [appliedRows, compare]);
  const { min, max } = scale;
  const startDate = window?.start ?? "";
  const endDate = window?.end ?? "";
  const start = dayCoordinate(startDate);
  const span = Math.max(1, dayCoordinate(endDate) - start);
  const projectionRef = useRef<SVGGElement>(null);
  const origin = dayCoordinate(full?.start ?? "");
  const projectionStyle = {
    "--chart-x-scale": 810 / span,
    "--chart-x-offset": 60 - (start - origin) * 810 / span,
  } as CSSProperties;
  // Cancel presentation movement synchronously when input ownership changes.
  // Reset remains animated even with Zoom mode off; no data state waits on CSS.
  useLayoutEffect(() => {
    const projection = projectionRef.current;
    if (projection) {
      projection.style.transitionProperty = "none";
      getComputedStyle(projection).getPropertyValue("--chart-x-scale");
      projection.style.removeProperty("transition-property");
    }
  }, [viewport.enabled, interactive]);
  const x = (date: string) => 60 + (dayCoordinate(date) - start) / span * 810;
  // Once an inspected day leaves the window, returning to it must not revive it.
  if (selected !== null && !rows.some((row) => row.date === selected)) setSelected(null);
  const y = (value: number) => 250 - (value - min) / (max - min) * 185;
  const active = rows.find((row) => row.date === selected);
  return <Surface>
    <PanelHeader title="Daily fleet capacity offline" description="Daily share of EIA-reported nuclear capacity out of service" actions={<label className="flex items-center gap-2 text-[12px]"><Checkbox disabled={!interactive} checked={compare} onChange={(event) => { setCompare(event.currentTarget.checked); }} />Compare EIA reported %</label>} />
    <div className="p-[18px]">
      <div className="mb-4">
        <ChartZoomControls enabled={viewport.enabled} rangeLabel={window ? `${window.start} to ${window.end}` : "Unavailable"}
          canZoomIn={viewport.canZoomIn} canZoomOut={viewport.canZoomOut} interactive={viewport.available}
          onEnabledChange={viewport.setEnabled} onZoomIn={viewport.zoomIn} onZoomOut={viewport.zoomOut} onReset={viewport.reset} />
      </div>
      {!window && <EmptyState title="No observations in this chart range" />}
      {window && <>
      <div className="relative">
      <div ref={viewport.regionRef} role="region" aria-label="National trend: scrollable chart" tabIndex={interactive ? 0 : -1} className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">
      <svg ref={viewport.svgRef} style={{ touchAction: viewport.enabled && interactive ? "pan-y pinch-zoom" : "auto" }} role="img" aria-labelledby={id} viewBox="0 0 920 300" className="block w-full min-w-[920px] animate-chart-wipe" data-chart="national-trend">
        <title id={id}>National offline capacity trend. Missing observations remain gaps; exact values are in the Daily observations table.</title>
        {[0, 1, 2, 3].map((index) => {
          const value = min + (max - min) * index / 3;
          return <g key={index}><line x1="60" x2="870" y1={y(value)} y2={y(value)} stroke="#dce3e7" /><text x="48" y={y(value) + 4} textAnchor="end" fontSize="11" fill="#5f707a">{value.toFixed(1)}%</text></g>;
        })}
        <defs><clipPath id={`${id}-plot`}><rect x="56" y="61" width="818" height="193" /></clipPath></defs>
        <g clipPath={`url(#${id}-plot)`}>
          <g key={`${range.start ?? ""}:${range.end ?? ""}:${full?.start ?? ""}:${full?.end ?? ""}:${series.provenance.snapshotId}`} ref={projectionRef}
            className="motion-chart-viewport" data-interactive={interactive} style={projectionStyle}>
            {([calculated, ...(compare ? [reported] : [])]).map((segments, seriesIndex) => <g key={seriesIndex}
              className={seriesIndex === 1 ? "animate-fade-in" : undefined} fill="none"
              stroke={seriesIndex === 0 ? "#087d82" : "#246b9e"} strokeWidth="2"
              data-series={seriesIndex === 0 ? "calculated" : "reported"}>
              {segments.map((segment, index) => <g key={index}>
                <polyline className="chart-projected-line" vectorEffect="non-scaling-stroke" data-segment="observed"
                  points={segment.map((point) => `${String(dayCoordinate(point.date) - origin)},${String(y(point.value))}`).join(" ")} />
                {segment.filter((point) => point.date >= startDate && point.date <= endDate).map((point) => <circle
                  key={point.date} className="chart-projected-point" style={{ "--chart-day": dayCoordinate(point.date) - origin } as CSSProperties}
                  cx={x(point.date)} cy={y(point.value)} r="4" fill="white"
                  onMouseEnter={() => { if (interactive) setSelected(point.date); }}>
                  <title>{point.date}: {seriesIndex === 0 ? "Calculated" : "EIA reported"} {point.label}</title>
                </circle>)}
              </g>)}
            </g>)}
          </g>
        </g>
        <text x="60" y="285" fontSize="11" fill="#5f707a">{startDate}</text><text x="870" y="285" textAnchor="end" fontSize="11" fill="#5f707a">{endDate}</text>
      </svg>
      </div>
      {rows.length === 0 && <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-5 text-center text-[14px] font-semibold">
        <span className="rounded bg-surface px-2 py-1">No observations in this chart range</span>
      </p>}
      </div>
      <p className="text-[11px] text-text-muted">Calculated offline %{compare && " · EIA reported %"} · Observation unavailable: a gap, never zero. Plot coordinates are approximate; labels preserve supplied decimal precision.</p>
      <label className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">Inspect observation
        <select disabled={!interactive} className="rounded border border-border bg-surface p-2" value={selected ?? ""} onChange={(event) => { setSelected(event.currentTarget.value); }}><option value="">Select date</option>{rows.map((row) => <option key={row.date} value={row.date}>{row.date}</option>)}</select>
      </label>
      {active && <div role="status" className="animate-fade-rise mt-2 rounded bg-sidebar p-3 text-[12px] text-white"><strong>{active.date}</strong><p>Calculated offline: {percentageLabel(active.status === "available" ? active.calculatedPercentage : null)}</p>{compare && <p>EIA reported: {percentageLabel(active.status === "available" ? active.reportedPercentage : null)}</p>}<p>Offline capacity: {active.status === "available" && active.outageMw ? `${active.outageMw.display} MW` : "Unavailable"}</p><p>Fleet capacity: {active.status === "available" && active.capacityMw ? `${active.capacityMw.display} MW` : "Unavailable"}</p></div>}
      </>}
    </div>
  </Surface>;
}
