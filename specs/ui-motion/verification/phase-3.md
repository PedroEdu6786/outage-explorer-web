# ui-motion — Phase 3 verification (entrances and chart)

Recorded October 6, 2026. **Fixture/synthetic evidence only**: nothing here is
live-integration evidence, Figma-fidelity sign-off or motion visual sign-off (a separate
record, T4.26). Not committed; T3.33 (devlog) is left to the coordinator.

## Revision binding

- `git rev-parse HEAD`: `36612abbefb5cbebe2cbcd90a071c7fd0f6b4e2b` (phase 2 commit; phase 3 changes are uncommitted)
- Working-tree digest (verification.md method, 412 tracked+untracked files, taken after all
  edits except this record file; `next-env.d.ts` restored):
  `8359d796fbddb3f12c898d67032a73028cc26b80c428a3a9f94bdc26e0d64885`
- Node 24.18.0, npm 11.16.0, `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`.
- Baseline: [baseline.md](baseline.md); phases 1–2: [phase-1.md](phase-1.md), [phase-2.md](phase-2.md).

## Commands actually run against this tree

| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | pass — 29 files, 370 tests (phase 2: 28 / 344; +14 retained-series, +2 overview chart, +2 data-table, +3 templates, +2 shell, +2 drawer logic, +1 auth) |
| `npm run test:boundaries` | pass — 33 tests |
| `npm run check:boundaries` | pass — 107 modules, 15 production roots |
| `npm run build` (configured) → `npm run check:production-fixtures` | pass — 523 emitted files scanned (the count includes `.next/dev` files written by the pre-existing `next dev` on port 3000; not comparable to earlier counts). The emitted CSS contains the `@starting-style` drawer rules and the `animation-timeline: scroll()` block |
| `npm run build-storybook` | pass |
| `npm run test:e2e -- --workers=1` (motion off default; includes tests/motion) | **103 passed, 4 failed** — the same 4 baseline failures (features.spec 17/89/107, pages.spec 10, same messages as baseline.md). Phase 2 was 77 + 4; +26 new tests (24 entrances, 1 overview-page motion-on scenario, 1 shell drawer scenario under motion on), 0 new failures |
| `npm run test:e2e -- tests/motion --workers=1` | pass — 63 tests (phase 2: 39; +24 in `entrances.spec.ts`: 11 checks x2 preferences, 2 data-identical) |
| `playwright.controlled.config.ts` (configured build) | pass — 4 tests |
| `git diff --exit-code package.json package-lock.json` | clean (AC6) |

Intermediate full runs also exposed two of my own test mistakes (a strict-mode locator and
a wrong pending-page heading) and one phase-2 assertion made stale by this phase
(`animationsUnder` counted the new row entrance); all were fixed and the final run above is
the evidence. A first full run was cut off by a tool timeout; it is not counted.

Not run (phase 3 does not change them): `playwright.production.config.ts` (phase 1 gate only),
`playwright.auth.config.ts` and `playwright.development.config.ts` (need a live backend / the
user's dev server on port 3000, which was left running and untouched).
`next-env.d.ts` churn from `typecheck`/`build` was restored with `git checkout` each time.
`tests/browser/overview-page.spec.ts` is a Storybook page-harness spec (PageDemo with
synthetic operations), not a real-route config; the real-route controlled config was run
unchanged and has no new motion scenario.

## Acceptance criteria (phase 3 scope)

- **AC1** — new motion uses only tokens/utilities in `src/styles` (`motion-drawer`, `motion-scroll-shadow`, `animate-icon-swap`, `animate-dot-pulse`, `animate-chart-wipe`, `animate-scale-in`, `motion-stagger`, tokens `--motion-icon-rotate`, `--stagger-step-row`); `tests/components/motion-guard.test.ts` passes (no ad-hoc `duration-`/`ease-`/`animate-[`, no `motion-reduce:`, one reduced rule, no `transitionend`/`animationend`/`getAnimations` in `src`); `tokens.spec.ts` still passes.
- **AC2** — `tests/motion/entrances.spec.ts` runs each group with `reduce` and `no-preference`: drawer (translate/overlay/display transitions with `--duration-move` 0.2s vs 0s, `--motion-drawer-shift` -100 vs 0, open creates a translate transition only without reduce, exit keeps `display: block` one frame only without reduce), header icon swap (`icon-swap`, rotate token -90 vs 0), one-iteration dot pulse (`dot-pulse` 1.2s vs `none`), template slot rise with capped stagger (max delay 0.05 x index vs 0, rise token 4 vs 0), AuthTemplate scale-in token 0.98 vs 1, row stagger (20ms step vs 0), chart wipe (`chart-wipe` vs `none`), scroll shadow (absent at top, present when scrolled, both preferences).
- **AC3** — polyline `points`, circle coordinates, segment count/gaps, cells and metric text are identical with motion on, off and reduced (Playwright DOM comparison); RTL: calculated segments byte-identical after the compare toggle, gaps never bridged, DataTable cells byte-identical with `entrance="none"` and under `loading`, skeletons never render zero/"Unavailable". The wipe's only keyframe is a clip inset (asserted from the stylesheet); the compare toggle keeps the same `svg` (identity marker), so the wipe cannot replay; the chart is fully visible (`clip-path: none`) once motion ends, under reduce and with the motion-off sheet (0s duration, no animations on the svg).
- **AC4** — drawer: RTL (open once via `showModal`, close button focused, Tab order, `close()` synchronous, trigger focus restored, `cancel` default prevented, reopen) and Chromium `shell.spec.ts` focus-trap/return-focus/Escape/link/sign-out scenario under motion off **and** on; `close()` synchronous with a transition running; closed state `pointer-events: none` during exit and `display: none` afterwards, nothing at the old panel position; crossing 1000px (both directions, drawer closed and open) starts no transition and never leaves a lingering animation; header trigger keeps label, `aria-expanded`, `aria-haspopup` and a decorative icon; AuthTemplate title switch keeps children, actions, footer and focus mounted; sign-in restoring/expired states keep headings, text, one live region and focus behavior; all existing tests green.
- **AC5** — `retained-series.test.tsx` (14 tests): non-null only while loading and bound to its generation; chained edits keep the on-screen series, an invalid range drops it; logout, expiry, `invalidate("pending")`, `beginLogout`, a new session generation and capability loss each clear it in the same commit (asserted without waiting) and a late response cannot restore it; forbidden and service failures mid-refetch clear it; `reloadMetadata` clears it; `explore()` never navigates from it; feature-level: the dimmed content is `inert` + `aria-hidden`, has no action, disappears on logout/capability loss with no remnant after a late response, and none remains once the new range lands. Playwright page scenario (motion on): range change then session withheld leaves no protected content, chart or dim, and no late restoration after the call settles. Chromium story scenario: dimmed content (opacity 0.5, inert, hidden from assistive technology, no skeleton, no Explore action) until released, then the new chart wipes in.
- **AC6** — no dependency change; boundaries, fixtures and build gates pass.
- **AC7** — see below.

Drawer behavior check in a real browser (the task's subtle point): the opening transition list contains `translate` (so `@starting-style` applies) and the exiting dialog is still `display: block` one frame after `close()` (so `allow-discrete` on `display`/`overlay` works); both are absent under reduced motion, where the dialog is hidden at once.

## Capture comparison (AC7)

The full `test:e2e` run (motion off) rewrote the committed PNGs it captures; every one of
the 85 files was compared by SHA-256 with HEAD (which already contains the phase 1 intentional
differences) and with the unmodified-tree baseline copies
(`/private/tmp/outage-motion/baseline-evidence`):

| File(s) | Difference | Decision |
| --- | --- | --- |
| all `phase-3/*` template/shell captures (explorer, overview, shell, workspace), `phase-4/overview-1440`, `explorer-schema-1440`, `overview-exact-390`, `phase-6/overview-1440` and the other 70+ files | byte-identical to HEAD (they differ from the baseline only by the phase 1 intentional differences) | none; motion off makes the drawer, header, template, chart, table and card changes invisible, as intended |
| `phase-4/explorer-1440`, `explorer-expired-1440`, `overview-unavailable-1440` | identical to the baseline copies; differ from HEAD by the known environment drift (date-input width), not by this work | not intentional; restored with `git checkout` |
| `phase-4/overview-denied-1440` | 8 pixels differ from the baseline (x266–270, y205–208) | baseline noise (this file already differed between baseline runs); restored |

**No intentional phase 3 capture differences.** `git status` shows no `docs/specs/web-client/evidence` changes after restoration.
The four pre-existing failing visual tests abort before some captures; those files are untouched.

## Deviations and decisions

See "Implementation notes (phase 3)" in [../tasks/phase-3.md](../tasks/phase-3.md). In short:
the drawer and backdrop use the movement-class alias so reduced motion jumps (no reduced-motion
backdrop fade); the scroll shadow is disabled by the motion-off sheet because a scroll-linked
effect has no end state; the Overview table keeps `DataTable`'s 60% loading dim while cards and
trend use 50%, and the table's "Explore dataset" action is omitted while its rows are stale;
a phase-2 Overview test and the phase-2 `animationsUnder` helper were updated for behavior this
phase introduces; the phase 2 row in the manifest now reads "verified and committed (36612ab)".

## Limitations

- Fixture/synthetic evidence only; jsdom has no stylesheet, so motion is verified in Chromium (Storybook, motion on).
- The held-dim state is asserted at the Storybook feature level and in RTL, not at page level (the fixture page cannot hold a response) and not in a real-route config.
- The snapshot component of the chart's remount key is covered by code review of the key, not an isolated test.
- Scroll-driven header shadow depends on Chromium's scroll timelines; other engines show no shadow.
- The `check:production-fixtures` file count is inflated by the pre-existing `next dev` process on port 3000 (left running).

## October 7 correction — visible entrance on opening/reload

The user confirmed zoom motion worked but the opening/reload entrance did not.
Earlier checks proved the animation name and final state, not its intermediate
appearance. A Chromium probe at `03fa237` found the implicit `clip-path: none`
endpoint caused a discrete jump: fully clipped at 0/70ms, fully visible at
175/350/699ms. An explicit `to { clip-path: inset(0); }` now permits a continuous
wipe over the existing 700ms duration. SVG identity, source geometry, zoom motion
and reduced-motion behavior are unchanged.

The new assembled Overview browser regression catches the real mount animation
on opening and reload, samples 25/50/75% of its duration, and requires strictly
decreasing partial clipping with identical source coordinates. Checks passed:
30 entrance/viewport browser scenarios, 97 focused Overview/motion-guard unit
tests, typecheck, lint, fresh Storybook and production builds, and release source
and fixture-exclusion scans (113 modules/15 roots, 361 emitted files). Evidence
is synthetic Chromium; authenticated user acceptance remains separate.
