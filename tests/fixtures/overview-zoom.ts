import type { NationalObservation, NationalSeries } from "../../src/contracts/observations";

/** Invented daily values for interaction checks; never EIA evidence or findings. */
export function syntheticZoomSeries(years: 1 | 2 = 1): NationalSeries {
  const start = years === 1 ? "2026-01-01" : "2025-01-01";
  const end = "2026-12-31";
  const observations: NationalObservation[] = [];
  for (let time = Date.parse(`${start}T00:00:00Z`), index = 0; time <= Date.parse(`${end}T00:00:00Z`); time += 86_400_000, index += 1) {
    const date = new Date(time).toISOString().slice(0, 10);
    // An omitted month supplies a genuinely empty window; single-day omission
    // and explicit unavailable/null values exercise distinct gap semantics.
    if (date.startsWith("2026-07") || date === "2026-06-12") continue;
    if (date === "2026-06-10") {
      observations.push({ status: "unavailable", date });
      continue;
    }
    const value = String(2 + index % 15);
    const percentage = date === "2026-06-11" ? { exact: "0", display: "0.00" }
      : date === "2026-06-09" ? { exact: "1.005", display: "1.01" }
      : { exact: value, display: `${value}.00` };
    observations.push({
      status: "available", date,
      capacityMw: { exact: "100000", display: "100000.00" },
      outageMw: { exact: String(Number(percentage.exact) * 1000), display: (Number(percentage.exact) * 1000).toFixed(2) },
      calculatedPercentage: date === "2026-06-13" ? null : percentage,
      reportedPercentage: date === "2026-06-14" ? null : percentage,
    });
  }
  return {
    range: { start, end }, coverage: { status: "available", range: { start, end } },
    provenance: { source: "Synthetic zoom fixture, not EIA observations", snapshotId: `synthetic-zoom-${String(years)}` },
    observations,
  };
}
