# Tasks — Phase 2: Status and loading
> Status: phase 2 verified (T2.33 devlog/commit pending) · Slug: ui-motion · Manifest: [../tasks.md](../tasks.md) · Plan: [../plan.md](../plan.md) · Spec: [../spec.md](../spec.md)

Plan phase 2 (B6, B8–B12, C5 loading, D2 first-load cards, D3 skeletons; FR3, FR4, FR6; AC2–AC5). Predecessor: T1.C accepted. Paths marked (new) are created.
Skeletons and decorative icon swaps are `aria-hidden`; banners keep their node, role and text; stale content shown while loading is `inert` and `aria-hidden`.

## New placeholders
- [x] **T2.1** Create the static placeholder atom: `className` sizing/shape, optional `shimmer` (default false, never enabled by call sites), always `aria-hidden` — `src/components/atoms/Skeleton.tsx` (new)  (A2, E1; FR4)
- [x] **T2.2** Create the table placeholder molecule: `rows`, `columns`, `className`; `aria-hidden`, no table/caption semantics; geometry matched to `DataTable`. Depends on T2.1 — `src/components/molecules/TableSkeleton.tsx` (new)  (FR4)

## Components
- [x] **T2.3** [P] Add the 150ms fade-in so short loads do not flash; keep role/`aria-live`/label markup — `src/components/atoms/Spinner.tsx`  (B6; FR3; AC2, AC4)
- [x] **T2.4** [P] Add mount fade/rise, keyed icon crossfade (spinner/check/warning, `aria-hidden`), tone border/background color transition and success border-tint settle; no shake; the live-region node, role and text are unchanged — `src/components/molecules/StatusMessage.tsx`  (B8; FR3; AC2, AC4)
- [x] **T2.5** [P] Add staggered fade-in of icon, title and description — `src/components/molecules/EmptyState.tsx`  (B9; FR3; AC2)
- [x] **T2.6** [P] Add current-page highlight crossfade; inherit Button hover/press — `src/components/molecules/PaginationControls.tsx`  (B10; FR2; AC2)
- [x] **T2.7** [P] Add calm validation color transition — `src/components/molecules/DateRangeField.tsx`  (B11; FR2; AC2)
- [x] **T2.8** Add optional `loading` (skeleton in the value slot, then fade-in of the real value; never zero or "Unavailable"; no counting); defaults keep today's output. Depends on T2.1 — `src/components/molecules/MetricValue.tsx`  (B12; FR4, FR6; AC3)
- [x] **T2.9** [P] Add optional `loading` (dim to ~60%, `aria-busy`, stale body `inert` + `aria-hidden`, content retained by the caller); no change to `TableData` or cell rendering — `src/components/organisms/DataTable.tsx`  (C5; FR4, FR6; AC3, AC5)
- [x] **T2.10** Add feature-internal `loading` prop rendering three skeleton metric cards. Depends on T2.8 — `src/features/overview/NationalMetricCards.tsx`  (B12, D2; FR4; AC3)
- [x] **T2.11** Render skeleton cards on first load (loading and no series) in the metrics slot; keep the "Loading national observations" banner. Depends on T2.10 — `src/features/overview/OverviewFeature.tsx`  (D2; FR4; AC3, AC4)
- [x] **T2.12** Show `TableSkeleton` while the first preview page loads and pass `loading` to the existing `DataTable` during `next()` (retained page dimmed); keep the banner and pagination disabling. Depends on T2.2, T2.9 — `src/features/explorer/DatasetPreview.tsx`  (D3, C5; FR4; AC3, AC4, AC5)
- [x] **T2.13** Show `TableSkeleton` rows above the "Loading schema" banner while schema loads. Depends on T2.2 — `src/features/explorer/ExplorerFeature.tsx`  (D3; FR4; AC3, AC4)
- [x] **T2.14** Pass `loading` to the results `DataTable` while `activity === "paging"` (retained page dimmed); no new controller state. Depends on T2.9 — `src/features/queries/QueryResults.tsx`  (C5; FR4; AC3, AC5)

## Tests
- [x] **T2.15** [P] Test `Skeleton` and `TableSkeleton`: `aria-hidden`, no table semantics, `shimmer` default false — `tests/components/skeleton.test.tsx` (new)  (E1; FR4; AC4)
- [x] **T2.16** Test StatusMessage (one live region per message, unchanged role/text across pending/success/warning), EmptyState text, and MetricValue loading (never zero/"Unavailable", exact value after load) — `tests/components/displays.test.tsx`  (B8, B9, B12; FR4, FR6; AC3, AC4)
- [x] **T2.17** Test DataTable `loading` (`aria-busy`, stale body `inert`/`aria-hidden`, cells identical, default output unchanged) — `tests/components/data-table.test.tsx`  (C5; FR4, FR6; AC3)
- [x] **T2.18** Test DateRangeField validation messaging and PaginationControls current-page/disabled semantics unchanged — `tests/components/fields-pagination.test.tsx`  (B10, B11; AC4)
- [x] **T2.19** Re-grep and keep green every existing loading-text assertion (`tests/components/atoms.test.tsx`, `tests/components/displays.test.tsx`, `src/features/auth/auth.test.tsx`, `tests/visual/shared-components.spec.ts` "Loading preview" count, `tests/browser/sign-in-page.spec.ts`, `tests/browser/navigation.spec.ts`); edit only a selector the skeleton work actually breaks and record it in the phase record  (FR4; AC4)
- [x] **T2.20** Test Overview first load: skeleton cards (no "0"/"Unavailable"), banner announced once, exact metric text after load, empty/unavailable states unchanged — `src/features/overview/overview.test.tsx`  (D2, B12; FR4, FR6; AC3, AC4)
- [x] **T2.21** Test Explorer preview/schema skeletons and paging dim; invalidation, expiry, capability loss or logout during `next()` removes the dimmed page in the same commit and a late response does not restore it — `src/features/explorer/explorer.test.tsx`  (D3, C5; FR4; AC3, AC5)
- [x] **T2.22** Test SQL paging dim; logout/invalidation during paging clears results and a late page response does not restore them — `src/features/queries/queries.test.tsx`  (C5; FR4; AC3, AC5)

## Stories
- [x] **T2.23** [P] Add Skeleton block and Spinner fade-in states — `src/components/atoms/status.stories.tsx`  (B6, E1; FR4)
- [x] **T2.24** [P] Add TableSkeleton, MetricValue loading→loaded, StatusMessage state switcher and EmptyState stories — `src/components/molecules/display.stories.tsx`  (B8, B9, B12; FR3, FR4)
- [x] **T2.25** [P] Add a DateRangeField invalid/valid toggle — `src/components/molecules/fields.stories.tsx`  (B11; FR2)
- [x] **T2.26** [P] Add a DataTable `loading` story over retained rows — `src/components/organisms/DataTable.stories.tsx`  (C5; FR4)
- [x] **T2.27** [P] Update the Overview `Loading` story to show skeleton cards — `src/features/overview/OverviewFeature.stories.tsx`  (D2; FR4)
- [x] **T2.28** [P] Update the Explorer `Loading` story and add a paging-in-flight state — `src/features/explorer/ExplorerFeature.stories.tsx`  (D3; FR4)
- [x] **T2.29** [P] Add a SQL paging-in-flight story — `src/features/queries/QueriesFeature.stories.tsx`  (C5; FR4)

## Browser motion checks
- [x] **T2.30** Add reduce vs no-preference checks for StatusMessage, Spinner fade, EmptyState, pagination and DateRangeField; assert skeletons never animate and never contain text; assert `getByRole("status")` counts remain single; compare metric/table cell text with motion on vs off for the loaded Overview/Explorer/Queries stories — `tests/motion/status-loading.spec.ts` (new)  (B6, B8–B12, C5; FR3–FR6; AC2, AC3, AC4)

## Documentation
- [x] **T2.31** Document skeleton/loading conventions (skeletons `aria-hidden`, banners announce, `loading` props) under the motion section — `docs/development/verification.md`  (FR4; AC4)
- [x] **T2.32** Update the README motion paragraph and spec status to "phases 1–2 verified" — `README.md`, `specs/ui-motion/spec.md`  (AC6)
- [x] **T2.33** At commit time, append the devlog entry and stage it with the implementation — `docs/devlog/<commit-date>.md`  (AGENTS.md devlog rule)

## Checkpoint
- [x] **T2.C** Checkpoint: run the phase gate list in [../tasks.md](../tasks.md#phase-gate-commands) (include `playwright.controlled.config.ts` with a configured build); regenerate captures with motion off and compare with the baseline, recording intentional differences for skeleton-bearing pending states (Overview/Explorer/Query); verify AC3 (identical values/cells, no zero placeholders) and AC5 (no lingering dim/stale content) for first-load, Explorer paging and SQL paging — `specs/ui-motion/verification/phase-2.md` (new), `specs/ui-motion/tasks/phase-2.md`  (AC1, AC2, AC3, AC4, AC5 for Explorer/SQL, AC6, AC7)

## Implementation notes (phase 2)
- T2.3/T2.8: a new `--duration-appear` (150ms; 100ms under the reduced rule) token and `--animate-appear` name (in `src/styles`) carry the "150ms" fade for Spinner and the loaded metric value; no existing token had that value.
- T2.4: `motion-enter-settle` (motion.css) combines fade-rise with the success settle on one element; the icon wrapper is keyed by `pending ? "pending" : tone`. The live-region node, role and text are unchanged. Shimmer got a `motion-shimmer` utility (unused by call sites).
- T2.6: `PaginationControls.tsx` needed no edit: its numbered buttons are `Button`s whose variant swap already crossfades through `motion-control`. A stateful `CurrentPageReview` story was added to `PaginationControls.stories.tsx` (not listed in the task) so T2.30 can verify it.
- T2.7: the default variant already eases through `motion-field`; the compact variant (inputs borderless) now tints its container border via `has-[[aria-invalid=true]]` with `motion-colors`. This adds a visible invalid border to the compact container; no capture shows that state.
- T2.9: `inert`/`aria-hidden`/`aria-busy`/dim sit on the `DataTable` root so the empty state is covered too; the root also gained `motion-colors` (opacity transition).
- T2.11: skeleton cards show whenever the "Loading national observations" banner shows and there is no series (includes the metadata-loading phase, when `loading` is still false), to avoid an empty-then-skeleton layout shift. Range changes also show skeletons (no retained series until phase 3).
- T2.12/T2.13: skeleton rows/columns are bounded (preview: page size up to 8 rows, schema column count up to 6; schema: 5x4).
- T2.30: `tests/motion/support.ts` `openMotionStory` now asserts the first `note` (feature stories add a second "Synthetic fixture demo" note). The Queries data-identical check uses the new analyst `Paging` story's retained page: the pre-existing viewer-persona query stories render "Query access denied" because the Viewer fixture cannot execute queries (observed, not changed).
- T2.19: no existing loading-text assertion needed editing (all stayed green).
- T2.33 is intentionally left for the coordinator (devlog and commit).
