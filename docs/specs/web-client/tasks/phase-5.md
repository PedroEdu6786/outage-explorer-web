# Tasks: Integration seams and gated live adapters
> Status: fixture checkpoint accepted; live branch blocked on Q2/Q3 · Slug: web-client · Plan phase: 5 · Manifest: ../tasks.md · Spec: ../spec.md

- 11 tasks; T5.1, T5.2 and T5.H accepted; live tasks remain unchecked. Paths are repository-relative planned additions unless noted in the manifest.
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
  - Owner: **Integration**. Depends: **T1.9; external Q2/Q3 agreement**.
  - Acceptance: Blocked for affected operations until responsible person, backend version/environment, request/response/error/encoding/authorization and credential transport are approved. Before dependent code, record exact callback/bridge/server file paths if required and update tasks/DAG; do not invent them now. SQL adds page size/TTL/delivery/outcome. Record separate Auth, Catalog/Preview, Metric and SQL readiness subgates so unrelated agreed operations can proceed.
- [ ] **T5.4** Implement live-only adapter composition with fail-closed configuration — `src/integration/live-composition.ts`, `src/integration/config.ts`, `src/integration/http-client.ts`, `src/integration/live-composition.test.ts` (FR5, FR16, FR18, TR3, TR6, TR7)
  - Owner: **Integration**. Depends: **T5.3 Auth subgate; T1.10**.
  - Acceptance: Create typed live operation factory using approved transport; unavailable operations fail closed. No runtime fixture selector or demo imports. No credentials/SQL in URLs, secret serialization or implicit execute retries. Implement any newly recorded callback/bridge paths only after task expansion.
- [ ] **T5.5** Implement agreed session adapter and runtime decoding — `src/adapters/live/auth-adapter.ts`, `src/adapters/live/auth-schema.ts`, `src/adapters/live/auth-adapter.test.ts` (FR2, FR3, FR4, FR5, FR6, FR16, TR3, TR6, TR7)
  - Owner: **Live-auth**. Depends: **T5.4; T5.3 Auth subgate and exact-path expansion**.
  - Acceptance: Use agreed PKCE exchange/storage/callback/logout with Zod decoding where data crosses trust boundary; no default localStorage credentials or silent app-session renewal. Tests validate malformed responses and approved transport only.
- [ ] **T5.6** [P] Implement agreed authorized catalog/schema and preview adapters — `src/adapters/live/catalog-adapter.ts`, `src/adapters/live/catalog-schema.ts`, `src/adapters/live/preview-adapter.ts`, `src/adapters/live/preview-schema.ts`, `src/adapters/live/catalog-preview.test.ts` (FR6, FR7, FR8, FR9, FR11, FR16, TR3, TR4, TR6, TR7)
  - Owner: **Live-data**. Depends: **T5.4; T5.3 Catalog/Preview subgate**.
  - Acceptance: Decode allowed metadata/coverage/cursor/snapshot/expiry at untrusted boundary and map to feature contracts; preserve original expiry and identifiers. Do not treat source EIA route names as API/SQL names.
- [ ] **T5.7** [P] Implement agreed national-series adapter and exact-value mapping — `src/adapters/live/metric-adapter.ts`, `src/adapters/live/metric-schema.ts`, `src/adapters/live/metric-adapter.test.ts` (FR10, FR11, FR16, FR20, TR3, TR6, TR7)
  - Owner: **Live-metric**. Depends: **T5.4; T5.3 Metric subgate**.
  - Acceptance: Validate exact/display percentages, dates, units, same-observation values and gaps. Backend remains metric authority; never recalculate through binary-number display formatting.
- [ ] **T5.8** [P] Implement agreed query execute and retained-page adapters — `src/adapters/live/query-adapter.ts`, `src/adapters/live/query-schema.ts`, `src/adapters/live/query-adapter.test.ts` (FR11, FR12, FR13, FR14, FR15, FR16, TR3, TR5, TR6, TR7)
  - Owner: **Live-query**. Depends: **T5.4; T5.3 SQL subgate**.
  - Acceptance: Decode approved delivery, ordered positional columns/rows, query ID/size/TTL/truncation/errors; exact SQL unchanged, page requests never execute. Preserve unknown execute outcome; no generic retry or invented status mapping.
- [ ] **T5.9** Create real-environment browser verification scenarios — `tests/live/session-access.spec.ts`, `tests/live/data-preview-metric.spec.ts`, `tests/live/query-lifecycle.spec.ts`, `tests/live/environment.ts` (FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR20, TR3, TR6, TR9)
  - Owner: **Integration**. Depends: **T5.5, T5.6, T5.7, T5.8**.
  - Acceptance: Author route-aware real-provider/backend scenarios after contracts are known; configure separate live project without fixture interception, secrets in source or automatic destructive data controls. Missing environment/accounts/lifecycle controls report blocked, never a green skipped acceptance. Browser execution occurs in phase 7 after pages.
- [ ] **T5.L** Checkpoint: accept versioned live adapters for release verification — `docs/specs/web-client/verification/integration-adapters.md` (FR2, FR3, FR4, FR6, FR7, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR20, TR3, TR5, TR7, TR9, AC2, AC6, AC7, AC9, AC10, AC11, AC12, AC13, AC14, AC15, AC16, AC20)
  - Owner: **Integration**. Depends: **T5.9**.
  - Acceptance: Reconcile adapters with approved backend version and contract tests; run each agreed operation against target environment. Q2/Q3 absence keeps this incomplete, independently of T5.H. Release still needs phase-7 end-to-end evidence.

## Run outcome — October 4, 2026

T5.H fixture-only acceptance is recorded in [integration-fixture.md](../verification/integration-fixture.md) and the [Phase 5 summary](../verification/phase-5.md). Test discovery configuration transfers belong to Integration for T5.2: Playwright discovers `tests/browser/**`; Vitest excludes that browser root. No feature public contract or product route changed.

T5.3 remains blocked: all four per-operation subgates in [live-readiness.md](../contracts/live-readiness.md) lack external Q2 agreement; SQL additionally lacks Q3. T5.4–T5.9 and T5.L cannot start without those predecessors. No callback/bridge paths or transport settings were invented. T5.H independently unlocks Phase 6 fixture page assembly in a subsequent authorized run.
