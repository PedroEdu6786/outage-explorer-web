# SQL execution and retained-page contract

Data API v1; [source snapshots, serialization and errors](data-api.md). Runtime pending.

## Execute once

`POST /api/query?page=1&page_size=100`, JSON body **only** `{"sql":"..."}`.
Use cookie credentials, Content-Type, current CSRF token and permitted browser
Origin. Default page is 1; page size defaults to 100 and permits 1–500.
An initial page greater than 1 is allowed. Execution is a bounded synchronous
`200 QueryResult`, not an asynchronous query-job protocol.

SQL remains unchanged: never append ordering/limits/offsets for pagination.
All referenced datasets require current backend authorization. A repeated POST
creates a new execution; there is no SQL idempotency key, automatic retry,
cancellation or unknown-execution lookup contract. A lost response requires
unknown-outcome handling and a deliberate new Run, not automatic replay.

## Read the same execution

`GET /api/query?query_id=<opaque-id>&page=2`. Optional `page_size` must equal
the stored size. No SQL or request body. Reads are owned by the original user
with current access checked again. Revisited pages retain their contents,
generation, size and original expiry; GET never starts a worker.

## Result envelope

Required fields are `query_id`, `generation_id`, ordered `columns`, positional
`rows`, `page`, `page_size`, `retained_row_count`, `total_pages`, `has_more`,
`truncated`, `truncation_reason`, `limits`, `expires_at`.

| Property | Contract |
| --- | --- |
| Page bounds | Positive, 1-based; an empty result has page 1 of 1 |
| Total retained caps | `limits.max_rows: 1000`, `limits.max_bytes: 1048576` |
| Expiry | Fixed 15 minutes from execution completion; requests never renew it |
| Truncation | Reason is null, `row_limit` or `byte_limit`; no wire `both` variant |
| `has_more` | Another retained page exists, not evidence of unretained matches |
| Count | Retained rows only, never a total count of all source matches |

The supplemental HTTP contract keeps the 10-second execution deadline and one
analytical worker at a time; preparation/overall deadlines and runtime capacity
are separate unresolved backend gates. Do not promise a 10-second HTTP response.

Canonical retained-byte accounting includes schema/metadata and complete rows,
not only visible cell payloads. Stop before the first non-fitting row; never skip
it to fit later rows. An oversized first row can yield empty rows with
`truncated: true`, `byte_limit`; this is different from an empty untruncated result.
The internal canonical document is not the HTTP response shape.

## Recovery and additions to frontend handling

- `400 page_out_of_range`: correct the page without a new execution. An initial
  POST error can carry `error.details: {query_id, expires_at}` for the owned
  retained result; explicit GET page recovery avoids repeating SQL.
- `400 page_size_mismatch`: retain the original size; a new size requires Run.
- `404 query_unavailable`: foreign/unknown/lost result, including metadata loss.
  `410 query_unavailable`: known expiry. Both require explicit rerun; the client
  cannot always distinguish expiry from loss after a backend restart.
- `422 query_resource_limit`, `429 result_capacity_exhausted` (per-user), and
  `503 result_capacity_exhausted` (global) add distinctions beyond the current
  frontend failure union. Quota counts are not fixed by this contract.
- `503 query_busy` is retryable by deliberate user action; `504 query_timeout`
  is a confirmed deadline. `Retry-After` is advisory, not an automatic POST policy.

The frontend currently drops structured error details/retry metadata, supports
fewer cell types, and does not retain returned `total_pages`/`has_more`/`limits`.
Agree decoding/mapping and validate consistency before transport coding. See
[contract comparison](contract-review.md); source fixture issues must not become
production behavior.
