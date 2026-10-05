# Spec: Complete live backend integration
> Status: draft · Slug: backend-integration

## Problem
The existing web experience has working authentication and prepared data behavior, but its production data operations remain unavailable. The user confirms that the documented backend services are implemented; users now need connected browsing, national metrics and read-only SQL without weakening session, permission or execution safeguards.

## Goal
Complete and verify the existing authenticated experience against the current backend contract while preserving safe state ownership and deliberate SQL execution.

## Requirements
### Functional (EARS)
- **FR1:** WHEN a recognized authenticated user opens dataset discovery THE SYSTEM SHALL display the current authorized catalog, embedded schema and reported coverage.
- **FR2:** WHEN a user applies valid independently optional inclusive start/end dates THE SYSTEM SHALL display the corresponding authorized preview, including an empty result for a nonmatching interval.
- **FR3:** WHEN a user continues or revisits a preview THE SYSTEM SHALL preserve its original caller, dataset, generation, filters, page size and expiry.
- **FR4:** IF preview continuation becomes unavailable THEN THE SYSTEM SHALL offer an explicit restart of browsing.
- **FR5:** WHEN a user opens the national Overview THE SYSTEM SHALL display the complete requested observation range from one preview generation.
- **FR6:** WHEN a user explicitly selects Run THE SYSTEM SHALL submit the unchanged draft once as a new read-only execution.
- **FR7:** WHEN a user navigates retained SQL pages THE SYSTEM SHALL read the selected numbered page of the same execution with its original page size and expiry.
- **FR8:** IF a SQL execution response is lost or cannot confirm its outcome THEN THE SYSTEM SHALL show an unknown outcome requiring deliberate new Run.
- **FR9:** IF a retained SQL result is lost or expired THEN THE SYSTEM SHALL offer an explicit new Run.
- **FR10:** IF an initial out-of-range response supplies owned retained-result recovery metadata THEN THE SYSTEM SHALL offer explicit page recovery from that execution.
- **FR11:** WHEN a user edits the SQL draft or selects another page size THE SYSTEM SHALL keep visible retained results associated with their original submitted SQL and page size until another explicit Run.
- **FR12:** WHEN the backend returns a documented failure THE SYSTEM SHALL display the corresponding denied, unauthenticated, invalid-input, unsupported-SQL, unavailable-data, busy, timeout, resource-limit or retention-capacity state with its permitted deliberate recovery.
- **FR13:** WHEN identity, session validity or access changes THE SYSTEM SHALL clear affected protected state and reject obsolete responses.
- **FR14:** WHILE the current user is a Viewer THE SYSTEM SHALL expose only national navigation, catalog, schemas, suggestions, previews, metrics and SQL results.
- **FR15:** WHEN displaying returned data THE SYSTEM SHALL preserve ordered columns, duplicate labels and rows, exact numeric values, opaque identifiers, calendar dates, typed nested values and missing-versus-zero distinctions.
- **FR16:** WHEN displaying a retained SQL result THE SYSTEM SHALL distinguish successful empty output, retained-page boundaries and whole-result truncation.
- **FR17:** IF configuration, current authentication or valid service data is unavailable THEN THE SYSTEM SHALL withhold the affected protected experience without substituting synthetic data.
- **FR18:** WHEN displaying SQL text, column labels, data values or failures THE SYSTEM SHALL treat returned content as untrusted text without executing it or exposing internal diagnostics.
- **FR19:** WHEN a retained SQL result reaches its fixed expiry THE SYSTEM SHALL remove its protected rows and display expired-result recovery without waiting for another request.

### Technical / Non-functional
- **TR1:** The backend remains authoritative for permissions, SQL validation, analytical execution and national metrics; the presentation tier accesses only the application backend for product data.
- **TR2:** SQL execution requires the current session and its session-bound anti-forgery material under the documented origin restrictions.
- **TR3:** Credentials, anti-forgery material, SQL drafts and protected results are not persisted in browser storage; credentials and SQL text are not included in navigation URLs, telemetry or diagnostic output.
- **TR4:** Protected requests and responses are not reused through shared caching; retained client state belongs to its identity/access context and its exact browsing sequence or execution.
- **TR5:** SQL submission is never triggered by pagination, retry policy, focus, reconnect, remount, ordinary navigation or preview/metric loading.
- **TR6:** Preview and SQL page sizes independently default to 100 and permit 1–500; each sequence/execution expires after its original fixed 15-minute lifetime.
- **TR7:** SQL retained-output limits are 1,000 rows or 1,048,576 bytes; a retained count is not a total source-match count, and the 10-second execution deadline is not a guaranteed response time.
- **TR8:** Submitted SQL obeys the current 65,536-byte UTF-8 bound; the client does not transform SQL to make it acceptable.
- **TR9:** Calculated and reported national percentages preserve the documented exact values and two-decimal half-up presentation; missing observations are never interpolated as measured data.
- **TR10:** Contract, fixture, connected-browser and visual evidence are reported separately against the exact target and source revision; successful compilation or a healthy service alone does not establish live acceptance.

## Inputs & Outputs
- Session input: backend-assigned identity, recognized Viewer/Analyst/Admin role, original expiry and current anti-forgery material; output: permitted authenticated presentation and session transitions.
- Catalog input: `generation_id`, `datasets` with `id`, `sql_name`, `label`, `schema_version`, ordered `columns`, `supported_filters`, and nullable coverage dates; output: authorized discovery and schema reference.
- Preview input: dataset, optional `start_date`/`end_date`, initial `page_size`, or a continuation/revisit cursor alone; output: `dataset`, `generation_id`, ordered `columns`, positional `rows`, `page_size`, `page_cursor`, nullable `next_cursor`, `has_more`, `expires_at`.
- SQL submission input: `sql` string and positive numbered `page`/`page_size`; continuation input: opaque `query_id`, numbered `page`, optional original `page_size`, without SQL.
- SQL output: `query_id`, nullable `generation_id` for reference-free expressions, ordered `columns`, positional `rows`, `page`, `page_size`, `retained_row_count`, `total_pages`, `has_more`, `truncated`, nullable `truncation_reason`, `limits`, `expires_at`.
- Failure input: safe `error.code`/`error.message`, optional advisory retry duration and owned-query recovery `query_id`/`expires_at`; output: normalized observable failure and deliberate next action.

## Scope
### In scope
- Complete live catalog, schema, previews, existing national Overview and SQL workspace integration.
- Reconcile current contract changes, including nullable reference-free SQL generation identity.
- Preserve and verify existing session behavior, permission isolation, typed data fidelity, explicit recovery and safe SQL-client state.
- Record state-management suitability and SQL-client security findings separately from this behavioral specification; dependency adoption is not a prerequisite.

### Out of scope (non-goals)
- New Admin refresh UI, deferred new-data card, saved queries, durable query history, exports and new visual features.
- Backend implementation, ingestion, operational database changes, provider configuration, deployment and user-owned analytical runtime isolation validation.
- Dependency installation or replacement of working state behavior during specification preparation.

## Assumptions
- The user's October 5 confirmation establishes readiness to begin integration; it does not replace observed live acceptance.
- Existing authentication and prepared client behaviors are retained and reused rather than treated as missing functionality.
- Current backend contracts supersede earlier imported snapshots; the former three artifact inconsistencies are corrected in the current source handoff.
- Live SQL acceptance requires an enabled, configured analytical runtime. [NEEDS CLARIFICATION: Which running backend build and explicitly configured analytical resources are the target for live data and SQL acceptance?]

## Acceptance Criteria
- [ ] **AC1:** Connected Viewer discovery returns national only; Analyst/Admin discovery returns their permitted datasets and embedded schema/coverage. (verifies FR1, FR14)
- [ ] **AC2:** Omitted, one-sided, valid paired and out-of-coverage dates produce the contract-defined preview behavior. (verifies FR2)
- [ ] **AC3:** Continuation/revisit remains stable after a newer publication; changed selection starts a separate sequence. (verifies FR3)
- [ ] **AC4:** An expired/lost preview displays restart without silently beginning another sequence. (verifies FR4)
- [ ] **AC5:** A range exceeding one preview page is complete, from one generation, with correct percentage presentation and missing-date gaps. (verifies FR5, TR9)
- [ ] **AC6:** One Run produces one unchanged SQL submission, including reference-free output with null generation identity. (verifies FR6, FR15)
- [ ] **AC7:** SQL page navigation/revisit sends only retained-execution inputs and preserves result identity, multiplicity and original expiry. (verifies FR7)
- [ ] **AC8:** Lost execution responses, focus, reconnect, remount and ordinary navigation never cause another SQL submission. (verifies FR8, TR5)
- [ ] **AC9:** Lost/expired SQL results require explicit Run and never recover by silently returning a new first page. (verifies FR9)
- [ ] **AC10:** Owned out-of-range recovery reads the existing first page without resubmitting SQL. (verifies FR10)
- [ ] **AC11:** Draft and page-size changes leave the existing result bound to its original submitted statement and fixed size. (verifies FR11)
- [ ] **AC12:** Each documented failure category receives its correct state; advisory retry timing never automatically submits SQL. (verifies FR12)
- [ ] **AC13:** Logout, original expiry, identity change and access reduction remove affected protected state; delayed responses cannot restore it. (verifies FR13, TR3, TR4)
- [ ] **AC14:** Viewer direct detail requests and foreign-user retained-result requests are denied without disclosing protected metadata. (verifies FR14, TR1)
- [ ] **AC15:** Rich typed results preserve precision, nulls, identifiers, duplicate labels/rows and column positions; malformed envelopes fail closed. (verifies FR15, FR17)
- [ ] **AC16:** Empty output and an empty byte-truncated result remain distinguishable; retained counts are never presented as full source counts. (verifies FR16, TR7)
- [ ] **AC17:** Missing configuration, unavailable data and service failures display explicit unavailability with no fixture substitution. (verifies FR17)
- [ ] **AC18:** Injection-shaped labels/values render inertly; diagnostics disclose no credentials, SQL fragments or internal storage/provider details. (verifies FR18, TR3)
- [ ] **AC19:** Missing/stale anti-forgery material and a disallowed origin cannot execute SQL; oversized SQL is rejected under the documented byte bound. (verifies TR2, TR8)
- [ ] **AC20:** Authenticated reload/reopen, fixed expiry, access reduction and independent-session logout pass against the named live target; missing evidence does not count as acceptance. (verifies FR13, TR10)
- [ ] **AC21:** Preview and SQL independently default to 100 rows and accept only page sizes 1–500; continuation and revisit never renew their original fixed 15-minute expiry. (verifies FR3, FR7, TR6)
- [ ] **AC22:** A displayed SQL result clears its protected rows at original expiry without user action or another request, and offers explicit Run without submitting it automatically. (verifies FR19, FR9, TR5)

## Open Clarifications
- [NEEDS CLARIFICATION: Which running backend build and explicitly configured analytical resources are the target for live data and SQL acceptance?]
