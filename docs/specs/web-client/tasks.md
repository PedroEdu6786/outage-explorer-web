# Tasks: Outage Explorer web client
> Status: fixture milestone complete; local data adaptation verified; auth and live integration pending · Slug: web-client · Plan: ./plan.md · Spec: ./spec.md

## Overview

- **78 tasks across 7 phases; 21 tasks marked parallelizable [P].** Hybrid layout: this manifest plus one granular file per phase. Phases 1–4 and fixture page assembly are accepted; local data adapters are prepared. Completion and evidence are recorded below and in the execution ledger.
- Source: [plan](plan.md), [spec](spec.md), [design inventory](design-inventory.md) and [council decisions](council/03-decisions.md). V/S/A/M/O/T references are inventory IDs; FR/TR/AC references belong to the spec.
- Initial inspection was documentation-only; the fixture application and local data adapters now exist. Phase files distinguish implemented paths from planned additions. Reuse existing modules and preserve uncommitted work; do not recreate superseded adapter filenames.
- The first milestone is synthetic fixture demos; live integration is required before release. Product routes remain live-only and fail closed; fixture page demonstrations use separate test/story roots or browser test boundaries. No runtime production adapter selector may import fixtures.
- Use native semantic text, headings, labels and separators directly where wrappers add no reusable contract. Component names prescribe ownership, not a mandate for an exhaustive library.

## Phase status

- [x] **Phase 1: Evidence, toolchain and cross-lane contracts** — [12 tasks](tasks/phase-1.md); status: accepted; [verification](verification/phase-1.md).
- [x] **Phase 2: Tokens and atoms** — [7 tasks](tasks/phase-2.md); status: accepted; [verification](verification/phase-2.md).
- [x] **Phase 3: Molecules, shared organisms and templates** — [13 tasks](tasks/phase-3.md); status: accepted; [verification](verification/phase-3.md).
- [x] **Phase 4: Parallel feature compositions** — [20 tasks](tasks/phase-4.md); status: accepted; [verification](verification/phase-4.md).
- [ ] **Phase 5: Integration seams and gated live adapters** — [11 tasks](tasks/phase-5.md); status: fixture T5.1/T5.2/T5.H accepted; local data preparation verified; revised auth DTO, target configuration and live acceptance pending; [verification](verification/phase-5.md).
- [ ] **Phase 6: Individual pages last** — [8 tasks](tasks/phase-6.md); status: fixture T6.1–T6.6/T6.C accepted; T6.L pending completed auth/composition and configured target; [verification](verification/phase-6.md).
- [ ] **Phase 7: Release verification** — [7 tasks](tasks/phase-7.md); status: not started.

## Dependency graph and start rules

Use the [technical execution plan](execution-plan.md) for exact cross-phase
triggers, agent dispatch and review. The coordinator maintains
[execution state](execution-state.md); the task files below remain the source
of completion and acceptance. Cross-phase scheduling requires an implementation
request that includes those phases; planning does not start execution.

- Phase 1 establishes bootstrap and the shared contracts/session runtime/fixture operations. `T1.C` is the contract readiness gate; `T1.3` separately controls asset fidelity. The unresolved live ledger is not approved transport.
- Atomic work starts from its listed foundation dependencies. Each phase-3 component starts from its actual atoms; no unrelated whole-phase checkpoint is an implicit predecessor.
- Auth starts at `T3.A`; Overview at `T3.O`; Explorer at `T3.E`; Queries at `T3.Q`. Each includes `T1.C` and therefore the **implemented and tested shared session-generation runtime**, authorized catalog/schema and operation fixtures. Auth need not wait for analytical table/chart work.
- Feature chains are `T4.A1 → T4.A2 → T4.A3 → T4.A4 → T4.AC`, `T4.O1 → T4.O2 → T4.O3 → T4.O4 → T4.OC`, `T4.E1 → T4.E2 → T4.E3 → T4.E4 → T4.EC`, and `T4.Q1 → T4.Q2 → T4.Q3 → T4.Q4 → T4.QC`. The chains run concurrently after their own readiness gate. No feature imports another feature's internal service/controller.
- **Page gate:** `T4.AC + T4.OC + T4.EC + T4.QC → T5.1 → T5.2 → T5.H → T6.1`. After single-owner shared layout/navigation wiring `T6.1`, dispatch `T6.2`, `T6.3`, `T6.4`, `T6.5` concurrently; then `T6.6 → T6.C`. This gate deliberately requires all four features and the composed fixture harness.
- **Independent live branch:** `T1.9 → T5.3` per-operation Auth/Catalog-Preview/Metric/SQL subgates. Auth transport readiness plus exact-path task expansion permits `T5.4`; agreed operation subgates independently enable `T5.5`–`T5.8`. A subgate can pass while others remain blocked. `T5.L` requires all adapters. Phase-6 pages **do not depend on phase 5 as a whole or on T5.L**.
- **Production registration gate:** `T6.1 + T6.C + T5.5 + T5.6 + T5.7 + T5.8 → T6.L`. The Page-integration owner connects approved live factories in `src/composition/production-operations.ts` and reruns affected page checks under this separate checkpoint. `T6.L` is not a predecessor of fixture milestone `T6.C`; no completed task must be reopened. Until registration, missing live operations return unavailable with protected content withheld, never synthetic identities or invented transport.
- Live release checks and the final production build require `T6.C + T6.L + T5.L` and their explicit external inputs; `T7.C` requires all listed verification evidence. Live checks remain incomplete until auth/configuration and actual backend prerequisites are satisfied; SQL contract values are supplied. Phase 7 contains verification only; fixes return to owning implementation tasks.

## Ownership and parallel dispatch

- **Foundation/Integration:** single writers for package/configuration files, shared contract modules, session runtime, common fixtures, boundary scripts and composition interfaces. Serialize their tasks when file paths overlap. Freeze consumed seams at readiness gates; a necessary change updates affected contracts, fixtures and dependent checks together.
- **Design:** owns token/asset provenance and approved deviations. Tokens and `src/app/layout.tsx`/`src/app/globals.css` transfer from bootstrap `T1.2` to token `T2.1` sequentially; no concurrent changes.
- **Shared UI lanes:** atoms/molecules/table/shell/template tasks list disjoint exact files. A lane can start only after its named predecessors. No shared barrel file is introduced; use named module imports. Shell tasks serialize within their owner.
- **Auth, Overview, Explorer, Queries:** each owns its entire respective `src/features/auth`, `src/features/overview`, `src/features/explorer`, or `src/features/queries` subtree, including public entry, organisms, hooks/service, tests and stories. Their concrete files appear in phase 4. Each agent receives that lane's tasks and required contracts only; do not ask a sibling to produce an undeclared dependency.
- **Page-integration:** exclusively owns shared layouts/providers/navigation/production composition and route registration. Individual page owners receive only their exact page/story/test paths (three files per lane), never shared layout or barrels. Wait for `T6.1` before dispatching page work; serialize later live registration in `T6.L` under this same owner.
- **Live adapter ownership:** auth has its own files; current catalog/preview/metric/query modules share schemas and mappings, so remaining data changes are serialized under Integration. `T5.3` is a serialized amendment owned by Integration; it must add exact callback/bridge/server file tasks after the transport decision and before dependent coding, with ownership and dependencies. Do not guess credential route paths now.
- **Release-QA:** run independent evidence checks with distinct output files. Shared browser sessions, backend publication controls and seeded fixtures may require scheduling; `[P]` does not authorize conflicting external mutation or secret exposure.
- To dispatch: select a task whose `Depends` are satisfied; give the worker its exact files and acceptance criteria; state that others are working and must not be reverted; return evidence to the readiness checkpoint. `[P]` marks safe initial/disjoint opportunities, while unmarked tasks inside different established lanes can still overlap when their explicit dependencies and ownership permit it.

## Open inputs and scope guards

- **Q2:** auth endpoint/cookie/CSRF/backend callback contracts are supplied. Await revised backend-controlled capability DTO, target environment/version/origins/return paths, integration ownership and live evidence. The client sends no role/capability claims and does not require role in the response.
- **Q3:** contract values supplied: synchronous SQL, default100/max500, fixed15-minute result lifetime, 1,000 rows/1 MiB and explicit GET recovery. User-owned artifact corrections and actual backend runtime verification remain; do not reopen supplied settings as missing inputs.
- **Q4:** browser/viewport matrix. Proposed current Chromium/Firefox/WebKit at inspected 1440/390 and 1000/760/480 boundary widths; agreement precedes final visual sign-off, not component work.
- **Asset gate:** actual visible vector icons/logo and licensed font sources must be retained with provenance. Unread Make PNG files have no assumed purpose; missing required source blocks affected visual implementation only.
- No Admin refresh screen, new-data notification card, deployment, saved history, generic grid/chart platform or new domain capability is included.

## Acceptance coverage

- AC1: `T2.C`, `T3.C`, `T6.C`, `T7.C`; actual visual sign-off in `T7.6`.
- AC2–AC6: `T4.AC`, `T5.H` for fixture portions; `T7.2` and `T7.C` for real auth/access.
- AC7–AC9: `T4.EC`; `T7.3` and `T7.C` for real data/snapshot behavior.
- AC10–AC11, AC20: `T4.OC` (plus table/query checks); `T7.3`, `T7.6`, `T7.C` for applicable live/visual evidence.
- AC12–AC16: `T4.QC`, `T5.H`; `T7.4`, `T7.5`, `T7.C` for applicable live/production evidence.
- AC17: `T2.C`, `T3.C`, feature checkpoints and `T6.C`; final matrix evidence `T7.6` and `T7.C`.
- AC18: `T1.C`, `T5.H`, `T6.C`; production import/output/runtime evidence `T7.1`, `T7.5`, `T7.C`.
- AC19, AC21: per-lane readiness, all four feature checkpoints, `T5.H`, `T6.C`, `T7.C`.
- Every FR1–FR21 and TR1–TR10 has implementation/verification tasks; checkpoints state the difference between fixture proof and actual release acceptance. A document being written never satisfies an unrun behavior check.

## Next step

- Follow the [remaining implementation sequence](plan.md#remaining-implementation-sequence--reconciled-october-5): revised auth DTO/configuration → composition/session adapter → reuse data adapters → production registration and live scenarios → actual live/release verification.
- Date-only optional bounds and backend-only authorization ownership are accepted. Never infer capability flags from roles or accept client permission claims.
- Local preparation evidence does not close live checkboxes. Existing P1–P4 preparation is recorded in [Phase 5](tasks/phase-5.md); no additional task IDs or completed live tasks are implied.
