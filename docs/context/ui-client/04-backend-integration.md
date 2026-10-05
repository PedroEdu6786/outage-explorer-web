# Backend integration contract and gaps

The UI consumes the Outage Explorer backend. This document captures required
semantics, not a complete OpenAPI specification. Revalidate availability against
the backend version used for integration.

## Auth handoff update — October 5, 2026

The user supplied auth endpoints and the full backend reference was read locally.
The [auth HTTP contract](../../specs/web-client/contracts/auth.md) now records
backend-owned Cognito login/callback, HttpOnly cookie sessions, session identity/
role/expiry/CSRF, confirmed logout, errors and same-origin local proxy behavior.
Its source revision/digest and remaining frontend mapping decisions are included.
This supersedes the auth-transport gaps in the original snapshot below. The
subsequent [Data API v1 intake](../../specs/web-client/contracts/data-api.md) supplies
service contracts and snapshots. All seven data/refresh operations are still
pending backend implementation; no live verification or web transport is implied.
See the [comparison report](../../specs/web-client/contracts/contract-review.md)
for date-only filter scope, mapping differences and source artifact issues.

## Verified implementation status on October 4 2026

At the October 4 handoff, the Flask application registered only `GET /health`. It returns
`status`, `service` and `checked_at` and sets `Cache-Control: no-store`.
It is unauthenticated liveness; it does not prove data, auth or SQL readiness.

Offline verification for all three grains, connector modeling, local Parquet
verification and EIA adapter work exist. Those are not product HTTP APIs.
Authentication, authorized catalog/preview/metrics, SQL execution/pagination
and Admin refresh HTTP integration are pending. Cognito and RDS setup were
user-confirmed, but end-to-end application integration is not thereby verified.

The backend stack is a layered Flask monolith, PostgreSQL on RDS for operational
state, S3/Parquet for durable analytical data, and isolated DuckDB execution
against backend-cached authorized inputs. Deployment targets one backend
replica on EC2. Local UI development does not require provisioning EC2.

## Logical operations to agree with the backend

These names identify adapter responsibilities only. They are not endpoint paths
or finalized method/type declarations.

| Operation | Semantics/information needed | Still open |
| --- | --- | --- |
| Resolve session | `GET /api/auth/session`: identity, role, expiry and CSRF | [Auth contract](../../specs/web-client/contracts/auth.md) recorded; capability/view-model mapping and live evidence pending |
| Login/callback/logout | Flask owns Cognito flow/callback and cookie sessions; CSRF-protected logout | [Auth contract](../../specs/web-client/contracts/auth.md) recorded; exact environment/proxy settings and live evidence pending |
| List datasets/schema | GET datasets embeds authorized columns/coverage and stable national/facilities/generators SQL names | [Contract supplied](../../specs/web-client/contracts/catalog-preview.md); metadata/capability mapping and runtime pending |
| Preview records | Date-only optional bounds; current/next cursors, fixed snapshot/size/15-minute expiry | [Contract supplied](../../specs/web-client/contracts/catalog-preview.md); facility-filter scope and date-validation reconciliation pending |
| Read fleet metric | Prepared columns of national through preview/SQL; no separate endpoint | [Contract supplied](../../specs/web-client/contracts/metric.md); full-series assembly and exact-fraction mapping pending |
| Execute SQL | POST query, SQL-only body, URL page/size; synchronous result | [Contract supplied](../../specs/web-client/contracts/sql.md); source issues, model/error mapping and runtime pending |
| Read query page | GET query with ID/page/fixed size; 15-minute lifetime from completion | [Contract supplied](../../specs/web-client/contracts/sql.md); runtime and live verification pending |
| Start/check refresh | Admin POST admission, GET latest/by-ID, idempotency and publication states | [Contract supplied](../../specs/web-client/contracts/refresh.md); runtime pending, UI still conditional |

Do not copy proposed `/api/...` paths from an earlier design and treat them as
implemented. The earlier proposed `fleet_offline_share_daily` name is superseded
by the v1 prepared metric columns in `national`; no such extra dataset is exposed.

## Authentication integration boundary

Cognito User Pools managed login and Authorization Code with PKCE are selected.
Seeded accounts are sufficient and public registration is disabled. Application
permissions belong to PostgreSQL, and the backend must enforce them on every
operation, including subsequent preview/result pages.

The October 5 handoff supplies browser-to-Flask authentication through a
same-origin local `/api` proxy. Flask owns code exchange and callback, sets an
HttpOnly session cookie, and returns an in-memory CSRF token for logout. Provider
tokens never reach the web client. Record exact proxy/origin/callback settings
and reconcile the existing frontend session/capability/logout seams before
connecting protected screens; see the [auth contract](../../specs/web-client/contracts/auth.md).
Do not store credentials in browser storage. No backend/AWS secrets may enter
client bundles or public environment variables. Production hosting remains open.

The one-hour application session, provider token lifetime and Cognito SSO session
are different concepts. Sign-out must invalidate the current application session
on the backend; clearing client state alone is not completion. Unknown or
unassigned identities receive no product permissions.

## Error and pagination semantics

Normalize backend failures into feature states without fabricating HTTP status
codes or error identifiers before the contract exists. Distinguish unauthenticated,
forbidden, invalid input, unsupported SQL, execution busy, execution timeout,
unavailable data, expired preview, lost/expired query result and service failure.

The [v1 serialization contract](../../specs/web-client/contracts/data-api.md) now
supplies ordered columns, positional rows, exact numeric strings and recursive
types. Frontend decoding/view models need reconciliation before integration.
A simplistic object keyed solely by column name loses duplicate SQL labels.

Preserve the separate pagination contracts:

| Property | Dataset preview | SQL result |
| --- | --- | --- |
| Selection | Opaque current-page/revisit or next cursor | Numbered `page` by opaque `query_id` |
| Stability | Original snapshot, filters and ordering | One execution's sequence and multiplicity |
| Size | Default 100; initial configurable maximum 500 | Fixed within execution; independently selected default100/max500 |
| Expiry | 15 minutes from first page | Fixed 15 minutes from execution completion |
| Recovery | Explicit restart of browsing | Explicit rerun, new ID |
| Total output | Backend-paginated browsing | Baseline 1,000 rows or 1 MiB for the entire execution |

Preview and SQL settings are independently specified, even though v1 values match. A backend restart can lose
SQL pagination metadata. Cache keys and UI state must distinguish a page of the
same execution from a newly submitted query, even when the SQL text is identical.

## Independent development before API availability

Define a narrow adapter seam and implement explicit fixture responses for
screen and state development. Keep proposed transport contracts labeled as
proposed; fixtures establish UI behavior, not backend compliance. Use the same
feature-facing seam for fixture and eventual HTTP adapters so components need
not know which supplies data.

Make fixture mode explicit in development configuration and visible in demos.
Production configuration must never silently fall back to fixtures after a
backend failure. Fixtures should cover each role, empty results, errors,
expiry, truncation, duplicate SQL rows/labels and stale-request races.

Synthetic observations must be labeled synthetic. If real EIA fixtures are
used, include provenance and preserve their access restrictions. Keep fixture
data out of production client bundles, especially facility/generator examples
that could be downloaded by a Viewer even when their screen is hidden.
