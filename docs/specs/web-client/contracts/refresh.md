# Refresh contract — Admin Overview control

Data API v1; [source snapshots and provenance](data-api.md). The October 5
user request authorizes an Admin-only refresh control on Overview. It supersedes
the earlier deferred refresh-control scope; no separate Admin page or new-data
status card is introduced.

Current backend OpenAPI was rechecked at
`/Users/PECRUZ/Projects/outage-explorer/docs/specs/data-api/openapi.json`, SHA-256
`5c8489c57bb13047b8d813f4d1b0c7209a6d5ef90380e74c46d26e4f20fed5db`.
Receipt/run/interval schemas match the imported snapshot. Refresh operations now
say implemented; latest also documents a `400` response. This source check does
not establish connected refresh execution acceptance.

## Overview implementation — October 5

Backend-assigned Admin role maps to `canRefreshDatasets`; Viewer/Analyst do not
receive the controls and are blocked by the adapter before HTTP. With configured
auth, the live composition exposes admission and status through the same-origin
proxy and auth-owned in-memory CSRF token. Analytical data registration remains
separate. Missing refresh configuration never substitutes fixture data.

**Refresh data** explicitly submits the empty body and a new UUID idempotency
key. Pending and active runs disable new admission. Uncertain admission offers
**Retry refresh admission**, retaining the same key. **Check refresh status**
reads the current run, or latest when no run is known; it never submits a POST.
Status distinguishes accepted/running, published success, retained data,
failure/interruption and nonterminal unknown publication. There is no automatic
POST retry, implicit source interval selector or invented progress percentage.
Confirmed publication asks Overview to reload its national observations once
per run, without touching retained SQL executions.

Refresh state and pending publications are discarded on unmount, logout,
expiry or role change. A denied response removes run state and disables controls
until a new authoritative session resolution. Closing the UI does not cancel
backend work; latest lookup allows deliberate rediscovery after reload.

## Admission and idempotency

`POST /api/refresh`, JSON `{}`, cookie credentials, permitted browser Origin,
session CSRF and `Idempotency-Key`. Keys contain 16–128 ASCII letters/digits,
hyphen or underscore. Dates and dataset selectors are rejected: the backend
chooses its configured inclusive interval and refreshes all three grains.

New admission returns `202`, `Location: /api/refresh/{run_id}`, `Retry-After: 3`,
and `{run_id, status, effective_interval: {start_date, end_date}, status_url}`.
Admission acknowledges durable recording, not completed retrieval/publication.
Closing the browser does not cancel the run.

An uncertain admission retry preserves the same key and empty request. The key
is scoped to user/operation and retains the original run/interval even if backend
settings change. Replay returns `202` while active, `200` when terminal.
Conflicting reuse returns `409 idempotency_conflict`; another occupied run yields
`409 refresh_busy`. Explicit Admin retry after terminal interruption uses a new
key after reconciliation. SQL POST has no corresponding idempotency promise.

## Status and rediscovery

`GET /api/refresh/{run_id}` returns `RefreshRun`; unknown IDs yield
`404 refresh_unavailable`. Admin authorization precedes lookup.
`GET /api/refresh/latest` returns `{run: <same run object or null>}`: the active
run, otherwise the most recently admitted run across Admin requesters (run-ID
tie-break). No prior run is `200 {"run":null}`; dependency failure is `503`.
Latest lookup neither starts work nor provides history.

| Field | Values / meaning |
| --- | --- |
| `status` | `accepted`, `running`, `succeeded`, `retained`, `failed`, `interrupted`, `publication_unknown` |
| `stage` | `queued`, `retrieving`, `modeling`, `persisting`, `verifying`, `publishing`, `finished` |
| Timing | `accepted_at`, nullable `started_at`/`finished_at`, persisted `effective_interval` |
| `datasets` | All three IDs; each has `pending`, `processing`, `succeeded`, `retained` or `failed`, nullable coverage/quality |
| `publication` | `state`: `pending`, `published`, `not_published`, `unknown`; nullable current/previous generation IDs and no-publication reason |
| `failure` | Null or safe `{code,message}` |

`publication_unknown` is nonterminal. Never call it confirmed failure/success or
automatically rerun source retrieval. `succeeded` means confirmed new publication.
`retained` means all incoming rows were excluded with previous data retained:
publication is `not_published`, reason `all_incoming_rows_excluded`.
Other successful publications can include exclusions/retained observations.
Never publish a partial subset of datasets or invent a progress percentage.

Quality fields are `received_rows`, `selected_rows`, `excluded_rows`,
`duplicates_collapsed`, `superseded_rows`, `retained_invalid_rows`,
`retained_absent_rows`, `carried_outside_interval_rows`, `modeled_rows`,
`retained_entire_dataset`, and `exclusion_reasons` (`code`, `count`). Unknown
counts/coverage/quality remain null, not zero. Overlapping reasons do not sum to
excluded rows; retained/out-of-interval observations are not newly retrieved data.

Polling uses status resources and advisory Retry-After, not a completion promise.
Cross-origin transport must allow Idempotency-Key and expose Location/Retry-After.
Worker ownership, interruption reconciliation and runtime resource isolation
remain backend implementation/verification gates.
