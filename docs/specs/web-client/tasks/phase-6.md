# Tasks: Individual pages last
> Status: draft · Slug: web-client · Plan phase: 6 · Manifest: ../tasks.md · Spec: ../spec.md

- 8 tasks; fixture T6.1–T6.6/T6.C accepted; T6.L blocked on Q2/Q3 live adapters. See [Phase 6 evidence](../verification/phase-6.md). Paths are repository-relative planned additions unless noted in the manifest.
- Dependencies name completed tasks or explicit external readiness subgates. `[P]` permits concurrency only with disjoint ready work; it never waives predecessors.

- [x] **T6.1** Wire shared production layout, providers and protected navigation — `src/app/(protected)/layout.tsx`, `src/app/providers.tsx`, `src/app/page.tsx`, `src/composition/ProductionProvider.tsx`, `src/composition/navigation.ts`, `src/composition/production-operations.ts`, `tests/browser/support/page-boundary.ts` (FR1, FR3, FR4, FR5, FR6, FR18, FR19, FR21, TR2, TR6, TR8)
  - Owner: **Page-integration**. Depends: **T4.AC, T4.OC, T4.EC, T4.QC, T5.H, T3.6, T3.8**.
  - Acceptance: Single owner wires shared navigation/provider/root redirect. Production operations are live-only and fail closed when live adapters/contracts unavailable; no production fixture imports. While T5.4 is blocked use explicit unavailable operations, never fabricated transport. Page tests inject fixtures only through test root or browser transport boundary. Live module registration has its own T6.L checkpoint and is not required for fixture page assembly.
- [x] **T6.2** [P] Assemble thin sign-in page and isolated page tests — `src/app/sign-in/page.tsx`, `tests/pages/SignInPage.stories.tsx`, `tests/browser/sign-in-page.spec.ts` (FR1, FR2, FR3, FR5, FR16, FR17, FR18, TR2)
  - Owner: **Page-auth**. Depends: **T6.1**.
  - Acceptance: V1/P1: compose AuthTemplate and Auth entry; test managed-login intent and expired/pending/error UI with explicit fixture evidence. No credentials form or route-specific workflow.
- [x] **T6.3** [P] Assemble thin Overview page and isolated page tests — `src/app/(protected)/overview/page.tsx`, `tests/pages/OverviewPage.stories.tsx`, `tests/browser/overview-page.spec.ts` (FR1, FR10, FR11, FR17, FR18, FR20, FR21, TR2)
  - Owner: **Page-overview**. Depends: **T6.1**.
  - Acceptance: V2/P1: compose approved Overview template/feature; verify dates, compare, exact cards/tooltips/table and safe dataset navigation against inspected views.
- [x] **T6.4** [P] Assemble thin Dataset Explorer page and isolated page tests — `src/app/(protected)/datasets/page.tsx`, `tests/pages/ExplorerPage.stories.tsx`, `tests/browser/explorer-page.spec.ts` (FR1, FR6, FR7, FR8, FR9, FR11, FR16, FR17, FR18, FR21, TR2)
  - Owner: **Page-explorer**. Depends: **T6.1**.
  - Acceptance: V3/P1: compose Explorer template/feature; verify tabs, role-filtered catalog, filters, cursor expiry/restart and unsent SQL handoff. No duplicated lifecycle implementation.
- [x] **T6.5** [P] Assemble thin SQL Workspace page and isolated page tests — `src/app/(protected)/query/page.tsx`, `tests/pages/QueryPage.stories.tsx`, `tests/browser/query-page.spec.ts` (FR1, FR6, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR21, TR2)
  - Owner: **Page-queries**. Depends: **T6.1**.
  - Acceptance: V4/P1: compose Workspace template/Queries entry; fixture browser trace verifies Run, paging, edited draft/handoff and recovery. Synthetic controls stay test-only.
- [x] **T6.6** Verify composed route navigation and design at observed widths — `tests/browser/navigation.spec.ts`, `tests/browser/production-failure.spec.ts`, `tests/visual/pages.spec.ts`, `docs/specs/web-client/verification/pages.md` (FR1, FR4, FR5, FR6, FR17, FR18, FR19, FR21, TR8, TR9)
  - Owner: **Page-integration**. Depends: **T6.2, T6.3, T6.4, T6.5**.
  - Acceptance: Verify drawer/keyboard, protected pending states and all handoffs using test-only injections; compare 1440/390 and breakpoint edges. Author a separate production-build backend-failure scenario with no fixture interception for release checks. Save deviations separately from backend results; no blanket phase-5 gate.
- [x] **T6.C** Checkpoint: accept final page assembly as fixture milestone — `docs/specs/web-client/verification/phase-6.md` (FR1, FR5, FR17, FR18, FR19, FR21, TR2, TR8, TR9, AC1, AC5, AC17, AC18, AC19, AC21)
  - Owner: **Page-integration**. Depends: **T6.6**.
  - Acceptance: All four feature gates, T5.H and thin page checks pass. Mark fixture milestone only; no release claim while live or visual sign-off inputs remain unresolved.
- [ ] **T6.L** Register agreed live operations and verify production page composition — `src/composition/production-operations.ts`, `docs/specs/web-client/verification/production-registration.md` (FR2, FR3, FR4, FR5, FR6, FR7, FR9, FR10, FR12, FR13, FR16, FR18, FR19, FR20, FR21, TR2, TR3, TR6, TR7, TR8, TR9, AC5, AC18, AC19)
  - Owner: **Page-integration**. Depends: **T6.1, T6.C, T5.5, T5.6, T5.7, T5.8**.
  - Acceptance: Register all approved live adapter factories in the production composition under one owner; verify real operations replace the unavailable placeholders without any fixture/demo imports or runtime adapter selector. Rerun affected sign-in/Overview/Explorer/Queries page checks, navigation and production composition/import-boundary checks, recording which fixture and live checks ran separately. Unconfigured or failed live operations remain fail closed. This checkpoint gates live release verification, never T6.C or fixture page work; do not reopen T6.1 to perform deferred registration.
