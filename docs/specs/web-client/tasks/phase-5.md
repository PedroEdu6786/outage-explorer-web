# Tasks: Integration seams and gated live adapters
> Status: fixture and local data preparation verified; revised auth DTO/configuration/live acceptance pending · Slug: web-client · Plan phase: 5 · Manifest: ../tasks.md · Spec: ../spec.md

- 11 tasks; T5.1, T5.2 and T5.H accepted; live tasks remain unchecked. Paths below identify existing modules to reuse and planned additions; no live checkbox is completed by local preparation.
- Dependencies name completed tasks or explicit external readiness subgates. `[P]` permits concurrency only with disjoint ready work; it never waives predecessors.

- [x] **T5.1** Compose test-only cross-feature harness with shared session/catalog — `tests/integration/FeatureHarness.tsx`, `tests/integration/FeatureHarness.stories.tsx` (FR4, FR5, FR6, FR18, FR19, FR21, TR6, TR8)
  - Owner: **Integration**. Depends: **T4.AC, T4.OC, T4.EC, T4.QC**.
  - Acceptance: Use actual four feature controllers/public entries and one shared runtime; visibly synthetic provider exists only in test root. Exercise handoffs before any product page.
- [x] **T5.2** Verify composed invalidation, handoffs and SQL call invariants — `tests/integration/feature-harness.test.tsx`, `tests/browser/feature-harness.spec.ts`, `playwright.config.ts`, `vitest.config.ts` (FR4, FR5, FR6, FR12, FR13, FR14, FR16, FR19, FR21, TR6)
  - Owner: **Integration**. Depends: **T5.1**.
  - Acceptance: Delay metadata, success and 401/403-like fixture failures across Analyst logout → Viewer/access reduction; clear tables, autocomplete and pending intents. Overview → Explorer → SQL preserves authorized context, edited draft needs consent, no automatic execution.
- [x] **T5.H** Checkpoint: accept fixture integration harness for page assembly — `docs/specs/web-client/verification/integration-fixture.md` (FR4, FR5, FR6, FR12, FR13, FR14, FR16, FR18, FR19, FR21, AC4, AC5, AC6, AC12, AC13, AC14, AC16, AC18, AC19, AC21)
  - Owner: **Integration**. Depends: **T5.2**.
  - Acceptance: Record all four preceding feature gates and composed proof. This is the phase-6 predecessor; live tasks below may remain blocked and are never folded into this fixture pass.
- [ ] **T5.3** Resolve per-operation backend and session contracts before transport coding — `docs/specs/web-client/contracts/live-readiness.md`, `docs/specs/web-client/contracts/auth.md`, `docs/specs/web-client/contracts/catalog-preview.md`, `docs/specs/web-client/contracts/metric.md`, `docs/specs/web-client/contracts/sql.md`, `docs/specs/web-client/tasks.md`, `docs/specs/web-client/tasks/phase-5.md` (FR2, FR3, FR4, FR6, FR7, FR9, FR13, FR16, TR3, TR5, TR7, TR9)
  - Owner: **Integration**. Depends: **T1.9; revised auth DTO/target configuration; supplied data/SQL contracts**.
  - Acceptance: Blocked for affected operations until responsible person, backend version/environment, request/response/error/encoding/authorization and credential transport are approved. Before dependent code, record exact callback/bridge/server file paths if required and update tasks/DAG; do not invent them now. SQL adds page size/TTL/delivery/outcome. Record separate Auth, Catalog/Preview, Metric and SQL readiness subgates so unrelated agreed operations can proceed.
- [ ] **T5.4** Implement live-only adapter composition with fail-closed configuration — `src/integration/live-composition.ts`, `src/integration/config.ts`, `src/integration/data-http-client.ts`, `src/integration/data-http-client.test.ts`, `next.config.ts`, `.env.example`, `src/integration/live-composition.test.ts` (FR5, FR16, FR18, TR3, TR6, TR7)
  - Owner: **Integration**. Depends: **T5.3 Auth subgate; T1.10**.
  - Acceptance: Create typed live operation factory using approved transport; unavailable operations fail closed. No runtime fixture selector or demo imports. No credentials/SQL in URLs, secret serialization or implicit execute retries. Implement any newly recorded callback/bridge paths only after task expansion.
- [ ] **T5.5** Implement agreed session adapter and runtime decoding — `src/adapters/live/auth-adapter.ts`, `src/adapters/live/auth-schema.ts`, `src/adapters/live/auth-adapter.test.ts`, `src/features/auth/service.ts`, `src/features/auth/useAuth.ts`, `src/session/session-runtime.ts` and affected tests (FR2, FR3, FR4, FR5, FR6, FR16, TR3, TR6, TR7)
  - Owner: **Live-auth**. Depends: **T5.4; T5.3 Auth subgate and exact-path expansion**.
  - Acceptance: Navigate to backend login; Flask owns PKCE/exchange/callback. Decode backend identity/effective capabilities/expiry/CSRF without requiring role or sending permission claims. Keep CSRF in memory; reject stale responses, clear protected state on logout, retain scoped retry context on unconfirmed `503`, and confirm only on `204`. Verify fixed expiry, reload resolution, malformed/missing capabilities and `401`/`403`/network failures with controlled responses; no silent renewal or provider-token storage.
- [ ] **T5.6** Implement agreed authorized catalog/schema and preview adapters — `src/adapters/live/data-adapter.ts`, `src/adapters/live/data-schema.ts`, `src/adapters/live/data-mapping.ts`, `src/adapters/live/table-mapping.ts`, `src/adapters/live/data-adapter.test.ts` (FR6, FR7, FR8, FR9, FR11, FR16, TR3, TR4, TR6, TR7)
  - Owner: **Integration (serialized shared data modules)**. Depends: **T5.4; T5.3 Catalog/Preview subgate**.
  - Acceptance: Reuse the locally tested modules; support date-only optional bounds and valid out-of-coverage empty results, schema from catalog and current/next cursors. Decode allowed metadata/coverage/cursor/snapshot/expiry at untrusted boundary and map to feature contracts; preserve original expiry and identifiers. Do not treat source EIA route names as API/SQL names.
- [ ] **T5.7** Implement agreed national-series adapter and exact-value mapping — `src/adapters/live/metric-mapping.ts`, shared `data-adapter.ts`/`data-schema.ts`/`data-adapter.test.ts` under `src/adapters/live/` (FR10, FR11, FR16, FR20, TR3, TR6, TR7)
  - Owner: **Integration (serialized shared data modules)**. Depends: **T5.4; T5.3 Metric subgate**.
  - Acceptance: Reuse the locally tested full national preview collector and rational mapping; collect one complete generation without implicit SQL. Validate exact/display percentages, dates, units, same-observation values and gaps. Backend remains metric authority; never recalculate through binary-number display formatting.
- [ ] **T5.8** Implement agreed query execute and retained-page adapters — `src/adapters/live/error-mapping.ts`, shared `data-adapter.ts`/`data-schema.ts`/`data-mapping.ts`/`data-adapter.test.ts` under `src/adapters/live/`, `src/features/queries/service.ts` and affected tests (FR11, FR12, FR13, FR14, FR15, FR16, TR3, TR5, TR6, TR7)
  - Owner: **Integration (serialized shared data modules)**. Depends: **T5.4; T5.3 SQL subgate**.
  - Acceptance: Reuse locally tested synchronous POST/retained GET mappings and rich cells. Preserve totals/limits/retry metadata and explicit owned-query GET recovery. Decode ordered positional columns/rows, query ID/size/TTL/truncation/errors; exact SQL unchanged, page requests never execute. Preserve unknown execute outcome; no generic retry or invented status mapping.
- [ ] **T5.9** Create real-environment browser verification scenarios — `tests/live/session-access.spec.ts`, `tests/live/data-preview-metric.spec.ts`, `tests/live/query-lifecycle.spec.ts`, `tests/live/environment.ts` (FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR20, TR3, TR6, TR9)
  - Owner: **Integration**. Depends: **T5.5, T5.6, T5.7, T5.8**.
  - Acceptance: Author route-aware real-provider/backend scenarios after contracts are known; configure separate live project without fixture interception, secrets in source or automatic destructive data controls. Missing environment/accounts/lifecycle controls report blocked, never a green skipped acceptance. Browser execution occurs in phase 7 after pages.
- [ ] **T5.L** Checkpoint: accept versioned live adapters for release verification — `docs/specs/web-client/verification/integration-adapters.md` (FR2, FR3, FR4, FR6, FR7, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR20, TR3, TR5, TR7, TR9, AC2, AC6, AC7, AC9, AC10, AC11, AC12, AC13, AC14, AC15, AC16, AC20)
  - Owner: **Integration**. Depends: **T5.9**.
  - Acceptance: Reconcile adapters with approved backend version and contract tests; run each agreed operation against target environment. Missing revised auth DTO, target configuration or actual backend evidence keeps this incomplete, independently of T5.H. Release still needs phase-7 end-to-end evidence.

## Run outcome — October 4, 2026

T5.H fixture-only acceptance is recorded in [integration-fixture.md](../verification/integration-fixture.md) and the [Phase 5 summary](../verification/phase-5.md). Test discovery configuration transfers belong to Integration for T5.2: Playwright discovers `tests/browser/**`; Vitest excludes that browser root. No feature public contract or product route changed.

T5.3 remains blocked: all four per-operation subgates in [live-readiness.md](../contracts/live-readiness.md) lack external Q2 agreement; SQL additionally lacks Q3. T5.4–T5.9 and T5.L cannot start without those predecessors. No callback/bridge paths or transport settings were invented. T5.H independently unlocks Phase 6 fixture page assembly in a subsequent authorized run.

## Contract intake — October 5, 2026

The user requested documentation before implementation and supplied auth only.
[Auth](../contracts/auth.md) now records endpoints, cookie/CSRF transport and
backend callback ownership, with source revision/digest and frontend mapping
gaps. [Readiness revision 2](../contracts/live-readiness.md) supersedes the lack
of auth transport information above. T5.3 remains incomplete: target configuration,
owner, identity/capability mapping and pending/confirmed logout handling remain;
service contracts/Q3 are awaited. No task checkbox or implementation acceptance
changes. Exact proxy/configuration paths must be assigned before transport coding;
the frontend does not own an OAuth callback or code exchange.

## Service contract intake — October 5, 2026

The subsequent user handoff supplies [Data API v1](../contracts/data-api.md),
with local OpenAPI/fixture snapshots and separate [catalog/preview](../contracts/catalog-preview.md),
[metric](../contracts/metric.md), [SQL](../contracts/sql.md) and
[refresh](../contracts/refresh.md) records. Q3 contract values are now supplied.
[Readiness revision 3](../contracts/live-readiness.md) supersedes the missing
service-contract inputs above; all data/refresh runtime endpoints remain pending.

Before implementation, resolve the [comparison findings](../contracts/contract-review.md):
T5.5 session/catalog capability composition and logout handling; T5.6 date-only
scope, date bounds, embedded schemas, cursor and richer table mappings; T5.7
multi-page national preview and exact fractions; T5.8 result types, errors and
owned out-of-range recovery. Shared-seam changes require explicit ownership and
consumer revalidation. Request source corrections B1–B3 before treating those
fixtures as conformance proof. No task checkbox is completed by this intake;
Admin UI scope and all live/release gates remain unchanged.

## Authorized local adaptation — October 5, 2026

The user now authorizes frontend adaptation while no API responses are expected.
This supersedes the earlier ban on dependent **local data preparation**; full
T5.3 target/environment and T5.L acceptance remain incomplete. Capability fields
will be added by the backend; auth composition waits for the expanded DTO.

Coordinator is sole writer, sequentially, for these concrete additions/changes:

| Step / predecessors | Owned paths | Status |
| --- | --- | --- |
| P1 — accepted fixture checkpoints and user decisions | `src/contracts/*`, affected Explorer/Overview/Queries consumers, DataTable, synthetic test consumers | Models and UI adapted; no auth/runtime behavior change |
| P2 — P1 and supplied v1 snapshots | `src/adapters/live/data-schema.ts`, `table-mapping.ts`, `data-mapping.ts`, `metric-mapping.ts`, `error-mapping.ts`, `data-adapter.ts`, `data-adapter.test.ts` | Controlled decoders/mappings/operations prepared |
| P3 — P2 | `src/integration/data-http-client.ts`, `data-http-client.test.ts` | Injected cookie/CSRF transport prepared, not registered in production |
| P4 — P1–P3 | `verification/contract-adaptation.md`, contract/context/plan/ledger updates, affected unit/browser checks | Local evidence recorded separately from T5.L |

No frontend callback/bridge route or deployment/proxy destination is introduced.
The eventual auth integration must supply current-session and in-memory CSRF
providers. T5.4–T5.8 above now reuse the implemented paths; preparation
consolidates data validation/mapping into the explicit P2 paths instead of
inventing separate schema HTTP calls. No live-task checkbox is closed by this
local preparation. Future production registration still depends on the expanded
auth contract, configured target, and versioned live acceptance.

### Auth ownership clarification — October 5

T5.5 must consume backend-resolved effective capabilities and must not send role
or capability claims, derive capabilities from a local role matrix, or require a
role field in the revised response. Session GET uses only the session cookie;
backend checks remain authoritative on every service request. The [response
proposal](../contracts/auth.md#backend-implementation-handoff) is not a request
body or finalized wire schema. Await the updated backend DTO before auth mapping.

### Configuration/composition paths for remaining work

Integration exclusively owns `src/integration/config.ts`,
`src/integration/live-composition.ts`, `src/integration/live-composition.test.ts`,
the existing `data-http-client.ts`/test, `next.config.ts` and planned `.env.example`.
Use an explicit server-side backend target for the local same-origin `/api` proxy;
preserve redirects/Set-Cookie and document actual callback/UI origins. No secret
values, guessed target URL or frontend OAuth callback route are introduced by
this path assignment. Product registration stays in
`src/composition/production-operations.ts` under T6.L. Auth owns the T5.5 files
listed above; shared runtime/model changes and consumer tests remain serialized.

The main task records describe remaining completion, not a need to rewrite P1–P4
preparation. T5.6–T5.8 no longer carry parallel flags because their implemented
modules overlap. All live checkboxes remain open until their evidence is met.
