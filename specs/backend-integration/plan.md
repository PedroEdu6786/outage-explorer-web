# Plan: Complete live backend integration
> Status: draft · Slug: backend-integration · Spec: ./spec.md

## Approach
Connect the prepared data adapters to the existing same-origin Flask transport, session runtime and feature controllers. Retain controller-owned protected state and React subscriptions; no new state-management dependency is needed for this integration. Reconcile the current source contract, close access-loss and expiry gaps, then complete connected acceptance without changing the accepted atomic components or thin pages. (FR1–FR19, TR1–TR10)

## Components affected
- Contract intake and typed data boundary — import the identified current OpenAPI/synthetic examples, preserve historical provenance, and accept nullable SQL generation identity throughout decoding, mapping and display. Preserve positional rich types and safe failure normalization. (FR12, FR15–FR18, TR7, TR10)
- Live HTTP transport and auth composition — share the auth adapter's memory-only, session-bound CSRF accessor and runtime guards with data requests; preserve permitted paths, cookie credentials, redirect rejection and no-store behavior. Validate the SQL UTF-8 bound before dispatch without changing the statement. (FR6, FR8, FR17, FR18, TR1–TR5, TR8)
- Session runtime and protected lifecycle — retain authoritative identity/role resolution, fixed expiry, logout cleanup and generation guards; deliberately re-resolve access when required by denial rather than interpreting every generic 403 as logout. (FR13, FR14, TR2–TR4)
- Explorer controller — retain independently optional dates, bounded page size, cursor identity, visited-page state and explicit expiry restart; reject obsolete selection/access responses. (FR1–FR4, FR12–FR15, FR17, TR4, TR6)
- Overview service and national adapter — reuse complete continuation assembly from one national preview generation and exact metric mapping; publish only a complete valid range and preserve missing-date gaps. (FR5, FR12–FR15, FR17, TR1, TR9)
- Queries controller and lifecycle — retain draft/submission separation, explicit Run and retained-page recovery; unify denial cleanup across metadata/execution requests, invalidate pending publications, and schedule original result expiry under the controller's existing lifetime owner. (FR6–FR16, FR19, TR3–TR7)
- Production composition and navigation — register approved live catalog/schema/preview/national/query operations with the existing session; supply independent preview/query defaults of 100 and maximum 500. Keep navigation handoffs in memory and fail closed when configuration is unavailable. (FR1–FR7, FR11, FR14, FR17, TR3–TR6)
- Verification and readiness records — record current artifact/build identity and separate contract, synthetic, live-browser and visual evidence; update existing gates only when their prerequisites pass. (TR10)

## Data model changes
- `QueryExecution.snapshotId` becomes `string | null`, matching SQL `generation_id`; catalog/preview generations remain required strings. Null means a reference-free execution, never unknown identity or permission. Result headers describe that case without inventing a snapshot. (FR15, FR17)
- Query lifecycle gains a revocable publication context shared by metadata and result callbacks, plus a cancellable deadline tied to the current execution's `expiresAt`. These are memory-only control state; retained backend fields and expiry are unchanged. (FR13, FR19, TR3, TR4)
- Draft SQL, submitted SQL, execution identity and selected future page size retain separate ownership. No persistent store, shared protected cache or new backend entity is introduced. (FR7, FR11, TR3–TR5)

## Interfaces & contracts
- **Session/transport:** existing session resolution supplies identity, recognized role, fixed expiry and CSRF. Data transport consumes the same runtime context and auth `csrfToken()` accessor; credentials stay HttpOnly and CSRF stays memory-only. Invalid context/401 clears protected state; generic 403 clears affected content and revokes pending publications without granting replacement access. (FR13, FR14, FR17, TR1–TR4)
- **Catalog/schema:** `GET /api/datasets` returns `{ generation_id, datasets }` with embedded ordered columns, supported filters and nullable coverage. Existing `listDatasets`/`readSchema` map this response; there is no new schema endpoint or protected catalog cache. (FR1, FR14, FR15, TR1, TR4)
- **Preview:** `GET /api/datasets/{dataset}/preview` initially sends optional inclusive `start_date`/`end_date` and `page_size`; continuation/revisit sends `cursor` alone. Preserve `{ dataset, generation_id, columns, rows, page_size, page_cursor, next_cursor, has_more, expires_at }`; unavailable sequences require explicit restart. Overview follows all continuations and validates one generation, schema and original expiry. (FR2–FR5, FR12, TR6, TR9)
- **SQL execution:** `POST /api/query?page=<positive>&page_size=<1–500>` sends only `{ sql }`, unchanged and at most 65,536 UTF-8 bytes, with current session/CSRF and backend-enforced Origin. A lost or malformed execution response remains an unknown outcome; no automatic POST retry exists. (FR6, FR8, FR12, FR17, TR2, TR5, TR8)
- **SQL pages/recovery:** `GET /api/query?query_id=<opaque>&page=<positive>&page_size=<original>` sends no SQL. Preserve query ID, nullable generation, columns/positional rows, size, retained count, total pages, truncation, limits and original expiry. Owned initial out-of-range metadata `{ query_id, expires_at }` plus submitted size enables explicit first-page GET recovery; lost/expired state requires explicit Run. (FR7, FR9–FR11, FR15, FR16, TR6, TR7)
- **Failure/presentation:** preserve operation/status/code distinctions for denied, unauthenticated, invalid/unsupported SQL, unavailable, busy, timeout, resource limit and retention capacity. Advisory retry timing is display metadata only; rendering uses text and fixed safe messages, never raw diagnostics or SQL-bearing navigation. (FR12, FR14, FR17, FR18, TR3, TR5)
- **Expiry/publication:** result acceptance, page completion and recovery all check the active publication context and deadline. At original expiry the controller cancels pending result publication, removes rows and owned recovery metadata, and exposes explicit Run; page reads cannot extend the deadline. Cancel timers on replacement, cleanup and disposal; recheck absolute expiry when browser scheduling resumes. (FR9, FR13, FR19, TR4–TR6)

## Implementation phases
1. **Current contract reconciliation** — version the updated source handoff and reconcile nullable SQL generation through model, mapping and presentation; controlled contract cases pass with unchanged preview identity. (FR12, FR15–FR18, TR7, TR10)
2. **Protected lifecycle completion** — reproduce and close the same-generation access-loss race, add idle result expiry under the existing controller lifetime, and enforce the unchanged SQL byte bound. Delayed successes cannot restore revoked/expired state. (FR6–FR14, FR19, TR2–TR8)
3. **Connected operation readiness** — connect auth-owned CSRF/runtime to prepared data transport and verify catalog, preview, complete national range and retained SQL behavior at existing operation seams. This supplements T5.3/T5.6–T5.8; controlled checks alone do not close T5.L. (FR1–FR18, TR1–TR9)
4. **Production registration and page verification** — after connected-adapter prerequisites, complete T6.L under one composition owner, preserving accepted feature/fixture/page-assembly gates. Verify existing page/navigation handoffs with live-only operations and explicit unavailable configuration. (FR1–FR19, TR1–TR10)
5. **Connected acceptance and release evidence** — use the named running build/resources and authorized personas to complete lifecycle, negative-access and request-trace acceptance; preserve separate visual comparison/sign-off and existing release gates. No gate is closed by this plan. (FR1–FR19, TR1–TR10)

## Dependencies & integrations
- Existing React subscriptions, session runtime, auth/data adapters and same-origin Next.js proxy are sufficient; retain one owner per state and no new dependency. Repeated catalog reads remain an explicit cost rather than introducing protected cache invalidation during this delivery. (FR13, TR3–TR5)
- Current backend Data API v1 source revision and working-tree hashes are recorded in the [integration assessment](../../docs/specs/web-client/integration-assessment.md); refresh those artifacts before implementation if the source changes. Flask owns permissions, metrics, SQL parsing/execution and retention. (TR1, TR10)
- Live acceptance requires a named backend build with explicitly enabled analytical resources, prepared data and permitted test identities. Publication/state-loss scenarios need backend-provided evidence or authorized support; frontend work does not configure resources, trigger ingestion or validate user-owned T1.7 isolation. (FR3, FR7, FR14, TR1, TR10)
- Existing verification tooling and inspected design evidence govern browser, production-boundary and visual checks; implementation should reload the active handoff and relevant predecessors. (TR10)

## Risks & tradeoffs
- Contract drift — copied snapshots are historical; identify the actual source revision and test corrected examples before treating transport readiness as integration acceptance. (FR15, FR17, TR10)
- Same-generation denial race — metadata denial currently can leave results or allow later success; revoke the affected publication context before clearing data, including all result/recovery callbacks. Generic 403 does not identify whether role, Origin or CSRF caused denial. (FR13, FR14, TR2, TR4)
- Browser timer delay — absolute expiry remains authoritative; deadline callbacks and resumed lifecycle checks remove expired state without extending retention or requesting SQL. (FR19, TR5, TR6)
- Ambiguous execution outcome — no idempotency/cancellation/lookup contract exists; keep a safe unknown-outcome state and deliberate Run even when a malformed response may hide a completed execution. (FR8, FR18, TR5)
- Live target unavailable — continue controlled integration work, but leave live/browser/release gates open until the named environment supplies evidence. Security headers and recursive decoding budgets from the assessment remain optional follow-up design work; do not invent numeric budgets or claim this integration proves runtime isolation. (FR17, FR18, TR1, TR10)

### Alternatives considered
- TanStack Query — declared-compatible optional server-state candidate, but existing controllers already own lifecycle; catalog deduplication alone does not justify new cache/retry ownership in this integration. Reconsider only with demonstrated shared-read demand and explicit session/expiry/replay safeguards. (TR3–TR5)
- Zustand — feasible UI store, but no cross-feature UI-state requirement warrants migrating working controller ownership. (FR13, TR3, TR4)

## Test strategy
- **AC1, AC14** — controlled role fixtures plus connected Viewer/Analyst/Admin catalog and direct negative-request evidence; verify foreign-user retained-result denial without protected metadata.
- **AC2–AC4, AC21** — adapter/controller and browser request traces for optional dates, independent size bounds, cursor-only continuation/revisit, changed selection, fixed expiry and explicit restart; live publication stability needs an authorized backend scenario.
- **AC5** — exact metric/adapter tests across multiple pages, gaps, half-up boundaries and partial failure; connected range evidence confirms complete one-generation output without synthetic substitution.
- **AC6–AC11** — adapter/controller and browser traces count unchanged POSTs and retained-ID GETs across draft edits, size changes, pagination/revisit, lost responses, focus/reconnect/remount/navigation and explicit recovery. Include null-generation expressions against live SQL.
- **AC12, AC16** — contract examples and feature/browser states cover every documented error, advisory retry metadata, empty output and empty byte-truncation; verify caps/count labels without a 10-second HTTP promise. Inject uncommon failures only in isolated test roots, and label evidence accordingly.
- **AC13, AC22** — adversarial delayed metadata/Run/page/recovery responses plus fake-clock lifecycle tests reproduce same-session denial races, session transitions and idle expiry. Include controller persistence across route changes, disposal/replacement and browser resume; expired rows disappear with no POST or expiry renewal.
- **AC15, AC18** — decoder/presentation tests preserve recursive typed values, precision, nulls, calendar dates, duplicate labels/rows and positional columns; malformed envelopes fail closed. Injection-shaped strings remain inert; inspect requests, URLs, storage and diagnostics for protected material.
- **AC17** — unconfigured and failing production builds use unavailable operations; run boundary/production-fixture checks and browser failure flows without fixture interception.
- **AC19** — UTF-8 multibyte boundary tests preserve accepted SQL bytes; connected negative session/CSRF/Origin cases confirm backend rejection. Do not mistake frontend prevalidation for enforcement evidence.
- **AC20** — authenticated connected-browser/manual evidence for reload/reopen, original expiry, current access reduction, logout and independent sessions against the recorded target; unresolved cases stay unaccepted.
- **TR10** — run repository typecheck, lint, behavior, boundaries, production build and affected browser checks using documented prerequisites; report checks actually run. Keep synthetic behavior, live operation traces and existing-width visual comparison/sign-off separate.

## Assumptions
- The user's backend-readiness confirmation and current handoff permit frontend design; historical pending-runtime statements are superseded but a healthy service alone does not establish live acceptance. (TR10)
- Existing auth, rich decoding, metric assembly, error recovery and fixture/page work are retained and revalidated where affected. The static same-generation denial finding needs an adversarial reproduction before closure. (FR1–FR19)
- The running backend build and enabled analytical resources can be named before phase 5; this nonblocking clarification does not prevent contract/lifecycle/composition design. Backend operational changes and user-owned isolation validation remain outside scope. (TR1, TR10)

## Open decisions
- Which running backend build and explicitly configured analytical resources are the target for live data and SQL acceptance? Required before connected acceptance, not before frontend implementation planning. (TR10)
- Optional follow-up only: agree response byte/depth/item budgets with the backend and production CSP/security-header policy with the hosting/rendering setup. Neither recommendation adds a requirement or blocks the current integration; retain both in the separate assessment. (FR18, TR10)
