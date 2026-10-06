# Catalog publication invalidation follow-up

Recorded October 5, 2026, following the selective [scope review](../scope-review.md).
The phase-1 foundation was already committed as `f26e602`. This update closes
its documented publication callback gap; deferred row-retention phases and
production enabling remain deferred.

## Behavior and controlled evidence

OverviewEntry now supplies catalog invalidation through the feature's publication
callback. The existing current-session, once-per-run successful-publication guard
calls it before reloading Overview metadata and national observations. Reloading
aborts the previous observation request and clears its selection, metadata and
rows; the user's selected date bounds remain intact. Session cleanup resets that
range-preservation state so a new session still starts with authorized coverage.
Context continues to expose dependencies rather than protected payloads.

Seven composed synthetic cases cover every refresh status. Only `succeeded`
invalidates; `accepted`, `running`, `retained`, `failed`, `interrupted` and
`publication_unknown` leave catalog and observations unchanged. The invalidation
listener observes zero retained entries before reloading begins. Under the
explicitly synthetic retention policy, publication changes catalog GET count
from one to two and national-series reads by exactly one. The returned series
has the newly published synthetic snapshot, and a subsequent schema projection
shares the new catalog without another catalog read. Checking that succeeded
run again makes a fresh status read but triggers no second invalidation or data
reload. No admission or SQL execution occurs in any case.

This changes no production retention policy, preview cursor or SQL-page lifetime.
Standalone Overview features also reload metadata after publication. Ordinary
row retrieval and deliberate SQL Run remain governed by their existing workflows.

## Checks actually run

- Focused repository, Overview, refresh and composition tests: 55 passed.
- `npm test`: 298 tests passed across 25 files.
- `npm run typecheck` and `npm run lint`: passed.
- `npm run test:boundaries`: 33 checks passed.
- `npm run check:boundaries`: 104 modules / 15 production roots passed.
- Fresh configured `npm run build`: passed for all four product routes.
- `npm run check:production-fixtures`: passed against that build, 341 emitted files.
- Controlled actual-Next browser suite (`playwright.controlled.config.ts`, one
  worker, temporary Chromium cache): all four tests passed, covering Viewer,
  Analyst, Admin and explicit failures without SQL replay.
- `git diff --check`: passed.

Base revision: `f26e602a7e872306aabb201d286094c2be3e2c70`. The sorted tracked/untracked
nonignored path/content digest taken after checks, before this evidence and
current-turn journal were added, is
`7ad52a2f0d53c5d4da818d8f3ea1009ca3c9adaf37a614303009cb60da814a30`.
Fresh build ID: `4rkBXSq4J6Ueqs-croA0-`. Generated Next type imports were restored
to their original tracked paths after verification; subsequent changes are
verification/journal documentation only.

The browser suite intercepts APIs with synthetic responses. It proves production
composition regressions, not live catalog reuse or real publication. Publication
invalidation itself is verified by the composed behavior tests above. No live
scenario or visual comparison was run. Production completed-response retention
remains disabled pending the user's deferred budget decision and production
enabling. The original live/visual release gates remain open.
