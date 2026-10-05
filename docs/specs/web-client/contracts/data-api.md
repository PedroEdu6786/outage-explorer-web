# Data API v1 contract intake

Received October 5, 2026. **Contract artifacts available; all seven data/refresh
operations remain pending backend implementation.** This is documentation-only
intake, not transport implementation, endpoint availability or live acceptance.
Auth remains governed by [auth.md](auth.md).

## Current integration intake — October 5, 2026

The user confirms the documented backend services are implemented and ready for
frontend integration. The updated source handoff confirms all seven operations
are implemented and opt-in, closes the former B1–B3 artifact issues and permits
null query generation identity for reference-free SQL. See the [integration spec](../../../../specs/backend-integration/spec.md)
and [assessment](../integration-assessment.md) for current source hashes, remaining frontend behavior,
state-management options and SQL-security recommendations.

This update supersedes backend-pending statements below, which retain historical
intake provenance. Prepared client adapters exist; production data registration
and connected acceptance remain open. Backend analytical resources must be
explicitly configured for the named live target; user-owned isolation validation
is outside this frontend work. No live or visual acceptance gate is closed here.

## Reference and provenance

The user supplied these files in the backend repository at
`/Users/PECRUZ/Projects/outage-explorer/docs/specs/data-api/`:

| Source | SHA-256 at intake |
| --- | --- |
| `client-handoff.md` | `e9da2b5e77e5762c14e1de9136ae4cbde8e3bacf73892485a9a299ed043adcfd` |
| `openapi.json` | `a40185741741b4d5450e473492bb05cdd947d788defbd731f1b5dff6156e683a` |
| `fixtures.json` | `44c735b29121c4d1fcf4c510b01338e63a912bb23f9951e9f72461b62f789d55` |

Read-only supplemental references from the same directory clarified intended
behavior and availability:

| Source | SHA-256 at intake |
| --- | --- |
| `http-contract.md` | `afe0326194f95392e5ef65eafa03d9e587c2da6ad033fbf6623d474ad9f4809a` |
| `runtime-evidence.md` | `62ce0abdec9e020a236c3f2084f75b88e046fd0a27e3c64abaa67fc12049f54a` |

Backend checkout HEAD was `f9e691d72d267a5385f3ccf4655885310e7f0a4d`.
The three supplied files and runtime evidence were **untracked**; the supplemental
HTTP contract was modified. These hashes identify the working-tree handoff;
that HEAD alone does not contain or version these artifacts.

Byte-identical copies of [OpenAPI](data-api-v1/openapi.json) and
[synthetic fixtures](data-api-v1/fixtures.json) are retained in this repository,
as requested by the backend handoff. OpenAPI is 3.1.0, contract version 1.0.0;
public schema/tabular encoding version is `1`. Keep these snapshots in docs,
outside runtime imports and public assets. Do not edit them to conceal source
issues: record resolutions and import a newly identified revision instead.

The following documents summarize the client handoff and supplemental HTTP
semantics; the snapshots retain the complete schemas and 58 named examples:

| Document | Covers |
| --- | --- |
| [Catalog and preview](catalog-preview.md) | Embedded schemas, dataset IDs, date-only filters and cursor navigation |
| [National metric](metric.md) | Prepared national columns and Overview adaptation |
| [SQL](sql.md) | POST execution, GET pages, caps, expiry and recovery |
| [Refresh](refresh.md) | Admin admission, idempotency, progress and publication |
| [Contract comparison](contract-review.md) | Differences from current frontend expectations and source issues |
| [Live readiness](live-readiness.md) | Inputs received versus unresolved mapping/runtime/environment gates |

## Endpoint inventory

| Method / path | Operation ID | Success | Access |
| --- | --- | --- | --- |
| `GET /api/datasets` | `listDatasets` | `200 Catalog` | Current role-filtered catalog |
| `GET /api/datasets/{dataset}/preview` | `previewDataset` | `200 Preview` | Authorized dataset |
| `POST /api/query` | `executeQuery` | `200 QueryResult` | All referenced datasets authorized |
| `GET /api/query` | `getQueryPage` | `200 QueryResult` | Original user, current access rechecked |
| `POST /api/refresh` | `admitRefresh` | `202 RefreshReceipt`; `200` terminal idempotent replay | Admin |
| `GET /api/refresh/latest` | `latestRefresh` | `200 LatestRefresh` | Admin |
| `GET /api/refresh/{run_id}` | `getRefresh` | `200 RefreshRun` | Admin |

There is no standalone schema route, metric route, query-page path, cancellation
route, refresh history list, or separate publish/approve endpoint in v1.
Documenting refresh does not add an Admin screen to the current delivery.

## Shared request and response rules

Use the existing session cookie and `credentials: "include"`. Both POST routes
require exact permitted browser Origin and the current in-memory `X-CSRF-Token`.
Send JSON Content-Type; JavaScript does not synthesize the Origin header.
Refresh additionally requires `Idempotency-Key`. Cross-origin integration must
allow that header and expose `Location`/`Retry-After`; these auth/CORS extensions
are not yet implemented or verified by this intake. Same-origin proxying remains
the local-development arrangement documented in auth.

All successes and errors use `Cache-Control: no-store`. Reject duplicate/unknown
query parameters, unknown JSON fields, invalid dates, invalid positive integers
and unsupported filter combinations. See review item B1 for missing OpenAPI
`400` declarations. Do not treat cached catalogs or role display as authorization.

`generation_id` identifies published data; it is separate from the frontend
session generation counter, a query execution ID and a preview cursor.
IDs are opaque strings. Dates are calendar values; data-API instants are RFC 3339
UTC ending in `Z`. Do not apply this narrower spelling to the auth response,
which also documents a `+00:00` expiry representation.

## Tabular wire representation

Rows are arrays aligned with ordered `columns`. Each column supplies `index`,
`name`, `type`, `encoding`, `nullable` (boolean or unknown/null) and `unit`
(string or null). Decimal metadata includes precision and scale; nested types
include ordered recursive `children` with names and type descriptors.
Duplicate labels and duplicate rows must survive decoding.

| Logical type | Encoding / JSON cell |
| --- | --- |
| `integer` | `integer-string`; exact text, including values beyond JS safe integers |
| `decimal` | `decimal-string`; precision/scale, exact text |
| `float` | `number-or-special-string`; finite number or `"NaN"`, `"Infinity"`, `"-Infinity"` |
| `boolean`, `string`, `null` | Native boolean, string or null |
| `date`, `time` | `iso-date`, `iso-time`; calendar date or timezone-free time |
| `timestamp`, `timestamp_tz` | `iso-local-datetime`, `iso-utc-datetime`; local timestamp versus UTC instant |
| `binary` | `base64` text |
| `list` | `array`; recursively typed elements |
| `struct` | `field-array`; values follow ordered child descriptors |
| `map` | `pair-array`; array of key/value pairs, not an object keyed by string |

Never convert integer/decimal cell values through JavaScript Number for display.
Pagination/count metadata uses bounded JSON numbers. Unknown nullability is not
false. Schema structure alone does not enforce each cell's descriptor, row width,
nullability, cursor ownership or authorization; adapters need semantic checks.

Supplemental runtime evidence does not claim lossless support for nanosecond
timestamps, calendar intervals, time-with-timezone, union/variant, BIGNUM,
UUID/enum or fixed arrays. Ambiguous date/timestamp extreme sentinels are rejected.
Unsupported values fail explicitly; the client must not silently coerce them.

## Service errors

Envelope: `{"error":{"code":"...","message":"..."}}`, optionally carrying
`retry_after_seconds` (1–3600) and owned-query recovery `details`.
Normalize by operation/status/code, not an exact message string.

| Status | Codes | Handling |
| --- | --- | --- |
| `400` | `invalid_request`, `invalid_sql`, `unsupported_sql`, `page_out_of_range`, `page_size_mismatch` | Correct input; out-of-range recovery can retain the owned execution |
| `401` | `unauthenticated` | Clear protected state and offer login |
| `403` | `forbidden` | Generic access/Origin/CSRF denial; remove affected content |
| `404` | `dataset_unavailable`, `query_unavailable`, `refresh_unavailable` | No protected lookup details; query loss requires deliberate rerun |
| `409` | `refresh_busy`, `idempotency_conflict` | Refresh admission conflict |
| `410` | `preview_unavailable`, `query_unavailable` | Explicit new preview sequence or deliberate SQL rerun |
| `422` | `query_resource_limit` | Execution resource limit; distinguish from successful output truncation |
| `429` | `result_capacity_exhausted` | Per-user retained-result admission capacity |
| `503` | `query_busy`, `result_capacity_exhausted`, `data_unavailable`, `service_unavailable` | Worker busy, global result capacity, no published data, or dependency failure |
| `504` | `query_timeout` | Confirmed execution deadline exceeded |

Only the responses declared for an operation apply to it; the table is a shared
vocabulary. `Retry-After` is a retry suggestion, never an ETA. Where present,
`error.retry_after_seconds` agrees with it. Do not automatically replay SQL POST.
Unknown/foreign resources use generic errors; never infer forbidden dataset
metadata from an error. A transport failure does not prove execution cancellation.

## Intake verification

Locally checked the two snapshots against their source bytes and SHA-256.
Using the existing backend virtualenv's JSON Schema validator, all **58 response
bodies** passed their declared schemas with format checks; all operation IDs,
response statuses/schema references and supplied header values matched OpenAPI.
Also checked positional row widths/column indexes and query page counters.
These are artifact checks, not request replay or proof of fixture SQL semantics;
[source issues](contract-review.md#source-artifact-issues) remain despite passing.

The backend's `runtime-evidence.md` describes controlled compatibility tests and
an unresolved Linux isolation/capacity gate. Its test counts are historical
backend claims, not tests rerun here. No frontend application tests, real API
requests, provider calls, runtime configuration or deployment were performed.
