# Explorer lane readiness — T3.E

Recorded October 4, 2026. Accepted predecessors: **T1.C, T3.1, T3.2,
T3.3, T3.4, T3.5, T3.8**. Trace: FR7, FR8, FR9, FR17, FR19, FR21,
TR8, AC7, AC8, AC9, AC17, AC19. Coordinator review accepted these shared
prerequisites; this record permits the Phase 4 fixture lane without implementing
an Explorer controller or product route.

## Accepted presentation and evidence

- `DateRangeField` accepts calendar strings, change callbacks, supplied errors
  and optional input constraints. `FormField` associates labels/help/errors;
  native `Select` can present the caller's authorized facility options.
- `Tabs` accepts document-unique item IDs, labels/content, selected ID and
  selection callback. It owns tab/panel relations and keyboard navigation.
- `PaginationControls` accepts label/summary and supplied previous/next actions
  with disabled states. Explorer omits numbered `pages`; the molecule neither
  infers totals nor owns a cursor lifecycle.
- `DataTable` accepts the existing positional `TableData` and required caption.
  `StatusMessage`, `EmptyState`, `PanelHeader`, `Surface` and `Button` supply
  reusable pending/error/recovery presentation without data or permissions.
- `ExplorerTemplate` takes `heading`, `catalog`, `detail` slots. It uses
  275px/220px/stacked source columns. `AppShell` excludes protected slots while
  caller navigation is pending and uses supplied destinations/identity/coverage.

Stories: `molecules-fields--date-filters`,
`molecules-navigation--dataset-details`,
`molecules-paginationcontrols--continuation-actions`,
`organisms-data-table--typed-values`, `templates-analytical--explorer`.
[Desktop](../evidence/phase-3/explorer-template-1440.png) and
[narrow](../evidence/phase-3/explorer-template-390.png) captures show template
slots; [table](../evidence/phase-3/table-390.png) and
[tabs](../evidence/phase-3/tabs-390.png) show shared presentation only.
Snapshot-driven preview behavior remains Phase 4 work.

Actual checks: fields/pagination **6**, display **3**, navigation **3**, table
**3** behavior tests passed; scoped ESLint and TypeScript passed. Coordinator
accepted final **21 Chromium tests / 32 captures**, including label/tab/focus
relations, keyboard table overflow, supplied-only pagination, modal background
exclusion and exact inclusive 480/760/1000px boundaries. This documentation task
did not rerun green checks. Prior prerequisites are bound in
[Phase 1](phase-1.md)/[Phase 2](phase-2.md). Final coordinator checks passed:
**67 Vitest / 31 boundary / 21 Chromium tests**, **43 source modules / 49
emitted files**. The [Phase 3 checkpoint](phase-3.md) and
[digest manifest](phase-3-digests.json) record 101 source files, aggregate
`1cd07f99e3b23abdaad48d16b39da2b8d1a20138f75a797cc4d718fcd90ab65a`,
build `Sji_VuXxa0ZrIyXlh3U4-`. Readiness prose adds no runtime change.

## Existing catalog, preview and fixture seam

`CatalogOperations` supplies authorized dataset summaries and ordered schema.
Dataset IDs are opaque; `sqlName`, filters and coverage are separate metadata.
`PreviewOperations` separates `startPreview(selection)` from
`continuePreview({ sequence, cursor })`. Selection contains dataset, filters
and page size; returned sequence fixes snapshot and original expiry.
`nextCursor: null` means no continuation, not an invented total.

An existing synthetic continuation example is:

```ts
const fixture = createFixtureOperations({ persona: "viewer" });
const runtime = createSessionRuntime();
runtime.setResolution(fixture.sessionResolution());
const context = runtime.capture();
const first = await fixture.operations.startPreview(context, {
  datasetId: "synthetic-national", filters: {}, pageSize: 1,
});
if (first.ok && first.value.nextCursor !== null) {
  await fixture.operations.continuePreview(context, {
    sequence: first.value.sequence, cursor: first.value.nextCursor,
  });
}
```

Page size 1 deliberately exercises the three-row fixture; production preview
requirements remain default 100 / initial maximum 500. Fixtures use original
15-minute preview expiry. Inject controlled `now` to test expiry;
`publishSnapshot()` changes new sequences while old continuations retain their
snapshot. `setDataState`, `failNext`, `deferNext` and `callLog.read()` expose
empty/unavailable/failure/race behavior and exact request inputs. Viewer catalog
and schema omit detail grains; Analyst fixtures preserve IDs `0012`, `A07` and
`G-01`. Fixture authorization is synthetic, not backend enforcement.

All publication needs shared runtime generation/cleanup and feature-owned
selection guards. Direct fixture `setPersona` requires a new runtime resolution;
`FixtureProvider`'s helper updates both. The SQL action emits a generation-bound
authorized `NavigationIntent`; it does not call execute or put SQL in a URL.

## Remaining feature and live work

T4.E1–T4.EC still implement sequence resets, cached previous-page rules,
calendar validation, dynamic metadata, expiry/restart and stale outcome handling.
Fixture range validation checks shape/order only; shared fields own no policy.
No live route, transport, payload or backend environment is inferred. Q2/Q3 live
agreement and Q4 final browser acceptance remain open; saved shared specimens
do not establish finished V3 fidelity or release acceptance.
