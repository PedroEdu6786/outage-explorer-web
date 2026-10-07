# ui-motion — Phase 1 verification (foundation and controls)

Recorded October 6, 2026. **Fixture/synthetic evidence only**: nothing here is
live-integration evidence, Figma-fidelity sign-off or motion visual sign-off
(a separate record, T4.26). Not committed; T1.37 (devlog) is left to the coordinator.

## Revision binding

- `git rev-parse HEAD`: `cef980d99f62df95a04a303462afe6cb716dd8a1` (clean base; changes are uncommitted)
- Working-tree digest (verification.md method, 404 tracked+untracked files,
  taken after all edits except this record file): `817d7faf5b80f5bc0d84255c64a3a7dd74a3cf0a7d45607f1594661ffb4cd5c4`
- Node 24.18.0, npm 11.16.0, `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`.
- Baseline (unmodified tree, digest `174d01d2…86aa`): [baseline.md](baseline.md).

## Commands actually run against this tree

| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | pass — 27 files, 316 tests (baseline 25 / 298; +motion-guard 6, +sliding-indicator 5, +7 extended behavior tests) |
| `npm run test:boundaries` | pass — 33 tests |
| `npm run check:boundaries` | pass — 105 modules, 15 production roots |
| `npm run build` (configured) → `npm run check:production-fixtures` | pass — see note on file count |
| `npm run build-storybook` | pass |
| `npm run test:e2e -- --workers=1` (motion off default; includes tests/motion) | **54 passed, 4 failed** — the same 4 failures as baseline (features.spec 17/89/107, pages.spec 10); baseline was 38 passed + 4 failed, +16 new motion tests |
| `npm run test:e2e -- tests/motion --workers=1` | pass — 16 tests (token values, reduce vs no-preference per control, single unlayered reduced-motion rule) |
| `playwright.controlled.config.ts` (configured build) | pass — 4 tests |
| `OUTAGE_API_ORIGIN='' npm run build` + `playwright.production.config.ts` | pass — 1 test; configured build restored afterward |
| `git diff --exit-code package.json package-lock.json` | clean (AC6) |

Notes and limitations:
- A first full run at the checkpoint had two `tests/motion` failures (badge, tabs; the tabs test reported 5.4 minutes). They passed in the isolated motion run and in a full re-run (above), so they were a transient host stall; the numbers above are from the clean re-run.
- `check:production-fixtures` scanned 813 emitted files versus 189 at baseline. The extra files come from `.next/dev` (768 files), written by a `next dev --webpack` process that was already running on port 3000 on this machine (not started by this work). The scan passes either way; the count is not comparable to baseline.
- **Not run:** `playwright.auth.config.ts` (needs its own server on port 3000, occupied by that pre-existing dev server, and a live Flask backend/credentials) and `playwright.development.config.ts` (needs the user's running dev server; the attempt produced no output within 280s and was aborted, with no baseline to compare). Both configs only gained `use.reducedMotion: "reduce"`; they remain unexecuted for this change.
- jsdom has no `ResizeObserver` or stylesheet, so unit tests cover the hook with a stub and structure only; motion is verified in Chromium (Storybook, motion on).
- `npm run typecheck`/`build` rewrite tracked `next-env.d.ts`; restored with `git checkout` each time.

## Acceptance criteria (phase 1 scope)

- **AC1** — tokens and one reduced rule exist; `tests/components/motion-guard.test.ts` (no ad-hoc `duration-`/`ease-`/`animate-[`/`@keyframes` outside `src/styles`, no `motion-reduce:`, no `animationend`/`transitionend`/`getAnimations`) and `tests/motion/tokens.spec.ts` (computed token values, one unlayered reduced-motion rule in emitted CSS) pass.
- **AC2** — `tests/motion/controls.spec.ts` runs each control under `reduce` and `no-preference`: no press translate/scale, nudge, indicator slide, check draw-in or hover nudge under reduce; color/opacity transitions remain (shortened to 60ms); Spinner `animation-name: none` under reduce and `0.8s` otherwise.
- **AC4 (controls)** — all existing component, shell and browser tests still pass (drawer focus/return-focus specs unchanged and green); keyboard Tab/Space/Arrow/Home/End checks for Button, IconButton, inputs, Checkbox, Badge, Tabs and desktop nav; live-region roles unchanged.
- **AC6** — no dependency change; boundaries, fixtures and build gates pass.
- **AC7** — captures regenerated with motion off and compared file by file with baseline run 2 (below).
- AC3/AC5 are not in phase 1 scope (no loading/retention changes).

## Capture comparison (AC7)

Method: byte hash, then pixel diff against the baseline-run copies, then visual
review of crops. 85 committed PNGs. Differences vs the baseline run:

| File(s) | Region | Cause | Decision |
| --- | --- | --- | --- |
| `phase-3/{explorer,overview,shell,workspace}-template-1440.png` | active nav item (x10–223, y124–165), 473 px | desktop sliding indicator replaces item background/bar; corner antialiasing only | intentional, regenerated files kept |
| `phase-4/explorer-schema-1440.png` | active tab underline (y394–396), 4 px | Tabs indicator at fractional width vs border | intentional, kept |
| `phase-4/overview-1440.png`, `phase-4/overview-exact-390.png`, `phase-6/overview-1440.png` | 16×16 compare checkbox, 68 px | custom checkbox (text-muted border) replaces native | intentional, kept |
| `phase-4/overview-unavailable-1440.png` (3 px strip, x1405–1408) | — | baseline-noise file (changed between baseline runs 2 and 3) | not intentional; restored with `git checkout` |
| `phase-4/explorer-1440.png`, `phase-4/explorer-expired-1440.png` | — | differ from HEAD at baseline too (noise) | restored with `git checkout` |

The other 77 files (including the 3 restored ones) are byte-identical to HEAD. Result: only Checkbox, Tabs and
nav-indicator captures differ intentionally, as planned. The four pre-existing
failing visual tests abort before some captures; those files are untouched.
`git status` therefore shows 8 modified PNGs (all intentional): the four phase-3
templates, `phase-4/explorer-schema-1440`, `phase-4/overview-1440`,
`phase-4/overview-exact-390`, `phase-6/overview-1440`. Because some of these also
carry baseline noise relative to HEAD, their pixel difference was reviewed against
the baseline run, not HEAD.

## Deviations and decisions

See "Implementation notes" in [../tasks/phase-1.md](../tasks/phase-1.md): `@source not`
for specs/docs in `globals.css`; loading-label-only fade in `Button`; no
`SearchField.tsx` edit; checkbox border contrast; nav no-op test placed in
`shell.test.tsx`. Motion-off lives in `tests/support/motion-off.ts`, injected by
`.storybook/preview.tsx` only while the `motion` global is not `on`.
