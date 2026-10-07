# ui-motion — Phase 4 verification (feature micro-interactions)

Recorded October 6, 2026. **Implemented with fixture/synthetic evidence.** All four
motion phases are verified. Human [motion visual sign-off](visual-signoff.md) is
pending; none of this establishes live-integration acceptance or Figma fidelity.

One phase worker owned implementation/tests/stories and evidence; the coordinator
reviewed the diff/static comparisons and owns the final append-only devlog and
commit (T4.29). No additional implementation lanes ran concurrently.

## Revision binding

- Tested parent: `8fe01dfa26ca47e5c030d021c07b5204c5300eca` (selected Overview dates fix).
- Phase 3 is committed at `2b79cdc`; stale manifest state is corrected here.
- Working-tree SHA-256: 4581a7f92682152d9152ab0008dbc9f5b82193d63fb3072039f7a6489aedb0d8 (method in verification.md, excluding this
  self-referential record; before final coordinator devlog/task bookkeeping and commit).
- Node 24.18.0 / npm 11.16.0; Chromium cache
  `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`.
- References: [T1.1 baseline](baseline.md), [phase 1](phase-1.md),
  [phase 2](phase-2.md), [phase 3](phase-3.md). Motion extends the previously
  [inspected prototype](../../../docs/specs/web-client/design-inventory.md);
  static capture comparison is not renewed Figma inspection or fidelity sign-off.

## Commands actually run

| Command | Final result |
| --- | --- |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm test` | pass — 30 files, 386 tests (previous HEAD 378) |
| `npm run test:boundaries` | pass — 33 tests |
| `npm run check:boundaries` | pass — 108 modules, 15 production roots |
| `npm run build` (configured `.env.local`) | pass |
| `npm run check:production-fixtures` after final build | pass — 310 emitted files scanned |
| `npm run build-storybook` | pass |
| `npm run test:e2e -- --workers=1` | pass — **122 tests**, full motion-off/default browser + capture suite, including motion-on preference checks |
| `npm run test:e2e -- tests/motion --workers=1` | pass — **76 tests**, explicit `no-preference` / `reduce` checks |
| `npx playwright test --config playwright.controlled.config.ts --workers=1` | pass — **5 tests**, actual configured Next routes with synthetic intercepted APIs |
| `git diff --exit-code cef980d -- package.json package-lock.json` | clean against T1.1 baseline; also clean against HEAD |

Build/type generation and capture/server runs were serialized. The existing dev
server was left alone. Emitted-file counts include existing `.next/dev` artifacts
and are not comparable to a clean-only count. `next-env.d.ts` generated churn was
reviewed/restored. No dependency changes.

Intermediate checks found/fixed test issues: unscoped document `table` selectors
saw Storybook's hidden argument table; a text comparison included the injected
motion-off stylesheet and unpinned query expiry time; an Explorer focus assertion
incorrectly assumed existing selection-keyed filters survived Apply. The first
separate motion run saw an accepted opacity-only preview entrance still active
when paging started; the helper now excludes only named `fade-in`/bounded
`fade-rise` entrances and continues counting every other active animation.
Final results above supersede those diagnostic runs.

**Historical browser failures resolved.** The four failures documented at T1.1
and phases 1–3 were stale test fixtures: intended SQL stories used Viewer after
Viewer became Overview-only, and the Explorer page capture used a Viewer story
that redirected. SQL stories now use Analyst with matching shell identity; the
page capture uses the existing Analyst Ready Explorer story. Production
permissions are unchanged and the Viewer redirect/restriction test still passes.
All intended captures now execute; no forbidden screen replaces a SQL specimen.

Not run: live auth/development configs (need named live services), or the
unconfigured production config (phase-1-only requirement, unaffected). Controlled
production is synthetic evidence, including the existing Overview date/range and
ten-row paging regression; it is not a live backend check.

## Acceptance criteria mapped across phases 1–4 (T4.C)

| AC | Evidence and result |
| --- | --- |
| **AC1** | Foundation token/source guard, emitted one-rule token checks (phases 1–3), plus T4.18 shimmer call-site guard. New row/chevron utilities use `--duration-move`; fades/progress/pulses reuse named primitives. No ad-hoc component timing/easing or completion-event dependencies. E1 has no call site. Pass. |
| **AC2** | 76 motion checks cover controls, status/loading, drawer/templates/chart and final features under both preferences. Compare/results/header/schema use shortened opacity fade; row accent/chevron jump via zero movement duration; progress and coverage pulse have `animation-name: none`; schema expand is disabled. Existing chart wipe/spinner/drawer rules remain covered. Pass. |
| **AC3** | Clock-bound Overview/Explorer/Queries DOM comparisons match text/cells/points with motion on/off; prior entrance checks additionally compare reduced motion. Overview unit/browser assertions preserve calculated points, segment count/gaps and persistent SVG on compare; reported group alone fades. Inspection is unchanged text/role. No counting, interpolation, gap fill or inferred progress. Pass. |
| **AC4** | 386 unit tests and all122 browser tests pass. Refresh and QueryStatus keep the same live-region node across running/success, with one role/status per message. Copy keeps its accessible name/status and single restartable timer, reverts at 1500ms and cleans on unmount. Catalog and local filter edits keep focus; Apply retains existing selection-reset behavior. Direct DatasetSchema rerender preserves scroll-region identity/focus while only its table replaces. Drawer focus/return/Escape/keyboard checks from phases1–3 still pass. Pass. |
| **AC5** | Phase2 Explorer/SQL and phase3 Overview retained-series adversarial tests remain green (logout, expiry, pending, generation/capability changes, denial and late responses). New motion-on Explorer/SQL page scenarios dispatch paging then withhold session in the same task and find no protected tables, dim or expanded schema at the next frame; late work cannot restore it. Schema collapsed props remove content immediately (unit + controlled browser story); no exit retention. Pass. |
| **AC6** | Dependency manifests unchanged since T1.1; typecheck/lint/unit/boundaries/build/fixture scan pass. Five controlled real-route checks pass. Pass. |
| **AC7** | All75 phase-2/3/4/6 generated PNGs refreshed with motion off/disabled, all85 including10 unchanged prototype reference PNGs hashed against T1.1, all26 byte differences inspected visually. Full file SHA manifest and classified decisions below. Pass. |

AC1–AC7 are checked in the spec against this machine evidence. The separate human
motion-on sign-off stays pending.

## Feature behavior and deliberate limits

- Overview compare adds only a reported-series fade; no SVG remount/wipe replay.
  Selected calendar range filtering from `8fe01df` is preserved. Inspected card
  enters on its existing status element. Refresh uses existing StatusMessage
  spinner/icon transitions and success settle without keying the live region.
- Coverage date keys only a presentational span for one pulse. Verified in shell
  stories; production composition does not yet supply coverage and is unchanged.
- Dataset header keys only description/grain/coverage, excluding the SQL action.
  Schema uses domain-free optional DataTable content key/class props to key only
  the table and preserve its focusable scroll region. Preview fades on its
  pre-existing key; selection clears preview pages before replacement, so even
  datasets in one snapshot remount. Pagination controls stay outside that key.
  Row/filter changes are presentational; selection/filter handlers are unchanged.
- SQL progress is decorative and indeterminate while **busy** (execution or
  retained-page loading), unmounts when idle, and is static under reduce. Copy
  adds the decorative copy/check icon with a 1.5-second functional feedback timer.
  Results section fades on first appearance; pagination stays mounted.
- Schema chevron rotates; expand animates and collapse/removal is instant. The
  production controller's same-dataset click reloads schema (it never toggled
  closed). Controlled `SchemaCollapse` story and direct props tests prove instant
  removal; no new production collapse semantics were introduced.
- Shimmer remains off. No controller/session/adapter or production permission
  behavior changed. No live, human motion or Figma sign-off is claimed.

## Capture comparison and intentional differences (AC7)

The [file-by-file SHA-256 manifest](phase-4-capture-hashes.json) records T1.1,
pre-phase4 HEAD and freshly regenerated hashes/dispositions for all85 files.
The75 generated captures are under `phase-{2,3,4,6}`; the10 original Figma
reference PNGs at the evidence root were preserved. Regenerated75: **26 differ
from T1.1**, **23 differ from HEAD**. After review, four noise-only files were
restored; **19 meaningful refreshed PNGs remain changed against HEAD**.
All26 differing baseline pairs were visually inspected in nine paired contact
sheets (`/private/tmp/motion-phase4-captures/sheet-{1..9}.png`); coordinator also
reviewed SQL/Explorer sheets. This is agent static comparison, not human sign-off.

| File(s), relative to `docs/specs/web-client/evidence/` | Classification / decision |
| --- | --- |
| `phase-3/explorer-template-1440`, `overview-template-1440`, `shell-1440`, `workspace-template-1440` | **C1**, already accepted phase1 desktop indicator; 473 pixels each within navigation accent. Byte-identical to HEAD; retained. |
| `phase-4/explorer-schema-1440` | Four-pixel underline rasterization drift against baseline, already identical to HEAD. No new intentional motion geometry; unchanged. |
| `phase-4/explorer-1440`, `explorer-expired-1440` | Regenerated files match T1.1 but differ from HEAD by previously recorded native date-input capture drift. Noise-only; restored HEAD. |
| `phase-4/overview-denied-1440`, `overview-unavailable-1440` | Native date-input edge noise (25/23 baseline pixels), unrelated to motion. Restored HEAD. |
| `phase-4/explorer-390` | Refresh reaches formerly aborted mobile capture: current Viewer feature has no SQL handoff action; existing accepted permission restrictions and previously committed two-decimal MW truncation. Outside motion catalog; refreshed, no new permission behavior. |
| `phase-4/overview-1440`, `overview-390`, `overview-exact-390`; `phase-6/overview-1440`, `overview-390`, `navigation-390` | Previously committed ten-row size/pagination/description, exact MW display and selected-range chart behavior. Full-page height changes (exact mobile 1501→1662; Overview mobile/nav 1589→1750; desktop 1202→1339) are primarily added table controls. Outside motion catalog; refreshed. Existing C1/B4 styling where present remains accepted. |
| `phase-4/queries-1440`, `queries-390`, `queries-truncated-1440`, `queries-unknown-1440` | **D4** idle Copy icon and consistent chevron SVG; plus verification fixture correction Viewer→Analyst identity/three datasets (mobile catalog adds height). Explicit fixture correction, not production permission expansion. Refreshed. |
| `phase-6/explorer-1440`, `explorer-390`, `explorer-schema-1440`, `explorer-schema-390` | Verification fixture correction to Analyst Ready: identity and three-dataset authorized catalog, plus previously committed preview decimal display. Mobile full-page 1127→1279. Outside motion catalog; refreshed. Existing C1 indicator styling remains accepted. |
| `phase-6/query-1440`, `query-390`, `query-results-1440`, `query-results-390` | **D4** idle Copy icon/width and decorative chevron SVG (2509 changed pixels in toolbar/browser band per file). Result values and geometry otherwise unchanged; refreshed. |
| Remaining files | Byte-identical to T1.1, or unchanged pre-existing HEAD differences as described above; no additional intentional differences. |

The D4 busy bar adds2px while busy, as accepted; existing static capture scenarios
are idle/completed, so no persistent bar appears in their PNGs. D2/D3 fades and
coverage pulse have no motion-off geometry difference. Checkbox/Tabs/nav changes
from earlier phases remain attributed to their earlier catalog IDs, rather than
this phase. No unreviewed screenshot diff was accepted.
