# Selective data reuse review

## October 7 correction: production metadata reuse and deliberate date submission

The user reported repeated dataset requests across navigation and refreshes while
still editing dates, and requested those behaviors be fixed. This authorizes
production catalog retention and supersedes the earlier enabling-authorization
gate below. Production now uses the previously selected one-entry / 256 KiB
UTF-8 serialized JSON admission budget. The repository checks each actual decoded
response against this cap at runtime; oversized responses remain usable but are
not retained. No live authenticated catalog size measurement is claimed.

Catalog listings, coverage and embedded schemas share open-app memory until page
reload or existing session/access/publication invalidation. Ordinary navigation
and date edits do not invalidate them. Observation rows and SQL page retrieval
keep their existing behavior; SQL execution remains explicit.

Overview now separates draft dates from applied dates: edits keep the displayed
results and navigation range unchanged; **Apply dates** submits one valid changed
range. Invalid and unchanged submissions make no request. Open bounds remain
supported. Dataset Explorer already uses explicit **Apply filters**.

See [October 7 verification](verification/navigation-and-dates.md). Earlier
records below preserve their historical scope and evidence.


Recorded October 5, 2026, before committing implementation. The user clarified
that row tables may reload on page visits, while data models should not repeatedly
refresh, and asked for other examples before optimizing every read. This narrows
the original broad retention proposal; it does not authorize implementing all
of its Overview, Explorer and SQL page caches.

## Current scope

| Resource or workflow | Treatment | Reason and current seam |
| --- | --- | --- |
| Authorized dataset names, SQL relation names, column models/types and supported filters | Share one decoded catalog bundle across permitted pages while the app remains open | `listDatasets`, `readSchema` and national metadata currently obtain the same `/api/datasets` response; schemas are already embedded. |
| Dataset coverage and catalog generation | Keep atomic with the catalog; invalidate after known publication | These fields share the same response and can change when new data is published. They are not immutable definitions. |
| Explorer row tables | Keep existing page-local retrieval and cursor browsing | Row retrieval on page visits is acceptable. No new cross-route row cache or retained Explorer controller is needed for this scope. |
| Overview chart, cards and observation rows | Keep existing national-series retrieval | These are observation data, not models. Sharing national metadata must not accidentally cache its preview pages or full series. |
| SQL results | Preserve the existing retained execution/controller and explicit Run | A page GET may fetch rows again from the same execution. Never rerun SQL automatically. Additional historical page retention is deferred. |
| Session, identity and capabilities | Preserve the existing session runtime and its resolution/expiry/cleanup | Permission information is not a permanently cached model. Known logout, identity/access changes and current denial clear protected metadata. |
| Admin refresh-job status | Keep deliberate status checks fresh | Job status changes while work runs; a reused old response would hide progress or completion. Admission remains an explicit action. |
| Display formatting and table column presentation | Derive from current decoded values | Local formatting needs no extra endpoint or cross-route response cache. Preview/query response columns remain authoritative for their own rows. |

## Lifetime and invalidation — October 5 checkpoint

The last bullet records the then-deferred budget/enabling decision; October 7
explicitly enabled retention as described above. Other boundaries remain.

- The user answered "until page is reloaded": no extra numeric freshness timer
  and no persistence across page reload/reopen. Ordinary route changes alone
  do not invalidate reusable catalog metadata.
- Existing session/access cleanup, current-context denial, deliberate recovery
  and known successful publication remain invalidation boundaries. Late responses
  cannot restore a cleared catalog. No new automatic focus/reconnect polling.
- Catalog reuse cannot discover backend-only permission changes without a request.
  Existing backend enforcement still applies to fresh row requests; known denial
  invalidates reusable metadata conservatively.
- Original preview and SQL deadlines still apply. No reuse/reload operation
  extends them or converts expired result recovery into implicit execution.
- The user explicitly deferred the memory-budget decision and production reuse.
  Production retention remains disabled; a synthetic injected test policy verifies
  the metadata seam without constituting a production setting.

## Examples consulted

- [TanStack Query important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults)
  supports resource-specific freshness and reuse until manual invalidation.
  The relevant pattern is choosing refresh behavior for each resource, not
  applying one lifetime or automatic refetch policy to everything. Catalog metadata
  needs explicit invalidation, so treating it as permanently immutable would be
  inappropriate.
- [SWR performance and deduplication](https://swr.vercel.app/docs/advanced/performance)
  shows shared reads preventing duplicate requests when the same data is used
  by several components. This supports one underlying catalog read serving
  listings and embedded schema projections.

These are examples of behavior, not a dependency selection. Keep the accepted
React Context and existing controller approach; add no Redux, TanStack or SWR
dependency for this change.

## Implementation boundary

Complete and verify phase 1's shared catalog loader, protected ownership,
pending-read sharing and provider lifecycle under controlled policy. Verify
that row reads and explicit SQL execution retain their existing behavior.
The original phase 2/3 row-retention tasks and broad navigation acceptance are
deferred by this clarification; revise them before any later implementation.
This foundation does not close production enabling, live or visual release gates.


<a id="retention-budget-decision--october-6-2026"></a>

## Historical retention budget decision — October 6, 2026

The size cap remains current; the enabling gate in the last paragraph was
superseded on October 7. No live size measurement is claimed.

The user accepted a starting production admission budget of one completed
catalog bundle, with a 256 KiB maximum UTF-8 serialized JSON size. Reuse remains
within the open app until page reload and the existing invalidation boundaries;
there is no numeric TTL, polling, or persistence. Oversized successful responses
remain usable for the current request but are not admitted for later reuse.

This cap measures serialized representation, not actual JavaScript heap use. The
largest supplied synthetic catalog fixture is about 3.3 KiB; it does not establish
the size of a live authorized catalog. Production completed-response retention
remains disabled until the actual catalog size is checked and production enabling
is explicitly authorized. This decision does not authorize row or SQL-page caches.
