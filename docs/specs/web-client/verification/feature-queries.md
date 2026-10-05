# Queries fixture checkpoint — T4.Q1–T4.QC

Recorded October 4, 2026. **Source and fixture behavior ready for coordinator
review; visual/browser checkpoint acceptance pending.** Live integration and
release acceptance remain unverified. Predecessor: accepted T3.Q readiness.

Base revision: `d85410486de5055237a4f66cde197250555e9bd8`.
Queries source digest (sorted paths, NUL, content, NUL):
`531eb0fd94c2d8f0b85d664a81548619d0c7ab3501cebc8006818687734b3e08`.
This covers all files in `src/features/queries/`, including stories/tests.
Coordinator owns integrated source binding and checkpoint acceptance.

## Public composition seam

`QueriesFeature` and `QueriesFeatureProps` are the only public exports. Inject
one shared `SessionRuntime`, catalog/query/navigation operations, positive
`initialPageSize` and `maximumPageSize`; optional `now` supports deterministic
expiry checks. An optional generation-bound `intent` proposes unsent SQL.
Runtime feature exports import no synthetic data, stories or live adapters.
No route, transport, package/configuration or shared-contract change was made.

Safe session rendering hides all protected content while pending, expired or
unauthenticated. Generation cleanup removes drafts, results, metadata and
pending/context handoffs; late outcomes cannot restore them. Local lifetime
abort guards unmounted metadata in addition to shared generation guards.

The browser searches returned authorized datasets and displays supplied table
names and ordered schema labels/types. Column labels/IDs are not authoritative
SQL identifiers, so insertion/autocomplete is deliberately absent. Backend SQL
validation remains authoritative; this client does not parse/rewrite SQL.

## Actual scoped checks

Commands run against the final source above:

- `npx vitest run src/features/queries/queries.test.tsx`: **13 passed**.
- `npx eslint src/features/queries`: passed.
- `npx tsc --noEmit`: passed on the integrated checkout at that time.

Synthetic settings: initial page size 2, maximum 100, result lifetime 60 seconds.
These are test choices, **not approved live defaults or TTL**.

The observable trace test uses the unchanged statement
`  WITH x AS (SELECT * FROM synthetic_national)\nSELECT * FROM x;\n`.
Its first execute input is exactly `{ sql, page: 1, pageSize: 2 }`. After editing
the draft and selecting size 3 for the next execution, page requests are
`{ queryId: first.execution.queryId, page: 2, pageSize: 2 }` and the corresponding
page 1 request, with no SQL argument. Focus/online events add no execution.
At original expiry, results clear with `result-expired`; no page-1 reset or
execute occurs. A deliberate Run then submits the edited statement at size 3
and returns a distinct execution ID.

Current forbidden schema/query responses clear metadata and handoff context,
including pending metadata publication. Superseding catalog/schema requests
abort their local publication context, so obsolete same-session denial cannot
erase current metadata or invalidate the shared session. A regression proves
these paths.

Other assertions cover lost results, unknown response, busy, deadline,
unsupported SQL, unavailable data, obsolete schema selection, disposed catalog
responses, old-session success and unauthenticated error, national-only Viewer
metadata, edited-draft consent and stale handoffs. Positional DOM assertions
preserve duplicate column labels/rows, large exact numeric display values,
`00A7`, missing cells and literal script-looking text. Truncation remains visible
on the short final retained page. Repeated Ctrl+Enter activates only one execute.

Trace: FR6, FR11–FR19, FR21; TR2, TR5–TR6, TR8–TR10;
fixture portions of AC6, AC11–AC17, AC19, AC21.

## Design mapping and pending comparison

Inspected saved published-prototype references: V4 desktop ready/results and
390×1100 mobile (`evidence/sql-ready-desktop.png`, `sql-results-desktop.png`,
`sql-mobile.png`). Implementation uses accepted WorkspaceTemplate, atoms,
StatusMessage, positional DataTable and numbered PaginationControls. The editor
preserves the dark toolbar/editor hierarchy, Copy/Run and textarea/line numbers;
vertical scrolling keeps the line-number gutter synchronized.

Stories are visibly labeled by FixtureProvider as invented test data and
synthetic session/SQL settings. IDs:
`features-queries--ready`, `--results-and-duplicates`,
`--short-truncated-page`, `--unknown-outcome`, `--busy`, `--timeout`,
`--result-expired`, `--result-lost`, `--denied`, `--unavailable`,
`--service-failure`, `--empty`. Result/error stories use explicit story-only Run
interactions; product entry never executes on mount or intent receipt.

Required C4/C5/C7/C10 corrections add arbitrary projection, fixed retained
pagination, typed status/recovery and single-submit shortcut. Readable schema
reference and page-size controls are functional extensions. Context notice
states supplied filters do not constrain the prepared SQL. Submitted SQL is
inspectable separately from edited draft. Q3 settings are supplied by composition.

**No feature screenshots or browser comparison have been produced by this
lane.** Coordinator will record desktop/mobile captures and breakpoint checks
at 1000/760/480, loaded-font/keyboard/overflow evidence and concrete differences.
Reference inspection and passing RTL checks are not V4 fidelity acceptance.

## Remaining gates

Coordinator integrated build/import/emitted-fixture checks and actual browser
comparison are outstanding for this checkpoint record. Q2/Q3 live routes,
transport, encoding/errors, authorization, settings/expiry/delivery and real
request traces remain unresolved; Q4 final viewport/browser sign-off remains
open. Fixture tests prove frontend orchestration, not Flask SQL security or real
Cognito/session transport. Queries contributes its public seam to Phase 5 only
after coordinator checkpoint acceptance. Product pages remain later gated work.

## Coordinator acceptance

Accepted fixture checkpoint after source review and integrated verification: 
123 Vitest tests, 31 boundary tests, 6 Chromium tests and 16 reviewed captures;
type/lint, fresh production/Storybook builds and emitted fixture exclusion passed.
The final [Phase 4 record](phase-4.md) and [manifest](phase-4-digests.json)
supersede worker-handoff pending integration/visual statements above. Live and
final browser-matrix acceptance remain unresolved as documented.
