# Explorer fixture feature — T4.E1–T4.EC

Recorded October 4, 2026. Prerequisite **T3.E** was accepted by the
coordinator. E1 received coordinator source review before E2 started. E2 and
E3 each passed scoped ESLint and integrated TypeScript before their successors.
The complete lane is ready for coordinator checkpoint review; this worker
record does not mark task checkboxes or claim final visual/live acceptance.

Trace: FR1, FR5–FR9, FR11, FR16–FR19, FR21; TR2, TR4, TR6–TR10;
AC6–AC9, AC11, AC16, AC17, AC19, AC21 (fixture portions).

## Public composition contract

`src/features/explorer/index.ts` exports `ExplorerFeature`, its props and
`ExplorerOperations`. The entry accepts the common `SessionRuntime` and injected
`CatalogOperations & PreviewOperations`. `onNavigate` emits an in-memory
`NavigationIntent`; optional `intent` accepts an Overview handoff. Both paths
check the current session generation and authorized catalog. They neither
execute SQL nor encode SQL in URLs. Optional `now` and `initialPageSize` permit
controlled fixture lifecycle tests; ordinary preview size defaults to 100 and
validation rejects sizes outside 1–500.

Shared templates, organisms and molecules remain domain-free. The Explorer
controller owns selection, schema, cursor continuation, original snapshot/expiry,
cached previous pages and explicit recovery. Transport decoding and authoritative
authorization remain adapter/backend responsibilities. There are no routes or
live adapters in this lane. Product exports do not import stories or fixtures.

## Fixture behavior evidence

Actual commands on the final lane source:

```sh
npx vitest run src/features/explorer/explorer.test.tsx
npx eslint src/features/explorer
npx tsc --noEmit
```

Results: **17 tests passed**, scoped ESLint passed and integrated TypeScript
passed. These tests assert observable state, rendered UI and exact fixture call
inputs. They establish synthetic controller behavior, not backend enforcement.
Tested source digest: `0238bc1e6a8854180ccca9c2c43770ceb8790dc13e4b2ad0e68d7969ce3f2a5b`
(SHA-256 of sorted `src/features/explorer/*` relative path, NUL, file bytes, NUL).

- Viewer catalog/schema/facility choices stay national-only; unlisted selection
  never dispatches a schema request. Coverage comes from returned metadata.
- Default size 100; valid leap calendars, invalid dates/order/coverage,
  unauthorized facility IDs and invalid sizes are checked before dispatch.
- Dataset/filter/size changes remove prior rows/cursors and start a new sequence.
  Identifiers `0012` and `G-01` remain strings; supplied decimal/null/zero cells
  pass through the shared positional table unchanged.
- Delayed schema/preview successes, forbidden/unauthenticated failures and
  unexpected rejections from old selections/sessions cannot restore data or
  invalidate the new identity. Pending sessions dispatch no protected calls.
- Current forbidden responses clear all catalog/schema/selection/rows. Current
  unauthenticated responses invalidate the shared runtime. Unexpected rejection
  text is replaced with a safe recovery message, without automatic retries.
- Publication during continuation retains the original snapshot and expiry.
  Cached previous/next revisits dispatch no cursor request. Original expiry
  removes every cached row and offers explicit restart; continuation never
  extends it. Mismatched continuation expiry is rejected.
- UI tests cover Preview/Schema tabs, invalid-date feedback, SQL intent, logout
  removal and distinct empty versus unavailable states.

Representative request trace asserted in the publication/cache test:

| User action | Synthetic operation and invariant |
| --- | --- |
| Load catalog | `listDatasets` under captured authenticated generation |
| Initial selection | `readSchema({datasetId})`; `startPreview({datasetId, filters: {}, pageSize: 1})` |
| Publish new fixture snapshot | No client request; fixture publication changes new sequences only |
| Next | One `continuePreview({sequence: first.sequence, cursor: first.nextCursor})` |
| Previous → Next | Cached rows, no additional continuation call |
| Restart | Second `startPreview`; new snapshot, new original expiry |

Another trace advances the injected clock to 14 minutes, continues, then advances
to the original 15-minute deadline. Cached previous is refused, rows disappear,
and `startPreview` stays at one until explicit restart makes it two. A separate
trace observes one SQL selection intent and **zero** `executeQuery` calls.

## V3 design mapping and stories

Inspected saved published-prototype references before visual choices:
[desktop preview](../evidence/datasets-preview-desktop.png),
[desktop schema](../evidence/datasets-schema-desktop.png) and
[390px Explorer](../evidence/datasets-mobile.png). They establish V3/O3 layout
and the C2/C3/C7/C10 corrections, rather than editable Figma node fidelity.

The feature reuses the accepted ExplorerTemplate master-detail columns and
stacking, light catalog/detail surfaces, grain/coverage header, Preview/Schema
tabs, filters, positional table and SQL action. Accessible shared font/label
extensions carry forward. Coverage dates display the supplied calendar strings.
Rows-per-page input and required failure/expiry regions are behavioral extensions.
Cursor pagination deliberately omits prototype totals and numbered jumps.
Schema displays the authorized type/unit/nullability metadata supplied by the
contract; no invented description field is added.

Runnable Storybook IDs:

- `features-explorer--analyst`: all permitted grains, cursor size 1, synthetic
  publication and session invalidation controls; Schema tab is interactive.
- `features-explorer--viewer`: national-only selection/schema/filter scenario.
- `features-explorer--loading`, `features-explorer--empty`,
  `features-explorer--unavailable`, `features-explorer--denied`,
  `features-explorer--expired`: explicit required state extensions.

Every story uses the test-only FixtureProvider and visibly labels synthetic
data/session choices. Size 1 exercises fixture cursor behavior; it is not a
production default. The worker did not claim screenshot comparisons or run a
browser here: the coordinator owns serialized Storybook/build/browser verification
and will record resulting screenshots and render observations separately.

## Remaining acceptance

Coordinator integration, production reachability/build and browser rendering
review are pending at this worker handoff. Phase 5 composed feature/session/intents
harness and Phase 6 page assembly remain downstream gates. Live catalog/filter
authorization, direct denied continuation, snapshot publication and expiry require
versioned backend/session agreement and real integration evidence (Q2). Q4 gates
final visual/browser acceptance. No fixture scenario establishes those live passes.

## Coordinator acceptance

Accepted fixture checkpoint after source review and integrated verification: 
123 Vitest tests, 31 boundary tests, 6 Chromium tests and 16 reviewed captures;
type/lint, fresh production/Storybook builds and emitted fixture exclusion passed.
The final [Phase 4 record](phase-4.md) and [manifest](phase-4-digests.json)
supersede worker-handoff pending integration/visual statements above. Live and
final browser-matrix acceptance remain unresolved as documented.
