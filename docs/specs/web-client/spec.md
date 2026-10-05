# Spec: Outage Explorer web client
> Status: draft; published prototype inspected, live contracts pending · Slug: web-client

## Problem
Analysts need a trustworthy way to explore permitted U.S. nuclear outage observations without manually reshaping EIA records. This frontend has no implementation yet; independent contributors need shared acceptance boundaries so parallel views do not duplicate UI, invent domain behavior or diverge from the supplied design.

## Goal
Deliver the accepted analytical workflows with inspectable design fidelity, accessible behavior and real backend enforcement, using atomic components first, parallel feature development next and individual page assembly last.

## Requirements
### Functional (EARS)
- **FR1:** WHEN the supplied design is inspectable THE SYSTEM SHALL present the agreed screens with traceable design references and documented extensions or conflicts.
- **FR2:** WHEN a user chooses sign-in THE SYSTEM SHALL start Cognito managed login using Authorization Code with PKCE.
- **FR3:** IF the one-hour application session expires THEN THE SYSTEM SHALL require explicit sign-in without automatic renewal.
- **FR4:** WHEN a user signs out THE SYSTEM SHALL invalidate the current backend session and clear protected client state without invalidating independent sessions.
- **FR5:** WHILE identity or capabilities are unresolved THE SYSTEM SHALL withhold protected data and navigation.
- **FR6:** WHEN permissions resolve or change THE SYSTEM SHALL expose only backend-authorized datasets, schemas, filters and data, including national-only access for Viewers.
- **FR7:** WHEN a user selects an authorized dataset THE SYSTEM SHALL show its schema, applicable filters and available coverage metadata.
- **FR8:** WHEN dataset, filters or preview page size change THE SYSTEM SHALL start a new browsing sequence and ignore obsolete responses.
- **FR9:** WHEN a user continues a preview THE SYSTEM SHALL preserve its original snapshot and opaque cursor context; IF that sequence expires THEN THE SYSTEM SHALL offer an explicit restart.
- **FR10:** WHEN the national metric is available THE SYSTEM SHALL show source capacity/outage in MW and both reported and calculated percentages, with two-decimal decimal half-up presentation and the accepted capacity-out-of-service meaning.
- **FR11:** WHEN observations or results are presented THE SYSTEM SHALL preserve calendar dates, opaque identifiers, numeric precision and the distinction between missing values and valid zero.
- **FR12:** WHEN a user deliberately runs SQL THE SYSTEM SHALL submit one unchanged statement and keep its retained execution distinct from subsequent draft edits.
- **FR13:** WHEN a user navigates SQL results THE SYSTEM SHALL use the retained query ID and fixed page size without rewriting or resubmitting SQL.
- **FR14:** IF a SQL result is lost or expired, or a new SQL page size is requested, THEN THE SYSTEM SHALL require an explicit new execution before replacing that result.
- **FR15:** WHEN SQL results arrive THE SYSTEM SHALL preserve column order, duplicate labels, duplicate rows and backend truncation information for the whole execution.
- **FR16:** IF loading, empty, unavailable, denied, expired, busy, timeout, unknown execution outcome or service-failure states occur THEN THE SYSTEM SHALL distinguish them and offer appropriate recovery without automatically retrying SQL execution; a lost execution response SHALL NOT be described as proof that no execution occurred.
- **FR17:** WHEN people operate the UI by keyboard or on narrow screens THE SYSTEM SHALL retain usable controls, visible focus, semantic labels, status announcements and access to table/editor content.
- **FR18:** WHERE development fixtures are enabled THE SYSTEM SHALL visibly identify synthetic data and keep fixture behavior separate from live integration; IF production requests fail THEN THE SYSTEM SHALL never substitute fixtures.
- **FR19:** WHEN features are developed independently THE SYSTEM SHALL support isolated behavior verification using shared components and stable feature-facing contracts before individual product pages are assembled.
- **FR20:** WHEN users inspect the Overview THE SYSTEM SHALL present the national metric cards, date-filtered daily trend with optional reported-percentage comparison, and an accessible observation table without interpolating unavailable observations.
- **FR21:** WHEN users follow Overview-to-dataset or dataset-to-SQL actions THE SYSTEM SHALL preserve authorized selection context without automatically executing SQL or replacing an edited draft without an explicit action.

### Technical / Non-functional
- **TR1:** Use the selected React, Next.js, strict TypeScript and Tailwind CSS stack; supporting versions/tooling remain implementation decisions.
- **TR2:** Atomic design separates domain-free shared atoms/molecules, contextual organisms, reusable templates and thin pages. Feature workflows and transport have separate owners.
- **TR3:** Flask is authoritative for permissions, SQL validation/execution, metrics and ingestion. No direct frontend access to EIA, S3, RDS or DuckDB; Next.js must not duplicate that business backend.
- **TR4:** Preview defaults to 100 rows, initial configurable maximum 500, and expires 15 minutes after the first page; continuation does not renew expiry.
- **TR5:** SQL pages are positive and 1-based; whole-execution baseline is 1,000 rows or 1 MiB with explicit truncation. One analytical query executes at a time initially; the 10-second execution deadline is not an end-to-end latency promise. SQL size limits and TTL require agreement.
- **TR6:** No credentials or query SQL in URLs; no default credential storage in localStorage. No secrets or protected fixtures in production client bundles; scope caches to identity, capabilities and snapshot/execution and reject stale successes, metadata and errors after identity/access generation changes. Production configuration fails closed and cannot import fixture adapters/data or demo identity transitively.
- **TR7:** API data requires runtime validation and explicit transport-to-view mapping; source field/route names are not finalized API or SQL identifiers.
- **TR8:** Parallel tasks have explicit predecessors, disjoint ownership or serialized shared-file changes, and acceptance checkpoints. No task marked parallel may silently depend on a sibling.
- **TR9:** Fixture behavior, live integration and visual comparison have separate evidence records. Type/lint/build success does not establish authorization or design fidelity.
- **TR10:** Shared components derive from inspected design or documented behavioral needs, with no universal component framework or speculative domain abstraction.

## Inputs & Outputs
- Input: [supplied Figma Make prototype](https://www.figma.com/make/9k3dy9IWG5UavJ0VgaZJ1G/Outage-Explorer-Prototype) and user-supplied [published preview](https://apply-less-42002887.figma.site/). The Make resource reader failed, but the published HTML, application bundle, stylesheet and rendered screens were inspected. Four main views are Sign in, Overview, Dataset Explorer (Preview/Schema tabs) and SQL Workspace. See [design evidence](design-inventory.md); Q1 access is resolved for planning, without claiming editable Figma node inspection.
- Input: backend identity, capabilities, expiry, permitted catalog/schema, coverage, preview rows/cursor/snapshot, national metric, SQL result columns/rows/query ID and failures. [NEEDS CLARIFICATION: Q2 — Agree backend version, routes, DTOs, encoding, errors, session exchange/storage/transport and integration owner.]
- Input: dataset selection, calendar-date/facility filters, opaque preview cursor, user SQL, positive `page`/`page_size` and opaque `query_id`. [NEEDS CLARIFICATION: Q3 — Agree SQL default/maximum page size, result TTL, out-of-range handling and synchronous/asynchronous execution delivery.]
- Output: permitted accessible views, precise data presentation and deliberate recovery actions; no inferred outage causes/durations, synthetic findings or invented totals.
- Output: requirement-linked component/feature acceptance evidence, followed by individual page and live integration evidence.
- [NEEDS CLARIFICATION: Q4 — Confirm target viewports/browser support and any responsive states absent from the supplied design.]

## Scope
### In scope
- Cognito sign-in/session/logout; Overview with its evidenced national trend chart and metric cards; authorized Dataset Explorer with Preview/Schema tabs; SQL Workspace and retained result navigation.
- Atoms, molecules, contextual organisms and templates needed by those workflows, plus isolated feature previews and explicit fixture adapters.
- Parallel feature lanes and final page assembly; design comparison and live integration verification.
### Out of scope (non-goals)
- Implementation or deployment during this planning session.
- Admin refresh UI, charts beyond the evidenced national Overview trend, or findings beyond core workflows; revisit when explicitly scoped with usable design and contracts. Backend refresh remains a backend requirement.
- Deferred new-data status card; revisit after current delivery, per the context pack.
- Registration, password recovery, role management, saved queries/history, exports, maps, collaboration, alerts, outage classification and automatic SQL retries; revisit only with a new requirement.
- Frontend hosting selection, cloud provisioning, new backend engines or direct source/storage access.

## Assumptions
- The user's original atomic-first/parallel/pages-last request is the Main Problem anchor; supplying the requested Figma link continues that task without adding scope.
- The user confirmed: "Fixture demos first; live integration required before release." This does not approve any proposed backend contract.
- "Pages last" allows isolated feature compositions and minimal framework bootstrap before route-level product page assembly.
- Accepted product behavior takes precedence over conflicting prototype affordances. Any such conflict must be recorded after inspection.
- No supporting component kit, hosting provider, team size or deadline has been selected. No schedule estimate is implied.
- The published prototype establishes the four-view inventory. Production URLs and component names are design decisions; static assets must retain provenance, and unread Make PNG resources must not be assigned invented roles.
- The prototype's local password form/persona selector, fake coverage/totals, 30-second SQL timeout, JS rounding and incomplete pagination are demonstration behavior, not production requirements. Adapt the visual design to the accepted rules and record those deviations.

## Acceptance Criteria
- [ ] **AC1:** Every agreed screen and reused component/token maps to inspected design evidence; deviations and absent responsive/error states are recorded. Unread source links do not satisfy this check. (verifies FR1)
- [ ] **AC2:** Real sign-in uses the agreed Cognito code/PKCE flow; callback failures expose no credentials. (verifies FR2)
- [ ] **AC3:** Expired application sessions require explicit sign-in with no automatic renewal. (verifies FR3)
- [ ] **AC4:** Current-session logout invalidates backend access and prevents cached or in-flight data restoration; an independent session continues according to backend policy. (verifies FR4)
- [ ] **AC5:** Unresolved identity/capabilities never flash protected content. (verifies FR5)
- [ ] **AC6:** Viewer navigation, schemas, filters, autocomplete, previews and SQL remain national-only; direct forbidden backend requests and later pages are denied, including after access reduction. (verifies FR6)
- [ ] **AC7:** Catalog/schema/filter choices and date coverage come from the authorized contract, not source sample counts or hardcoded rolling windows. (verifies FR7)
- [ ] **AC8:** Dataset/filter/size changes reset preview state and a delayed old response cannot overwrite the new selection. (verifies FR8)
- [ ] **AC9:** Preview continuation retains one snapshot through publication; fixed expiry offers explicit restart and never fabricates numbered jumps/totals. (verifies FR9)
- [ ] **AC10:** Both national percentages use half-up two-decimal presentation, correct MW labels and capacity-out-of-service meaning; no discrepancy badges or facility-average reconstruction appear. (verifies FR10)
- [ ] **AC11:** Decimal ties, nulls, zero, leading-zero/alphanumeric identifiers and dates across timezones preserve the agreed values; zero outage displays `0.00%`. (verifies FR11)
- [ ] **AC12:** Request observations show one unchanged SQL submission per explicit Run and distinguish draft edits from retained result origin. (verifies FR12)
- [ ] **AC13:** Page navigation/revisit uses the same query ID and fixed size, including after focus/reconnect, without another execution. (verifies FR13)
- [ ] **AC14:** Lost/expired results and page-size changes require deliberate new execution; no silent return to page 1 occurs. (verifies FR14)
- [ ] **AC15:** Ordered column metadata, repeated labels and duplicate rows survive rendering; whole-result truncation is visible even on a short page. (verifies FR15)
- [ ] **AC16:** Empty, absent-data, invalid/unsupported input, denied, expired, busy, timeout, lost-execution-response and service errors have distinguishable recovery. Unknown outcome preserves safe context and explains that a deliberate new Run starts another execution; no cancellation or safe replay is invented. (verifies FR16)
- [ ] **AC17:** Keyboard/focus/labels/announcements and narrow table/editor usability pass the recorded viewport matrix. (verifies FR17)
- [ ] **AC18:** Synthetic fixtures are visible as such in demos; production import-graph and built-asset sentinel checks exclude fixture/demo identity modules, and a production-mode backend-failure browser scenario shows unavailability rather than mock data. (verifies FR18)
- [ ] **AC19:** Independently owned feature compositions pass their behavior checkpoints before product page assembly; shared contract changes have a designated owner and dependent task updates. (verifies FR19)
- [ ] **AC20:** Overview date changes affect the displayed national series/cards/table; missing days remain gaps and optional reported comparison has a keyboard-operable control plus accessible data equivalent with both exact display percentages. (verifies FR20)
- [ ] **AC21:** Cross-view actions carry only authorized dataset/filter context; opening SQL prepares a draft without execution and handles an existing edited draft explicitly. (verifies FR21)

## Open Clarifications
- **Q1 resolved for planning:** Published prototype inspected; editable Make source and the four PNG roles remain unverified. Do not claim Figma node mappings or reuse unread assets.
- **Q2:** Versioned live API/session contract and integration owner; blocks real adapters and live authorization/session acceptance, not fixture feature work.
- **Q3:** SQL size limits/TTL/delivery/errors; blocks final live SQL controls and transport, not synthetic lifecycle scenarios.
- **Q4:** Viewport/browser matrix and missing responsive states; blocks final visual sign-off, not accessible semantic component work.
