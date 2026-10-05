# Phase 4 fixture feature verification

Recorded October 4, 2026. Scope: **T4.A1–T4.AC, T4.O1–T4.OC,
T4.E1–T4.EC, T4.Q1–T4.QC**; twenty tasks. The four T3 readiness gates
were accepted before dispatch. This record accepts isolated fixture features;
composed harness, product routes, production registration and release remain
later gates.

## Integrated source and checks

Base revision `d85410486de5055237a4f66cde197250555e9bd8` on
`feat/web-client-foundation`. Source/test/script/config/font manifest:
[phase-4-digests.json](phase-4-digests.json), **143 files**, aggregate SHA-256
`e7c089ca383f5a315c61c78f113235ca6abf30114a7c0bf77674f03bcd1fb67c`.
Fresh final webpack build ID: `NhRs0XCGG62x8hXANSBUl`.
Untracked implementation is included; evidence/docs/generated outputs are excluded.
Shared contracts, configuration and session runtime were not changed in this phase.
A final manifest verification after capture binds this same source to the evidence.

| Actual command/check | Result |
| --- | --- |
| Node/npm | 24.18.0 / 11.16.0, matching pins |
| `npm run typecheck` | Passed; final Overview correction additionally passed strict nonincremental tsc and build TypeScript |
| `npm run lint` | Passed; final changed Overview/browser files additionally passed scoped ESLint |
| `npm test` | **123 tests passed**, 16 files |
| `npm run test:boundaries` | **31 adversarial tests passed**; boundary scripts unchanged |
| `npm run check:boundaries` | **76 modules / 1 bootstrap production root passed** |
| `npm run build` | Passed; only internal `/404`, no product route assembled |
| `npm run check:production-fixtures` | Passed against fresh final build; **49 emitted files** |
| `npm run build-storybook` | Passed; Next/Vite module-directive warnings remain browser-bundle tooling warnings |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/visual/features.spec.ts --workers=1` | **6 Chromium tests passed / 16 captures** |
| `git diff --check` | Passed |

Meaningful new behavior coverage: **Auth 16**, **Overview 10**, **Explorer 17**,
**Queries 13**, totaling **56** alongside 67 previously accepted tests.
Detailed operation traces and public seams are in
[Auth](feature-auth.md), [Overview](feature-overview.md),
[Explorer](feature-explorer.md) and [Queries](feature-queries.md).

Final browser checks exercised 1440×1100 / 390×1100 plus 479/480/481,
759/760/761 and 999/1000/1001 CSS pixels, loaded Inter, contained overflow,
keyboard chart scrolling, comparison/exact inspection, managed-login CTA,
Viewer cursor/Schema tabs, SQL shortcut/edit/pages and required recovery states.
Capture clock was fixed at `2026-10-04T12:00:00Z`. Port 6007 needed sandbox
escalation after EPERM; the actual approved Chromium run passed. An additional
exact-card selector initially failed because its text includes date metadata;
the corrected selector and final rebuilt run passed. This is reference-width
fixture evidence, with no pixel-difference threshold or Q4 certification.

## Controller review and acceptance

Root reserved coordination/shared/build resources. Auth, Explorer and Queries
workers exclusively owned their respective feature paths and evidence; root
owned Overview. Successor tasks began after scoped implementation/compile checks
and predecessor source review. No worker imported a sibling controller.
All public entries take injected operations and the same shared SessionRuntime.
Stories alone import FixtureProvider. All synthetic SQL limits/TTL and role
controls remain isolated, with no live transport/path or library changes.

- Auth withholds children and their invocation until authoritative resolution;
  beginLogin alone cannot establish identity. Logout clears local content before
  injected service dispatch and explicitly distinguishes unconfirmed backend
  invalidation. Runtime expiry remains authoritative, without auto-renewal.
- Overview preserves exact/display labels, calendar strings, zero/null/gaps and
  missing-day segments. Independent Auth-worker review found fresh generation
  capture could legitimize stale rendered intents; root bound callback selection
  and original session generation and added a regression. Date edits also abort
  request contexts synchronously so obsolete unauthenticated errors cannot
  invalidate current sessions before effect cleanup. Plot coordinates/ticks are
  approximate, while card/table/point/inspection values use supplied display text.
- Explorer uses metadata-driven authorized datasets, schemas, coverage and
  facilities. Filter/dataset/size changes reset pages. Continuations retain original
  snapshot/expiry; Previous is cached only and no totals/random page jumps are
  invented. Publication requires deliberate restart to switch snapshots.
- Queries retains unchanged submitted SQL separately from editable drafts. All
  page calls use query ID/fixed size and never SQL. Lost response is unknown,
  never cancellation or an automatic rerun. Current forbidden responses clear
  restricted metadata/context; request-specific abort contexts prevent older
  schema/catalog errors from invalidating a current selection/session.

Trace: FR1–FR7, FR8–FR21; TR2, TR4–TR6, TR8–TR10;
AC2–AC17 and AC19–AC21 fixture portions only. Live AC portions remain unverified.
No calculated metric, SQL policy or backend authorization was duplicated.

## Visual comparisons and extensions

Root and workers inspected the saved V1–V4 published prototype references before
composition; the authoring Make nodes remain unreadable. Root reviewed new
feature captures. These are isolated feature specimens, not assembled product
pages or final pixel/browser certification. The existing source inventory and
C1–C11/D1–D6 corrections remain authoritative.

| View / story | Captures and reviewed mapping | Deliberate difference |
| --- | --- | --- |
| V1/O5 `features-auth--managed-login-entry` | [1440](../evidence/phase-4/auth-1440.png), [390](../evidence/phase-4/auth-390.png), [expired](../evidence/phase-4/auth-expired-1440.png) | Centered brand/card/CTA retained; C1 removes credentials/persona; C10 adds expiry/recovery |
| V2/O2 `features-overview--ready` | [1440](../evidence/phase-4/overview-1440.png), [390](../evidence/phase-4/overview-390.png), [exact narrow full capture](../evidence/phase-4/overview-exact-390.png) | Three cards/trend/observation hierarchy retained. Ready includes latest-day null; exact-date selection demonstrates 1.01%. D3 keeps chart at least 920 CSS pixels in named keyboard scroll region; full table and inspection preserve all observations |
| V3/O3 `features-explorer--viewer` | [1440](../evidence/phase-4/explorer-1440.png), [390](../evidence/phase-4/explorer-390.png), [Schema](../evidence/phase-4/explorer-schema-1440.png), [expiry](../evidence/phase-4/explorer-expired-1440.png) | Catalog/master-detail/tabs/table retained. Isolated specimen excludes shell; fixture controls and size 1 are demo choices. C3 replaces total/numbered preview with original-snapshot cursors |
| V4/O4 `features-queries--ready` | [1440](../evidence/phase-4/queries-1440.png), [390](../evidence/phase-4/queries-390.png), [short truncated page](../evidence/phase-4/queries-truncated-1440.png), [unknown outcome](../evidence/phase-4/queries-unknown-1440.png) | Data browser/dark editor/results retained; C4 arbitrary positional duplicates/exact text; D4 no-wrap editor with scroll-synchronized logical-line gutter; explicit next-execution size and immutable retained pages |

Overview [denied](../evidence/phase-4/overview-denied-1440.png) and
[unavailable](../evidence/phase-4/overview-unavailable-1440.png) captures exercise
C10 extensions. Synthetic chrome and incomplete shell navigation in lane stories
are test-only; they do not replace the Phase 5 composed harness.

## Remaining gates

All four fixture checkpoints unlock T5.1, then T5.2/T5.H; **page assembly remains
gated until the composed harness passes**. Q2 session/API and Q3 SQL agreement
block affected live adapters and live acceptance. Q4 final browser/viewport
agreement remains unresolved. No real Cognito/Flask request, backend permission
proof, release registration, product page, commit, push or deployment occurred.
