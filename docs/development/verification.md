# Reproducible checks and evidence

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
| `npm run dev` | Assembled Next routes; production operations unavailable until T6.L |
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
| `npm run check:release-boundaries` | Source/artifact checks with mandatory production registration; currently fails closed |
| `npm run storybook` | Isolated Next/Vite previews on port 6006 |
| `npm run build-storybook` | Serialize build into `storybook-static`; required before browser smoke |
| `npm run test:e2e` | Chromium browser/visual fixture scenarios against static Storybook server on port 6007 |

The general browser setup is `npx playwright install chromium`, followed by
`npm run build-storybook` and `npm run test:e2e`. On this workspace, Chromium
was downloaded under `/private/tmp/outage-web-playwright`; use
`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright` on both browser
installation and execution when choosing that cache. Temporary storage can be
removed by the host; reinstall if the browser executable is absent. Linux hosts
may additionally require Playwright's documented system dependencies. Browser
download, server binding and browser launch need their actual environment's
network/permission support; a skipped or blocked browser check is not a pass.

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
navigation; `tests/visual/pages.spec.ts` captures all four pages plus schema/results/
drawer states and checks the eleven-width matrix. See [Phase 6](../specs/web-client/verification/phase-6.md).

After a fresh `npm run build`, run the separate actual-production scenario:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.production.config.ts --workers=1
```

This starts Next on port6008 and uses no fixtures/interception. Default Storybook
checks exclude this spec and run on port6007. Production browser artifacts use
`playwright-report/production-results` separately from Storybook `test-results`;
serialize builds/captures and keep mutable browser output isolated. This scenario
verifies unavailable configuration fails closed; connected backend-failure/live
checks remain behind T6.L/T5.L. The explicit unavailable registration marker
continues to fail `npm run check:release-boundaries` until T6.L is accepted.

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
