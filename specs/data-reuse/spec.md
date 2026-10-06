# Spec: Reuse already fetched data
> Status: draft · Slug: data-reuse

## Problem
Outage Explorer users repeatedly wait for information the app has already
retrieved when revisiting pages or using the same information elsewhere. This
slows ordinary navigation and consumes endpoints unnecessarily.

## Goal
Make previously fetched, still usable information promptly available wherever
needed, without redundant requests or weakening existing access and expiry rules.

## Requirements
### Functional (EARS)
- **FR1:** WHEN a user returns to Overview or Dataset Explorer and the requested data is already available and still usable THE SYSTEM SHALL display that data without fetching it again.
- **FR2:** WHEN a permitted page needs dataset listings or schemas already available and still usable THE SYSTEM SHALL reuse that information without fetching it again.
- **FR3:** WHEN a user requests permitted information without a usable previously fetched copy THE SYSTEM SHALL retain the existing retrieval and recovery behavior for that information.
- **FR4:** WHEN logout, session expiry, identity change or loss of access occurs THE SYSTEM SHALL clear protected previously fetched data.
- **FR5:** IF an obsolete response arrives after protected data has been cleared or the requested information has changed THEN THE SYSTEM SHALL prevent it from restoring or replacing the current protected data.
- **FR6:** WHEN a retained preview expires THE SYSTEM SHALL require an explicit restart before displaying preview records again.
- **FR7:** WHEN a retained SQL result expires or is reported unavailable THE SYSTEM SHALL require an explicit rerun before displaying its result rows again.
- **FR8:** WHEN a user revisits SQL results THE SYSTEM SHALL avoid automatically executing SQL again.
- **FR9:** WHEN a user requests a previously fetched, still usable page of the same retained SQL execution THE SYSTEM SHALL reuse that page without fetching it again.

### Technical / Non-functional
- **TR1:** Reusable data must match its authorized request context: current identity and permissions, requested information, associated generation, and applicable preview snapshot or SQL execution with fixed page size. Metadata and a newer preview need not share a generation.
- **TR2:** Reuse must not extend preview expiry beyond 15 minutes from the first page or SQL result expiry beyond 15 minutes from execution completion.
- **TR3:** Data usability beyond existing access and expiry rules remains unresolved: [NEEDS CLARIFICATION: How long should each kind of data remain usable, and which events should require updated data?]
- **TR4:** Reused data must preserve existing identifiers, calendar dates, missing-versus-zero distinctions, row and column order, duplicate SQL rows and metric presentation.

## Inputs & Outputs
- Inputs: the current session and permissions; requested dataset listings, schemas, Overview national data, preview selection/page or retained SQL execution/page; previously fetched data and its existing snapshot, execution and expiry information.
- Outputs: matching permitted data without another data request when reusable; the existing loading, empty, error or explicit recovery state when no usable data is available.

## Scope
### In scope
- Data reuse during navigation between permitted pages in the open app.
- Reuse of dataset listings and schemas across Overview, Dataset Explorer and SQL Workspace.
- Reuse of fetched Overview data, preview pages and retained SQL result pages under existing access and lifetime constraints.
- Reuse beyond the open app: [NEEDS CLARIFICATION: Must fetched data also be reusable after a browser reload or closing and reopening the app?]

### Out of scope (non-goals)
- Restoring navigation position, selected controls or unfinished work as a separate feature.
- Durable query history, saved queries, exports or browser-offline support.
- A new-data status card, expanded permissions or changes to preview/SQL execution semantics.

## Assumptions
_None._

## Acceptance Criteria
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

## Open Clarifications
- [NEEDS CLARIFICATION: How long should each kind of data remain usable, and which events should require updated data?]
- [NEEDS CLARIFICATION: Must fetched data also be reusable after a browser reload or closing and reopening the app?]
