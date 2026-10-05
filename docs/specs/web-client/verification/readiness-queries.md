# Queries lane readiness — T3.Q

Recorded October 4, 2026. Accepted predecessors: **T1.C, T3.1, T3.2,
T3.4, T3.5, T3.8**. Trace: FR12, FR13, FR15, FR17, FR19, FR21, TR8,
AC15, AC17, AC19. Coordinator accepted shared source/behavior/browser evidence.
This gate enables Phase 4 fixture work; it implements no query feature or route.

## Accepted presentation and evidence

- `SearchField` takes label, controlled text and `onValueChange`; caller owns
  authorized search results. Native `Textarea` preserves unchanged draft text.
  `Button` provides explicit Run; copying and the single-submit shortcut remain
  query feature responsibilities.
- `StatusMessage` supplies explicit announcements, pending and recovery actions
  outside live text; tones grant no authority. `PanelHeader`/`Surface` compose
  panels. `DataTable` preserves positional columns/rows, duplicate labels/rows,
  supplied decimal text, source strings and missing-versus-zero semantics.
- `PaginationControls` receives supplied numbered page actions/current state
  and previous/next callbacks. It does no execution or page arithmetic.
- `WorkspaceTemplate` takes `heading`, `browser`, `workspace` slots, using
  250px/220px/stacked source columns. `AppShell` excludes protected children
  and accessory while caller navigation is pending.

Stories: `molecules-fields--schema-search`,
`molecules-displays--status-states`,
`molecules-paginationcontrols--numbered-actions`,
`organisms-data-table--duplicate-columns-and-rows`,
`templates-analytical--workspace`. Saved
[desktop](../evidence/phase-3/workspace-template-1440.png)/
[narrow](../evidence/phase-3/workspace-template-390.png) template and
[duplicate-table](../evidence/phase-3/table-duplicates-390.png) captures are
shared synthetic specimens, not an implemented SQL editor or live results.

Actual checks: fields/pagination **6**, displays **3**, positional table **3**
behavior tests passed; scoped ESLint/TypeScript passed. Coordinator accepted
final **21 Chromium tests / 32 captures**, covering search association,
explicit pagination, duplicate projections, literal text safety, keyboard
overflow, pending exclusion and inclusive source breakpoints. No green checks
were rerun by this documentation task. [Phase 1](phase-1.md) and
[Phase 2](phase-2.md) bind prior prerequisites. Final coordinator evidence:
**67 Vitest / 31 boundary / 21 Chromium tests**, **43 source modules / 49
emitted files** passed. The [Phase 3 checkpoint](phase-3.md) and
[digest manifest](phase-3-digests.json) record 101 source files, aggregate
`1cd07f99e3b23abdaad48d16b39da2b8d1a20138f75a797cc4d718fcd90ab65a`,
build `Sji_VuXxa0ZrIyXlh3U4-`. Readiness prose adds no runtime change.

## Existing execution and adversarial fixture seam

`QueryOperations.executeQuery` receives unchanged SQL, positive page and size.
`readQueryPage` receives only query ID/page/fixed size and prohibits `sql`.
Returned execution owns query ID, snapshot, expiry, retained row count and
whole-execution truncation. Retained count is not total source matches.

An existing synthetic paging example is:

```ts
const fixture = createFixtureOperations({ persona: "viewer" });
const runtime = createSessionRuntime();
runtime.setResolution(fixture.sessionResolution());
const context = runtime.capture();
const result = await fixture.operations.executeQuery(context, {
  sql: "SELECT * FROM synthetic_national", page: 1, pageSize: 2,
});
if (result.ok) {
  await fixture.operations.readQueryPage(context, {
    queryId: result.value.execution.queryId,
    page: 2, pageSize: result.value.execution.pageSize,
  });
}
```

These are direct seam demonstrations, not a controller or implicit execution
policy. Fixture `callLog.read()` records execute/page inputs and outcomes;
assert one execute across edit, paging, focus/reconnect until explicit rerun.
`failNextExecution({ kind: "unknown-execution-outcome", message: ... })`
models an execution that may exist although no ID reached the caller.
`loseResults()`, controlled `now`, `failNext`, `deferNext` and
`setDataState("truncated")` cover loss/expiry, busy/timeout/failure, races and
short truncated pages. Arbitrary synthetic projection includes duplicate labels
and rows, `9007199254740993`, a large decimal and literal script-looking text.

Synthetic size 2, maximum 100 and 60-second result TTL are test choices, never
approved live defaults. The fixture checks preselected `queryDatasetIds`, not
SQL parsing/security. Viewer catalog/schema contain national metadata only.
Generation guards and registered cleanup remain mandatory; feature-owned
draft/submission/execution/selection state is still to be implemented.

## Schema and handoff constraints

`DatasetSummary.sqlName` is explicit table metadata. Schema columns currently
provide display labels, positional IDs and SQL types, **not authoritative SQL
column identifiers**. Search/display/editor requirements can proceed. Do not
derive insertion/autocomplete SQL from these labels/IDs; any such optional
feature requires an explicit contract amendment, fixture update and consumer
revalidation. This is no blocker for required schema browsing.

`consumeNavigationIntent` returns authorized dataset/filter context and an
unsent `proposedDraft`. Its fixture draft is `SELECT * FROM <sqlName>` and does
not apply filter predicates. Preserve supplied context separately; never claim
filters constrain that SQL or execute it on receipt. An edited draft requires
explicit replacement consent. `guardCurrent` guards the handoff generation.

T4.Q1–T4.QC must still prove complete execute/paging call traces, unchanged
submission, single shortcut activation, expiry/loss/unknown-outcome recovery and
safe draft replacement. Q2/Q3 live contracts/settings and Q4 final browser
acceptance remain unresolved. No fixture proves backend SQL authorization,
live transport, completed V4 fidelity or release readiness.
