# Tasks — Phase 1: Foundation and controls
> Status: draft · Slug: ui-motion · Manifest: [../tasks.md](../tasks.md) · Plan: [../plan.md](../plan.md) · Spec: [../spec.md](../spec.md)

Plan phase 1 (A1–A3, B1–B5, B7, C1, Spinner rotation migration; FR1, FR2, FR5; AC1, AC2, AC4, AC6, AC7).
Paths marked (new) are created. `[P]` = independent of sibling tasks once its stated predecessors are done, with disjoint files.

## Baseline (unmodified tree)
- [ ] **T1.1** Capture the baseline on the unmodified tree: record revision/digest; run typecheck, lint, `npm test`, boundaries, `build` + `check:production-fixtures`, `build-storybook` and the full `test:e2e` (tests/visual, tests/browser, tests/e2e); hash every PNG under `docs/specs/web-client/evidence/` after the run and compare with HEAD to list pre-existing drift; note the existing Spinner assertions' result — `specs/ui-motion/verification/baseline.md` (new)  (AC6, AC7)

## Foundation (A1–A3)
- [ ] **T1.2** Add motion tokens to `:root` (`--duration-fast|base|enter`, movement-class duration alias, rise/press/nudge/drawer movement tokens, `--stagger-step`), `--ease-out` in `@theme`, and the single unlayered `@media (prefers-reduced-motion: reduce)` block (zero movement tokens and alias; movement/looping `--animate-*` to `none`; shorten opacity/color durations) — `src/styles/tokens.css`  (A1; FR1, FR5; AC1, AC2)
- [ ] **T1.3** Create the motion primitives: keyframes and `--animate-*` entries inside `@theme` (fade-in, fade-rise, scale-in, settle, nudge, expand, chart-wipe, progress, dot-pulse, spinner, shimmer defined-but-unused), plus `@utility` composites (control transition set; staggered entrance driven by an index custom property; sliding-indicator transition) — `src/styles/motion.css` (new)  (A2; FR1, FR3; AC1)
- [ ] **T1.4** Import `motion.css` after `tokens.css` — `src/app/globals.css`  (A2; FR1; AC1)
- [ ] **T1.5** [P] Create the test-only stylesheet constant (zero animation/transition duration and delay, iteration count 1, all elements) — `tests/support/motion-off.ts` (new)  (A3; FR5; AC7)
- [ ] **T1.6** Add the `motion` global (toolbar toggle, default `off`) and a decorator that injects the T1.5 constant only when off; `globals=motion:on` re-enables motion; keep the existing synthetic-fixture note decorator — `.storybook/preview.tsx`  (A3; FR5; AC7)
- [ ] **T1.7** [P] Set `use.reducedMotion: "reduce"` in the four real-route configs (behavior assertions only, no captures) — `playwright.development.config.ts`, `playwright.controlled.config.ts`, `playwright.production.config.ts`, `playwright.auth.config.ts`  (A3; FR5; AC2)
- [ ] **T1.8** [P] Make `tests/motion` discoverable by Playwright (`testMatch` entry `motion/**/*.spec.ts`) and excluded from Vitest (`exclude` entry `tests/motion/**`) — `playwright.config.ts`, `vitest.config.ts`  (A3; AC2, AC6)
- [ ] **T1.9** [P] Create the domain-free sliding-indicator hook (container ref + active key in; writes position/size custom properties; no-ops without `ResizeObserver`; untransitioned first placement; re-measure on resize and on container display toggles). Depends on T1.3 for custom-property names — `src/components/atoms/useSlidingIndicator.ts` (new)  (B7, C1; FR3; AC4)

## Components (B1–B5, B7, C1, Spinner migration)
- [ ] **T1.10** [P] Move Spinner rotation onto the `spinner` animation token (remove the literal `animate-[spin_0.8s…]` and the `motion-reduce:animate-none` variant); keep 0.8s linear rotation and the static reduced-motion ring. Depends on T1.4 — `src/components/atoms/Spinner.tsx`  (B6 rotation; FR1, FR5; AC1, AC2)
- [ ] **T1.11** [P] Add 120ms color/border transitions, 1px press-down, idle↔loading label fade (same inline-flex gap and geometry) and disabled-opacity fade — `src/components/atoms/Button.tsx`  (B1; FR2; AC2, AC4)
- [ ] **T1.12** [P] Add hover transitions and press scale (~0.96) — `src/components/atoms/IconButton.tsx`  (B2; FR2; AC2)
- [ ] **T1.13** [P] Add hover color transition only (no press scale on the inline default) — `src/components/atoms/Link.tsx`  (B2; FR2; AC2)
- [ ] **T1.14** [P] Add border-color and focus-ring ease-in at constant size, error-border transition and one-shot 2px nudge on becoming invalid — `src/components/atoms/Input.tsx`, `src/components/atoms/Textarea.tsx`, `src/components/atoms/Select.tsx`  (B3; FR2; AC2)
- [ ] **T1.15** [P] Apply the same focus/invalid treatment to the search control and fade in error text without changing field markup or `aria-describedby` — `src/components/molecules/SearchField.tsx`, `src/components/molecules/FormField.tsx`  (B3; FR2; AC2, AC4)
- [ ] **T1.16** [P] Add the clip-path draw-in check mark via a pseudo-element plus fill fade on the unchanged native input — `src/components/atoms/Checkbox.tsx`  (B4; FR2; AC2, AC4)
- [ ] **T1.17** [P] Add tone color crossfade — `src/components/atoms/Badge.tsx`  (B5; FR3; AC2)
- [ ] **T1.18** Add the sliding active underline (hook-measured custom properties, CSS motion, static pre-measure styling) and panel fade-rise on re-show; panels stay mounted; keyboard handling untouched. Depends on T1.9 — `src/components/molecules/Tabs.tsx`  (B7; FR3; AC2, AC4)
- [ ] **T1.19** [P] Add the 2px hover nudge while keeping text/hover styling and `aria-current` — `src/components/molecules/NavigationItem.tsx`  (C1; FR2; AC2)
- [ ] **T1.20** Add the desktop-only sliding active indicator via the hook (re-measure on drawer display toggle); do not edit `showModal`/`close`, focus, return-focus or `cancel` logic. Depends on T1.9, T1.19 — `src/components/organisms/AppNavigation.tsx`  (C1; FR3; AC2, AC4)

## Tests and stories
- [ ] **T1.21** Create the Vitest source-scan guard: tokens and exactly one reduced-motion block exist; no `duration-[`, `ease-[`, `animate-[` or raw `transition-duration` literals outside `src/styles`; no `animationend`/`transitionend`/`getAnimations` dependency; no `motion-reduce:` variants in components. Depends on T1.10–T1.20 — `tests/components/motion-guard.test.ts` (new)  (FR1, FR5; AC1, AC6)
- [ ] **T1.22** Add hook tests with a stubbed `ResizeObserver` (writes properties, first placement untransitioned, re-measure) and a no-op check without it — `tests/components/sliding-indicator.test.tsx` (new)  (B7, C1; AC4)
- [ ] **T1.23** Extend atom tests: Button loading keeps accessible name, `disabled`, `aria-busy` and blocked clicks; Checkbox stays a native input operable by Space; Spinner announces once; IconButton/Badge output unchanged — `tests/components/atoms.test.tsx`  (B1–B6; FR2; AC4)
- [ ] **T1.24** Extend field tests: `aria-invalid`/`aria-describedby`/error text unchanged for inputs, search and form fields — `tests/components/fields-pagination.test.tsx`  (B3; AC4)
- [ ] **T1.25** Extend Tabs and navigation tests: Arrow/Home/End/Space keyboard behavior, panels remain mounted, `aria-current` on the active item, indicator absent/no-op in jsdom — `tests/components/navigation.test.tsx`  (B7, C1; AC4)
- [ ] **T1.26** [P] Add Button/IconButton hover-press-loading-disabled states for motion review — `src/components/atoms/actions.stories.tsx`  (B1, B2; FR2)
- [ ] **T1.27** [P] Add checked/unchecked Checkbox and valid→invalid input states — `src/components/atoms/controls.stories.tsx`  (B3, B4; FR2)
- [ ] **T1.28** [P] Add a Badge tone-switch story — `src/components/atoms/status.stories.tsx`  (B5; FR3)
- [ ] **T1.29** [P] Add a multi-tab Tabs story and NavigationItem hover/active states — `src/components/molecules/navigation.stories.tsx`  (B7, C1; FR3)
- [ ] **T1.30** [P] Add a desktop shell story whose destination can change to show the indicator slide — `src/components/organisms/shell.stories.tsx`  (C1; FR3)
- [ ] **T1.31** Create the shared motion-spec helpers (open a story with `globals=motion:on`, emulate reduce/no-preference, read computed `translate`/`scale`/`animation-name`/`transition-duration`) — `tests/motion/support.ts` (new)  (A3; AC1, AC2)
- [ ] **T1.32** Add token/rule checks: computed durations resolve to the token values, reduce zeroes movement tokens, Spinner rotation `0.8s`/`none` — `tests/motion/tokens.spec.ts` (new)  (A1; FR1, FR5; AC1, AC2)
- [ ] **T1.33** Add per-item reduce vs no-preference checks (no translate/scale change under reduce; color/opacity still transition) and keyboard Tab/Space/Arrow checks for Button, IconButton, inputs, Checkbox, Badge, Tabs and desktop nav indicator — `tests/motion/controls.spec.ts` (new)  (B1–B5, B7, C1; FR2, FR5; AC2, AC4)
- [ ] **T1.34** Update the existing Spinner assertions to open the story with `motion:on` so `animation-name: none` (reduce) and `animation-duration: 0.8s` (no-preference) still hold; keep all `animations: "disabled"` screenshot options — `tests/visual/atoms.spec.ts`  (B6; AC2, AC4, AC7)

## Documentation
- [ ] **T1.35** Document the `motion` Storybook global (default off, toggle), the `tests/motion` command (`npm run test:e2e -- tests/motion --workers=1` after `build-storybook`), the real-route `reducedMotion` default and the AC7 capture-comparison method — `docs/development/verification.md`  (AC6, AC7)
- [ ] **T1.36** Update the motion paragraph and spec status line from "not implemented" to "in progress, phase 1 verified" — `README.md`, `specs/ui-motion/spec.md`  (AC6)
- [ ] **T1.37** At commit time, append the devlog entry (request, decisions, changes, checks run, limitations) and stage it with the implementation — `docs/devlog/<commit-date>.md`  (AGENTS.md devlog rule)

## Checkpoint
- [ ] **T1.C** Checkpoint: run the phase gate list in [../tasks.md](../tasks.md#phase-gate-commands) (plus `playwright.production.config.ts` with `OUTAGE_API_ORIGIN=''` build and `playwright.controlled.config.ts` with a configured build, because T1.7 changed both); regenerate captures with motion off and compare file-by-file with T1.1, differing only for Checkbox, Tabs and nav indicator; confirm no `package.json`/lockfile diff; record revision, digest, commands and intentional differences — `specs/ui-motion/verification/phase-1.md` (new), `specs/ui-motion/tasks/phase-1.md`  (AC1, AC2, AC4 for controls, AC6, AC7)
