# Tasks: Release verification
> Status: draft · Slug: web-client · Plan phase: 7 · Manifest: ../tasks.md · Spec: ../spec.md

- 7 tasks; every checkbox starts unchecked. Paths are repository-relative planned additions unless noted in the manifest.
- Dependencies name completed tasks or explicit external readiness subgates. `[P]` permits concurrency only with disjoint ready work; it never waives predecessors.

- [ ] **T7.1** [P] Run reproducible build and architectural boundary checks — `docs/specs/web-client/verification/release-build.md` (FR18, FR19, TR1, TR2, TR3, TR6, TR8, TR9, TR10)
  - Owner: **Release-QA**. Depends: **T6.C, T6.L, T5.L**.
  - Acceptance: Run installed type/lint/build, meaningful tests, import reachability and emitted fixture sentinels. Record actual commands/version/results; phase 7 changes evidence only, implementation fixes return to owning tasks.
- [ ] **T7.2** [P] Verify real Cognito session and backend authorization journeys — `docs/specs/web-client/verification/live-session-access.md` (FR2, FR3, FR4, FR5, FR6, TR3, TR6, TR9, AC2, AC3, AC4, AC5, AC6)
  - Owner: **Release-QA-auth**. Depends: **T6.C, T6.L, T5.L; Q2 target accounts/environment**.
  - Acceptance: Use real managed-login PKCE callback, explicit re-login at app expiry and backend current-session logout; independent session remains per policy. Prove direct forbidden catalog/schema/preview/SQL and later-page denial after reduction, plus stale response/error rejection. Missing access keeps unchecked.
- [ ] **T7.3** [P] Verify live catalog, snapshot and exact metric journeys — `docs/specs/web-client/verification/live-data.md` (FR7, FR8, FR9, FR10, FR11, FR20, TR4, TR7, TR9, AC7, AC8, AC9, AC10, AC11, AC20)
  - Owner: **Release-QA-data**. Depends: **T6.C, T6.L, T5.L; Q2 reproducible data/environment**.
  - Acceptance: Verify authorized dynamic coverage, filter reset, old response rejection, publication during cursor continuation, fixed expiry/restart, backend exact/display metric with precision/identifier/calendar fixtures or approved replay evidence. Never invent missing observations.
- [ ] **T7.4** [P] Verify live SQL execution and retained-page request traces — `docs/specs/web-client/verification/live-sql.md` (FR11, FR12, FR13, FR14, FR15, FR16, TR5, TR7, TR9, AC11, AC12, AC13, AC14, AC15, AC16)
  - Owner: **Release-QA-query**. Depends: **T6.C, T6.L, T5.L; Q2/Q3 controllable query lifecycle environment**.
  - Acceptance: Observe Run/edit/page/revisit/focus/reconnect/loss/explicit rerun; same ID/size and unchanged SQL, duplicates/ordered columns and whole-execution truncation. Prove busy/deadline/unknown response/result-state loss recovery without auto-replay; missing live capability stays incomplete.
- [ ] **T7.5** Verify production backend failure and fixture exclusion together — `docs/specs/web-client/verification/production-isolation.md` (FR5, FR16, FR18, TR6, TR9, AC5, AC16, AC18)
  - Owner: **Release-QA**. Depends: **T7.1**.
  - Acceptance: Use production build with backend unavailable/misconfigured; show unavailable/auth-safe state and no synthetic substitution. Correlate runtime observation with graph and emitted-bundle proof; a missing sentinel alone is insufficient.
- [ ] **T7.6** Confirm viewport matrix and run final accessibility and visual review — `docs/specs/web-client/verification/visual-accessibility.md`, `docs/specs/web-client/verification/viewport-matrix.md` (FR1, FR17, FR20, TR9, TR10, AC1, AC17, AC20)
  - Owner: **Design-QA**. Depends: **T6.C; Q4 agreement and T1.3 resolved visible assets**.
  - Acceptance: Record agreed browsers/viewports, 1440/390 references and 1000/760/480 boundaries, keyboard/focus/announcements/zoom/overflow/chart data equivalence; actual icon/logo/font provenance and C1–C11 deviations. Unresolved Q4 prevents final visual sign-off, not fixture progress.
- [ ] **T7.C** Checkpoint: reconcile all acceptance evidence and release readiness — `docs/specs/web-client/verification/acceptance.md` (FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, TR1, TR2, TR3, TR4, TR5, TR6, TR7, TR8, TR9, TR10, AC1, AC2, AC3, AC4, AC5, AC6, AC7, AC8, AC9, AC10, AC11, AC12, AC13, AC14, AC15, AC16, AC17, AC18, AC19, AC20, AC21)
  - Owner: **Release-QA**. Depends: **T7.2, T7.3, T7.4, T7.5, T7.6**.
  - Acceptance: Map every AC to separate fixture, visual and live evidence where applicable, including phase-4/5/6 handoff proof. Keep unmet Q2/Q3/Q4 checks and release unchecked; type/build or fixture success cannot substitute. Deployment remains out of scope.
