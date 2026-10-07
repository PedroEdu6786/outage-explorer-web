# National metric contract

Data API v1; [source snapshots and provenance](data-api.md). Frontend adapter registered; named-target live acceptance pending.
See [current status](../../../development/current-status.md).

The prepared metric is part of **`national`**, available through national preview
and authorized SQL. There is no separate metric dataset or endpoint. The source
HTTP reference records this as a backend-side user decision; the frontend
`readNationalSeries` operation now assembles the complete authorized series
from cursor previews; named-target live acceptance remains open.

| National column | Meaning / client treatment |
| --- | --- |
| `period` | Calendar date; no timezone shift |
| `capacity_mw`, `outage_mw` | Same-observation exact decimal(38,12) text |
| `reported_percentage` | EIA source percentage, exact decimal(38,12) text |
| `calculated_percentage_rounded` | Backend-calculated decimal(38,2) percentage |
| `percentage_numerator`, `percentage_denominator` | Exact calculated percentage as fraction strings |
| `calculated_percentage_display`, `reported_percentage_display` | Backend two-decimal percentage display strings; supplied examples omit `%` |

The synthetic example has capacity `3000.000000000000`, outage
`100.000000000000`, exact calculated fraction `10 / 3`, rounded/display `3.33`.
That fraction is a percentage, not a raw capacity ratio. Do not present the
rounded `3.33` as its exact mathematical value or recalculate display through
floating point. Preserve source-reported and calculated percentages separately.

The frontend now has a rational percentage model alongside legacy decimal
fixtures. Numerator, denominator, rounded decimal and display remain separate;
only plot coordinates approximate the fraction. Backend display is authoritative.

Registered in configured production composition, with controlled HTTP evidence
and live acceptance still open: use national preview with
the requested range, follow cursor pages on the same generation until complete,
then build the series in ascending calendar order for the existing chart.
Never show a single default 100-row page as a complete longer series. Abort on
range/session change and handle expiry explicitly rather than joining generations.
Do not create implicit SQL executions merely to populate Overview.

Coverage comes from catalog; generation comes from the preview sequence. The
wire response does not contain the frontend's `provenance.source` label, so any
static source label must be documented as application presentation, not a
server-returned field. Valid rows are non-nullable; absent observation dates
remain gaps/unavailable, never zero or interpolation. Preserve `0.00%` as valid.

The existing metric meaning, half-up display, same-observation comparison and
no-discrepancy-badge rules remain. Named-target endpoint/mapping acceptance remains pending.
