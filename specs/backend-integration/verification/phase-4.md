# Backend integration phase 4: Production registration and pages

Completed T4.1–T4.4 and T4.C on October 5, 2026. This checkpoint accepts
structural registration and controlled frontend behavior. Original T5.L/T6.L,
connected lifecycle, backend authorization, Figma comparison and release
acceptance remain open. No real analytical HTTP request, SQL execution, refresh
admission or backend/resource change was performed.

## Source binding

Base revision `325aa1c939b1e80f3af601f17dac7f16aeee4d68`, branch
`feat/backend-integration`, plus the phase-4 working tree. Node `v24.18.0`, npm
`11.16.0`, existing dependencies. SHA-256 over sorted UTF-8 paths, NUL, file
contents, NUL: `b684d10b2f69d797ff42e2ec9ce4aa326874a37899b8dc2500a451128335850d`.
The digest covers these nineteen paths; this evidence, coordinator journal and
context synchronization, and generated declarations/artifacts are excluded:

- `README.md`
- `docs/development/verification.md`
- `docs/specs/web-client/execution-state.md`
- `playwright.controlled.config.ts`
- `specs/backend-integration/tasks.md`
- `src/composition/ProductionProvider.tsx`
- `src/composition/navigation.ts`
- `src/composition/production-operations.ts`
- `src/integration/config.ts`
- `src/integration/live-composition.test.ts`
- `src/integration/live-composition.ts`
- `tests/browser/overview-page.spec.ts`
- `tests/browser/query-page.spec.ts`
- `tests/development/data-production.spec.ts`
- `tests/development/login-return.spec.ts`
- `tests/development/logout.spec.ts`
- `tests/development/refresh.spec.ts`
- `tests/development/session-reload.spec.ts`
- `tests/pages/composition.test.tsx`

Both preexisting `.next/dev` imports in `next-env.d.ts` were restored after
framework type/build generation. Original feature checkpoints T4.AC/OC/EC/QC,
fixture harness T5.H, page assembly T6.C and integration phases 1–3 are accepted
predecessors with their existing evidence scope preserved.

Final configured production build ID: `7MBfTJbcqFQc561SUal5k`. Fresh configured
webpack build, artifact scan and actual Next controlled browser checks were run
together after development checks. The temporary unconfigured build had ID
`mnx5gdaa9uY-ixi6kUgup`; it was tested without interception, then replaced by
a fresh configured build. Backend origin/logout settings were read from existing
server configuration; credentials/configuration values were not logged.

## Controlled criterion contributions

| Criteria | Observed frontend behavior |
| --- | --- |
| AC1–AC5, AC21 | Production forwards catalog, embedded schema, preview and complete national operations through current authenticated transport. Actual Next Overview loads synthetic exact national values, hands date context to Explorer, and starts preview with default100. Existing feature/adapter tests retain optional dates, one-generation continuation completeness, missing-date gaps and explicit restart. No named-target cursor or metric claim. |
| AC6–AC11, AC21 | Actual production Analyst/Admin handoff prepares `SELECT * FROM national` without a POST. Explicit Run sends unchanged SQL once, query page1 and chosen size1, using auth-owned CSRF. Pagination uses query ID and fixed size in GET; edited draft, result identity and consent survive Next route navigation. Focus/online/remount do not POST. Query default100 is observed independently from preview100. Existing recovery/controller tests remain passing. |
| AC9, AC22 | Controlled browser clock advances beyond the original query expiry while session remains valid. Retained rows disappear, explicit Run remains the recovery path, draft is preserved and POST count stays one. Existing fake-clock unit tests retain timer disposal/replacement and recovery expiry coverage. |
| AC12, AC17 | Configured actual Next API503 reads fail explicitly on Overview/Explorer/SQL without fixture fallback; a SQL POST receiving the deliberately malformed 503 envelope becomes unknown outcome and is never replayed on focus/online/navigation. Contract-defined error envelopes retain their normalized unit-tested states. Unconfigured actual production routes/retry send no fetch/XHR and mount no protected content. Unit coverage proves unconfigured factory/navigation fail closed and pending session data dispatches nothing. |
| AC13, AC14 | Actual production Viewer direct `/datasets` and `/query` return to Overview before editor mounts. Analyst/Admin retain both analytical pages. Existing fixture harness covers delayed success/denial after access reduction/logout and consent cleanup; unit handoffs reject stale context, unavailable IDs, invalid calendar dates and unsupported facility filters. Backend role/foreign-user enforcement remains unaccepted. |
| AC15, AC16, AC18 | Actual production preserves exact integer strings beyond JavaScript safe integer range and null generation as “Reference-free execution.” Explicit uncommon string-cell injection renders `<img ...>` literally and mounts no image/script. Existing full unit suite retains rich positional/duplicate/empty/truncated output tests. No Figma comparison is claimed. |
| AC19 | Auth-owned memory-only CSRF accompanies configured SQL POST; token never enters session model. Existing UTF-8 bounds and transport guards pass. Real backend anti-forgery/Origin enforcement remains Phase5. |
| TR10 | Unit, fixture-browser and controlled actual Next evidence are separated below. Structural release boundaries passes; it does not accept original connected gates, AC20 authenticated lifecycle, or visual/width sign-off. |

Preview/query settings are separate objects, both default100/maximum500. Preview
controller and adapter already enforce1–500; the production provider supplies
its initial setting independently of next-execution SQL settings. Handoffs use
the accepted fixed public relation names national/facilities/generators, current
capabilities/generation and strict optional calendar filters. They remain in
memory and unsent; no catalog cache, SQL rewrite, URL/storage handoff, dependency
or protected state-owner migration was introduced.

## Checks actually run

| Check | Result |
| --- | --- |
| `npm run typecheck` | Final pass after browser test changes. |
| `npm run lint` | Final pass. Earlier optional-relation interpolation and unnecessary JSON type assertion were corrected. |
| `npm test` | Final264 tests across24 files passed. |
| `npm run test:boundaries` | 33 adversarial tests passed. |
| `npm run check:boundaries` | 102 modules/15 production roots passed. |
| `npm run build` | Configured production webpack builds passed; final configured artifact restored after unconfigured/development checks. |
| `npm run check:production-fixtures` | Final fresh configured graph/artifact scan passed,392 emitted files. |
| `npm run check:release-boundaries` | Passed mandatory registration and392-file fixture scan. Structural evidence only. |
| `npm run build-storybook` | Passed,274 transformed modules; existing module-level directive warnings. |
| Fixture browser run | 12 passed: navigation, Explorer, Overview, Queries and feature-harness suites; fresh Storybook on6007, Chromium temporary cache. |
| Configured actual Next browser run | Final4 passed using `playwright.controlled.config.ts`, production6009. All API requests intercepted with explicitly synthetic bodies. |
| Unconfigured actual Next browser run | 1 passed using `playwright.production.config.ts`, production6008, no interception; all five paths/retry had no fetch/XHR. |
| Existing development browser run | 19 passed on existing configured Next3000: login-return/logout/refresh/session-reload plus the new4 data cases. All analytical datasets/query requests are intercepted; controlled refresh/provider responses remain test-only. After final inert-string injection, affected4 data cases passed again. |
| `git diff --check` | Passed. |

Browser commands used `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`
and one worker. Production and fixture projects own separate ports/output
folders; builds were serialized. Initial sandbox port/Chromium launch denials
were retried through escalation and passed. Initial configured discovery required
a JSON import attribute; the first actual scenario failed an exact header matcher
against the longer rendered description. Both were corrected before final runs.
These were tooling/assertion failures, not suppressed test skips. No live check
was marked green, and no screenshot comparison was performed.

Commands for reproduction are in `docs/development/verification.md`; fixture run
selected `tests/browser/navigation.spec.ts`, `explorer-page.spec.ts`,
`overview-page.spec.ts`, `query-page.spec.ts`, `feature-harness.spec.ts` with
`npm run test:e2e -- ... --workers=1`. Development run used
`npx playwright test --config playwright.development.config.ts --workers=1`.

## Remaining gate

Phase5 requires the named enabled running backend/resources, authorized personas
and scenario support. The observed disabled analytical composition does not
establish these prerequisites. Original T5.L/T6.L and release/visual acceptance
remain open; no integration spec AC checkbox was closed by this controlled
checkpoint. User-owned backend isolation, ingestion and resource configuration
remain outside this work.

Review the diff, then run /implement for phase 5.
