# Prepared integration adapters — phase 3

Completed backend-integration T3.1–T3.4 and T3.C on October 5, 2026.
This record accepts controlled frontend operation readiness only. Original
T5.L/T6.L, connected-browser, backend enforcement, visual and release gates
remain open. No analytical HTTP requests or real SQL executions were performed.

## Source binding and prerequisites

- Base revision: `3a078e61d82e37212ea04e6df0340bcd5de4616e` on
  `feat/backend-integration`, plus the phase-3 working-tree changes.
- SHA-256: `ee952d2409eafa234c9bae22de97eae86b557a39b76e5ba810ec7ce33e42beee`.
  Hash sorted UTF-8 paths, NUL, contents, NUL for the eleven files listed below.
  This evidence record, coordinator-owned journal/ledger and generated files
  are excluded to avoid self-reference and concurrent coordinator writes.
- Node `v24.18.0`, npm `11.16.0`; existing dependencies. Next type generation
  normalized declarations; both preexisting `.next/dev` imports in
  `next-env.d.ts` were restored afterward and are outside phase ownership.
- Original auth composition/runtime T5.4/T5.5 and integration phases 1–2 are
  predecessors, with their previously recorded scope preserved. Current copied
  Data API v1 OpenAPI/fixture identities are unchanged from
  [phase 1](../../../../specs/backend-integration/verification/phase-1.md):
  `5c8489c57bb13047b8d813f4d1b0c7209a6d5ef90380e74c46d26e4f20fed5db`
  and `a4ec631f86c77329e4613c1c9c3987609ddf29d665392bb23fad077827e1f087`.
  Historical auth smoke evidence is not rerun or expanded by this phase.

Digest inventory:

- `src/integration/live-composition.ts` and `live-composition.test.ts`
- `src/integration/data-http-client.ts` and `data-http-client.test.ts`
- `src/adapters/live/data-adapter.ts` and `data-adapter.test.ts`
- `src/features/explorer/service.ts` and `explorer.test.tsx`
- `docs/specs/web-client/contracts/live-readiness.md`
- `docs/specs/web-client/README.md`
- `specs/backend-integration/tasks.md`

## Controlled readiness by operation

| Operation / criterion contribution | Observed behavior |
| --- | --- |
| Session-bound data transport — AC6, AC8, AC17, AC19 | Composition injects the current authenticated runtime and auth-owned memory-only CSRF into separate `dataOperations`. Pending/signed-out/stale/aborted requests dispatch nothing. POST is SQL-only, cookie-bearing, same-origin, `no-store`, `redirect: error`; redirects fail safely. Context and token continuity are checked after fetch, after asynchronous JSON decoding and on rejection. A pending logout's retained retry token grants no data access. No token enters the session view model. |
| Catalog/schema — AC1, AC15, AC17 | Viewer synthetic catalog contains national metadata only; Analyst catalog has all three datasets. Schemas map from authorized embedded catalog columns through GET datasets, with no invented schema endpoint. Absent detail metadata remains unavailable. Backend role enforcement is not proven. |
| Preview — AC2–AC4, AC21 | Optional start/end dates and empty nonmatching ranges preserve the request contract. Preview and query size choices are independent and reject 0, 501 and fractional sizes. Advance/revisit GETs contain only cursor; selection, dataset, size, generation and original expiry mismatches fail without starting a new sequence. Existing controller tests retain pages within a sequence, clear them on selection changes and require explicit restart after expiry. |
| Protected metadata denial — FR13 / AC17 contribution | Current catalog403 or schema/catalog `dataset_unavailable` removes metadata, selected context and pages while advancing publication versions. Delayed schema/preview successes cannot restore them; generic denial leaves the current authenticated session intact. Both metadata sources are tested against delayed responses. Full connected access-change acceptance remains open. |
| National range — AC5, AC15, AC17 | Collector follows cursor-only national pages and publishes only complete output from one preview generation. A preview may be newer than catalog coverage. Generation/column drift, failed continuation, cursor cycle, duplicate/out-of-range dates and original expiry withhold the whole series. Original expiry is checked on every page and immediately before publication. Injected clocks precede the historical fixture expiry. Exact fraction/display remains authoritative; measured zero is retained and an omitted calendar date breaks the chart line. Existing Overview tests cover half-up display and missing-versus-zero presentation. No SQL POST populates Overview. |
| SQL execute/page — AC6–AC12, AC15–AC19, AC21 | Existing rich/null-generation output, duplicate labels/rows, full-result caps and UTF-8 bounds remain verified. One explicit unchanged POST carries only SQL; retained GET carries ID/page/original size without SQL. All documented data error examples map to safe states; owned initial out-of-range metadata receives captured size and explicit first-page GET recovery. Existing query controller tests preserve draft/result separation, unknown-outcome/no-replay, expiry and deliberate recovery. No backend Origin/CSRF enforcement or live retention lifetime is claimed. |

Transport paths are limited to the documented datasets/preview/query routes;
foreign origins, fragments, encoded traversal and mutations of dataset routes
are rejected before cookie-bearing dispatch. Malformed reads remain safe service
failures; unconfirmed mutation responses remain unknown execution outcomes.
There is no automatic retry, protected cache, dependency or fixture fallback.

## Checks actually run

| Command | Result |
| --- | --- |
| Targeted Vitest transport/composition/adapter/Explorer/Overview/Queries run | Final pass: 108 tests across six files. Initial run had one new partial-array matcher assumption failure; corrected to inspect the returned authorized schema directly. |
| `npm run typecheck` | Final pass. Initial new-test optional revisit-cursor type error was corrected with an explicit cursor presence assertion. |
| `npm run lint` | Final pass. New-test unnecessary fallback and unsafe asymmetric matcher findings were corrected. |
| `npm test` | Final pass: 262 tests across 24 files. |
| `npm run test:boundaries` | Pass: 33 adversarial tests. |
| `npm run check:boundaries` | Pass: 102 modules, 15 production roots; mandatory live registration is not checked by this command. |
| `git diff --check` | Passed. |

No production build, emitted-fixture scan, browser/visual comparison or live
requests were required by T3.C or performed here. Controlled responses do not
close connected assertions in the integration spec; no AC checkbox changes.

## Next gate

`operations` continues to expose auth/refresh only; existing production consumers
cannot activate data by spreading it. Phase 4 explicitly registers the prepared
`dataOperations` and independent preview/query settings, then revalidates pages.
Phase 5 requires the named enabled backend build/resources and authorized persona
and lifecycle scenarios. User-owned analytical isolation and backend/resource
configuration remain outside this frontend work.

Review the diff, then run /implement for phase 4.
