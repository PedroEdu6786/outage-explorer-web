# Tasks — Phase 4: Feature micro-interactions
> Status: complete; verification and devlog recorded · Slug: ui-motion · Manifest: [../tasks.md](../tasks.md) · Plan: [../plan.md](../plan.md) · Spec: [../spec.md](../spec.md)

Plan phase 4 (remaining D2, D3, D4; E1 stays off; FR2–FR6; AC1–AC7). Predecessor: T3.C accepted. Paths marked (new) are created.
Keyed elements are presentational wrappers only, never containing focusable controls; `QueryStatus` is not keyed so its live region persists across states.

## Overview (D2)
- [x] **T4.1** [P] Fade in the newly mounted EIA-reported series on compare (no wipe replay, no point movement) — `src/features/overview/NationalTrend.tsx`  (D2; FR3, FR6; AC2, AC3)
- [x] **T4.2** Add the inspected-observation card enter on the existing `role="status"` element (role/text unchanged). Depends on T4.1 (same file) — `src/features/overview/NationalTrend.tsx`  (D2; FR3; AC2, AC4)
- [x] **T4.3** [P] Add a one-shot pulse on the coverage date when `availableThrough` changes (keyed span; activates when production supplies coverage) — `src/components/organisms/AppNavigation.tsx`  (D2, C4; FR3; AC2)
- [x] **T4.4** [P] Route refresh run/message status through the StatusMessage transitions (success settle) without new keys on the live region — `src/features/overview/RefreshControl.tsx`  (D2, B8; FR3; AC4)

## Explorer (D3)
- [x] **T4.5** [P] Add row hover and selected-accent transitions using the movement-class duration alias (instant under reduced motion) — `src/features/explorer/DatasetCatalog.tsx`  (D3; FR2; AC2)
- [x] **T4.6** [P] Key a presentational header wrapper by dataset for a fade on dataset switch — `src/features/explorer/DatasetHeader.tsx`  (D3; FR3; AC2, AC4)
- [x] **T4.7** [P] Key a wrapper around the schema table by dataset for the switch fade. Depends on T3.10 (same file) — `src/features/explorer/DatasetSchema.tsx`  (D3; FR3; AC2, AC4)
- [x] **T4.8** Fade the preview table on dataset switch via its existing key (no keyed wrapper around Restart/pagination controls). Depends on T3.11 (same file) — `src/features/explorer/DatasetPreview.tsx`  (D3; FR3; AC2, AC4)
- [x] **T4.9** [P] Add the subtle filter-change transition without altering filter state or handlers — `src/features/explorer/PreviewFilters.tsx`  (D3; FR2; AC2, AC4)

## Queries (D4)
- [x] **T4.10** [P] Add the state-bound indeterminate bar under the toolbar while `busy`; unmount on completion; `aria-hidden`; static under reduced motion — `src/features/queries/SqlEditorPanel.tsx`  (D4; FR3, FR5; AC2, AC4)
- [x] **T4.11** Swap the Copy icon to a check for ~1.5s then revert (single timer, cleaned up on unmount); keep the existing `role="status"` copy message and button name. Depends on T4.10 (same file) — `src/features/queries/SqlEditorPanel.tsx`  (D4; FR2; AC4)
- [x] **T4.12** [P] Add results fade-in on first completion on the section (DataTable replacement already fades via its key); no key on pagination controls. Depends on T2.14 (same file) — `src/features/queries/QueryResults.tsx`  (D4; FR3; AC2, AC4)
- [x] **T4.13** [P] Replace the swapped text glyph with one rotating chevron (`aria-hidden`; `aria-expanded` unchanged) and animate expand only; collapse is instant — `src/features/queries/SchemaBrowser.tsx`  (D4; FR3; AC2, AC4, AC5)

## Tests
- [x] **T4.14** Test compare toggle and inspected card: roles/text unchanged, series points identical, gaps preserved — `src/features/overview/overview.test.tsx`  (D2; FR6; AC3, AC4)
- [x] **T4.15** Test refresh status announces once per state — `src/features/overview/refresh.test.tsx`  (D2; AC4)
- [x] **T4.16** Test dataset switch: keyed wrappers hold no focusable controls, focus on catalog/filters preserved, filter handlers unchanged — `src/features/explorer/explorer.test.tsx`  (D3; FR2, FR3; AC4)
- [x] **T4.17** Test Copy swap with fake timers (check shown, reverts at 1.5s, clipboard-failure message unchanged), bar present only while busy and `aria-hidden`, chevron `aria-expanded`, collapse removes schema content immediately (AC5), `QueryStatus` live-region node persists running→success — `src/features/queries/queries.test.tsx`  (D4; FR2–FR4; AC4, AC5)
- [x] **T4.18** Extend the source guard: E1 shimmer unused by any call site (no `shimmer` prop or `animate-shimmer` outside `src/styles` and component definitions), final ad-hoc literal scan across all migrated files — `tests/components/motion-guard.test.ts`  (E1, FR1; AC1)

## Stories
- [x] **T4.19** [P] Add compare-on and inspected-observation states — `src/features/overview/OverviewFeature.stories.tsx`  (D2; FR3)
- [x] **T4.20** [P] Add a dataset-switch interaction story — `src/features/explorer/ExplorerFeature.stories.tsx`  (D3; FR3)
- [x] **T4.21** [P] Add running (progress bar), Copy and schema expand states — `src/features/queries/QueriesFeature.stories.tsx`  (D4; FR2, FR3)
- [x] **T4.22** [P] Add a coverage-date-change story — `src/components/organisms/shell.stories.tsx`  (D2; FR3)

## Browser motion checks
- [x] **T4.23** Add reduce vs no-preference checks for compare fade, inspected card, coverage pulse, dataset row accent, dataset-switch fades, filters, progress bar (`animation-name: none` under reduce), results fade, chevron/expand and Copy swap; DOM-compare Overview/Explorer/Queries text with motion on vs off — `tests/motion/features.spec.ts` (new)  (D2–D4; FR2–FR6; AC2, AC3)
- [x] **T4.24** Add a motion-on Explorer and SQL scenario: withhold the session during paging/expand and assert results and schema vanish immediately — `tests/browser/explorer-page.spec.ts`, `tests/browser/query-page.spec.ts`  (D3, D4; AC5)

## Final evidence and documentation
- [x] **T4.25** Regenerate the full capture set (phase-2/3/4/6) with motion off, compare byte hashes then visual review of differing files against the T1.1 baseline, and list every intentional difference with its catalog ID — `specs/ui-motion/verification/phase-4.md` (new)  (AC7)
- [x] **T4.26** Create the separate motion visual sign-off record (reviewer, date, motion-on states reviewed; pending until a reviewer fills it; not Figma-fidelity evidence) — `specs/ui-motion/verification/visual-signoff.md` (new)  (spec Open items)
- [x] **T4.27** Document the final motion verification flow and capture policy; mark visual sign-off as a separate evidence class — `docs/development/verification.md`  (AC6, AC7)
- [x] **T4.28** Update the README motion paragraph, set the spec status to implemented-with-evidence and tick AC1–AC7 only as T4.C records them — `README.md`, `specs/ui-motion/spec.md`  (AC1–AC7)
- [x] **T4.29** At commit time, append the devlog entry and stage it with the implementation — `docs/devlog/<commit-date>.md`  (AGENTS.md devlog rule)

## Checkpoint
- [x] **T4.C** Checkpoint: run the phase gate list in [../tasks.md](../tasks.md#phase-gate-commands) (include `playwright.controlled.config.ts`); map AC1–AC7 individually to recorded evidence from phases 1–4; confirm `package.json`/lockfile unchanged since baseline, E1 shimmer unused, schema-tree collapse instant (documented deviation) — `specs/ui-motion/verification/phase-4.md`, `specs/ui-motion/tasks/phase-4.md`  (AC1, AC2, AC3, AC4, AC5, AC6, AC7)


## Implementation notes (phase 4)

- Exclusive implementation ownership: one phase worker; coordinator reviews and
  owns the final devlog/commit. Evidence: [phase-4.md](../verification/phase-4.md).
- T4.7: the schema fade/key belongs to the presentational `table`, through optional
  domain-free `DataTable.contentKey`/`contentClassName` props. Its focusable scroll
  region stays mounted and keeps focus; a new keyed wrapper around it would violate
  the task's focus constraint. Header key excludes the SQL action; preview uses
  its pre-existing DataTable key. Catalog/filter handlers are unchanged.
- T4.10: `busy` includes both execution and retained-page loading, as before.
  Progress is decorative, indeterminate and static under reduce; no progress is inferred.
- T4.13/T4.17/T4.23: expansion animates, removal/collapse is instant. Production
  same-dataset clicks reload schema and never toggled closed; behavior is preserved.
  Collapsed props are verified directly and in `SchemaCollapse` controlled story;
  session withholding removes expanded product schema immediately.
- T4.18: E1 stays unused. New styles are named token-driven utilities in motion.css.
- T4.23: comparisons omit test-only injected CSS text and pin the clock so query
  expiry text matches. Existing loading helper excludes only named `fade-in` and
  bounded `fade-rise` entrances; every other active animation still fails its check.
- T4.25: all 75 phase-2/3/4/6 generated captures were refreshed and compared with
  T1.1; 10 original Figma-reference captures stay untouched. Four historical browser
  failures were stale fixture authorization: SQL stories now use Analyst and the page
  Explorer specimen uses Analyst Ready. Their intended scenarios now run and capture
  fully; Viewer restriction tests remain in place. Role/metadata capture changes are
  distinguished from motion and previously committed decimal/pagination/range changes.
- T4.26: human sign-off stays pending; no live or Figma acceptance is claimed.
- T4.29: coordinator reviewed and staged the append-only devlog with this completion commit.
