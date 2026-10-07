# Phase 1: Catalog metadata ownership

Recorded October 5, 2026. T1.1–T1.C are complete at the controlled catalog
metadata seam. The [scope review](../scope-review.md) records the user's narrowed
request: reuse model/schema metadata; row tables may reload on visits. Broader
Overview/Explorer/SQL row retention phases are deferred. No broader spec
acceptance checkbox or live/visual release gate is closed by this record.

The user chose open-app reuse until page reload, and explicitly deferred the
budget decision and production enabling. Production injects `retention: disabled`:
concurrent identical catalog requests share pending work, but completed payloads
are not retained. Tests/fixture compositions inject an explicitly synthetic
16-entry/1 MiB policy; those numbers are test choices, never production defaults.
No browser storage, new TTL, polling, dependency, row cache or SQL execution
reuse was added.

## Changes and ownership

The decoded CatalogBundle preserves authorized summaries, generation identity
and ordered embedded schemas atomically. The same loader serves listings,
schema projection and the metadata read inside national assembly. Metadata may
accompany a newer preview generation; that preview's own sequence remains
authoritative. Preview and SQL-page reads, complete national row assembly and
every explicit SQL execution retain existing request behavior.

One injected repository owns pending transport signals and protected catalog
payloads. Consumer cancellation detaches that reader while remaining/remounted
readers share the request. Session ownership includes generation, subject and a
copied capability snapshot. Resource epochs reject late writes after invalidation.
Session cleanup, current denial and disposal synchronously remove retained
metadata and abort owned work. Old-session denials cannot clear a newer session.
Current forbidden clears metadata without asserting backend logout. Same-session
invalidation/disposal failures use a service-failure outcome, preserving the
existing guardOperation distinction from an authoritative unauthenticated result.

Provider replacement and unmount dispose the repository; route consumer remounts
leave it owned by the provider. Application and fixture Strict Mode tests verify
cleanup/reattachment. Context exposes dependencies, never payloads. Admission
honors injected entry/byte bounds without evicting another usable bundle.
Successful empty catalog responses are reusable; malformed/error outcomes are
not. Throwing invalidation listeners cannot prevent other mandatory listeners,
disposal or settlement of catalog callers.

## Actual checks

| Command | Result |
| --- | --- |
| `npm test` | 291 tests passed across 25 files, including repository, adapter, session, feature and composition tests. |
| `npm run typecheck` | Passed (`next typegen && tsc --noEmit`). Generated next-env imports restored to their starting tracked paths afterward. |
| `npm run lint` | Passed after correcting Promise rejection typing and initial test lint findings. |
| `npm run test:boundaries` | 33 adversarial checks passed. |
| `npm run check:boundaries` | 104 modules / 15 production roots passed. |
| `npm run build` | Coordinator's fresh configured webpack production build passed for all four product routes. Generated next-env imports restored afterward. |
| `npm run check:production-fixtures` | Coordinator's scan passed against the fresh build: transitive source graph and 313 emitted files. |
| `git diff --check` | Passed. |

The build and emitted fixture scan above were run separately by the coordinator
after the implementer's final behavior/type/lint/boundary checks. They establish
build and fixture isolation, not live or visual acceptance.

## Controlled acceptance contributions

| Criterion | Catalog seam evidence |
| --- | --- |
| AC2 | Concurrent listing + schema + national metadata, later schema reuse and a second national assembly issue **one catalog request** under injected policy. The second national assembly still issues a new row request. |
| AC3 | Different resource identity fetches separately. Missing schema returns data-unavailable without inventing a dataset. Empty bundles are reused; malformed catalog retries and decodes a new valid bundle. Current unavailable dataset responses invalidate metadata for deliberate revalidation. |
| AC4 | Repository tests cover cleanup, current unauthenticated invalidation, current forbidden, identity/capability replacement and disposal. Session tests in the full suite cover expiry/logout cleanup. Scope is repository metadata, not global clearing of all existing feature snapshots on a same-session forbidden response. |
| AC5 | Ignored transport aborts, delayed success/denial, provider replacement and request cancellation cannot restore metadata. Current denial and publication/disposal cancellation passed through guardOperation do not falsely log out the session. |
| AC9 | Reused listing/schema projections match decoded values and preserve order and opaque identities. Existing adapter/feature regressions remain passing for calendar dates, null/zero, positional output, duplicate labels/rows and exact metric presentation; row reuse itself is outside this phase. |

Explicit request traces also prove two identical SQL Runs issue **two POSTs**;
two same SQL-page reads issue **two GETs**; two preview starts issue **two GETs**.
Production default listing/schema concurrent reads issue one pending catalog
GET, then a subsequent schema read issues another GET and retained entry count
stays zero. Fixture remount listing/schema issue one underlying listing read.

## Limitations

The publication-wiring limitation below records the original checkpoint. It is
resolved by the [publication follow-up](publication.md); production retention and
budget agreement remain deferred.

The repository's published-refresh invalidation seam is tested, but the existing
Overview refresh publication callback is not wired to it in this phase. Before
production catalog retention is enabled, integrate that callback so bundled
coverage/generation metadata cannot survive known publication. Production
retention remains disabled, so existing refresh retrieval stays fresh now.

Budget/admission agreement and production enabling remain deferred. Controlled
metadata ownership is not proof of named-target authorization, navigation row
retention, backend-only permission-change discovery or Figma fidelity. No live
scenario or visual comparison was run. Broader phases remain unchecked and
require scope review before implementation.

Review the diff; confirm the narrowed metadata policy and publication wiring
before enabling production reuse. Do not start the deferred row-retention phases
automatically.

### Policy update — October 6, 2026

The user has since selected a one-entry, 256 KiB UTF-8 serialized JSON admission
cap. The original budget-deferred note above records the October 5 checkpoint.
Production retention remains disabled pending actual authorized catalog-size
verification and explicit production enabling.
