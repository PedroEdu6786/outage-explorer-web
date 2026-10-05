# Composed fixture integration acceptance — T5.H

Recorded October 4, 2026. **T5.1, T5.2 and T5.H accepted**. This checkpoint
unlocks T6.1 fixture page assembly; it does not accept live adapters or release.

All four explicit predecessors were accepted before this composition:

| Predecessor | Accepted fixture evidence |
| --- | --- |
| T4.AC | [Auth](feature-auth.md): authoritative-resolution boundary, expiry/logout and stale outcomes |
| T4.OC | [Overview](feature-overview.md): exact national observations and generation-bound dataset intent |
| T4.EC | [Explorer](feature-explorer.md): permitted metadata, snapshot-bound preview and SQL intent |
| T4.QC | [Queries](feature-queries.md): edited-draft consent, explicit execution and retained paging |

[Phase 4 integrated verification](phase-4.md) remains the predecessor record.
The harness imports only the four public feature entries. Each actual controller
consumes one shared SessionRuntime and one synthetic operations/catalog instance.
All features stay mounted across authenticated view switches to preserve drafts
and retained results; Auth withholds/unmounts protected children when unresolved
or signed out. The harness clears its in-memory intent and diagnostic display on
generation transitions. Fixtures and test controls live only under `tests/`.

## Actual composed proof

Five RTL cases and four Chromium scenarios passed against
`integration-feature-harness--shared-session`:

- Overview date context reaches Explorer, then SQL through public callbacks.
  Handoffs carry authorized dataset/filter context in memory. An edited draft
  requires Keep draft or Replace draft; preparing SQL never executes it.
- One explicit Run submits unchanged SQL. Editing the draft and next-execution
  page size does not change retained query origin. Next/Previous and focus/online
  events keep the same query ID and fixed size with no second execute.
- Result loss clears results and requires deliberate Run; the new execution uses
  the edited draft and selected next-execution size. Original whitespace/newline
  SQL preservation is asserted in the RTL trace.
- Delayed schema, catalog, preview, national-series and execution successes and
  unauthenticated/forbidden failures cannot publish after Analyst logout and
  Viewer resolution. Chromium separately releases delayed schema/preview and
  execution across that transition, including obsolete denial responses.
- Direct access reduction clears restricted tables, schema-browser choices,
  drafts, pending replacement consent and dataset intent. Viewer exposes national
  metadata only. Unresolved identity removes all protected feature content,
  including hidden sections; no stale outcome invalidates the new Viewer.

The handoff/paging trace asserts exactly:

| Operation | Input / count |
| --- | --- |
| `consumeNavigationIntent` | Authorized national dataset and the original date filters; no execute |
| `executeQuery` | One original `{ sql, page: 1, pageSize: 2 }` until deliberate new Run |
| `readQueryPage` | `{ queryId: "synthetic-query-1", page: 2, pageSize: 2 }`, then page 1 with that same ID/size; no SQL |

Trace: FR4, FR5, FR6, FR12, FR13, FR14, FR16, FR18, FR19, FR21;
TR6, TR8; **AC4, AC5, AC6, AC12, AC13, AC14, AC16, AC18, AC19, AC21
fixture portions**. AC4 real backend logout/independent-session behavior,
AC6 direct backend denial and AC18 production failure browser proof remain live
release requirements. No real authorization or Cognito compliance is claimed.

Full commands, source/build binding and remaining inputs are recorded in
[Phase 5 verification](phase-5.md).
