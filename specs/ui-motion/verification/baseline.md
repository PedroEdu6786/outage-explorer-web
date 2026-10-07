# Baseline — ui-motion phase 1 (T1.1)

Recorded October 6, 2026 on the **unmodified tree** before any phase 1 edit.
Fixture/synthetic evidence only: nothing here is live-integration or Figma
sign-off evidence.

## Revision binding

- `git rev-parse HEAD`: `cef980d99f62df95a04a303462afe6cb716dd8a1`
- Working-tree digest (verification.md method; tree was clean, no untracked
  files): `174d01d2026714e83588df6a667c599eef591ee855aebda93f86b4e3b9ada6aa`
- Node 24.18.0, npm 11.16.0, `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`
  (Chromium headless shell was downloaded for this run; cache was absent).

## Commands and results (baseline)

| Command | Result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass (no output) |
| `npm test` | pass — 25 files, 298 tests |
| `npm run test:boundaries` | pass — 33 tests |
| `npm run check:boundaries` | pass — 104 modules, 15 production roots |
| `npm run build` (configured, `.env.local`) + `npm run check:production-fixtures` | pass — 189 emitted files scanned |
| `npm run build-storybook` | pass |
| `npm run test:e2e` (parallel, then `--workers=1` twice) | **38 passed, 4 failed** in all three runs (identical failure set) |
| `playwright.controlled.config.ts` (configured build) | pass — 4 tests |
| `OUTAGE_API_ORIGIN='' npm run build` + `playwright.production.config.ts` | pass — 1 test |

`npm run build`/`typecheck` rewrite the tracked `next-env.d.ts` (`.next/dev/types`
→ `.next/types`); it was restored with `git checkout next-env.d.ts` each time.

### Pre-existing `test:e2e` failures at HEAD (not caused by this work)

1. `tests/visual/features.spec.ts:17` — four isolated features … (`heading "SQL Workspace"` not found)
2. `tests/visual/features.spec.ts:89` — SQL single keyboard Run … (`locator.fill` timeout)
3. `tests/visual/features.spec.ts:107` — required state specimens …
4. `tests/visual/pages.spec.ts:10` — four final page compositions … (`heading "Dataset Explorer"` not found)

The accessibility snapshot of failure 1 shows the page title text in the banner
without a `heading` role. These failures exist on the unmodified tree and are out
of scope; phase 1 must not make them worse. Because these tests abort before
some captures, those captures are not rewritten by the suite on this tree.
The existing Spinner assertions (`tests/visual/atoms.spec.ts:68`, A3 reduced-motion
ring) **pass** at baseline.

## Pre-existing evidence PNG drift against HEAD

85 PNGs are committed under `docs/specs/web-client/evidence/`. After running the
suite on the unmodified tree, these differ from HEAD (rewritten by the capture
specs):

- `phase-4/explorer-1440.png`, `phase-4/explorer-expired-1440.png`,
  `phase-4/explorer-schema-1440.png`, `phase-4/overview-1440.png`,
  `phase-4/overview-exact-390.png`, `phase-4/overview-unavailable-1440.png`,
  `phase-6/overview-1440.png` (all three runs)
- `phase-4/overview-denied-1440.png` (first, parallel run only)

Capture runs are **not byte-deterministic** on this tree: between serial baseline
runs 2 and 3, `phase-4/overview-unavailable-1440.png` changed again, and run 1
vs run 2 differed in two files. So byte hash differences in the Overview/Explorer
phase-4/6 captures are baseline noise, not evidence of regression. The other 77
PNGs were byte-identical to HEAD in every baseline run.

Baseline-run copies (serial run 2) were kept outside the repo
(`/private/tmp/outage-motion/baseline-evidence`) for later visual comparison;
the committed PNGs were restored with `git checkout` after the baseline so the
tree stayed clean.

## Limitations

- Fixture/synthetic evidence only. `playwright.development.config.ts` and
  `playwright.auth.config.ts` need a live dev server / Flask backend; not part of
  this baseline.
