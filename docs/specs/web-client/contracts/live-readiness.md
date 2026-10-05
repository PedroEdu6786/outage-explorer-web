# Live contract readiness

Ledger revision: **1**, October 4, 2026. Task: **T1.9**. Requirements:
FR2–FR4, FR6–FR7, FR9, FR13, FR16; TR3, TR5, TR7, TR9.

**Q2 and Q3 remain unresolved. No live operation is ready.** The accepted
[frontend contracts](../../../../src/contracts/session.ts) define proposed
feature-facing models; they do not approve HTTP payloads, routes, error codes,
credential transport or SQL settings. Synthetic checks cannot close live gates.

The imported [backend snapshot](../../../context/ui-client/04-backend-integration.md)
describes October 4 findings. No backend revision or live environment has been
revalidated for this ledger; the historical health endpoint proves no product
operation readiness.

## Responsibility and target slots

| Required slot | Current assignment/value | Evidence needed |
| --- | --- | --- |
| Backend/session contract decision owner | Unassigned — Q2 | Named responsible person and recorded agreement |
| Frontend integration implementation owner | Integration lane | Coordinate mappings and affected consumer checks |
| Backend contract version | Unprovided — Q2 | Versioned contract artifact with revision/digest |
| Backend implementation revision | Unprovided — Q2 | Commit/release tied to the contract |
| Target environment | Unprovided — Q2 | Environment identifier and approved connection configuration |
| Session/Cognito configuration decision owner | Unassigned — Q2 | Responsible person for callback, exchange and session choices |
| SQL lifecycle/settings decision owner | Unassigned — Q3 | Responsible person for size, expiry, delivery and outcome agreement |
| Live verification environment/accounts owner | Unassigned — Q2 | Access-controlled test setup and independent session identities |

These named responsibility slots reserve accountability without assigning an
invented person. Do not place credentials, tokens or account secrets in this ledger.

## Operation records

Every row is **blocked pending agreement**. For each row, fill the contract
version, implementation revision, target environment, decision owner, approved
artifact and actual evidence before changing readiness. Required evidence includes
request/response examples with secrets removed, runtime decoding/mapping checks,
authorization/error cases and an operation exercised against the target version.

| Operation / frontend seam | Required request and response agreement | Required authorization, failures and encoding agreement | Gate / current evidence |
| --- | --- | --- | --- |
| Resolve session / `resolveSession` | Identity, current dataset capabilities, expiry and unauthenticated resolution | Unknown/unassigned identity; expired/denied session; validated instant and capability encoding | Auth / none |
| Managed login / `beginLogin` and callback | Authorization Code + PKCE initiation, callback validation and application session establishment | Generic credential failure; safe callback/configuration failures; exchange and redirect ownership | Auth / none |
| Current-session logout / `logout` | Backend invalidation acknowledgment and provider/app logout relationship | Current session denied afterward, independent session policy; failures during logout | Auth / none |
| Authorized catalog / `listDatasets` | Opaque IDs, stable SQL names, grain, coverage and applicable authorized filter choices | Viewer national-only metadata; capability reductions; unavailable coverage; identifiers and calendar dates | Catalog/Preview / none |
| Authorized schema / `readSchema` | Dataset selection, ordered columns, SQL types, units and nullability | Direct forbidden dataset/schema access and safe failures; stable positional IDs and repeated labels | Catalog/Preview / none |
| Preview first page / `startPreview` | Dataset, applied date/facility filters, requested/effective size, ordered rows, snapshot, cursor and original expiry | Authorization, invalid filters, empty vs absent data; positional cells, exact numbers, IDs and dates | Catalog/Preview / none |
| Preview continuation / `continuePreview` | Opaque cursor binding to caller/selection/ordering/snapshot; original expiry; supported navigation metadata | Authorization on continuation; cursor expiry/invalidity; publication must preserve original snapshot | Catalog/Preview / none |
| National series / `readNationalSeries` | Authorized range, coverage, provenance, same-observation capacity/outage MW and reported/calculated percentages | Missing date vs null vs valid zero; two-decimal half-up display and exact decimal encoding; calendar dates | Metric / none |
| Explicit SQL execution / `executeQuery` | Unchanged SQL, positive 1-based page, requested/effective size, delivery state/result, query ID, snapshot, expiry and whole-result truncation | Dataset authorization; invalid/unsupported SQL, busy, confirmed timeout and lost-response unknown outcome; ordered positional cells with arbitrary projections | SQL / none |
| Retained SQL page / `readQueryPage` | Query ID, positive page and original fixed effective size; same execution/snapshot and truncation | Per-page authorization; lost/expired result; out-of-range page; duplicates/precision preserved; never SQL resubmission | SQL / none |

`consumeNavigationIntent` is a frontend handoff, not an invented backend endpoint.
Its dataset/filter authorization comes from the agreed session/catalog context;
its generation guard and explicit edited-draft replacement remain frontend duties.

## Auth subgate — Q2 unresolved

Record browser-to-Flask versus a thin Next.js bridge, code-exchange ownership,
credential/session mapping and storage, cookie/token forwarding, CORS and
applicable CSRF behavior. Agree callback/client configuration and allowed
redirects, credential-free messages, explicit re-login without silent application
session renewal, backend current-session invalidation and independent sessions.
Distinguish the application session from provider token and SSO lifetimes.

Before implementation, record any required callback/bridge/server file paths and
update the phase-5 tasks and dependency graph under the coordinator's ownership.
No such paths or credential transport are approved by this document.

## Catalog/Preview and Metric subgates — Q2 unresolved

Agree dataset/SQL names rather than copying EIA route names. Finalize filter and
coverage payloads, authorized schema metadata and lossless table encoding.
Verify Viewers cannot obtain detail metadata or data through direct requests or
continuation pages. Preview agreement must preserve the original snapshot and
fixed expiry; any previous-navigation support needs its own agreed semantics.

Metric agreement must preserve backend authority, same-observation source values,
exact/display decimals, calendar dates and unavailable observations. Plotting
approximations cannot become displayed metric values or interpolated observations.

## SQL subgate — Q2 and Q3 unresolved

Record SQL page default/maximum and effective-size behavior, fixed result TTL and
expiry origin, synchronous/asynchronous delivery, out-of-range handling, result
loss on backend restart, and whole-execution row/byte limits with truncation
representation. None of these settings is supplied by fixture scenarios.

Agree confirmed execution timeout versus unknown outcome after response loss,
including deliberate-new-execution recovery and busy behavior. Do not assume
cancellation, lookup, idempotent replay, execution retry or implicit page-1
recovery. Page requests must reuse one execution's ID and size without SQL.

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
