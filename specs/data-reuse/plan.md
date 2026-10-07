# Plan: Reuse already fetched data
> Status: controlled implementation complete; production budget selected, enabling gated · Slug: data-reuse · Spec: ./spec.md

## Scope and decisions

The October 5, 2026 scope review is authoritative. Reuse is limited to the
decoded catalog bundle: authorized dataset and SQL relation names, coverage,
generation, column models/types, and supported filters. Listing, embedded
schema projections, and national metadata share this bundle and identical
pending reads. Catalog reuse lasts until page reload under the enabled policy;
route changes alone do not invalidate it. There is no extra TTL or browser
storage.

Observation rows remain governed by their current workflows. Explorer tables may
reload on visits; Overview continues its national-series retrieval; SQL retains
its existing execution/controller, and a page GET may retrieve rows again for
the same execution. Additional row/page retention is out of scope. An explicit
SQL Run remains the only way to execute SQL. Preview and SQL absolute deadlines,
cursor behavior, and recovery rules remain unchanged.

Protected catalog metadata clears on session cleanup, identity/capability
changes, current-context denial, provider disposal/replacement, unavailable
dataset invalidation, and known successful publication. Late responses cannot
restore invalidated metadata. Publication invalidates before Overview reloads
metadata and observations, preserving selected date bounds. Session/access
resolution and expiry remain owned by the existing session runtime. No new
focus/reconnect polling is introduced.

Completed controlled implementation evidence is recorded in
[phase 1](verification/phase-1.md) and the
[publication follow-up](verification/publication.md). The scope decision and
resource boundaries are recorded in [scope review](scope-review.md). This plan
does not mark deferred specification acceptance criteria complete. In
particular, the user selected a one-entry, 256 KiB serialized-JSON admission
cap. Production completed-response retention remains disabled pending a live
authorized catalog size check and explicit production enabling; live and visual
release evidence also remains open. See the [budget decision](scope-review.md#retention-budget-decision--october-6-2026).

## Approach

Use the existing React Context and subscribed-controller architecture. An
application-owned repository supplies one decoded catalog bundle to the
catalog listing, schema projection, and national metadata reads, and shares
identical pending catalog requests. Repository ownership is protected by the
current session identity/capabilities and resource epoch. Production currently
uses `retention: disabled`; the controlled fixture/test composition injects a
synthetic bounded policy. The policy is not a production default. (FR2, FR4,
FR5, TR1, TR3, TR4)

Keep adapters responsible for HTTP transport and decoding, and features
responsible for their existing observation workflows. Do not introduce a
cross-route Explorer row cache, national-series cache, or historical SQL page
cache. Keep `executeQuery` uncached and non-deduplicated; page retrieval accepts
only the existing execution identity and page inputs and never submits SQL.
(FR1–FR9, TR1–TR4)

## Components affected

- **Application composition and repository** — own the shared catalog loader,
  pending-read coordination, protected metadata, invalidation epochs, and
  provider lifecycle. Context carries dependencies, not response payloads.
  Consumer cancellation detaches that consumer; disposal and invalidation clear
  metadata and abort owned work. (FR2, FR4, FR5, TR1)
- **Catalog/data adapter** — decode the catalog bundle atomically, preserving
  ordered embedded schemas, coverage and generation identity. Listing, schema,
  and national metadata project from the same bundle. A newer preview's own
  snapshot and columns remain authoritative for its rows. (FR2, FR3, TR1, TR4)
- **Overview publication flow** — invalidate the catalog on the existing
  current-session successful-publication event before reloading Overview
  metadata and national observations. Preserve selected date bounds. Other
  refresh statuses do not invalidate or reload data. (FR2, FR3, TR1)
- **Explorer, Overview rows, and SQL pages** — retain current feature behavior;
  their row reads are not made reusable across visits. Existing preview cursor,
  query execution, page retrieval, expiry, and recovery contracts remain in
  force. (FR1, FR3, FR6–FR9, TR2)

## Implementation phases

1. **Shared catalog foundation — complete.** Decoded catalog sharing, pending-
   read coordination, protected ownership and lifecycle are implemented and
   verified under controlled policy. Production completed-value retention is
   disabled. (FR2, FR4, FR5; relevant portions of AC2–AC5)
2. **Publication invalidation — complete.** Guarded successful publication
   clears catalog metadata before Overview reload; controlled ordering and
   status behavior are verified. (FR2, FR3)
3. **Production enabling — gated.** The user selected one entry and a 256 KiB
   maximum UTF-8 serialized JSON size. First measure the actual authorized live
   catalog and confirm it fits the cap; oversized successful responses remain
   usable but are not retained. Production remains disabled until the user
   explicitly authorizes enabling. This byte count is not a heap-size guarantee.
   (TR3)
4. **Broader row or SQL-page retention — deferred, not an active phase.** Any
   Overview/Explorer row reuse, retained preview sequence, or additional SQL
   page cache requires a fresh scope decision and revised requirements/ACs.

## Data and interface contracts

- **Catalog bundle** — one decoded value contains authorized dataset summaries,
  ordered embedded schemas, coverage, and `generationId`. Successful empty
  responses may be reused. Errors and malformed payloads are not reusable.
  Listing and schema reads use the same repository identity and pending loader.
  (FR2, TR1, TR4)
- **Ownership and invalidation** — entries are scoped to session generation,
  resolved subject/capabilities, and a resource epoch. Check ownership on hits
  and completion. Session cleanup, current denial, provider disposal, known
  unavailable-dataset responses, and successful publication clear applicable
  protected metadata. Delayed writes from an obsolete session or epoch are
  rejected. A current forbidden result clears metadata without asserting
  backend logout. (FR4, FR5, TR1)
- **Pending reads** — identical authorized catalog reads share one repository-
  owned transport request. Aborting one consumer detaches it without aborting
  other consumers. Invalidation/disposal aborts owned work; late completion
  cannot repopulate cleared metadata even if transport ignores abort. (FR2,
  FR4, FR5, TR1)
- **Publication** — only the existing guarded `succeeded` publication status
  invalidates, once per successful run. Invalidation is observable before
  Overview reload starts. Selected date bounds survive that reload; session
  cleanup resets range preservation. (FR2, FR3, TR1)
- **Rows and execution boundaries** — catalog metadata reuse does not retain
  preview pages or complete national series. Preview snapshot/cursor and SQL
  execution/page deadlines are never extended. SQL execution is an explicit,
  uncached action; page reuse never submits SQL. (FR1, FR3, FR6–FR9, TR2)
- **Transport and fixtures** — retain existing endpoints, cookie/CSRF behavior,
  and `no-store` transport. No browser storage or new cache dependency. Fixtures
  use explicitly synthetic injected policy/loaders, isolated from production.
  (FR4, TR1, TR4)

## Implementation status and acceptance traceability

The controlled catalog ownership foundation and publication invalidation
follow-up are implemented. Evidence includes repository, adapter, session,
feature, composition and controlled browser checks; exact commands and results
are in the two verification records. These checks establish the implemented
catalog seam and regression behavior, not live backend authorization or visual
fidelity.

| Acceptance criterion | Status and evidence |
| --- | --- |
| AC1 — Overview/Explorer rows survive navigation | Deferred with row retention; not implemented or claimed complete. |
| AC2 — permitted catalog/list/schema reuse | Catalog seam is controlled-verified; production completed-value reuse is disabled pending policy agreement. |
| AC3 — mismatched/unavailable data keeps retrieval/recovery behavior | Catalog identity, empty/malformed response and unavailable-dataset cases are controlled-verified; broad resource behavior remains scoped to existing workflows. |
| AC4 — cleanup on logout/expiry/identity/access change | Catalog metadata cleanup is controlled-verified for repository/session cases; this does not claim global clearing of all feature snapshots. |
| AC5 — stale completion cannot restore or replace protected data | Catalog epoch, delayed response, denial and disposal cases are controlled-verified. |
| AC6 — expired preview requires explicit restart | Existing preview behavior preserved; no retained preview cache added. Broad AC6 remains outside this implementation. |
| AC7 — expired/unavailable SQL result requires explicit rerun | Existing SQL recovery behavior preserved; no new result-page retention added. |
| AC8 — no implicit SQL execution; same execution/page size | Existing explicit Run behavior preserved; controlled traces confirm identical Runs still issue separate POSTs. Full retained-page reuse is not claimed. |
| AC9 — identifiers, dates, null/zero, ordering, duplicates and metrics preserved | Existing regression checks passed as recorded; no row-retention claim. |
| AC10 — usable SQL page revisits avoid another page request | Deferred with additional SQL-page retention; existing page GET behavior remains. |

Named-target live authorization and visual comparison are separate open release
gates. Controlled checks do not close them or establish backend-only access
change discovery.

## Dependencies & integrations

- Continue using the accepted [catalog/preview](../../docs/specs/web-client/contracts/catalog-preview.md),
  [SQL](../../docs/specs/web-client/contracts/sql.md), and
  [metric](../../docs/specs/web-client/contracts/metric.md) contracts, plus the
  current [backend integration plan](../backend-integration/plan.md). Preserve
  its authorization, pagination, and expiry rules. (FR2, FR6–FR9, TR1, TR2,
  TR4)
- Existing React Context, `useSyncExternalStore`, session runtime, and injected
  operations are sufficient. Keep feature boundaries and fixture isolation.
- Use the established [verification guidance](../../docs/development/verification.md)
  for any future work. Named-target live scenarios require authorized backend
  access; they remain distinct from controlled synthetic evidence.

## Risks & tradeoffs

- **Backend-only access changes are not discovered on a catalog memory hit.**
  Existing session resolution/expiry, fresh backend enforcement on row reads,
  and known denial invalidation remain authoritative. No new polling cadence is
  approved. (FR4, FR5, TR3)
- **Publication can stale coverage and generation.** The existing successful
  publication callback now clears catalog metadata before Overview reloads;
  other statuses leave current data alone. (FR2, FR3)
- **Production retention has no approved budget.** Production completed-value
  retention stays disabled until the actual authorized catalog size is verified against the selected
  256 KiB serialized-size cap and the user explicitly authorizes enabling. The
  cap is an admission bound, not a heap-size guarantee. (TR3)
- **Broader acceptance remains unproven.** Controlled tests do not prove live
  backend enforcement, backend-only permission-change discovery, broad row
  retention, or Figma fidelity. Keep those release claims open. (AC1–AC10)

### Alternatives considered

- **Redux/RTK Query or another cache dependency** — unnecessary for the
  accepted Context and repository seam; no dependency was added. (FR1, FR2)
- **Page-local catalog caches** — do not share embedded schemas across
  consumers or pending reads and are lost on route unmount.
- **Browser/durable caching** — outside the chosen lifetime, which ends at page
  reload; protected browser persistence was not approved. (FR4, TR1)

## Test strategy and evidence

No new implementation phase is authorized by this plan; the in-scope work is
complete. Refer to [phase 1 verification](verification/phase-1.md) for catalog
sharing, ownership, lifecycle, pending-read, fixture-policy, and unchanged row
request traces. Refer to [publication verification](verification/publication.md)
for status-by-status invalidation, ordering, date preservation, and controlled
browser evidence. The records distinguish controlled synthetic validation from
live integration and visual comparison.

Before production enabling, verify the actual authorized catalog serialized size
against the selected one-entry/256 KiB admission budget and record the result.
If it exceeds the cap, the successful response remains usable but is not retained.
Do not change preview/SQL deadlines or explicit execution rules.
Any expansion into row or SQL-page retention requires a fresh scope decision and
must not be inferred from the original broad spec.

## Assumptions

- **Decided:** catalog metadata reuse lasts until page reload when enabled;
  there is no added TTL, route-change invalidation, automatic polling, or
  cross-reload persistence. (Scope review; FR2, TR1)
- **Decided:** row tables may reload on page visits. Overview observations and
  Explorer rows do not gain cross-route retention. SQL execution remains
  explicit and SQL page GET behavior remains unchanged. (Scope review; FR1,
  FR6–FR9)

## Open decisions

- Verify the actual authorized catalog size against the selected one-entry,
  256 KiB serialized JSON admission cap, then obtain explicit authorization to
  enable completed-response retention. Production policy remains disabled until
  those steps are complete. The serialized size is not a heap-size guarantee. (TR3)
- Decide through a fresh scope review whether to pursue Overview/Explorer row
  reuse or additional SQL-page retention. Those items are deferred and are not
  active implementation phases; update their requirements and acceptance
  criteria before starting.
