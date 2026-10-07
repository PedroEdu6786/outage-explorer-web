# Tasks — Phase 2: Status and loading
> Status: draft · Slug: ui-motion · Manifest: [../tasks.md](../tasks.md) · Plan: [../plan.md](../plan.md) · Spec: [../spec.md](../spec.md)

Plan phase 2 (B6, B8–B12, C5 loading, D2 first-load cards, D3 skeletons; FR3, FR4, FR6; AC2–AC5). Predecessor: T1.C accepted. Paths marked (new) are created.
Skeletons and decorative icon swaps are `aria-hidden`; banners keep their node, role and text; stale content shown while loading is `inert` and `aria-hidden`.

## New placeholders
- [ ] **T2.1** Create the static placeholder atom: `className` sizing/shape, optional `shimmer` (default false, never enabled by call sites), always `aria-hidden` — `src/components/atoms/Skeleton.tsx` (new)  (A2, E1; FR4)
- [ ] **T2.2** Create the table placeholder molecule: `rows`, `columns`, `className`; `aria-hidden`, no table/caption semantics; geometry matched to `DataTable`. Depends on T2.1 — `src/components/molecules/TableSkeleton.tsx` (new)  (FR4)

## Components
- [ ] **T2.3** [P] Add the 150ms fade-in so short loads do not flash; keep role/`aria-live`/label markup — `src/components/atoms/Spinner.tsx`  (B6; FR3; AC2, AC4)
- [ ] **T2.4** [P] Add mount fade/rise, keyed icon crossfade (spinner/check/warning, `aria-hidden`), tone border/background color transition and success border-tint settle; no shake; the live-region node, role and text are unchanged — `src/components/molecules/StatusMessage.tsx`  (B8; FR3; AC2, AC4)
- [ ] **T2.5** [P] Add staggered fade-in of icon, title and description — `src/components/molecules/EmptyState.tsx`  (B9; FR3; AC2)
- [ ] **T2.6** [P] Add current-page highlight crossfade; inherit Button hover/press — `src/components/molecules/PaginationControls.tsx`  (B10; FR2; AC2)
- [ ] **T2.7** [P] Add calm validation color transition — `src/components/molecules/DateRangeField.tsx`  (B11; FR2; AC2)
- [ ] **T2.8** Add optional `loading` (skeleton in the value slot, then fade-in of the real value; never zero or "Unavailable"; no counting); defaults keep today's output. Depends on T2.1 — `src/components/molecules/MetricValue.tsx`  (B12; FR4, FR6; AC3)
- [ ] **T2.9** [P] Add optional `loading` (dim to ~60%, `aria-busy`, stale body `inert` + `aria-hidden`, content retained by the caller); no change to `TableData` or cell rendering — `src/components/organisms/DataTable.tsx`  (C5; FR4, FR6; AC3, AC5)
- [ ] **T2.10** Add feature-internal `loading` prop rendering three skeleton metric cards. Depends on T2.8 — `src/features/overview/NationalMetricCards.tsx`  (B12, D2; FR4; AC3)
- [ ] **T2.11** Render skeleton cards on first load (loading and no series) in the metrics slot; keep the "Loading national observations" banner. Depends on T2.10 — `src/features/overview/OverviewFeature.tsx`  (D2; FR4; AC3, AC4)
- [ ] **T2.12** Show `TableSkeleton` while the first preview page loads and pass `loading` to the existing `DataTable` during `next()` (retained page dimmed); keep the banner and pagination disabling. Depends on T2.2, T2.9 — `src/features/explorer/DatasetPreview.tsx`  (D3, C5; FR4; AC3, AC4, AC5)
- [ ] **T2.13** Show `TableSkeleton` rows above the "Loading schema" banner while schema loads. Depends on T2.2 — `src/features/explorer/ExplorerFeature.tsx`  (D3; FR4; AC3, AC4)
- [ ] **T2.14** Pass `loading` to the results `DataTable` while `activity === "paging"` (retained page dimmed); no new controller state. Depends on T2.9 — `src/features/queries/QueryResults.tsx`  (C5; FR4; AC3, AC5)

## Tests
- [ ] **T2.15** [P] Test `Skeleton` and `TableSkeleton`: `aria-hidden`, no table semantics, `shimmer` default false — `tests/components/skeleton.test.tsx` (new)  (E1; FR4; AC4)
- [ ] **T2.16** Test StatusMessage (one live region per message, unchanged role/text across pending/success/warning), EmptyState text, and MetricValue loading (never zero/"Unavailable", exact value after load) — `tests/components/displays.test.tsx`  (B8, B9, B12; FR4, FR6; AC3, AC4)
- [ ] **T2.17** Test DataTable `loading` (`aria-busy`, stale body `inert`/`aria-hidden`, cells identical, default output unchanged) — `tests/components/data-table.test.tsx`  (C5; FR4, FR6; AC3)
- [ ] **T2.18** Test DateRangeField validation messaging and PaginationControls current-page/disabled semantics unchanged — `tests/components/fields-pagination.test.tsx`  (B10, B11; AC4)
- [ ] **T2.19** Re-grep and keep green every existing loading-text assertion (`tests/components/atoms.test.tsx`, `tests/components/displays.test.tsx`, `src/features/auth/auth.test.tsx`, `tests/visual/shared-components.spec.ts` "Loading preview" count, `tests/browser/sign-in-page.spec.ts`, `tests/browser/navigation.spec.ts`); edit only a selector the skeleton work actually breaks and record it in the phase record  (FR4; AC4)
- [ ] **T2.20** Test Overview first load: skeleton cards (no "0"/"Unavailable"), banner announced once, exact metric text after load, empty/unavailable states unchanged — `src/features/overview/overview.test.tsx`  (D2, B12; FR4, FR6; AC3, AC4)
- [ ] **T2.21** Test Explorer preview/schema skeletons and paging dim; invalidation, expiry, capability loss or logout during `next()` removes the dimmed page in the same commit and a late response does not restore it — `src/features/explorer/explorer.test.tsx`  (D3, C5; FR4; AC3, AC5)
- [ ] **T2.22** Test SQL paging dim; logout/invalidation during paging clears results and a late page response does not restore them — `src/features/queries/queries.test.tsx`  (C5; FR4; AC3, AC5)

## Stories
- [ ] **T2.23** [P] Add Skeleton block and Spinner fade-in states — `src/components/atoms/status.stories.tsx`  (B6, E1; FR4)
- [ ] **T2.24** [P] Add TableSkeleton, MetricValue loading→loaded, StatusMessage state switcher and EmptyState stories — `src/components/molecules/display.stories.tsx`  (B8, B9, B12; FR3, FR4)
- [ ] **T2.25** [P] Add a DateRangeField invalid/valid toggle — `src/components/molecules/fields.stories.tsx`  (B11; FR2)
- [ ] **T2.26** [P] Add a DataTable `loading` story over retained rows — `src/components/organisms/DataTable.stories.tsx`  (C5; FR4)
- [ ] **T2.27** [P] Update the Overview `Loading` story to show skeleton cards — `src/features/overview/OverviewFeature.stories.tsx`  (D2; FR4)
- [ ] **T2.28** [P] Update the Explorer `Loading` story and add a paging-in-flight state — `src/features/explorer/ExplorerFeature.stories.tsx`  (D3; FR4)
- [ ] **T2.29** [P] Add a SQL paging-in-flight story — `src/features/queries/QueriesFeature.stories.tsx`  (C5; FR4)

## Browser motion checks
- [ ] **T2.30** Add reduce vs no-preference checks for StatusMessage, Spinner fade, EmptyState, pagination and DateRangeField; assert skeletons never animate and never contain text; assert `getByRole("status")` counts remain single; compare metric/table cell text with motion on vs off for the loaded Overview/Explorer/Queries stories — `tests/motion/status-loading.spec.ts` (new)  (B6, B8–B12, C5; FR3–FR6; AC2, AC3, AC4)

## Documentation
- [ ] **T2.31** Document skeleton/loading conventions (skeletons `aria-hidden`, banners announce, `loading` props) under the motion section — `docs/development/verification.md`  (FR4; AC4)
- [ ] **T2.32** Update the README motion paragraph and spec status to "phases 1–2 verified" — `README.md`, `specs/ui-motion/spec.md`  (AC6)
- [ ] **T2.33** At commit time, append the devlog entry and stage it with the implementation — `docs/devlog/<commit-date>.md`  (AGENTS.md devlog rule)

## Checkpoint
- [ ] **T2.C** Checkpoint: run the phase gate list in [../tasks.md](../tasks.md#phase-gate-commands) (include `playwright.controlled.config.ts` with a configured build); regenerate captures with motion off and compare with the baseline, recording intentional differences for skeleton-bearing pending states (Overview/Explorer/Query); verify AC3 (identical values/cells, no zero placeholders) and AC5 (no lingering dim/stale content) for first-load, Explorer paging and SQL paging — `specs/ui-motion/verification/phase-2.md` (new), `specs/ui-motion/tasks/phase-2.md`  (AC1, AC2, AC3, AC4, AC5 for Explorer/SQL, AC6, AC7)
