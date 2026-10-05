# Integration, state management and SQL security assessment

October 5, 2026. Recommendations for planning; no dependency selection or
application implementation is approved by this assessment. The requirements
live in [the integration spec](../../../specs/backend-integration/spec.md).

## Current intake

The user confirms the documented backend endpoints are implemented and ready
for frontend work. Read-only inspection of the updated backend handoff confirms
all seven operations are implemented and opt-in. Backend HEAD at inspection:
`5feed0bf8c072c17bc7a31aed99a038fab60e41b`. Working-tree artifact hashes identify
the actual inspected material independently of HEAD:

| Backend artifact under `docs/specs/data-api/` | SHA-256 |
| --- | --- |
| `client-handoff.md` | `a3165feb5053959df7a4b5a0f46eee735a1fd1c7bae6a93a3f21fbd58dfb098d` |
| `openapi.json` | `5c8489c57bb13047b8d813f4d1b0c7209a6d5ef90380e74c46d26e4f20fed5db` |
| `fixtures.json` | `a4ec631f86c77329e4613c1c9c3987609ddf29d665392bb23fad077827e1f087` |
| `runtime-evidence.md` | `6ddf0eae5f90c63dfabce101d700bc30d102ae344e8427794450a864f364a1f1` |

API-D01–03 close the earlier B1–B3 documentation/fixture issues. API-D04 permits
null `generation_id` for reference-free SQL and excludes internal spool encoding
version from public query results. Existing copied snapshots remain historical;
the implementation intake must import this identified revision and reconcile it.
`src/adapters/live/data-schema.ts` currently requires a non-null query generation,
so a valid reference-free result would be rejected and reported as an unknown
execution outcome. Update the full model/display path during implementation.

Typed data adapters, HTTP transport, exact metrics and lifecycle controllers
already exist. `production-operations.ts` still registers unavailable data
operations and null SQL settings; `live-composition.ts` connects auth only.
Integration should reuse these modules and complete registration, configuration,
navigation handoffs and live evidence. Admin refresh UI remains conditional.

Backend runtime evidence explicitly retains user-owned T1.7 without agent
validation. HTTP implementation alone does not supply an enabled analytical
launcher/resources. Record the running build and enabled resources for live
acceptance; frontend work can proceed independently. No backend code, service
configuration, live query, refresh or isolation test was changed/run here.

## State dependency feasibility

Registry metadata checked with `npm view` on October 5; peer ranges establish
declared compatibility only. No package was installed or bundle benchmark run.

| Option | Compatibility and benefit | Cost / recommendation |
| --- | --- | --- |
| Existing controllers + React subscriptions | Already integrated with React 19.3.0; owns drafts, executions and session generations | Preferred for this integration; avoids a second owner for protected state |
| TanStack Query 5.104.1 | React peer `^18 || ^19`; could deduplicate repeated catalog/schema reads across features | Best optional server-state candidate if shared reads justify it; requires scoped cache and explicit lifecycle settings |
| Zustand 5.0.15 | React/types peers `>=18`, Node `>=12.20`; listed peers are optional; could provide UI selectors | Feasible, but no demonstrated cross-feature UI need warrants replacing current controllers |

This recommendation follows the current code: `useQueries` uses
`useSyncExternalStore`; `readSchema` fetches the same embedded catalog used by
`listDatasets`. Shared catalog reads offer a concrete potential optimization.
SQL draft/submission, cursor sequences and execution identity already have owners.

TanStack's defaults mark reads stale, refetch on mount/focus/reconnect, retry
failed reads and retain inactive cached data. These require explicit choices for
snapshot-bound workflows. See [official defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults).
If adopted, use one session-scoped client, key protected data by session generation
and selection/execution identity, and clear query **and mutation** state on
access loss. Use no persistence, protected hydration or broadcast cache.
Fixed backend expiry needs explicit eviction/display invalidation; cache freshness
and garbage collection do not enforce it.

Keep SQL execution an explicit command with `retry: false`, no offline queue,
paused-mutation resumption, optimistic results or focus/reconnect execution.
Page reads carry only the retained ID and fixed size. Consume the cancellation
signal for HTTP reads, retaining generation guards; browser abort does not prove
backend SQL cancellation. See [mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
and [cancellation](https://tanstack.com/query/latest/docs/framework/react/guides/query-cancellation).
These are adoption conditions, not reasons to migrate SQL into a generic cache.

If Zustand is later selected, create provider-scoped stores, preserve matching
server/client initial state and avoid server module singletons or RSC writes.
See [official Next.js guidance](https://zustand.docs.pmnd.rs/learn/guides/nextjs).
Do not duplicate session credentials, results or permission claims in UI state.

## SQL-client security findings

Static inspection establishes existing protections, not backend security proof:
cookie-bearing data requests restrict API paths, reject redirects, use no-store
and require memory-only CSRF for POST. The adapter sends unchanged SQL exactly
once. Decoders preserve positional columns and lossless numeric values; table
cells render as text. Safe fixed error messages suppress raw backend details.
Session-generation guards reject obsolete responses and clear protected state.

| Priority | Finding and proposed improvement | Observable verification for implementation |
| --- | --- | --- |
| Integration | Connect data transport to the current auth token/runtime; preserve server Origin/CSRF validation and response no-store | Missing/wrong CSRF, foreign Origin, expired cookies and redirects fail safely; no automatic SQL replay |
| High | Query metadata denial clears schema but does not clear an existing result; query denial does not advance the query request counter. Concurrent same-generation success may repopulate state after another request observes denial | Delay Run/page responses, deny metadata/access, then release the responses: no restricted state reappears; deliberately re-resolve access without treating every 403 as logout |
| Medium | Query expiry is checked on Run/page/recovery; no retained-result timer is present in the query hook/controller | Leaving the result idle beyond its original expiry removes retained rows and offers explicit rerun; no POST occurs |
| Medium | Recursive descriptors/cells and JSON response parsing have no explicit frontend byte/depth/item budget | Agree envelope and nesting budgets against the contract, reject oversized/deep payloads safely before expensive recursion; never silently truncate analytical output |
| Medium | `next.config.ts` supplies no explicit CSP/security-header policy | Evaluate production CSP, frame denial, nosniff and Referrer-Policy; check framework scripts/styles, local fonts, Cognito navigation and proxy behavior in a production build |
| Preserve | SQL, credentials and protected output must stay out of URLs, persistent storage, telemetry and cache/devtool exports | Inspect requests, storage, production assets and any telemetry integrations; log only safe operation/outcome metadata |

The race finding is from code review and remains to be reproduced in an adversarial
test. Existing tests cover previous-session races and individual denials, not
this mixed same-generation overlap. Scope cleanup to affected protected data and
invalidate pending publications; do not grant broader access after a denial.

For CSP, start with measured report-only evaluation and promote an enforced
policy after production validation. A nonce policy changes rendering/cache
behavior and needs planning; do not copy development `unsafe-eval` into release.
See [Next.js CSP guidance](https://nextjs.org/docs/app/guides/content-security-policy).
CSRF custom headers and exact Origin checks remain backend responsibilities;
SameSite is defense in depth. See [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

Arbitrary read-only analytical SQL is intentional product input. Browser keyword
blacklists or replacing the whole statement with a bound string cannot secure
that capability. Keep unchanged SQL and backend-authoritative parsing,
dataset/function restrictions and resource isolation. Bound parameters remain
appropriate for the backend's fixed operational queries; this assessment does
not change those. See [OWASP SQL guidance](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
No client improvement is evidence of OS file/network/credential isolation.

## Planning handoff

Use the draft spec for behavior and acceptance. The
[integration plan](../../../specs/backend-integration/plan.md) retains controller
ownership without adding a state dependency, then reconciles current snapshots
and nullable generation identity, addresses the access-loss race and expiry,
and completes connected operation and browser evidence. Numeric processing
budgets and the production header policy remain optional follow-up decisions.
Existing phase/task acceptance gates remain open; this assessment closes none.
