# Frontend adaptation to the supplied contracts

October 5, 2026. The user accepts date-only filtering for v1, owns backend
documentation corrections B1–B3, and requests frontend adaptation without
expecting data API responses yet. The user subsequently confirmed backend auth
works and is ready for frontend integration. Follow the [next auth tasks](../tasks/phase-5.md#next-implementation-connect-working-backend-auth);
frontend connected verification remains required.

## Expected experience versus available contract

| Originally expected | Available v1 behavior | Frontend treatment |
| --- | --- | --- |
| Dates and applicable facility filters | Dates only | Remove the facility selector; reject unsupported facility input rather than silently ignoring it. Analysts still browse facility/generator datasets. |
| Paired dates within coverage | Independently optional inclusive start/end; out-of-coverage requests can be empty | Accepted and implemented: optional bounds in Explorer and Overview; coverage informs users rather than limiting valid inputs. Overview starts with catalog coverage. |
| Session identity plus capability flags | ID, email, role, expiry, CSRF | User confirms the backend will add capability fields. Backend auth is now confirmed working; capture its current capability response during integration intake before mapping. No role-derived substitute. |
| Separate schema request | Columns embedded in authorized catalog | Keep the feature operation; fulfill it from the catalog and preserve generation/session ownership. |
| Complete national series endpoint | Paginated national preview | Collect one cursor sequence, validate consistency, sort dates ascending, then publish the complete series. Never run SQL implicitly. |
| Exact decimal calculated percentage | Exact numerator/denominator plus rounded decimal/display | Preserve the fraction; use approximation only for chart coordinates, backend display for labels. |
| Basic scalar table values | Rich scalar and recursive values, unknown nullability | Preserve ordered cells/duplicate names, numeric strings, structured values and unknown metadata. |
| Simple SQL error and inferred paging metadata | Explicit totals, limits, retry hints and retained-query recovery | Preserve metadata; offer explicit GET recovery, never automatic SQL replay. |
| Live API verification | Backend responses not expected yet | Test local decoding/mapping/lifecycle with controlled responses. Production remains fail-closed and has no fixture fallback. |

## Ownership and sequence

The current coordinator is the sole writer for shared models, affected consumers,
adapters, tests and documentation. Existing atomic components, thin pages and
feature operation injection remain the boundaries. This is sequential work;
no parallel assignments are made.

1. Adapt `src/contracts/*`, Explorer date-only controls and Overview exact values;
   revalidate affected `src/features/*`, table presentation and test fixtures.
2. Prepare versioned decoders/mappings in `src/adapters/live/*` and controlled
   tests there. Backend artifact issues remain documented separately.
3. Prepare `src/integration/data-http-client.ts` with injected fetch/current-session/CSRF providers. Auth integration is next against the user-confirmed working backend; capture its current capability fields at intake. No frontend OAuth callback.
4. Keep production registration unavailable pending target configuration and
   actual backend verification. T5.L/T6.L/release remain incomplete.

No refresh screen is added; the Admin UI and new-data card retain their deferred
scope. No backend files are changed. Implementation/check evidence will be
recorded separately from this proposal and from live acceptance.

## What is implemented locally

- Date-only controls with independently optional bounds, valid empty ranges outside
  coverage, and explicit rejection of unsupported facility filters. This removes
  the prototype facility control as an accepted scope change; it does not remove
  facility/generator datasets from authorized Analyst workflows.
- `src/adapters/live/data-schema.ts`, `table-mapping.ts` and `data-mapping.ts`:
  runtime decoding for catalog, preview, SQL and recursive cells. Schema labels
  are formatted from descriptors; descriptions/grain are documented client text.
  Schema reads currently fetch catalog metadata afresh, so no cross-session
  catalog cache is introduced.
- `data-adapter.ts` and `metric-mapping.ts`: injected operations; schema from
  catalog; preview cursors; full national preview collection; exact fraction
  retention; SQL execute and GET page operations. National source text is client
  presentation metadata. No SQL is executed to populate Overview.
- Rich table rendering preserves positional duplicates, quoted strings, nested
  lists/struct fields/map pairs, binary base64 and unknown nullability. Approximate
  chart coordinates are separate from authoritative percentage labels.
- SQL retains supplied totals/limits and retry/recovery metadata. An explicit
  first-page recovery action uses the returned query ID and original size; a
  network retry does not submit SQL again. Empty byte-truncated results are
  explained separately from a query with no matches.
- `src/integration/data-http-client.ts`: cookie-bearing same-origin requests,
  in-memory CSRF injection for SQL POST, sanitized error decoding, no retry or
  fallback. It is **not registered in production** and no API call was made.

Legacy synthetic feature fixtures still use their own IDs, decimal examples and
short SQL lifetime. They remain explicitly synthetic; new adapter tests consume
supplied v1 response examples. Current/revisit cursor, SQL totals and limits are
optional in legacy feature models but required by the v1 runtime decoder.
Backend B2 remains an SQL-example issue; response mapping does not execute or
prove that SQL projection. B3 is rejected by the decoder until corrected.

## Auth integration inputs

The frontend needs authorized dataset IDs, national-series visibility and SQL
execution visibility, currently named `datasetIds`, `canReadNationalSeries` and
`canExecuteQuery` in its **view model**. These are not proposed JSON field names
or claims about the upcoming response. Once the expanded backend DTO is supplied,
map and validate it alongside ID/email, expiry and CSRF. Backend authorization
continues to enforce every operation.

The user clarified that both role assignment and capability control belong to
the backend. The frontend sends neither role nor capabilities; its session GET
sends the session cookie with no permission payload. The revised response need
not include `role`. UI permissions come from returned effective capabilities,
never a local role-to-permission mapping. See the [accepted authorization boundary
and response proposal](auth.md#accepted-authorization-boundary--october-5-2026).

Logout's pending/confirmed lifecycle and memory CSRF retention across `503` will
be completed with that auth adapter. No auth/session runtime behavior was changed
in this pass. Production registration, same-origin proxy settings, target backend
revision/environment and actual connected checks remain pending.

Verification is recorded in [the adaptation evidence](../verification/contract-adaptation.md).
