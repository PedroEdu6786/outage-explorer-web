# Phase 6 verification

Recorded October 4, 2026. **Fixture page milestone T6.1–T6.6/T6.C accepted;
phase remains blocked only for T6.L**. Live Auth/catalog/preview/metric/SQL
contracts and settings remain unresolved under Q2/Q3. No release acceptance,
commit, push or deployment occurred.

## Preconditions, ownership and scope

All four feature checkpoints T4.AC/OC/EC/QC, T5.H and T3.6/T3.8 were accepted
before route assembly; see [Phase 5](phase-5.md). One implementation worker
owns shared composition, all four ready route lanes, tests, configuration,
Queries public lifecycle changes and documentation. Existing working-tree work
is preserved. No nested workers or concurrent source writers were used.

Four thin routes import composed entries with reusable Auth/AppShell/analytical
templates. The production provider supplies only explicit unavailable operations
until T6.L registers approved adapters. SQL settings stay null in production;
no SQL defaults, transport routes, cookie/token storage or mock fallback were
invented. All fixture identity/settings/controls are under tests/ and Storybook.
The root redirects to /overview. Unresolved authentication withholds entire
protected trees rather than rendering hidden restricted navigation.

PageDemo imports the actual route and protected-layout modules into an injected
test root. Its navigation changes the rendered route composition; it does not
claim real Next router or live backend success. The separate production test
visits actual Next URLs, including root redirect, without any fixture interception.

The existing Queries controller is exported via its public feature index and
optionally injected, with lifetime owned by composition. Route unmount preserves
an edited draft and retained execution for handoff consent; session-generation
cleanup clears both, even while the SQL route is absent. Composition disposal
aborts/resets the controller. A successfully consumed intent is handled once per
controller lifetime to prevent consent reopening on an ordinary route revisit.
Existing internally owned feature usage still attaches/disposes normally.
This required seam change revalidated affected query, composed-harness and page
consumers; no feature-private import, shared contract or session-runtime change.

## Revision binding and actual checks

Base revision d85410486de5055237a4f66cde197250555e9bd8; branch
feat/web-client-foundation. [176-file manifest](phase-6-digests.json),
including untracked implementation, aggregate SHA-256 `86e03c887b064f5169e96fcb6da5195ed059e016dc2549064a86df7b8fc2238e`.
Final fresh webpack build ID `-1AAmKnDD8CRKUZqCG9l6`.

| Actual command | Result |
| --- | --- |
| node --version / npm --version | 24.18.0 / 11.16.0, matching pins |
| npm run typecheck | Passed |
| npm run lint | Passed |
| npm test | 132 tests passed, 18 files; four composition regressions added |
| npm run test:boundaries | 33 passed; unavailable versus ready registration covered |
| npm run check:boundaries | 88 modules / 13 production roots passed |
| npm run build | Passed; /, /sign-in, /overview, /datasets, /query and internal not-found routes |
| npm run check:production-fixtures | Passed after final fresh build; 118 emitted files |
| npm run build-storybook | Passed; existing Vite module-directive warnings remain |
| Chromium page/navigation suites plus affected feature-harness and visual pages | 14 passed; 9 page scenarios, 4 predecessor harness regressions, 1 eleven-width matrix |
| Chromium visual pages after additional schema/results/drawer captures | 1 passed; 13 mapped screenshots |
| Chromium production-failure with playwright.production.config.ts | 1 passed; all 5 URL entries fail closed, retry remains unavailable, no synthetic content or fabricated fetch/XHR |
| npm run check:release-boundaries | Expected failure: unavailable/unverified T6.L registration |
| git diff --check / content-manifest verification | Passed |

Browser commands use PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright.
Fixture checks run with npm run test:e2e and the named tests/browser page,
navigation and feature-harness specs plus tests/visual/pages.spec.ts, --workers=1.
Production check runs npx playwright test --config playwright.production.config.ts
--workers=1 on port6008, after production build. Storybook uses port6007.
Sandbox port binding required approved outside-sandbox execution. No checks were
skipped. Final browser runs have no page errors. Initial assertions were corrected
to use Overview's actual accessible inspection selector and scope hidden-element
checks to the page test root, excluding Storybook diagnostics. An overlapping
visual/production run initially shared Playwright output and failed during trace
cleanup; production now writes to a separate ignored output directory, and final
runs pass. This was tooling evidence failure, not a product behavior failure.

## Acceptance traces

| AC | Fixture/page proof and limits |
| --- | --- |
| AC1 | V1–V4/S1/P1 mapped to inspected saved Figma publication captures; 13 reviewed screenshots and deviations in [pages](pages.md); final Q4 sign-off remains open |
| AC5 | Deferred session and pending transitions mount no protected navigation, editor, tables or metadata; actual production unresolved failure remains withheld |
| AC17 | Drawer Enter/Escape focus restoration, accessible inspection/compare and tabs; all four pages contained at 1440/390 and inclusive edge matrix; desktop/mobile captures reviewed |
| AC18 | Visible synthetic test labels; source + fresh built-asset exclusion; real production URLs fail closed without fixture interception; live connected outage scenario awaits T6.L/T7 |
| AC19 | All feature/T5.H checkpoints precede page assembly; designated single writer; Queries seam's affected consumers revalidated |
| AC21 | Overview dates reach Explorer; Viewer-only authorized context; SQL handoff prepares unsent draft, requires consent for edited text, survives route switches, never executes implicitly |

Additional page traces verify exact 1.01% and zero/missing/date presentation,
Preview/Schema tabs, cursor expiry/restart, unchanged SQL per Run, same execution
ID/fixed-size pages and busy/lost result deliberate recovery. These are controlled
synthetic frontend proofs; no backend security, managed PKCE callback, connected
session or live query/metric claim is made.

## Remaining gate

T6.L remains unchecked because T5.5–T5.8 are blocked on approved Q2/Q3 contracts.
productionRegistration explicitly declares unavailable; the release checker
requires an explicit exported ready registration rather than merely finding a
placeholder filename. That structural guard is additional to real T6.L/T5.L
acceptance evidence, not proof of connected adapters. Q4 still gates final visual
and browser acceptance. Phase 7 was not executed; its live tasks remain gated.

Review the diff, then run /implement for phase 7.
