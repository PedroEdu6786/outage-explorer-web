# Tasks: Animations and micro-interactions
> Status: phases 1–4 complete with recorded verification and devlog · Slug: ui-motion · Plan: ./plan.md · Spec: ./spec.md · Layout: hybrid (manifest + `tasks/phase-N.md`)

## Overview
136 tasks across 4 phases; 62 tasks parallelizable [P] (phase 1: 38/18, phase 2: 34/14, phase 3: 34/16, phase 4: 30/14).

- **This file does not authorize implementation.** Implementation starts only when the user requests `/implement`; the spec's open items (authorization, priority versus live-acceptance work, revalidating the codebase) still apply. Revalidate paths and the plan's design intent before the first edit.
- Each phase is a separate commit, created when `/implement` is requested for that phase (one phase per run). Per AGENTS.md, every commit needs a descriptive multiline body and the staged devlog entry (`docs/devlog/<commit-date>.md`, append-only; the final doc task of each phase). Pushing needs separate authorization.
- Checkboxes are ticked only with evidence from commands actually run; fixture/synthetic evidence is never presented as live or Figma-fidelity evidence. Motion visual sign-off is a separate record (T4.26).
- `[P]` = independent of sibling tasks once its stated predecessors are done, and touching disjoint files. Shared configuration (`tokens.css`, `motion.css`, `globals.css`, Playwright/Vitest/Storybook config) stays under one writer. Tasks editing the same file are sequential.
- Paths marked **(new)** are created; all others exist (verified against the repo October 6, 2026). At that checkpoint visual specs wrote directly to saved evidence. October 7 M7 supersedes that workflow: `npm run capture:evidence` writes ignored candidates; ordinary tests leave evidence untouched. See [capture guidance](../../docs/development/verification.md#deliberate-screenshot-capture).

## Phases
| Phase | File | Scope | Status |
| --- | --- | --- | --- |
| 1 | [tasks/phase-1.md](tasks/phase-1.md) | Baseline; A1–A3; B1–B5, B7; C1; Spinner token migration | verified and committed (36936b1) |
| 2 | [tasks/phase-2.md](tasks/phase-2.md) | Skeleton/TableSkeleton; B6, B8–B12; C5 loading; D2 first-load cards; D3 skeletons | verified and committed (36612ab) |
| 3 | [tasks/phase-3.md](tasks/phase-3.md) | C2–C4, C5 stagger, C6, C7, D1; D2 chart wipe, metric entrance, guarded range-change dim | verified and committed (2b79cdc) |
| 4 | [tasks/phase-4.md](tasks/phase-4.md) | Remaining D2; D3; D4; E1 left off; final evidence | complete; verification and devlog in phase completion commit |

## Cross-phase dependencies
- Phase 1 → all: T1.1 baseline is the AC7 reference for every checkpoint; T1.2–T1.4 tokens/primitives, T1.5/T1.6 Storybook motion global, T1.8 `tests/motion` discovery and T1.31 helpers are reused by phases 2–4.
- Phase 2 → 3: `DataTable.loading` (T2.9) precedes stagger/`entrance` (T3.8) and Overview retained dim (T3.15); `NationalMetricCards`/`OverviewFeature` loading (T2.10, T2.11) precede T3.12/T3.15; `DatasetPreview` (T2.12) precedes T3.11.
- Phase 3 → 4: `entrance="none"` (T3.10, T3.11) precedes keyed fades (T4.7, T4.8); `QueryResults` loading (T2.14) precedes T4.12; `AppNavigation` drawer/dot (T3.1, T3.2) precede the coverage-date pulse (T4.3).
- Same-file chains across phases: `AppNavigation.tsx` (T1.20 → T3.1 → T3.2 → T4.3), `DataTable.tsx` (T2.9 → T3.8), `OverviewFeature.tsx` (T2.11 → T3.15), `NationalTrend.tsx` (T3.13 → T4.1 → T4.2), `DatasetPreview.tsx` (T2.12 → T3.11 → T4.8), `status/display/shell/DataTable/Overview/Explorer/Queries stories` accumulate states.
- Each checkpoint (T<n>.C) must pass before the next phase starts.

## Phase gate commands
Run in this order at each checkpoint; serialize builds and port-bound servers. Browser runs use `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright` when that cache is chosen (see `docs/development/verification.md`).
- `npm run typecheck`, `npm run lint`, `npm test`
- `npm run test:boundaries`, `npm run check:boundaries`
- `npm run build`, then `npm run check:production-fixtures`
- `npm run build-storybook`, then `npm run test:e2e` (default `motion:off`; includes affected `tests/visual`, `tests/browser`, `tests/e2e`)
- Reduced-motion check: `npm run test:e2e -- tests/motion --workers=1` (motion on; `emulateMedia` reduce vs no-preference)
- Real-route configs when changed or affected: `playwright.controlled.config.ts` (configured build); phase 1 also `playwright.production.config.ts` (build with `OUTAGE_API_ORIGIN=''`, rebuild configured afterward)
- Captures: run `npm run capture:evidence` with motion off; compare candidates by phase/filename (byte hash, then visual review of differing files) against T1.1 before copying reviewed replacements into evidence. List intentional differences in the phase record.
- AC6 hygiene: `git diff --exit-code package.json package-lock.json`; record `git rev-parse HEAD` and the working-tree digest with the build result
- Record every phase in `specs/ui-motion/verification/phase-N.md`

## Checkpoint coverage
| AC | Verified at |
| --- | --- |
| AC1 tokens/rule, no ad-hoc durations | T1.C, T2.C, T3.C, T4.C (guard T1.21/T4.18, `tests/motion/tokens.spec.ts`) |
| AC2 reduced motion | T1.C (controls), T2.C (status/loading), T3.C (entrances, chart), T4.C (features) |
| AC3 data identical, gaps preserved | T2.C, T3.C, T4.C |
| AC4 focus, announcements, keyboard, existing tests | T1.C–T4.C |
| AC5 no lingering stale data | T2.C (Explorer/SQL), T3.C (Overview `retainedSeries`, logout/access change), T4.C (final) |
| AC6 no dependency, gates | T1.C–T4.C |
| AC7 captures compared | T1.C–T4.C; final decision list at T4.C |

| FR | Primary tasks |
| --- | --- |
| FR1 tokens + single reduced rule | T1.2–T1.4, T1.10, T1.21, T1.32, T4.18 |
| FR2 control feedback | T1.11–T1.16, T1.19, T2.6, T2.7, T4.5, T4.9, T4.11 |
| FR3 entrances/state changes | T1.17, T1.18, T1.20, T2.3–T2.5, T3.1–T3.13, T4.1–T4.13 |
| FR4 loading treatments | T2.1–T2.14, T3.14, T3.15 |
| FR5 reduced motion | T1.2, T1.7, T1.32, T1.33, T2.30, T3.28, T4.23 |
| FR6 no data-implying motion | T2.8, T2.9, T3.8, T3.13, T3.17, T3.28, T4.1, T4.23 |

## Assumptions
- Accepted plan defaults (Open decisions): JS-measured custom properties for sliding Tabs/nav indicators with CSS performing all motion (non-sliding scale-in underline is the fallback if rejected); schema-tree collapse is instant and only expand animates (documented deviation); Checkbox draw-in uses a pseudo-element clip-path reveal on the unchanged native input.
- Tailwind class names, token spellings and file placement in the plan are design intent; these tasks fix files, not exact class spellings. `/implement` finalizes spellings and keeps them inside `src/styles` where the guard requires.
- The indicator hook lives in `src/components/atoms/useSlidingIndicator.ts` so molecules (Tabs) and organisms (AppNavigation) can import it under the layer rules in `scripts/check-boundaries.mjs`.
- The test-only motion-off stylesheet lives in `tests/support/motion-off.ts` (isolated by the boundary scan); `.storybook/preview.tsx` imports it, so it never enters `src/` or emitted app output.
- The new Playwright motion specs live in `tests/motion/` and run under the Storybook project on port 6007; `tests/motion/**` is excluded from Vitest. The source-scan guard is a Vitest test at `tests/components/motion-guard.test.ts`.
- Explorer tables inside Tabs panels use `entrance="none"` (hidden panels restart descendant animations on display toggle); dataset-switch fades use keyed presentational wrappers (phase 4). `SignInPanel.tsx`, `QueryStatus.tsx`, `Button` props and controller/session code need no source edits; their transitions come from `AuthTemplate` keying and `StatusMessage`.
- The Overview metric-card stagger (D2) is placed in phase 3 (T3.12) with the other entrances; the plan names D2 items only partially for that phase.
- SQL paging dim applies to `activity === "paging"` only; Explorer dims the retained page during `next()`.
- Coverage pulses (C4, D2) are verified in organism stories; production composition does not pass `coverage` yet and is not changed.
- Visual changes to Checkbox, Tabs, desktop nav indicator and skeleton-bearing pending states are expected capture differences and are recorded, not silently accepted.

## Open decisions
_None blocking._ The plan's three open decisions are accepted as assumptions above.
