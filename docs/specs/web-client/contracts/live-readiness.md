# Live contract readiness

## Current integration intake — October 5, 2026

The user confirms the documented backend services are implemented and ready for
frontend integration. The updated source handoff confirms all seven operations
are implemented and opt-in, closes the former B1–B3 artifact issues and permits
null query generation identity for reference-free SQL. See the [integration spec](../../../../specs/backend-integration/spec.md)
and [assessment](../integration-assessment.md) for current source hashes, remaining frontend behavior,
state-management options and SQL-security recommendations.

This update supersedes backend-pending statements below, which retain historical
intake provenance. Client adapters and production data registration are implemented;
connected acceptance remains open. See [current status](../../../development/current-status.md). Backend analytical resources must be
explicitly configured for the named live target; user-owned isolation validation
is outside this frontend work. No live or visual acceptance gate is closed here.


Ledger revision: **8**, October 5, 2026. Tasks: **T1.9 / T5.3**. Requirements:
FR2–FR4, FR6–FR7, FR9, FR13, FR16; TR3, TR5, TR7, TR9.

**Auth configuration/composition and the current session adapter are implemented;
full authenticated browser acceptance remains pending.** The user confirmed the
role-only session DTO and supplied role restrictions, authorizing presentation
mapping from backend-assigned roles. This supersedes the earlier capability-only
constraint. The client sends no role/capability claims. See the
[current decision](auth.md#current-response-and-revised-user-decision--october-5)
and [auth integration evidence](../verification/auth-integration.md).
Data API v1 contracts and local adaptations are prepared; data runtime readiness
and source corrections remain separate. No expanded capability response is
required for the agreed auth integration.
The [data handoff](data-api.md) now supplies all seven service operations and
resolves Q3 contract defaults/expiry/delivery. Data backend runtime is pending and
[frontend/source discrepancies](contract-review.md) require reconciliation.
The earlier October 5 [auth handoff](auth.md) supplies routes, payloads, errors, backend
callback ownership, HttpOnly session cookies, logout CSRF and a same-origin local
proxy. Auth mapping/configuration are implemented; full lifecycle evidence remains pending. The accepted
[frontend contracts](../../../../src/contracts/session.ts) define proposed
feature-facing models; they do not approve HTTP payloads, routes, error codes,
credential transport or SQL settings. Synthetic checks cannot close live gates.

The imported [backend snapshot](../../../context/ui-client/04-backend-integration.md)
describes October 4 findings. The auth reference was read at backend checkout
`f9e691d72d267a5385f3ccf4655885310e7f0a4d`; its clean-file digest and draft integration
status are recorded in [auth.md](auth.md). The later data handoff is a working-tree artifact, not contained in that HEAD;
its separate [hashes and snapshots](data-api.md) identify the intake. No running
backend environment was verified; source contracts prove no live readiness.

## Phase 3 controlled readiness update — October 5

The current corrected Data API v1 snapshots and auth contract are consumed by
prepared `createLiveComposition().dataOperations`, with the same runtime and
auth-owned memory-only CSRF. `operations` still registers only auth/refresh;
production analytical registration remains phase 4. Current authenticated status,
generation, cancellation and token continuity guard dispatch and response
publication, including asynchronous JSON decoding. Requests use same-origin
cookies, `no-store` and rejected redirects with no automatic retry.

| Prepared operation | Contract / controlled readiness | Connected acceptance |
| --- | --- | --- |
| Catalog/schema | Authorized embedded metadata, coverage and hidden-schema withholding verified | Open |
| Preview | Independently optional dates; 1–500 sizes; cursor-only advance/revisit; original sequence identity; explicit controller restart verified | Open |
| National series | Complete same-generation continuation; original expiry; partial-failure withholding; exact fractions/displays, measured zero and missing-date gaps verified | Open |
| SQL execute/page | Unchanged SQL-only POST, retained-only GET, null generation/rich types, documented errors/advisory retry, owned recovery and whole-result limits verified | Open |

See [adapter evidence](../verification/integration-adapters.md) for source binding,
actual checks and scope. Backend authorization/Origin/CSRF enforcement, named
enabled target/resources and full authenticated browser scenarios remain
unverified here. Original T5.L/T6.L and release/visual gates stay open.
Earlier runtime/source-correction statements below retain intake provenance;
the phase-1 corrected snapshot reconciliation supersedes those artifact gaps.

## Responsibility and target slots

| Required slot | Current assignment/value | Evidence needed |
| --- | --- | --- |
| Backend/session contract decision owner | User supplies auth DTO/restrictions; data owner unassigned | Auth decision recorded; data reconciliation pending |
| Frontend integration implementation owner | Integration lane | Coordinate mappings and affected consumer checks |
| Backend contract version | Auth reference and [Data API v1 snapshots/hashes](data-api.md) recorded; data artifacts uncommitted at source | Select artifacts for the target integration version |
| Backend implementation revision | Auth source checkout recorded; deployed target unprovided — Q2 | Commit/release tied to the target environment |
| Target environment | Local Flask8000 / Next3000 for auth; deployment/data target pending | Limited connected auth smoke evidence |
| Session/Cognito configuration decision owner | User supplies auth setup; Integration aligns transport | Existing callback8000 retained; UI3000 redirect approved |
| SQL lifecycle/settings decision owner | Person unassigned; v1 settings supplied | Responsible person for reconciliation and target runtime verification |
| Live verification environment/accounts owner | Unassigned — Q2 | Access-controlled test setup and independent session identities |

These named responsibility slots reserve accountability without assigning an
invented person. Do not place credentials, tokens or account secrets in this ledger.

## Operation records

Every row still lacks **frontend live acceptance**. Backend auth is user-confirmed
ready for implementation; data runtime readiness is separate. Both have documented
source contracts.
For each row, fill the contract
version, implementation revision, target environment, decision owner, approved
artifact and actual evidence before changing readiness. Required evidence includes
request/response examples with secrets removed, runtime decoding/mapping checks,
authorization/error cases and an operation exercised against the target version.

| Operation / frontend seam | Required request and response agreement | Required authorization, failures and encoding agreement | Gate / current evidence |
| --- | --- | --- | --- |
| Resolve session / `resolveSession` | GET cookie only; confirmed ID/email/role/expiry/CSRF | User-approved role presentation mapping; malformed/unknown role fails closed | Controlled adapter + real signed-out proxy evidence; authenticated restoration pending |
| Managed login / `beginLogin` and callback | Browser GET login; Flask PKCE/callback/exchange; return `/` | Local Flask8000 / Next3000; callback stays8000 | Controlled navigation + real redirect/cookie evidence; Cognito completion pending |
| Current-session logout / `logout` | POST cookie, exact browser Origin and memory CSRF; only204 confirms | Unconfirmed failures retain scoped retry token; original expiry discards it | Controlled failure/token cases + real signed-out logout; authenticated invalidation pending |
| Authorized catalog / `listDatasets` | GET datasets: IDs/SQL names, coverage, embedded schemas, generation | Role-filtered; capability/summary mapping pending | Catalog/Preview / [contract](catalog-preview.md), controlled adapters only |
| Authorized schema / `readSchema` | Embedded catalog columns; no standalone schema route | Descriptor/nullability/client-description mapping prepared | Catalog/Preview / [contract](catalog-preview.md), controlled adapters only |
| Preview first page / `startPreview` | GET preview: optional inclusive date sides, size 100/max500 | Date-only optional bounds accepted and locally adapted | Catalog/Preview / [contract](catalog-preview.md), controlled adapters only |
| Preview continuation / `continuePreview` | Cursor-only GET; current/revisit and next cursor, fixed 15-minute expiry | Session/generation binding; generic 404/410 recovery | Catalog/Preview / [contract](catalog-preview.md), controlled adapters only |
| National series / `readNationalSeries` | National preview metric columns, fraction plus displays; no metric endpoint | Multi-page complete series and exact-rational mapping prepared | Metric / [contract](metric.md), controlled adapter only |
| Explicit SQL execution / `executeQuery` | Synchronous POST; SQL-only body, URL page/size, default100/max500 | CSRF, expanded types/errors, owned recovery metadata | SQL / [contract](sql.md), fixture source issues pending |
| Retained SQL page / `readQueryPage` | GET same path with ID/page/fixed size; 15 minutes from completion | 404/410, fixed limits and duplicates; no SQL replay | SQL / [contract](sql.md), controlled adapter only |

Refresh admission/latest/by-ID are also [documented](refresh.md); Admin UI stays
conditional and no refresh implementation task is added.

`consumeNavigationIntent` is a frontend handoff, not an invented backend endpoint.
Its dataset/filter authorization comes from the agreed session/catalog context;
its generation guard and explicit edited-draft replacement remain frontend duties.

## Auth subgate — current contract accepted for implementation

The user supplies contract/configuration decisions; Integration owns the exact
paths in Phase 5. Current DTO: application ID/email/role, original expiry and
CSRF. Viewer maps to national; Analyst/Admin to national/facilities/generators;
read-only SQL uses each role's permitted datasets. Refresh UI remains excluded.
The backend remains the authorization authority and receives no client claims.

Target: user-confirmed Flask `http://localhost:8000`, Next
`http://localhost:3000`, server-only `OUTAGE_API_ORIGIN` proxy target.
Existing public/callback origin remains port 8000; backend UI origin is now
port 3000 after approved `.env` update and user restart. Default return path `/`
is allowed. No frontend callback/exchange is added. The local reference checkout
is `808205158669836e52e107cbc626d1517e0df4e6`; the running API does not advertise
its revision, so this is source provenance rather than a deployed-version claim.

T5.4/T5.5 implement decoding, role presentation mapping, fixed expiry and scoped
memory-only CSRF. Logout clears protected state immediately, preserves only the
current generation's retry token until original expiry, and confirms on `204`.
Malformed/unknown-role responses withhold access. Controlled and connected smoke
checks are recorded separately in [auth integration evidence](../verification/auth-integration.md).
Real authenticated Cognito completion, persistent reload/reopen, role changes and
independent session verification remain open. Combined T5.3/T5.L/T6.L remain
incomplete pending the other operation gates and release evidence.

## Catalog/Preview and Metric subgates — contract received, mapping pending

[Catalog/preview](catalog-preview.md) supplies names, embedded schemas, filters,
coverage, positional encodings and current/next cursors. [Metric](metric.md)
supplies prepared national columns through preview, not a separate endpoint.
Date-only scope and optional bounds are accepted. Local adapters cover catalog
metadata, typed cells/unknown nullability and exact fractions; verification remains
controlled until target backend integration.
Overview must consume a complete same-generation preview range. Verify Viewer
access against the eventual implementation, including direct and cursor requests.

## SQL subgate — Q3 contract supplied, runtime and reconciliation pending

[SQL](sql.md) now fixes synchronous execution, default100/max500, 15 minutes from
completion, 1,000 rows/1 MiB, GET continuation, out-of-range recovery and errors.
Do not infer production retention quotas from backend runtime proposals.
Local mappings cover richer cells and retry/recovery metadata. The user owns
[source corrections](contract-review.md#source-artifact-issues); target runtime
verification remains pending.
Preserve unknown outcome and deliberate Run; no cancellation, replay or automatic
page-1 recovery is introduced. Backend runtime isolation/capacity and live target
verification remain required. No code setting is changed by this ledger update.

## Gate update and evidence protocol

1. Record the responsible person, approved contract artifact/version, backend
   revision and target environment for the affected operations.
2. Complete their request, response, error, encoding and authorization mappings;
   record the applicable session and SQL decisions above.
3. Expand affected tasks for approved callback/bridge paths before code begins.
   Auth agreement unlocks the live-only composition task; each other approved
   subgate unlocks only its own adapters once their task predecessors pass.
4. Keep **contract agreed**, **adapter verified** and **live exercised** separate.
   Record actual commands, sanitized traces, tested revision and reviewer outcome.
   A skipped or unavailable environment remains blocked, never a passing check.
5. If the contract changes, increment this ledger revision, name affected
   consumers and invalidate obsolete acceptance evidence before their recheck.

All live subgates and release evidence remain required. These unresolved gates
allow independent fixture work to continue under the accepted execution plan.

## Revision history

| Revision | Date | Change / validation |
| --- | --- | --- |
| 1 | 2026-10-04 | T1.9 initial ledger; reconciled with T1.5 frontend seams, plan, phase-5 tasks and integration context. No live calls or contract agreement claimed. |
| 2 | 2026-10-05 | Documented user-supplied auth handoff and read full backend reference with revision/digest. Recorded capability and logout seam gaps. Source review only; no adapter/config changes or live calls. Service contracts/Q3 pending. |
| 3 | 2026-10-05 | Received Data API v1; copied exact OpenAPI/58 fixtures, validated response schemas/headers/page structure, documented F1–F13 and source issues B1–B3. Q3 contract values supplied; no runtime, adapter or live acceptance. |
| 4 | 2026-10-05 | User accepts date-only/optional bounds and backend capability additions; local data decoders, models, UI and injected transport prepared and tested. No production registration, auth mapping or live acceptance. |
| 5 | 2026-10-05 | User confirms backend-only role assignment/capability control; no client permission claims or role-derived capabilities. Revised session response need not include role; illustrative capability names await backend contract. Documentation only. |
| 6 | 2026-10-05 | User confirms backend auth works and is ready for frontend implementation. T5.3 Auth intake → T5.4 → T5.5 is next, independently of data API availability. Capture current DTO/configuration; frontend live acceptance remains unverified. Documentation only; no endpoint calls. |
| 7 | 2026-10-05 | User confirms current role-only DTO, supplies presentation role matrix and Flask URL. Auth adapter/configuration/composition implemented; backend UI origin aligned with approval and user restart. Controlled checks and limited real-Flask smoke evidence recorded; full authenticated lifecycle and data/release acceptance remain open. |
| 8 | 2026-10-05 | Backend-integration T3.1–T3.C prepared auth-owned guarded data composition and revalidated data seams with injected responses; protected metadata-denial races and expired national assembly fixed. Production registration and connected/live/visual acceptance remain open. |
