# ui-motion — Phase 2 verification (status and loading)

Recorded October 6, 2026. **Fixture/synthetic evidence only**: nothing here is
live-integration evidence, Figma-fidelity sign-off or motion visual sign-off
(a separate record, T4.26). Not committed; T2.33 (devlog) is left to the coordinator.

## Revision binding

- `git rev-parse HEAD`: `36936b12fb716efc0d93aad9f608c862cc8f253d` (phase 1 commit; phase 2 changes are uncommitted)
- Working-tree digest (verification.md method, 409 tracked+untracked files, taken
  after all edits except this record file): `12b235c06d06c30b4b9f78d9eb1d241516f99055fbbeb870d58fae047256ff68`
- Node 24.18.0, npm 11.16.0, `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`.
- Baseline: [baseline.md](baseline.md); phase 1: [phase-1.md](phase-1.md).

## Commands actually run against this tree

| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | pass — 28 files, 344 tests (phase 1: 27 / 316; +skeleton 5, +displays 4, +data-table 2, +fields/pagination 2, +overview 3, +explorer 7, +queries 5) |
| `npm run test:boundaries` | pass — 33 tests |
| `npm run check:boundaries` | pass — 107 modules, 15 production roots (Skeleton atom, TableSkeleton molecule import no upward layer) |
| `npm run build` (configured) → `npm run check:production-fixtures` | pass — 349 emitted files scanned (the count includes `.next/dev` files written by the pre-existing `next dev` on port 3000; not comparable to baseline) |
| `npm run build-storybook` | pass |
| `npm run test:e2e -- --workers=1` (motion off default; includes tests/motion) | **77 passed, 4 failed** — the same 4 baseline failures (features.spec 17/89/107, pages.spec 10). Phase 1 was 54 + 4; +23 new motion tests, 0 new failures |
| `npm run test:e2e -- tests/motion --workers=1` | pass — 39 tests (phase 1: 16; +23 in `status-loading.spec.ts`: 9 checks x2 preferences, 3 data-identical, 2 geometry) |
| `playwright.controlled.config.ts` (configured build) | pass — 4 tests |
| `git diff --exit-code package.json package-lock.json` | clean (AC6) |

Not run (phase 2 does not change them): `playwright.production.config.ts` (phase 1 gate only),
`playwright.auth.config.ts` and `playwright.development.config.ts` (need a live backend / the
user's dev server; unchanged since phase 1, which also did not run them).
`next-env.d.ts` churn from `typecheck`/`build` was restored with `git checkout` each time.
Existing loading-text assertions (T2.19) were re-grepped and all stayed green without edits.

## Acceptance criteria (phase 2 scope)

- **AC1** — new motion uses only tokens/utilities in `src/styles` (`--duration-appear`, `--animate-appear`, `motion-enter-settle`, `motion-shimmer`, existing `animate-fade-*`, `motion-stagger`, `motion-colors`); `tests/components/motion-guard.test.ts` passes (no ad-hoc `duration-`/`ease-`/`animate-[`, no `motion-reduce:`, one reduced rule), and `tokens.spec.ts` still passes.
- **AC2** — `tests/motion/status-loading.spec.ts` runs StatusMessage (fade-rise 0.26s vs 0.1s with `--motion-rise` 4px vs 0, icon fade-in, success `fade-rise, settle`), Spinner fade (0.15s vs 0.1s, ring `spinner` vs `none`), EmptyState stagger (delay 0.05s/0.1s vs 0s), pagination current-page color crossfade (0.12s vs 0.06s), DateRangeField validation color (nudge only without reduce), DataTable dim (opacity 0.6, 0.12s vs 0.06s), MetricValue fade-in; skeletons assert `animation-name: none`, no running animations, no text, no shimmer under both preferences.
- **AC3** — metric/table cell text is identical with motion on and off for Overview Ready, Explorer Analyst and the Queries retained page; skeletons never render text (spec) and never zero/"Unavailable" (RTL: Overview first load and range change, MetricValue); DataTable `loading` leaves `tbody` HTML byte-identical (RTL); gaps (`—`) and zero preserved.
- **AC4** — one live region per message: StatusMessage RTL test (pending → success → warning) and the Playwright status count; Overview banner announced once; banners keep role/text; skeletons `aria-hidden`; focus/keyboard (pagination Space, table scroll region) unchanged; all existing tests green.
- **AC5 (Explorer/SQL)** — RTL: Explorer `next()` in flight, then logout, expiry (`invalidate("expired")`), capability reduction and preview-deadline expiry each remove the dimmed page in the same commit and a late response does not restore it; SQL paging: logout, expiry, access change and a mid-flight `forbidden` do the same. Dimmed content is `inert` + `aria-hidden` + `aria-busy`. Overview `retainedSeries` is phase 3 and was not added.
- **AC6** — no dependency change; boundaries, fixtures and build gates pass.
- **AC7** — see below.

Layout shift check (Chromium, motion off): skeleton Overview cards are 145.5px tall, equal to loaded cards (3/3); Explorer skeleton header/row heights 35.5/36.5px equal the real table's (enforced to within 1px by the spec).

## Capture comparison (AC7)

85 committed PNGs regenerated by the full `test:e2e` run (motion off), compared with the
unmodified-tree baseline copies (`/private/tmp/outage-motion/baseline-evidence`, run 2)
by byte hash and pixel diff:

| File(s) | Difference vs baseline | Decision |
| --- | --- | --- |
| `phase-3/{explorer,overview,shell,workspace}-template-1440`, `phase-4/explorer-schema-1440`, `phase-4/overview-1440`, `phase-4/overview-exact-390`, `phase-6/overview-1440` | the phase 1 intentional differences (nav indicator, Tabs underline, Checkbox), already committed in 36936b1 | unchanged by phase 2; kept |
| `phase-4/overview-denied-1440` | 3 px strip (x1405–1408), 25 px | baseline noise (differed between baseline runs); not intentional |
| `phase-4/explorer-1440`, `explorer-expired-1440`, `overview-unavailable-1440` | identical to baseline | these differ from HEAD (environment drift of date-input width, also present at baseline); not intentional |

**No intentional phase 2 capture differences.** No existing capture is taken in a
pending state with skeletons (Overview/Explorer captures wait for loaded content), so
skeleton rendering is evidenced by the Storybook motion/geometry specs rather than PNGs.
All four PNGs that differed from HEAD were noise and were restored with
`git checkout`; `git status` shows no `docs/specs/web-client/evidence` changes.
The four pre-existing failing visual tests abort before some captures; those files are untouched.

## Deviations and decisions

See "Implementation notes (phase 2)" in [../tasks/phase-2.md](../tasks/phase-2.md): new
`--duration-appear` token for the 150 ms fade; no source edit to `PaginationControls`
(inherits Button) plus an added story; compact `DateRangeField` container border tint
on invalid; skeleton cards also during metadata loading and range change; `inert` on the
`DataTable` root; `tests/motion/support.ts` asserts the first `note`.

## Limitations

- Fixture/synthetic evidence only; jsdom has no stylesheet, so motion is verified in Chromium (Storybook, motion on).
- Pre-existing: the viewer-persona Queries stories (`Ready`, `ResultsAndDuplicates`, …) show "Query access denied" because the Viewer fixture cannot execute queries; the new `Paging` story uses the analyst persona.
- The `check:production-fixtures` file count is inflated by a pre-existing `next dev` process on port 3000 (left running).
- Overview range-change refetch shows skeleton cards (no retained series); the guarded dim is phase 3.
