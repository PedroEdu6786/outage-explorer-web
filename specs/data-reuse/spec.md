# Spec: Reuse already fetched data

## October 7 implementation simplification (M3)

The accepted catalog-only scope now uses a typed `CatalogCache` with one retained
bundle and one shared pending read. The 256 KiB serialized UTF-8 admission cap,
session/access/publication invalidation, independent reader cancellation and
rejection of late responses are unchanged. Generic request keys, multi-entry
budgets and injectable freshness decisions have been removed; no row cache,
TTL or polling was added. See [M3 evidence](verification/catalog-cache.md).
Earlier resource-repository contracts and task paths below describe prior work.

## October 7 correction

Production catalog reuse is now enabled under the existing one-entry / 256 KiB
admission policy, as requested by the user. Overview date edits require explicit
**Apply dates**. This supersedes earlier production-enabling gates below; broader
row retention remains deferred. See the [updated scope](scope-review.md) and
[verification](verification/navigation-and-dates.md).

## Current accepted subset and invariants

Catalog listing/schema reuse (FR2) is accepted; broad observation/preview and
additional SQL-page retention (FR1/FR9) remain deferred. The accepted catalog
work preserves protected cleanup and stale-response rejection (FR4/FR5),
authorized ownership (TR1), exact value semantics (TR4), and retrieval/recovery
when reuse is unavailable (FR3). Existing preview/SQL deadlines and explicit
execution rules (FR6–FR8/TR2) still apply to their own workflows.

Reuse ends at page reload or existing invalidation events; no added TTL, polling
or durable storage is approved. The selected one-entry/256 KiB admission policy
is enabled. See [current implementation and evidence](../../docs/development/current-status.md).

> The sections below preserve the original broad proposal and dated checkpoints
> for traceability. Their requirement IDs include both the accepted subset above
> and deferred work; they are not an active implementation queue. Disabled-
> production gates and generic repository details are superseded by October 7
> decisions. Existing security, data and SQL invariants remain requirements.

## Historical — Scope revision — October 5, 2026

The user clarified that models/schemas should be reused while row tables may
reload on page visits. See [the selective reuse review](scope-review.md).
Immediate implementation covers the shared catalog foundation, not all of the
row-retention requirements below. Their original wording is retained as proposal
history and does not authorize broad optimization. The user chose reuse until
page reload, and deferred the memory budget and production enabling. No periodic
freshness timeout or durable storage is selected. Existing session/access cleanup,
known publication invalidation and original preview/SQL deadlines still apply.
Revise the deferred requirements and their acceptance criteria before implementing
row retention.

## Historical — Retention budget decision — October 6, 2026

The user selected a one-entry, 256 KiB UTF-8 serialized JSON admission cap for
the catalog bundle. No TTL is added; existing invalidation and page-reload
lifetime apply. Oversized successful catalog responses remain available to the
current request but are not retained. This serialized-size estimate is not a
hard JavaScript heap limit. Production completed-response retention remains
disabled until the live authorized catalog size is checked and production
enabling is explicitly authorized. Row and SQL-page retention remain outside
the accepted scope.

## Historical — Problem
Outage Explorer users repeatedly wait for information the app has already
retrieved when revisiting pages or using the same information elsewhere. This
slows ordinary navigation and consumes endpoints unnecessarily.

## Historical — Goal
Make previously fetched, still usable information promptly available wherever
needed, without redundant requests or weakening existing access and expiry rules.

## Historical — Requirements
### Historical — Functional (EARS)
- **FR1:** WHEN a user returns to Overview or Dataset Explorer and the requested data is already available and still usable THE SYSTEM SHALL display that data without fetching it again.
- **FR2:** WHEN a permitted page needs dataset listings or schemas already available and still usable THE SYSTEM SHALL reuse that information without fetching it again.
- **FR3:** WHEN a user requests permitted information without a usable previously fetched copy THE SYSTEM SHALL retain the existing retrieval and recovery behavior for that information.
- **FR4:** WHEN logout, session expiry, identity change or loss of access occurs THE SYSTEM SHALL clear protected previously fetched data.
- **FR5:** IF an obsolete response arrives after protected data has been cleared or the requested information has changed THEN THE SYSTEM SHALL prevent it from restoring or replacing the current protected data.
- **FR6:** WHEN a retained preview expires THE SYSTEM SHALL require an explicit restart before displaying preview records again.
- **FR7:** WHEN a retained SQL result expires or is reported unavailable THE SYSTEM SHALL require an explicit rerun before displaying its result rows again.
- **FR8:** WHEN a user revisits SQL results THE SYSTEM SHALL avoid automatically executing SQL again.
- **FR9:** WHEN a user requests a previously fetched, still usable page of the same retained SQL execution THE SYSTEM SHALL reuse that page without fetching it again.

### Historical — Technical / Non-functional
- **TR1:** Reusable data must match its authorized request context: current identity and permissions, requested information, associated generation, and applicable preview snapshot or SQL execution with fixed page size. Metadata and a newer preview need not share a generation.
- **TR2:** Reuse must not extend preview expiry beyond 15 minutes from the first page or SQL result expiry beyond 15 minutes from execution completion.
- **TR3:** Data usability beyond existing access and expiry rules remains unresolved: [NEEDS CLARIFICATION: How long should each kind of data remain usable, and which events should require updated data?]
- **TR4:** Reused data must preserve existing identifiers, calendar dates, missing-versus-zero distinctions, row and column order, duplicate SQL rows and metric presentation.

## Historical — Inputs & Outputs
- Inputs: the current session and permissions; requested dataset listings, schemas, Overview national data, preview selection/page or retained SQL execution/page; previously fetched data and its existing snapshot, execution and expiry information.
- Outputs: matching permitted data without another data request when reusable; the existing loading, empty, error or explicit recovery state when no usable data is available.

## Historical — Scope
### Historical — In scope
- Data reuse during navigation between permitted pages in the open app.
- Reuse of dataset listings and schemas across Overview, Dataset Explorer and SQL Workspace.
- Reuse of fetched Overview data, preview pages and retained SQL result pages under existing access and lifetime constraints.
- Reuse beyond the open app: [NEEDS CLARIFICATION: Must fetched data also be reusable after a browser reload or closing and reopening the app?]

### Historical — Out of scope (non-goals)
- Restoring navigation position, selected controls or unfinished work as a separate feature.
- Durable query history, saved queries, exports or browser-offline support.
- A new-data status card, expanded permissions or changes to preview/SQL execution semantics.

## Historical — Assumptions
_None._

## Historical — Acceptance Criteria
- [ ] **AC1:** After data loads on Overview or Dataset Explorer, navigating away and returning while that same data remains usable displays it without another request for that data. (verifies FR1)
- [ ] **AC2:** After permitted dataset listings and schemas load, another permitted page can use the same usable information without another request for it. (verifies FR2)
- [ ] **AC3:** Requesting different or previously unavailable information still follows the existing retrieval and recovery behavior rather than displaying a mismatched retained response. (verifies FR3, TR1)
- [ ] **AC4:** Logout, session expiry, identity change and loss of access each clear protected retained data before it can be reused. (verifies FR4)
- [ ] **AC5:** A response arriving after cleanup or a change to requested information cannot restore cleared data or replace the current request's data. (verifies FR5)
- [ ] **AC6:** Revisiting a preview after its original 15-minute lifetime does not display its expired records; the user is offered an explicit restart. (verifies FR6, TR2)
- [ ] **AC7:** Revisiting an expired or reported-unavailable SQL result does not display its rows; the user is offered an explicit rerun. (verifies FR7, TR2)
- [ ] **AC8:** Revisiting SQL results issues no SQL execution, and reused pages belong to the same execution and fixed page size. (verifies FR8, TR1)
- [ ] **AC9:** Reused records and metrics retain the same identifiers, dates, null/zero distinctions, row and column order, duplicate rows and metric presentation as when first displayed. (verifies TR4)
- [ ] **AC10:** After a SQL result page loads, revisiting that page while it remains usable displays it without another request for the page. (verifies FR9)

## Historical — Open Clarifications
- [NEEDS CLARIFICATION: How long should each kind of data remain usable, and which events should require updated data?]
- [NEEDS CLARIFICATION: Must fetched data also be reusable after a browser reload or closing and reopening the app?]
