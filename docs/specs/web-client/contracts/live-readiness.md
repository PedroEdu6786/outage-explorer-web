# Live contract readiness

Ledger revision: **3**, October 5, 2026. Tasks: **T1.9 / T5.3**. Requirements:
FR2–FR4, FR6–FR7, FR9, FR13, FR16; TR3, TR5, TR7, TR9.

**Auth and Data API v1 contracts are documented; no live operation is ready.**
The [data handoff](data-api.md) now supplies all seven service operations and
resolves Q3 contract defaults/expiry/delivery. Backend runtime is pending and
[frontend/source discrepancies](contract-review.md) require reconciliation.
The earlier October 5 [auth handoff](auth.md) supplies routes, payloads, errors, backend
callback ownership, HttpOnly session cookies, logout CSRF and a same-origin local
proxy. Auth adapter mapping, environment and live evidence remain pending. The accepted
[frontend contracts](../../../../src/contracts/session.ts) define proposed
feature-facing models; they do not approve HTTP payloads, routes, error codes,
credential transport or SQL settings. Synthetic checks cannot close live gates.

The imported [backend snapshot](../../../context/ui-client/04-backend-integration.md)
describes October 4 findings. The auth reference was read at backend checkout
`f9e691d72d267a5385f3ccf4655885310e7f0a4d`; its clean-file digest and draft integration
status are recorded in [auth.md](auth.md). The later data handoff is a working-tree artifact, not contained in that HEAD;
its separate [hashes and snapshots](data-api.md) identify the intake. No running
backend environment was verified; source contracts prove no live readiness.

## Responsibility and target slots

| Required slot | Current assignment/value | Evidence needed |
| --- | --- | --- |
| Backend/session contract decision owner | Unassigned — Q2 | Named responsible person and recorded agreement |
| Frontend integration implementation owner | Integration lane | Coordinate mappings and affected consumer checks |
| Backend contract version | Auth reference and [Data API v1 snapshots/hashes](data-api.md) recorded; data artifacts uncommitted at source | Select artifacts for the target integration version |
| Backend implementation revision | Auth source checkout recorded; deployed target unprovided — Q2 | Commit/release tied to the target environment |
| Target environment | Unprovided — Q2 | Environment identifier and approved connection configuration |
| Session/Cognito configuration decision owner | Unassigned — Q2 | Responsible person for callback, exchange and session choices |
| SQL lifecycle/settings decision owner | Person unassigned; v1 settings supplied | Responsible person for reconciliation and target runtime verification |
| Live verification environment/accounts owner | Unassigned — Q2 | Access-controlled test setup and independent session identities |

These named responsibility slots reserve accountability without assigning an
invented person. Do not place credentials, tokens or account secrets in this ledger.

## Operation records

Every row is **not live-ready**; auth and data now have documented source contracts.
For each row, fill the contract
version, implementation revision, target environment, decision owner, approved
artifact and actual evidence before changing readiness. Required evidence includes
request/response examples with secrets removed, runtime decoding/mapping checks,
authorization/error cases and an operation exercised against the target version.

| Operation / frontend seam | Required request and response agreement | Required authorization, failures and encoding agreement | Gate / current evidence |
| --- | --- | --- | --- |
| Resolve session / `resolveSession` | `GET /api/auth/session`: application ID, email, role, expiry, CSRF; no capabilities | `401`/`403`/`503` documented; identity/capability seam mapping pending | Auth / [handoff](auth.md), no adapter/live evidence |
| Managed login / `beginLogin` and callback | Browser GET login; Flask PKCE/callback/exchange; allowlisted UI redirect | Generic errors documented; exact environment callback/proxy values pending | Auth / [handoff](auth.md), no adapter/live evidence |
| Current-session logout / `logout` | POST with cookie, exact Origin and session CSRF; `204` after invalidation | `503` retains cookie and is unconfirmed; frontend pending/confirmed lifecycle mapping pending | Auth / [handoff](auth.md), no adapter/live evidence |
| Authorized catalog / `listDatasets` | GET datasets: IDs/SQL names, coverage, embedded schemas, generation | Role-filtered; capability/summary mapping pending | Catalog/Preview / [contract](catalog-preview.md), no runtime |
| Authorized schema / `readSchema` | Embedded catalog columns; no standalone schema route | SQL type/nullability/description mapping pending | Catalog/Preview / [contract](catalog-preview.md), no runtime |
| Preview first page / `startPreview` | GET preview: optional inclusive date sides, size 100/max500 | Date-only conflicts with facility seam and paired/in-coverage validation | Catalog/Preview / [contract](catalog-preview.md), no runtime |
| Preview continuation / `continuePreview` | Cursor-only GET; current/revisit and next cursor, fixed 15-minute expiry | Session/generation binding; generic 404/410 recovery | Catalog/Preview / [contract](catalog-preview.md), no runtime |
| National series / `readNationalSeries` | National preview metric columns, fraction plus displays; no metric endpoint | Multi-page complete series and exact-rational mapping pending | Metric / [contract](metric.md), no runtime |
| Explicit SQL execution / `executeQuery` | Synchronous POST; SQL-only body, URL page/size, default100/max500 | CSRF, expanded types/errors, owned recovery metadata | SQL / [contract](sql.md), fixture source issues pending |
| Retained SQL page / `readQueryPage` | GET same path with ID/page/fixed size; 15 minutes from completion | 404/410, fixed limits and duplicates; no SQL replay | SQL / [contract](sql.md), no runtime |

Refresh admission/latest/by-ID are also [documented](refresh.md); Admin UI stays
conditional and no refresh implementation task is added.

`consumeNavigationIntent` is a frontend handoff, not an invented backend endpoint.
Its dataset/filter authorization comes from the agreed session/catalog context;
its generation guard and explicit edited-draft replacement remain frontend duties.

## Auth subgate — Q2 partially documented, integration pending

The [auth contract](auth.md) records the supplied browser-to-Flask flow: backend
code exchange/callback, HttpOnly session cookie, in-memory CSRF token, fixed
expiry, confirmed current-session logout and same-origin local proxy. It also
records exact Origin/CORS rules and the distinction from provider SSO lifetimes.
These transport details are no longer unspecified. The backend source still
labels integration choices draft; target configuration and live proof are pending.

Remaining: responsible integration person, target version/environment, actual
UI/public/callback origins and return paths, capability/identity mapping, and
logout retry/token handling. The current fixture session requires capabilities
absent from the wire response and invalidates local state before logout completes.
Do not fabricate capabilities or treat a failed logout as confirmed.

Before implementation, record required proxy/configuration/adapter file paths and
update the phase-5 tasks and dependency graph under the coordinator's ownership.
No frontend callback/code exchange is required. This documentation-only handoff
does not authorize transport implementation or complete T5.3.

## Catalog/Preview and Metric subgates — contract received, mapping pending

[Catalog/preview](catalog-preview.md) supplies names, embedded schemas, filters,
coverage, positional encodings and current/next cursors. [Metric](metric.md)
supplies prepared national columns through preview, not a separate endpoint.
Resolve date-only versus facility-filter scope, one-sided date input, schema/
summary metadata, typed cells/unknown nullability and the exact fraction model.
Overview must consume a complete same-generation preview range. Verify Viewer
access against the eventual implementation, including direct and cursor requests.

## SQL subgate — Q3 contract supplied, runtime and reconciliation pending

[SQL](sql.md) now fixes synchronous execution, default100/max500, 15 minutes from
completion, 1,000 rows/1 MiB, GET continuation, out-of-range recovery and errors.
Do not infer production retention quotas from backend runtime proposals.
Resolve richer cell types, retry/recovery metadata and the [source issues](contract-review.md#source-artifact-issues).
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
