# Data API v1 comparison with the web client

October 5, 2026. Compared the [received contract](data-api.md), OpenAPI and
58 fixtures with current `src/contracts/*` and Auth/Explorer/Overview/Queries
controllers. The table below preserves the intake findings. Subsequent user
decisions and local adaptations are recorded immediately below.

## Resolution after user feedback — October 5

- F1: user accepts date-only v1; facility selector removed, dataset access retained.
- F2: user accepts API-compatible optional bounds and valid out-of-coverage empty results.
- F3–F10 and the SQL portion of F12: local data decoders, mappings, richer models and controlled transport
  are prepared; see [frontend adaptation](frontend-adaptation.md) and its verification.
- F11: backend will add capability fields. Await the expanded auth DTO; no role-only
  capability substitute or live auth connection is implemented.
- B1–B3: user owns backend corrections. Imported source snapshots remain unchanged;
  the inconsistent row-limit response is rejected rather than copied into behavior.
- F13: refresh UI remains conditional. Live readiness is still unverified.

## Frontend differences and newly specified behavior (intake baseline)

| ID | Current expectation / code | Received contract | Consequence before implementation |
| --- | --- | --- | --- |
| F1 — filter scope | Product context expects facility filters where applicable; `AppliedFilters.facilityId`, catalog facility options and Explorer selector exist | Initial preview is date-only; facility/generator filter parameters are rejected | Reconcile the scope change explicitly. Keep controls unavailable for v1 and do not send or silently drop a selected facility filter. |
| F2 — date bounds | `DateRange` requires both sides; Explorer validation and Overview reject dates outside catalog coverage | Either date side may be omitted; a valid nonmatching interval returns empty rows (`preview_empty` demonstrates dates outside fixture coverage) | Decide the UI date policy and allow wire semantics without labelling valid backend requests invalid. Do not invent missing bounds. |
| F3 — catalog/schema | Separate `readSchema` operation; summary requires description/grain and schema `sqlType` | One catalog response embeds columns; has no description/grain/raw SQL type label | Map the existing operation to catalog data. Document labels/grain/type formatting as client mappings, not invented server fields; keep caches session/generation-scoped. |
| F4 — cursor history | `PreviewPage` stores only next cursor; Previous currently uses retained local pages | Every page has `page_cursor` and can be revisited through GET; `has_more` is explicit | Existing local previous navigation can remain within original expiry; preserve current cursors if using server revisits and reconcile consistency checks. |
| F5 — metric transport | `readNationalSeries` returns a complete series with coverage and provenance | Prepared metric columns live in `national`, exposed through paginated preview/SQL; no metric endpoint | Assemble a range from one preview sequence before charting; do not silently truncate at 100 rows or create implicit SQL runs. Source label is presentation metadata. |
| F6 — exact calculated metric | `DecimalValue.exact` assumes decimal text; chart uses `Number(exact)` | Exact percentage is a numerator/denominator pair, with separate rounded decimal and display text; fixture is `10/3` | Choose a lossless rational representation and coordinate mapping. `3.33` is rounded, not the exact value of `10/3`. |
| F7 — table domain | `TableValueKind` supports text/ID/date/integer/decimal/boolean; nullable is boolean | Adds floats including nonfinite strings, time, local/UTC timestamps, binary, recursive list/struct/map, null type and unknown nullability | Expand or deliberately map the view model with documented formatting; preserve precision/type distinctions and duplicate labels. Do not stringify nested arrays ambiguously. |
| F8 — errors/recovery | `OperationFailure` has kind/message only; current query controller needs a successful result before paging | Adds retry seconds, resource/capacity distinctions and owned query ID/expiry on initial out-of-range error | Preserve metadata and explicit GET recovery without another POST. `404 dataset_unavailable` can mask denied IDs; not every denial is `403`. |
| F9 — SQL settings | Q3 defaults/max/TTL/delivery were open; production registration has no configured SQL settings | Default 100, max 500, synchronous POST, fixed 15 minutes from completion; numbered GET | Contract questions are answered. Runtime/environment and frontend reconciliation still gate live use; no settings changed now. |
| F10 — query envelope | Frontend derives total pages and has truncation reason `both` | Explicit totals/has_more/limits; reasons only `row_limit` or `byte_limit`; empty byte-truncated page possible | Validate wire counters and keep empty versus truncated distinct. Never expect a `both` response. |
| F11 — session/capabilities | Session model expects dataset IDs and capability booleans; auth response supplies role only | Role-filtered catalog now supplies dataset IDs, but neither artifact supplies the frontend capability booleans | Agree session/catalog composition and presentation policy. Catalog failure is not proof of logout; never manufacture authorization from fixture roles. |
| F12 — mutation transport | Auth handoff covered CSRF for logout; backend auth CORS documented only X-CSRF-Token/Content-Type | SQL and refresh POST also need CSRF/Origin; refresh needs Idempotency-Key and exposed Location/Retry-After | Coordinate backend/proxy CORS integration; browser sends Origin. Existing logout confirmation/503 issue remains in [auth](auth.md). |
| F13 — refresh | Admin UI conditional; earlier context covers generic background refresh | Adds latest lookup, fixed configured interval, idempotent admission, interruption and nonterminal publication uncertainty | Document backend capability without adding UI scope. Never apply refresh's safe same-key retry policy to SQL. |

These are mostly expected adaptations from proposed fixture-facing seams to the
now-supplied transport. F1 is a scope difference; F2 is a narrower current UI
policy; F5 is an endpoint mapping choice resolved by the supplemental backend
contract, not a missing backend metric. F6–F8 need substantive model/behavior work.
No previously accepted fixture tests establish compatibility with these wire DTOs.

## Source artifact issues

These issues should be reconciled in the backend artifacts before treating the
affected cases as authoritative conformance examples. Imported snapshots remain
unchanged, with hashes in [data-api.md](data-api.md).

| ID | Evidence | Impact / requested correction |
| --- | --- | --- |
| B1 — missing error declaration | OpenAPI `listDatasets` and `latestRefresh` omit `400`, although their descriptions and supplemental HTTP contract reject unknown/duplicate parameters and unsupported bodies | Add the promised `400 invalid_request` response or clarify a different route policy. Generated clients otherwise miss a documented failure. |
| B2 — projection mismatch | `query_first` / `query_direct_page` execute `SELECT * ... AS sample(x, x_copy)` but return column names `x`, `x`; continuation/revisit share that projection | Use SQL that actually projects duplicate labels, or correct returned names. This fixture cannot demonstrate SQL-to-result projection fidelity as written. |
| B3 — row-limit fixture | `query_row_limit` has `truncated: true`, reason `row_limit`, `retained_row_count: 2`, with `limits.max_rows: 1000` | Clarify that this is only a compact presentation fixture or supply a semantically consistent retained result. Do not use it as proof that the 1,000-row cap was exercised. |

Fixture `request` objects are **scenario shorthand**, not complete HTTP requests:
several are `{}` even for required SQL/path inputs, and populated query cases mix
`sql` and page metadata in one object. The handoff/OpenAPI correctly place only
SQL in the POST body and pagination in the URL. Split these fields for eventual
tests/adapters; never send the fixture request object verbatim. This limitation
does not invalidate response-schema checks.

The generic `Cell` schema also cannot enforce descriptor-dependent values or
row widths; passing schema validation is not an engine/authorization proof.
The intake performed additional row/page checks, but did not execute fixture SQL.

## Resolved inputs and remaining gates

Received: stable dataset/SQL names, embedded schema route, date-only filtering,
revisit cursors, national metric projection, richer lossless encodings, SQL
defaults/limits/expiry/delivery/recovery, error codes and refresh lifecycle.

Still needed: expanded auth capability DTO, user-owned correction/clarification of B1–B3,
actual backend implementation and runtime isolation/capacity evidence, named
integration owner, target revision/environment, auth/proxy/CORS configuration
and live request/permission/session verification. Proposed result-retention
quotas in backend runtime notes are not agreed production settings.

T5.3 is progressed, not complete. No T5.4–T5.9/T5.L/T6.L or release acceptance
is asserted by this documentation pass. No backend files were changed or messages
sent to backend maintainers.
