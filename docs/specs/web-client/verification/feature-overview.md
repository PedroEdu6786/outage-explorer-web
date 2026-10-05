# Overview fixture checkpoint — T4.O1–T4.OC

Recorded October 4, 2026. Predecessor T3.O accepted. Implementation trace:
FR10, FR11, FR16, FR17, FR18–FR21; TR2, TR6, TR8, TR10;
AC10, AC11, AC16, AC17, AC19–AC21. Root owns this lane.

`src/features/overview/index.ts` exports OverviewFeature and its props/operations.
The entry takes injected CatalogOperations/ObservationOperations, the shared
SessionRuntime and an optional generation-bound NavigationIntent callback.
It establishes a provider for that same runtime; no sibling feature imports,
credentials, URLs, fixtures or HTTP transport exist in its production graph.

Catalog metadata supplies the national dataset, coverage and initial range.
Backend capabilities bound visible metadata and national-series requests.
Calendar validation rejects impossible, reversed and out-of-coverage dates.
Changing a range immediately clears old observations and aborts their publication;
selection version and runtime generation guard both successes and failures.
Synchronous request abortion on date edits also guards shared unauthenticated
invalidation before React effect cleanup; a dedicated regression proves this.
Logout/access changes clear metadata, values and inspection state.

Exact/display decimal pairs are preserved throughout. Card/table/SVG point titles
and keyboard observation inspection consume authoritative display strings;
Number conversion is limited to plotted coordinates and approximate axis ticks.
No national percentage is recalculated or averaged. Latest returned date supplies
cards, including unavailable values, without silently choosing an older valid day.
Explicit/omitted dates and null values break chart segments; zero is a measured
point. Comparison is a labeled native checkbox. D3 readability extension keeps SVG at least 920 CSS pixels
inside a named keyboard-scrollable region on narrow screens. All returned observations have an
accessible positional table with both percentages and MW. A keyboard select
provides exact tooltip-equivalent inspection. No mismatch flags/findings exist.

Actual scoped `npx vitest run src/features/overview/overview.test.tsx` assertions
**10 tests passed**, covering half-up tie 1.005→supplied 1.01 in card/table values, zero/null distinction,
calendar dates, explicit/omitted gaps, keyboard compare/inspection, out-of-order
ranges and authorized intent, rejected retained callbacks after session/selection changes, coverage bounds, denied capability and late logout
responses. Scoped ESLint and TypeScript passed. Final integrated counts and
revision/digest/build binding will be recorded in phase-4.md.

Visual mapping: V2/O2, A1–A3/M1–M2/O1/T1; references overview-desktop.png and
accepted OverviewTemplate. Three cards, bounded SVG trend and observations panel
preserve source hierarchy. C2/C6/C7/C10 replace static samples/rounding/control
behavior; D3 extends chart with full table and keyboard inspection. Both percent
labels require two decimals from adapters. Text and keyboard control extensions
remain explicit, without a live precision calculation claim.

Stories `features-overview--ready/loading/empty/unavailable/denied` visibly label
invented observations. The ready example includes decimal ties, missing date,
valid zero and null. Browser capture/comparison evidence follows in phase-4.md;
this checkpoint does not claim final visual sign-off. Live series, authorization,
exact-value encoding and navigation integration remain Q2/Q3-gated. Product page
assembly and composed fixture harness remain later phases.

## Coordinator acceptance

Accepted fixture checkpoint after source review and integrated verification: 
123 Vitest tests, 31 boundary tests, 6 Chromium tests and 16 reviewed captures;
type/lint, fresh production/Storybook builds and emitted fixture exclusion passed.
The final [Phase 4 record](phase-4.md) and [manifest](phase-4-digests.json)
supersede worker-handoff pending integration/visual statements above. Live and
final browser-matrix acceptance remain unresolved as documented.
