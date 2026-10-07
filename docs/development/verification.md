# Reproducible checks and evidence

Use [current status](current-status.md) for implemented behavior and open release
gates. Dated command outcomes below describe their recorded checkpoint; they
are not expected results for every later configured build.

T1.11 documents the installed workflow. The coordinator accepts task evidence
under `docs/specs/web-client/verification/` and updates the execution ledger.
No command listed as a workflow implies it has already passed for a later task.
Acceptance always records commands actually executed against the integrated tree.

## Environment and command prerequisites

Use `.nvmrc` (Node 24.18.0), npm 11.16.0 and the committed lockfile. After
`nvm install` / `nvm use`, verify `node --version` and `npm --version`; if npm
differs, install the pinned npm version before `npm ci`. Direct versions,
official compatibility evidence and the supported webpack choice are in
[toolchain.md](toolchain.md).

| Command | Purpose / prerequisite |
| --- | --- |
| `npm ci` | Install exact lockfile; network and cache-write access required |
| `npm run dev` | Assembled Next routes; configured production auth/data operations |
| `npm run build` | Serialized webpack production build into `.next` |
| `npm run start` | Serve an existing production build; requires local port access |
| `npm run typecheck` | Generate Next route types, then strict TypeScript without emitting JS |
| `npm run lint` | ESLint 10 strict TypeScript and JS flat rules; no Next/React-specific lint coverage claimed |
| `npm test` | Vitest behavior/contract/RTL tests; includes `src` and `tests`, excludes Playwright tests |
| `npm run test:watch` | Interactive Vitest development runner |
| `npm run test:boundaries` | Node test runner with independent adversarial temporary trees |
| `npm run test:devlog` | Standalone Python 3 standard-library checks for the Codex journal; see [devlog setup](devlog.md) |
| `npm run check:boundaries` | Transitive imports plus source layer/public-seam policy |
| `npm run check:production-fixtures` | Source check plus emitted signature scan; requires a fresh production build |
| `npm run check:release-boundaries` | Source/artifact checks with mandatory structural production registration; no live acceptance inferred |
| `npm run storybook` | Isolated Next/Vite previews on port 6006 |
| `npm run build-storybook` | Serialize build into `storybook-static`; required before browser smoke |
| `npm run test:e2e` | Chromium behavior/layout fixture checks against Storybook on port 6007; no saved-evidence writes |
| `npm run capture:evidence` | Opt-in visual suite; fresh Storybook required; PNGs under ignored `playwright-report/capture-results/` |

The general browser setup is `npx playwright install chromium`, followed by
`npm run build-storybook` and `npm run test:e2e`. On this workspace, Chromium
was downloaded under `/private/tmp/outage-web-playwright`; use
`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright` on both browser
installation and execution when choosing that cache. Temporary storage can be
removed by the host; reinstall if the browser executable is absent. Linux hosts
may additionally require Playwright's documented system dependencies. Browser
download, server binding and browser launch need their actual environment's
network/permission support; a skipped or blocked browser check is not a pass.

## Deliberate screenshot capture

`npm run test:e2e` keeps the visual suite's behavior, font, responsive and
accessibility assertions, but screenshot calls are disabled. Neither ordinary
runs nor capture runs write into `docs/specs/web-client/evidence/`.

To generate review candidates, build Storybook and run the separate project:

```sh
npm run build-storybook
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run capture:evidence
```

The capture project opts in through `metadata.captureScreenshots`, runs one
worker, and saves PNGs inside per-test directories under
`playwright-report/capture-results/`, retaining `phase-N/<filename>.png` names.
Normal runs use `test-results/`; they do not clean or overwrite capture output.
Capture reruns clean their own output, so preserve pending review candidates
elsewhere before rerunning. Serialize runs sharing the Storybook server port6007.

Compare candidates with the corresponding committed images and inspect meaningful
differences. Copy only reviewed, intentional replacements into the evidence
folder, record the reason and reviewer, then stage those selected files. The
capture command neither promotes candidates nor approves visual fidelity.
Keep synthetic captures, live integration and human visual sign-off separate.

## Verification sequence and shared resources

Run type/lint, relevant behavior tests, boundary adversarial tests and source
checks. Then serialize the production build and emitted fixture scan. For
component/browser changes, serialize the Storybook build and run affected browser
tests. The tooling smoke alone proves tooling and keyboard interaction. Phase 6 page
scenarios compose actual route modules in isolated fixture roots; the separate
production scenario visits actual Next URLs without fixture interception. None
proves live authentication before the live contracts/registration gates pass.

One coordinator assigns exact paths and accepts each prerequisite before its
successor starts. Foundation owns package/config/check scripts; Integration owns
contracts, session runtime, fixtures and later live composition. Feature lanes
consume the accepted public operations and expose their own `index.ts`. Request
shared changes from that owner rather than editing a sibling's files. Consult
[ownership.md](ownership.md) and the execution ledger for explicit transfers.

Package installs, production builds, Storybook output, shared snapshots and root
configuration writes are serialized. Read-only tests may overlap only with
isolated output directories, ports, browser contexts and external state.
Current ports 6006/6007 belong to Storybook development/browser smoke respectively.
New product browser projects should name their own harness and mutable resources.

## Revision binding and artifact freshness

Record the git revision and a content digest covering the tested working tree,
including untracked implementation files. For example, this hashes sorted
tracked/untracked nonignored file paths and contents without generated outputs:

```sh
git rev-parse HEAD
node --input-type=module -e 'import {execFileSync} from "node:child_process"; import {readFileSync} from "node:fs"; import {createHash} from "node:crypto"; const h=createHash("sha256"); const files=execFileSync("git",["ls-files","--cached","--others","--exclude-standard","-z"],{encoding:"utf8"}).split("\0").filter(Boolean).sort(); for(const path of files){h.update(path);h.update("\0");h.update(readFileSync(path));h.update("\0");} console.log(h.digest("hex"));'
```

Run the build against that integrated source, then scan its output and record
both results together. The artifact checker validates existing `.next` files;
it cannot prove they match newly changed source. A stale build's clean scan is
insufficient. Source-graph traversal and emitted signatures complement each
other; neither proves backend authorization or design fidelity. Recheck affected
consumers and invalidate earlier acceptance if an accepted shared seam changes.

## Separate evidence classes

| Evidence | Required record | What it establishes |
| --- | --- | --- |
| Fixture behavior | Task/FR/TR/AC IDs, source revision/digest, actual commands/results, deterministic scenario/call traces | Controlled frontend semantics; data is explicitly synthetic |
| Visual comparison | Inventory IDs, story/route and state, viewport, screenshot path, reference/deviation record, reviewer | Comparison to inspected design; no live/auth claim |
| Live integration | Accepted backend/contract version, environment, actual operation/request traces, permission/session outcomes | Real connected behavior; blocked operations stay incomplete |

Visual work compares 1440×1100 and 390×1100 and checks immediately below/at/above
1000, 760 and 480px. Stable synthetic values, loaded fonts and controlled
animation/time make captures reviewable. Record accessibility extensions and
required prototype corrections. A tooling story screenshot is not a product
fidelity result.

The [auth handoff](../specs/web-client/contracts/auth.md) now documents credential
transport and auth paths; target configuration, frontend mapping and live checks
remain pending. [Data API v1](../specs/web-client/contracts/data-api.md) now supplies
service contracts; backend runtime and documented discrepancies remain pending. Do not invent API paths/settings
or substitute fixtures after failures. Production registration,
failure behavior, live session/permission/pagination checks and the final release
checkpoint are later gates. Fixture-page acceptance does not accept a release.

## Evidence already observed during Foundation tasks

The pinned install and complete dependency tree passed. Bootstrap build/type/lint
passed; default Turbopack failed on an internal worker port and the supported
webpack build passed. Storybook build passed; two RTL harness tests and one
Chromium smoke test passed with no page errors. T1.10's 31 adversarial boundary
tests passed. Its source check examined 12 modules/one production root and its
fresh build artifact scan examined 49 emitted files. Release boundaries failed
as expected because production operation registration is absent.

These are task-specific observations, not the final Phase 1 checkpoint. The
coordinator's final integrated runs and Integration's shared runtime/fixture
tests establish that checkpoint separately. No Foundation task has provided
live integration or product visual-comparison evidence.

The coordinator subsequently reported integrated type/lint, 38 Vitest tests,
fresh webpack build, 49-file artifact scan, Storybook build and one actual
Chromium browser test passing. The tested 43 source/test/script/config files
retained digest `26bca88893cf89e64225b36f96012513aada6f3155c2fdc66343bf1e9b4afc65`
before/after build, with build ID `sfxyFofKfbhgboPh1IIDn`. Final acceptance and
the full task/requirement traces belong to the
[Phase 1 verification record](../specs/web-client/verification/phase-1.md).

Phase 5 browser scenarios live in `tests/browser/`; Playwright discovers this root and Vitest excludes it. Run `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/browser/feature-harness.spec.ts --workers=1` after the Storybook build for composed fixture handoff/invalidation/paging proof. See [Phase 5 verification](../specs/web-client/verification/phase-5.md); this test-only harness does not verify live product routes.

Phase 6 fixture routes use `tests/pages/*Page.stories.tsx` and PageDemo, importing
actual thin route/layout modules with injected synthetic operations. The page
browser suites are sign-in-page, overview-page, explorer-page, query-page and
navigation; `tests/visual/pages.spec.ts` checks the eleven-width matrix and,
under the capture project, emits all four pages plus schema/results/drawer states. See [Phase 6](../specs/web-client/verification/phase-6.md).

After a fresh `npm run build`, run the separate actual-production scenario:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.production.config.ts --workers=1
```

This starts Next on port6008 and uses no fixtures/interception. Default Storybook
checks exclude this spec and run on port6007. Production browser artifacts use
`playwright-report/production-results` separately from Storybook `test-results`;
serialize builds/captures and keep mutable browser output isolated. This scenario
verifies unavailable configuration fails closed; connected backend-failure/live
checks remain behind T6.L/T5.L. At this original unconfigured checkpoint the
unavailable registration marker failed `npm run check:release-boundaries`.
Configured production registration now passes that structural check; this
does not accept T6.L or T5.L connected behavior.

## Contract adaptation checks — October 5

See [contract-adaptation evidence](../specs/web-client/verification/contract-adaptation.md)
for current affected-consumer, decoder, injected HTTP, browser and build results.
Data adapter tests use supplied synthetic response examples; HTTP tests inject
fetch responses and make no backend requests. The user expects API unavailability;
expanded auth capabilities and live integration remain pending.

## Local auth checks — October 5

Auth-only live composition is opt-in through server-only OUTAGE_API_ORIGIN.
The local target is Flask http://localhost:8000, with Next http://localhost:3000;
the backend UI origin must match3000, while its existing callback8000 remains.
Restart/rebuild Next after changing the target; rewrite configuration and the
server-supplied enabled flag belong to the same build environment.
External rewrite transport follows the [official Next documentation](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites);
only the enabled boolean reaches client props, following
[environment guidance](https://nextjs.org/docs/app/guides/environment-variables).

Run a fresh configured build, then
`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.auth.config.ts --workers=1`.
The isolated project uses real Flask and no interception, fixtures, traces,
videos or screenshots; actual cookies/PKCE values must not enter evidence.
It checks signed-out session, login redirect/binding cookies and signed-out
logout Origin handling. Missing backend/configuration fails, never silently skips.
Authenticated Cognito completion, reload/reopen, role changes and independent
sessions still need separately coordinated accounts and live evidence.
Vitest excludes tests/live; Storybook projects do not discover them.

For unconfigured production checks, build with `OUTAGE_API_ORIGIN='' npm run build`,
then run the production Playwright project with the same empty override. Restore
a configured build afterward before running local auth or starting the frontend.
See [auth evidence](../specs/web-client/verification/auth-integration.md).

## Development login-return regression

`tests/development/logout.spec.ts` also verifies `204` produces a document
navigation to Cognito with only the public client ID and explicit return URL,
then returns to `/sign-in` with controlled session `401`. A `503` clears protected
content and offers retry without provider navigation. These tests intercept API
and provider responses, so they do not prove real Cognito cookie clearance or
the next credential prompt. Run them with the same development Playwright command
below, after configuring the public logout settings described in the README.

With `OUTAGE_API_ORIGIN` configured in `.env.local`, run `npm run dev` on
localhost:3000, then in a separate terminal run:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.development.config.ts --workers=1
```

This project uses the already running development server and isolated browser
contexts. It intercepts only the session endpoint with explicitly synthetic
signed-out/Viewer/Analyst/Admin responses; it does not complete Cognito sign-in
or prove live session acceptance. It verifies the HTTP307 root redirect,
session restoration under development Strict Mode, authenticated sign-in-page
navigation and absence of browser runtime errors. No traces, videos or
screenshots are recorded. Cold route compilation has a15-second assertion budget.
The suite is separate from Storybook, production, live auth and Vitest discovery.

## Backend-integration Phase 4 controlled production checks

After a configured fresh `npm run build`, run:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.controlled.config.ts --workers=1
```

This separate test-only project serves actual Next production routes on6009.
Every API request is intercepted with synthetic responses; it verifies role
presentation, data registration, independent sizes, handoffs, retained SQL and
explicit failures without reaching backend analytical services. Its output is
`playwright-report/controlled-results`; it closes no live/visual gate.

For unconfigured production failure, build with `OUTAGE_API_ORIGIN='' npm run build`,
then run the existing `playwright.production.config.ts` on6008. Rebuild with the
intended configured environment afterward before serving the app. Serialize these
builds and production servers; fresh output is required for fixture/release scans.
The release-boundaries marker establishes registration and source/artifact
isolation only. T5.L/T6.L still require named-target connected acceptance.

## Motion checks (ui-motion)

Motion is an extension (see the [motion spec](../../specs/ui-motion/spec.md));
phase records live in `specs/ui-motion/verification/`. These are fixture/synthetic
checks; they are neither live-integration nor Figma-fidelity evidence.

- **Storybook `motion` global.** Default `off`: the preview injects the test-only
  stylesheet from `tests/support/motion-off.ts` (zero animation/transition
  duration and delay, iteration count 1), so captures and behavior assertions see
  end states. Use the toolbar "Motion" toggle, or append `&globals=motion:on` to a
  story iframe URL, to review motion. The stylesheet never enters `src/` or app output.
- **Reduced-motion and token check.** After `npm run build-storybook`, run
  `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/motion --workers=1`.
  The specs open stories with motion on and switch `emulateMedia` between `reduce`
  and `no-preference`, asserting computed values with retrying matchers (never
  timing). `tests/motion/**` is excluded from Vitest; the source-scan guard is
  `tests/components/motion-guard.test.ts`.
- **Real-route configs** (development, controlled, production, auth) set
  `use.reducedMotion: "reduce"`; they assert behavior only and capture nothing.
- **Capture comparison (AC7).** Use `npm run capture:evidence` with motion off
  to create ignored candidates, then compare matching phase/filename images with
  committed evidence and the phase-1 baseline (`specs/ui-motion/verification/baseline.md`).
  Review differing files visually before copying intentional replacements into
  the evidence folder. Some Overview/Explorer captures are not byte-deterministic
  even on an unmodified tree; the baseline lists them. Ordinary tests leave the
  committed PNGs untouched; no restore step is needed after an ordinary run.

### Skeleton and loading conventions

- **Skeletons are decorative.** `Skeleton` and `TableSkeleton` are always
  `aria-hidden`, render no text, number or status, and never animate (shimmer is an
  unused, default-off option). They stand in for a value that has not arrived and
  must never show zero, "Unavailable" or a date.
- **Banners announce.** The existing `StatusMessage` banner ("Loading national
  observations", "Loading preview", "Loading schema") keeps its node, role and text;
  it is the only live region. Its icon swap is decorative (`aria-hidden`).
- **`loading` props.** `MetricValue.loading` swaps the value slot for a placeholder
  (explicit `false` fades the real value in). `DataTable.loading` dims content that
  the caller retained: `aria-busy`, `inert` and `aria-hidden`, cells untouched. The
  caller owns what is retained; Explorer and SQL paging reuse controller state that
  logout, expiry and access change already clear, so no stale rows survive. Overview
  shows first-load skeleton cards and guarded retained series on range changes (see below).
- **Geometry.** Skeletons use the real padding and line-height strut so the swap does
  not shift layout (`tests/motion/status-loading.spec.ts` compares card and row
  heights). Skeleton-bearing pending states are expected, recorded capture differences.
- **Checks.** `tests/motion/status-loading.spec.ts` (reduce vs no-preference, one live
  region, text identical with motion on/off); RTL scenarios in the Overview, Explorer
  and Queries feature tests cover first-load skeletons and paging dim/invalidation.

### Entrances, drawer, chart and retained-series conventions (phase 3)

- **Drawer.** `AppNavigation`'s native `<dialog>` slides and fades its backdrop at or
  below 1000px through the `motion-drawer` utility (CSS only: `@starting-style`,
  `transition-behavior: allow-discrete` on `display`/`overlay`). `showModal`/`close`,
  focus placement, return-focus and `cancel` handling are untouched, `close()` is
  synchronous and nothing awaits a transition event. During exit the dialog is
  `pointer-events: none` and shows already-updated content. Above 1000px no transition
  exists, so crossing the breakpoint never flashes. Under reduced motion open and close
  jump. `tests/motion/entrances.spec.ts` asserts these computed states (no timing), and
  `tests/visual/shell.spec.ts` runs the focus-trap, return-focus, Escape and sign-out
  scenario with `globals=motion:off` and `globals=motion:on`.
- **Chart wipe.** The persistent trend `svg` has a left-to-right `clip-path` wipe
  (`chart-wipe`); points, segments and gaps are never moved or interpolated, the compare
  toggle keeps the same `svg` (no replay) and reduced motion has no wipe. The Storybook
  motion-off sheet sets durations to 0, so the end state (`clip-path: none`) is visible
  at once. The header scroll shadow is a scroll-linked progressive enhancement; the
  motion-off sheet disables it (it has no end state of its own).
- **Entrances.** Template slots, metric cards and the first ten table rows rise with a
  capped stagger (`--stagger-index`); content is in the DOM and operable immediately.
  Tables inside Tabs panels use `entrance="none"` because a hidden panel restarts
  descendant animations whenever it is displayed.
- **Overview `retainedSeries` (AC5).** On a range change the previous series is shown
  dimmed (about 50%; the table uses the shared `DataTable` loading dim), `inert` and
  `aria-hidden` while the new one loads. It is derived in `useOverview`: non-null only
  while loading, bound to its session generation and requiring an authenticated session
  with `canReadNationalSeries`; it is cleared by runtime cleanup, any failure (including
  `forbidden`), the end of loading and `reloadMetadata`, and never feeds `series`,
  `explore()` or navigation. `src/features/overview/retained-series.test.tsx` covers the
  matrix (logout, expiry, pending, `beginLogout`, new generation, capability loss,
  forbidden/other failure mid-refetch, publication reload) and that a late response
  cannot restore it. The page scenario in `tests/browser/overview-page.spec.ts` (motion
  on) withholds the session right after a range change and asserts no protected content
  or dim remains; the held-dim state itself is shown by the `Features/Overview`
  `RangeChangeRefetch` story and asserted in `tests/motion/entrances.spec.ts`.
  The chart now consumes the selected range directly, filtering retained rows and
  updating axis dates during refetch. The controlled production pagination scenario
  holds the replacement HTTP response and asserts the chart narrows from 23 points
  to five before release, then checks completion and expansion back to 23. Overview
  component regressions additionally cover both bounds, compare, inspection, open
  bounds and empty windows against broader supplied data. These remain synthetic
  behavior checks, with no live API or visual-comparison acceptance implied.

### Feature micro-interactions and final motion evidence (phase 4)

- `tests/motion/features.spec.ts` checks compare-series opacity, inspected cards,
  keyed coverage dates, catalog accent, dataset-switch fades, filter feedback,
  SQL busy progress, Copy icon swap, results entrance and schema expansion with
  motion on under both preferences. Its clock-bound DOM comparison checks
  Overview/Explorer/Queries text, cells and chart points with motion on/off.
- The SQL bar is decorative, indeterminate and state-bound to `busy` (execution
  or retained-page loading); it unmounts immediately when idle and stays static
  under reduce. Copy uses one restartable 1.5-second feedback timer, cleaned up
  on unmount, and keeps its button name and separate copy-status live region.
- Dataset switches key only presentational header/table content. Schema table
  replacement preserves its focusable scroll region through `DataTable.contentKey`;
  pagination and SQL actions are outside the new keyed content. Filters retain
  their existing state/handlers and existing selection-driven reset behavior.
- Schema expand animates; collapse/removal is immediate to avoid retaining
  protected metadata for an exit. The production controller reloads a clicked
  selected dataset; this phase adds no toggle semantics. A controlled component
  story (`Features/Queries/SchemaCollapse`) verifies expanded-to-collapsed props.
- Coverage pulse is verified in shell stories; production composition still does
  not supply coverage. E1 shimmer remains unused at all call sites.
- Run all [phase gate commands](../../specs/ui-motion/tasks.md#phase-gate-commands),
  including the configured real-route controlled config, with builds and capture
  runs serialized. `npm run capture:evidence` creates candidates for the complete
  phase-2/3/4/6 PNG set with `motion:off` plus `animations: "disabled"`. Compare
  candidates by phase/filename and SHA-256 to T1.1, then visually inspect
  differing images before promotion. Record intentional catalog differences,
  earlier committed product changes, fixture corrections and capture noise
  separately. Do not replace intended SQL/Explorer captures with forbidden screens.
- Final machine evidence is [phase-4.md](../../specs/ui-motion/verification/phase-4.md).
  **Human motion visual sign-off** is a separate evidence class in
  [visual-signoff.md](../../specs/ui-motion/verification/visual-signoff.md), pending
  until a named reviewer records the date and motion-on states reviewed. Machine
  captures, reduced-motion assertions and an agent's image review do not close it.
  Neither evidence class establishes live integration or Figma fidelity.
