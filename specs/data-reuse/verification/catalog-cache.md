# M3 — catalog-specific memory

October 7, 2026. Base revision: `158eb88`. The user authorized this simplification
after its scope and preserved behavior were explained. It changes the internal
cache seam; HTTP contracts, permission policy and user workflows are unchanged.

## Implementation and tradeoffs

All real callers requested the same authorized decoded `CatalogBundle`. The
previous repository nevertheless accepted generic payloads, request keys,
multiple entries, per-key epochs, description callbacks and injected freshness
decisions. Its only production freshness decision was unconditional reuse.

`src/contracts/catalog-cache.ts` now accepts only catalog bundles.
`src/resources/catalog-cache.ts` owns one completed bundle and one pending
transport. There are no generic payload casts, request-key maps, eviction rules,
freshness callbacks or cache clock. Production's one-entry limit is structural;
the 256 KiB serialized UTF-8 byte budget remains explicit. Empty successes are
reusable, oversized successes are usable without retention, and failures are
never cached. Ordered schemas and catalog generation stay inside the bundle.

SessionRuntime already increments its generation before cleanup on every
identity/capability resolution. The cache checks that authority instead of
serializing a duplicate subject/capability snapshot. A separate invalidation
version rejects work started before publication, denial, unavailable data or
disposal. Abort-controller identity prevents old completion from clearing a
replacement pending request. Aborting a consumer detaches that reader; other
and remounted consumers still share the cache-owned request.

Composition, adapters and fixtures now name this dependency `catalogCache`.
Provider ownership, Strict Mode reattachment, mandatory subscriber isolation and
D1 cross-feature denial remain intact. There is no compatibility facade around
the deleted internal repository. Future caching of another resource would need
its own demonstrated requirements; it cannot silently enter this catalog slot.

No preview rows, national series, SQL pages, SQL execution or refresh status are
added to the cache. SQL reads still use their execution's ID and fixed page size;
publication does not rerun SQL. D2 uncertain admission behavior is unchanged.

## Verification actually run

- First focused cache/adapter/live-composition/page-composition run: 85 passed.
- Final `node_modules/.bin/vitest run --no-cache --maxWorkers 2`: 407 passed in
  30 files. Existing lifecycle tests were moved to typed catalog values. Generic
  multi-key admission and injected freshness tests were replaced with exact-byte
  admission, oversized UTF-8 response and pending-replacement scenarios. Added
  shared catalog denial, synchronous loader failure and invalid-budget checks.
- `npm run typecheck`, `npm run lint`: passed.
- `npm run test:boundaries`: 33 passed.
- `npm run build`, then `npm run check:release-boundaries`: passed; 108 modules,
  15 production roots and 369 emitted files checked. Generated `next-env.d.ts`
  was restored.
- Configured `playwright.controlled.config.ts`, one worker: eight passed. Actual
  Next production routes use intercepted synthetic HTTP; catalog reuse across
  navigation, explicit date submission, paging, failures and D1/D2 still pass.
- `npm run build-storybook`: passed, with existing module-directive warnings.
- Fresh Storybook browser checks for `feature-harness`, `overview-page`,
  `explorer-page` and `query-page`, one worker: 13 passed. Includes stale success
  and stale denial after identity change, Viewer direct entry, protected-state
  removal and explicit SQL recovery without rerun.
- `git diff --check`: passed. No dependencies installed.

SHA-256 of sorted existing tracked/untracked, nonignored `src/` and `tests/`
paths and contents, each separated with NUL (201 files):
`0434b0b5f5d26d5527134c60290b5ff0ea5f5a1e9533132d99abeece49c5d98f`.

These checks establish controlled frontend behavior. No live backend permission
or catalog-size measurement, authenticated Cognito acceptance, screenshot
comparison or visual sign-off was performed. A memory hit still cannot discover
an unknown backend-only permission change; existing fresh-request enforcement,
known denial and session resolution remain authoritative. Historical phase/task
records retain their old paths and policies; the current spec/plan notes point to
this replacement without accepting deferred row-retention work.
