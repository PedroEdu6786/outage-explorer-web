# Catalog and preview contract

Data API v1; [source snapshots and provenance](data-api.md). Frontend adapter registered; named-target live acceptance pending.
See [current status](../../../development/current-status.md).

## Catalog and schema

`GET /api/datasets` returns `{generation_id, datasets}`. Each dataset includes
`id`, `sql_name`, `label`, `schema_version: "1"`, ordered `columns`,
`supported_filters: ["start_date", "end_date"]` and
`coverage: {start_date, end_date}` (nullable dates).

Public IDs and SQL relation names are `national`, `facilities`, `generators`.
Viewer receives national only; Analyst/Admin receive all three. Do not infer
permission from a stale catalog. No published generation returns
`503 data_unavailable`, not a fabricated empty catalog. Coverage describes usable
stored data, not proof that all upstream observations were received.

The schema is embedded in the catalog; `readSchema` is a frontend operation to
map from this response, not an additional HTTP route. Preserve catalog generation
and session ownership in any cache; a new preview may start on a newer generation.
Use the preview's own columns/generation and do not force it to match an old catalog.

The supplied catalog fixtures establish these public columns, all non-nullable:

| Dataset | Ordered columns |
| --- | --- |
| `national` | `period`, `capacity_mw`, `outage_mw`, `reported_percentage`, `calculated_percentage_rounded`, `percentage_numerator`, `percentage_denominator`, `calculated_percentage_display`, `reported_percentage_display` |
| `facilities` | `period`, `capacity_mw`, `outage_mw`, `reported_percentage`, `facility`, `facility_name` |
| `generators` | Same facility columns, then `generator` |

`period` is a date; MW/reported percentage are decimal(38,12). National rounded
percentage is decimal(38,2); fraction/display columns and identifiers are strings.
General SQL expression nullability can still be unknown. The [OpenAPI](data-api-v1/openapi.json)
defines generic descriptors; exact projection parity additionally relies on
the [fixtures](data-api-v1/fixtures.json) and backend supplemental HTTP reference.

## Preview request

First page: `GET /api/datasets/{dataset}/preview`, with optional inclusive
`start_date`, `end_date`, `page_size` (default 100, allowed 1–500).
The October 6 web preference explicitly sends 10 initially in Dataset Explorer;
its adjustable size starts a new sequence. Overview still assembles the complete
national series through 100-row backend pages for its chart and cards, then
presents the Daily observations table in adjustable pages starting at 10 rows.
Either date side can be omitted; both omitted browse all stored coverage.
Facility/generator ID filters are explicitly excluded initially and rejected,
not ignored. A valid range without matching observations returns an empty page.

Ordering is newest `period` first, then applicable identifiers ascending using
binary UTF-8 comparison. This does not establish default ordering for user SQL.

Continuation/revisit: same route with **only** `cursor` in the query string.
Do not repeat dates or page size. The path still identifies the dataset.
`page_cursor` revisits the current page (including page 1); `next_cursor` advances.
Previous navigation can send a previously visited page cursor. Changing filters
or page size explicitly starts another sequence.

## Preview response and lifecycle

Required fields: `dataset`, `generation_id`, `columns`, `rows`, `page_size`,
`page_cursor`, nullable `next_cursor`, `has_more`, `expires_at`.
Empty result: `200`, empty rows, no next cursor. No total-page/count field exists.

The cursor binds caller, dataset, published generation, normalized filters,
fixed size and position. Expiry is 15 minutes from first-page creation and never
renews. Publication cannot mix a new generation into the sequence. Clear stored
pages/cursors on identity/access change and reject stale response publication.

Expired/lost continuation returns `410 preview_unavailable`; offer explicit
restart. Unknown or unauthorized dataset IDs return generic
`404 dataset_unavailable` without schemas. `403 forbidden` can also deny access;
the UI must support both without exposing hidden datasets.

Following user feedback, the frontend accepts date-only optional bounds and
valid ranges outside coverage. V1 decoders retain current/next cursors and validate
`has_more`; local Previous navigation still uses unexpired retained pages. See
[the adaptation record](frontend-adaptation.md). Backend wire examples
are synthetic; their dates and IDs are not production coverage.
