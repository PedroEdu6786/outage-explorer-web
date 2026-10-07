# Tasks — Phase 3: Entrances and chart
> Status: phase 3 verified (T3.33 devlog/commit pending) · Slug: ui-motion · Manifest: [../tasks.md](../tasks.md) · Plan: [../plan.md](../plan.md) · Spec: [../spec.md](../spec.md)

Plan phase 3 (C2–C4, C5 stagger, C6, C7, D1, D2 chart/range/metric entrance; FR3, FR4, FR5, FR6; AC2–AC5). Predecessor: T2.C accepted. Paths marked (new) are created.
Drawer logic (`showModal`/`close`, `closeButton.focus()`, return-focus, `containFocus`, `onCancel`) is not edited; nothing awaits `transitionend`.

## Shell and templates
- [x] **T3.1** Add the drawer slide-in/out and backdrop fade with `@starting-style`/`allow-discrete`, disabled at desktop width so crossing 1000px never flashes; CSS only — `src/components/organisms/AppNavigation.tsx`  (C2; FR3, FR5; AC2, AC4)
- [x] **T3.2** Add the coverage status-dot single slow pulse (one cycle, not infinite). Depends on T3.1 (same file) — `src/components/organisms/AppNavigation.tsx`  (C4; FR3; AC2)
- [x] **T3.3** [P] Add menu↔close icon crossfade-rotate keyed on `navigationOpen` (label and `aria-expanded` unchanged; icon `aria-hidden`) and the optional scroll-driven shadow as progressive enhancement — `src/components/organisms/AppHeader.tsx`  (C3; FR3; AC2, AC4)
- [x] **T3.4** [P] Add fade-rise slot entrances with 40–60ms stagger (index ≤4) — `src/components/templates/OverviewTemplate.tsx`  (C6; FR3; AC2)
- [x] **T3.5** [P] Add the same slot entrances — `src/components/templates/ExplorerTemplate.tsx`  (C6; FR3; AC2)
- [x] **T3.6** [P] Add the same slot entrances — `src/components/templates/WorkspaceTemplate.tsx`  (C6; FR3; AC2)
- [x] **T3.7** [P] Add card scale-in from 0.98 with fade and a title/description block keyed by the supplied `title` (no focusable controls inside the keyed block) — `src/components/templates/AuthTemplate.tsx`  (C7, D1; FR3; AC2, AC4)
- [x] **T3.8** [P] Add capped row stagger on mount (index custom property, ≤10 rows, 20ms step) and the `entrance?: "stagger" | "none"` prop (default stagger); cells untouched. Depends on T2.9 (same file) — `src/components/organisms/DataTable.tsx`  (C5; FR3, FR6; AC2, AC3)
- [x] **T3.9** [P] Pass `loading` and `entrance` through to the table. Depends on T3.8 — `src/features/overview/DailyObservations.tsx`  (C5, D2; FR4; AC3, AC5)
- [x] **T3.10** [P] Set `entrance="none"` for the schema table inside the Tabs panel so tab switches do not replay row stagger. Depends on T3.8 — `src/features/explorer/DatasetSchema.tsx`  (C5; FR3; AC4)
- [x] **T3.11** Set `entrance="none"` for the preview table inside the Tabs panel. Depends on T3.8, T2.12 (same file) — `src/features/explorer/DatasetPreview.tsx`  (C5; FR3; AC4)

## Overview chart and range change
- [x] **T3.12** [P] Stagger the three metric cards (index custom property). Depends on T2.10 (same file) — `src/features/overview/NationalMetricCards.tsx`  (D2; FR3; AC2, AC3)
- [x] **T3.13** [P] Add the left-to-right clip-path wipe class on the persistent `svg` (not the compare toggle); points, segments and `data-segment` gaps untouched; keep `key` on range/snapshot/generation — `src/features/overview/NationalTrend.tsx`  (D2; FR3, FR5, FR6; AC2, AC3)
- [x] **T3.14** [P] Expose derived in-memory `retainedSeries` (previous `NationalSeries`) non-null only while a refetch loads, bound to its session generation, requiring `authenticated` + `canReadNationalSeries`; clear on runtime cleanup, any failure including `forbidden`, loading end and `reloadMetadata`; never feed `series`, `explore()` or navigation guards — `src/features/overview/useOverview.ts`  (D2; FR4; AC5)
- [x] **T3.15** Render `retainedSeries` dimmed (~50%, `inert`, `aria-hidden`) during range-change refetch for cards, trend and table, then fade new content in; no change to banners or failure handling. Depends on T3.9, T3.13, T3.14, T2.11 (same file) — `src/features/overview/OverviewFeature.tsx`  (D2; FR4; AC3, AC5)

## Tests
- [x] **T3.16** Test the `retainedSeries` matrix: logout, expiry, `invalidate("pending")`, generation change, capability loss, forbidden/failure mid-refetch, publication `reloadMetadata`; retained content gone in the same commit as session state and no late response restores it; `explore()` never reads it — `src/features/overview/retained-series.test.tsx` (new)  (D2; FR4; AC5)
- [x] **T3.17** Test wipe/gap integrity: polyline point sets and segment count unchanged, the svg key remounts on range/snapshot change and not on compare toggle — `src/features/overview/overview.test.tsx`  (D2; FR6; AC3)
- [x] **T3.18** Test DataTable stagger cap (≤10 indexed rows), `entrance="none"`, cells identical to the no-motion render — `tests/components/data-table.test.tsx`  (C5; FR3, FR6; AC3)
- [x] **T3.19** Test templates stay slot-only/reusable, content is present immediately, AuthTemplate title switch keeps children and actions mounted — `tests/components/templates.test.tsx`  (C6, C7; FR3; AC4)
- [x] **T3.20** Test AppHeader keeps label, `aria-expanded` and `aria-haspopup`; icon swap is `aria-hidden`; coverage block text unchanged — `tests/components/shell.test.tsx`  (C3, C4; AC4)
- [x] **T3.21** Test drawer open/close focus order, return-focus, `cancel`/Escape and synchronous `close()` are unchanged — `tests/components/navigation.test.tsx`  (C2; FR3; AC4)
- [x] **T3.22** Test sign-in state changes (restoring, failure, expired, ready) keep headings/text, focus and `Checking session` banner behavior — `src/features/auth/auth.test.tsx`  (D1; FR3; AC4)

## Stories
- [x] **T3.23** [P] Add drawer-open and coverage-dot states — `src/components/organisms/shell.stories.tsx`  (C2–C4; FR3)
- [x] **T3.24** [P] Add template entrance states for the three analytical templates — `src/components/templates/analytical.stories.tsx`  (C6; FR3)
- [x] **T3.25** [P] Add a title/state switch story — `src/components/templates/AuthTemplate.stories.tsx`  (C7, D1; FR3)
- [x] **T3.26** [P] Add stagger and `entrance="none"` DataTable states — `src/components/organisms/DataTable.stories.tsx`  (C5; FR3)
- [x] **T3.27** [P] Add a range-change refetch story showing the dimmed retained series — `src/features/overview/OverviewFeature.stories.tsx`  (D2; FR4)

## Browser motion and acceptance checks
- [x] **T3.28** Add checks: drawer slide with no-flash at 1000px crossing, reduced-motion jump, header icon, single dot pulse iteration, template/card translate under reduce, chart wipe `animation-name` vs `none`, chart fully visible without wipe under reduce, polyline `points` and gap segments identical motion on/off, compare toggle does not replay the wipe (element identity marker, no timing) — `tests/motion/entrances.spec.ts` (new)  (C2–C7, D1, D2; FR3, FR5, FR6; AC2, AC3)
- [x] **T3.29** Run the drawer focus-trap/return-focus/Escape scenario under both `motion:off` and `motion:on` — `tests/visual/shell.spec.ts`  (C2; AC4)
- [x] **T3.30** Add a motion-on scenario at the Overview page: withhold the session while content (and a range-change dim) is shown and assert protected content is gone immediately; no lingering dim — `tests/browser/overview-page.spec.ts`  (D2; AC5)

## Documentation
- [x] **T3.31** Document drawer/chart/retained-series verification notes and the motion-on browser scenario — `docs/development/verification.md`  (AC4, AC5)
- [x] **T3.32** Update the README motion paragraph and spec status to "phases 1–3 verified" — `README.md`, `specs/ui-motion/spec.md`  (AC6)
- [x] **T3.33** At commit time, append the devlog entry and stage it with the implementation — `docs/devlog/<commit-date>.md`  (AGENTS.md devlog rule)

## Checkpoint
- [x] **T3.C** Checkpoint: run the phase gate list in [../tasks.md](../tasks.md#phase-gate-commands) (include `playwright.controlled.config.ts`); verify focus/return tests and AC5 logout/access-change scenarios pass with `retainedSeries` in place; regenerate captures with motion off, compare with the baseline and record intentional differences (drawer/header/template states) — `specs/ui-motion/verification/phase-3.md` (new), `specs/ui-motion/tasks/phase-3.md`  (AC1, AC2, AC3, AC4, AC5, AC6, AC7)

## Implementation notes (phase 3)
- T3.1: `motion-drawer` (motion.css) is a utility applied to the dialog. Its transitions live inside `@media (width <= 1000px)` so crossing the breakpoint never starts one; the closed state is `translate: var(--motion-drawer-shift)` with `pointer-events: none` (so the exiting panel cannot catch clicks); `display`/`overlay` use `allow-discrete` and the open state is started from `@starting-style`. Durations use the movement-class alias `--duration-move`, so reduced motion makes open and close jump (the backdrop fade is also zero there). Verified in Chromium: an open creates a `translate` transition without reduce, and `display` stays `block` for one frame after `close()` without reduce and is `none` with reduce.
- T3.2: the dot pulse is the existing `animate-dot-pulse` (one iteration); it replays each time the drawer is displayed because `display: none` toggles restart animations. It is verified in the desktop sidebar story.
- T3.3: tokens `--motion-icon-rotate` (-90deg, 0deg under reduce) and `--animate-icon-swap`/`icon-swap` keyframe were added. The icon wrapper is keyed by `navigationOpen`; label, `aria-expanded` and `aria-haspopup` are unchanged. The scroll shadow is `motion-scroll-shadow` (`animation-timeline: scroll()` inside `@supports`, fill `both`, range 0–48px); because a scroll-linked effect has no end state, `tests/support/motion-off.ts` disables it (`.motion-scroll-shadow { animation: none }`) so captures show the scroll-top state.
- T3.4–T3.6: slot wrappers (`motion-stagger` + `[--stagger-index:N]`, N <= 3) use the existing 50ms step. `OverviewTemplate` now wraps `observations` in a div (it was rendered unwrapped); the notice slot is deliberately not animated (it holds an already-animated `StatusMessage`).
- T3.7: the keyed title/description block holds no focusable controls (callers pass strings).
- T3.8: new token `--stagger-step-row` (20ms, 0ms under reduce) so row stagger collapses under reduced motion without a component-level override. Only rows with index < 10 get the class/index.
- T3.10/T3.11: tables in Tabs panels use `entrance="none"`.
- T3.14: `retainedSeries` is derived; the stored `{ series, generation }` is set only in `changeRange` (and cleared with the plan's invariants plus the effect's early-return branch), and the returned value additionally requires `loading`, no `failure`, authenticated + `canReadNationalSeries` and a matching generation, so it disappears in the same render as the session change even before cleanup runs.
- T3.15: `OverviewFeature` shows retained content in a stable `Retained` wrapper (cards and trend, 50% dim, `inert`, `aria-hidden`) so the live trend keeps its identity when it becomes stale; the table uses the shared `DataTable` loading dim (60%, task T3.9), and its "Explore dataset" action is omitted while stale. Stale cards/table are keyed `stale`, live `live`, so the arriving content remounts (cards fade in, rows stagger) and the keyed trend remounts (new wipe).
- Existing test updated: the phase-2 Overview test "replaces skeletons ... keeps no stale values while a new range loads" asserted skeleton cards on range change; with the guarded retained series (this phase's feature) it now asserts the dimmed, inert, hidden retained content and no skeleton. `tests/motion/status-loading.spec.ts` `animationsUnder` now ignores the one-shot row-entrance `fade-rise` (dimming itself still never animates).
- T3.29: the existing drawer scenario runs for both `globals=motion:off` and `globals=motion:on`.
- T3.30: `openPage` gained an optional `globals` argument. The held-dim state cannot be held at page level (the fixture page has no hold control), so the scenario changes the range then withholds the session and asserts the protected content, the retained copy and any dim are gone with no late restoration; the held-dim state is asserted in `tests/motion/entrances.spec.ts` (`RangeChangeRefetch` story) and RTL. The controlled real-route config was run unchanged (no new scenario there).
- T3.17 covers the range key (remount) and compare toggle (same `svg`); the snapshot component of the key is not isolated by a separate test.
- T3.33 is intentionally left for the coordinator (devlog and commit).
