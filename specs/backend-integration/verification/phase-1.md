# Backend integration phase 1: current contract reconciliation

October 5, 2026. **T1.1–T1.4 and T1.C complete at controlled frontend scope.**
This record supplements the original fixture/page gates; it accepts no connected
operation, full spec acceptance criterion, visual sign-off or release gate.

## Revision and artifact binding

- Frontend branch: `feat/backend-integration`; checked source base HEAD:
  `fdf3725e0822092a88f76b87632751527da6f8fd` plus the phase-1 working-tree changes.
- Backend HEAD at read-only artifact revalidation:
  `b59b8afdc85bf5bbbfdf7382fd373df254563dc6`. Artifact contents remain identical
  to the frozen handoff previously inspected at
  `5feed0bf8c072c17bc7a31aed99a038fab60e41b`; a repository HEAD is separate from
  the identity or configuration of a running process.
- Checked source digest:
  `e0708bbe9e198211092d4300eb18774d76f16f4e6e016b843a15713379ece0cb`.
  SHA-256 covers 368 sorted unique tracked/nonignored untracked file paths,
  each UTF-8 path, NUL, file contents, NUL. Excludes `next-env.d.ts`,
  `docs/devlog/` and `specs/backend-integration/verification/` to avoid generated
  normalization and evidence/journal self-reference. Generated/ignored artifacts
  are excluded by Git's file inventory. The digest includes the completed task
  list and updated active handoff.
- Next type generation/build normalized the generated declarations while checks
  ran. Both preexisting `.next/dev/types/routes.d.ts` and
  `.next/dev/types/root-params.d.ts` imports were restored afterward; that
  preexisting user change is excluded from implementation ownership/digest.
- Node `v24.18.0`, npm `11.16.0`; existing dependencies and documented webpack
  build used. No dependency installation, backend changes, live requests or
  provider/resource operations were performed.

| Read-only backend artifact | Verified SHA-256 |
| --- | --- |
| `docs/specs/data-api/client-handoff.md` | `a3165feb5053959df7a4b5a0f46eee735a1fd1c7bae6a93a3f21fbd58dfb098d` |
| `docs/specs/data-api/openapi.json` | `5c8489c57bb13047b8d813f4d1b0c7209a6d5ef90380e74c46d26e4f20fed5db` |
| `docs/specs/data-api/fixtures.json` | `a4ec631f86c77329e4613c1c9c3987609ddf29d665392bb23fad077827e1f087` |
| `docs/specs/data-api/http-contract.md` | `e79dd9a3585af5e059ac1a5c4dd952fa3649357f9196308afe75386932d8e3d5` |
| `docs/specs/data-api/runtime-evidence.md` | `6ddf0eae5f90c63dfabce101d700bc30d102ae344e8427794450a864f364a1f1` |

The two current JSON artifacts were copied byte-identically to
`docs/specs/web-client/contracts/data-api-v1/`. Earlier intake hashes and B1–B3
findings remain as explicitly historical provenance in their contract records.

## Observable controlled evidence

| Criterion contribution | Observed behavior |
| --- | --- |
| AC6 | Null-generation response decodes through one unchanged SQL POST; a coherent second page uses the retained query ID, original size and expiry in GET, with no SQL in that request. No real backend SQL was executed. |
| AC12 | Corrected catalog/latest-refresh OpenAPI declares 400; all current response examples validate. Existing normalized resource/capacity/expiry/recovery failures retain safe messages; malformed SQL POST remains unknown outcome and malformed page GET remains service failure with no replay. Full connected failure coverage remains open. |
| AC15 | All 11 successful SQL examples decode, including null-generation and rich recursive/positional values. Corrected `query_first` projects `x`, `x_copy`; separate duplicate-label coverage retains `x`, `x`. Existing exact large integers, nested values, duplicate rows/labels and malformed-cell tests pass. Missing SQL generation and missing/null catalog or preview generation fail. Controller pages preserve null identity, and null-to-string identity changes clear results as lost without POST replay. |
| AC16 | Corrected row-limit fixture retains 1,000 rows, has 1,000 one-row pages and decodes without weakening cap validation. A fabricated two-row row-limit envelope remains rejected. Successful empty output and empty byte-truncated output are distinct. |
| AC17 | Invalid/publicly forbidden spool encoding fails closed rather than becoming results. Production data registration remains unavailable; no fixture fallback was introduced. Connected unavailable-service acceptance remains open. |
| AC18 | Null SQL generation displays “Reference-free execution” without a snapshot label. Injection-shaped generation text renders literally with no image/script element. Existing SQL-table literal source text and safe failure normalization tests pass. No visual comparison or full diagnostics audit is claimed. |
| TR10 | Contract/schema, synthetic behavior and build evidence are recorded separately; no connected-browser or visual evidence was produced. |

The 62 response bodies were checked against current OpenAPI component schemas
with the existing backend virtualenv's `jsonschema.Draft202012Validator` and
`FormatChecker`, reading only copied frontend JSON. `listDatasets` and
`latestRefresh` 400 declarations were checked directly. These checks do not
execute example SQL, replay HTTP requests or establish backend authorization.

## Checks actually run

| Check | Result |
| --- | --- |
| Targeted adapter/query/public-contract Vitest run | 35 tests passed across three files after correcting two new test assertion assumptions; the initial run had three assertion failures. |
| `npm run typecheck` | Passed Next route type generation and strict TypeScript. |
| `npm run lint` | Passed. |
| `npm test` | 220 tests passed across 24 files. |
| `npm run test:boundaries` | 33 tests passed. |
| `npm run check:boundaries` | Passed: 102 modules, 15 production roots; live registration not required. |
| `npm run build` | Passed serialized production webpack compilation, TypeScript and static routes. |
| `npm run check:production-fixtures` | Passed transitive source graph and 169 emitted files against that fresh build. Bootstrap scope; mandatory live registration not checked here. |
| Current synthetic response schema validation | All 62 responses passed with format checks. |
| `git diff --check` | Passed. |

## Remaining gates

Phase 2 protected-denial race, idle result expiry and UTF-8 bounds are not
implemented by this phase. Connected transport readiness, production data
registration and actual lifecycle/request/permission acceptance remain phases
3–5. The observed handoff has disabled running data composition; the enabled
target build/resources, authorized personas and scenario support remain required
before live acceptance. Viewer product navigation remains Overview only;
national Viewer SQL acceptance belongs to backend/operation seams. Original
T5.L/T6.L and release/visual gates remain open; no spec AC checkbox is closed.

Review the diff, then run /implement for phase 2.
