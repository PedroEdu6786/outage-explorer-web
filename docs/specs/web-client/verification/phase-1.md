# Phase 1 verification

Task **T1.C**, October 4, 2026. Integration evidence record reviewed and accepted by the
coordinator. All predecessors **T1.7, T1.8, T1.9 and T1.11** were
accepted before this record was created. The coordinator reviewed T1.1–T1.11
and ran the final integrated checks below.

The executable toolchain, proposed frontend contracts, generation-guarded session
runtime and synthetic operation seams are ready for downstream development.
This checkpoint establishes fixture foundation readiness; it supplies partial
**AC5, AC18 and AC19** evidence, not complete screen or release acceptance.

## Tested revision and artifacts

| Binding | Evidence |
| --- | --- |
| Git HEAD | `d85410486de5055237a4f66cde197250555e9bd8` |
| Working branch | `feat/web-client-foundation`; implementation changes remain uncommitted |
| Tested content | 43 source, test, script and configuration files listed in [phase-1-digests.json](phase-1-digests.json) |
| Aggregate source digest | `26bca88893cf89e64225b36f96012513aada6f3155c2fdc66343bf1e9b4afc65` |
| Fresh Next webpack build ID | `sfxyFofKfbhgboPh1IIDn` |
| Freshness | Coordinator verified the tested source digest remained unchanged before/after the production build and artifact scan |

The digest manifest identifies the tested implementation independently of HEAD,
including untracked additions. Documentation evidence added afterward is outside
that 43-file manifest. Later source edits invalidate affected acceptance and
require their consumer checks; an old clean artifact scan does not validate
new source.

## Actual final integrated checks

These results were supplied by the coordinator from the integrated tree, rather
than inferred from worker reports. Commands and environment prerequisites are
documented in [verification.md](../../../development/verification.md).

| Executed command | Result | Evidence scope |
| --- | --- | --- |
| `npm run typecheck` | Exit 0 | Strict TS plus Next type generation; compile-negative retained-page SQL argument checked |
| `npm run lint` | Exit 0 | Configured JS/TypeScript rules across the integrated tree |
| `npm test` | Exit 0; 5 files, 38 tests passed | Session, guards, contracts, synthetic operations and RTL tooling behavior |
| `npm run test:boundaries` | Exit 0; 31 tests passed | Adversarial source graph/layer/loader and emitted-check fixtures |
| `npm run check:boundaries` | Exit 0; 12 modules, 1 production root | Current production import graph and ownership rules |
| `npm run build` | Exit 0; fresh webpack build | Framework bootstrap only; internal 404 is the only built route |
| `npm run check:production-fixtures` | Exit 0; 49 emitted files checked | Source graph and fresh production artifact fixture signatures |
| `npm run build-storybook` | Exit 0 | Independently built preview/tooling root |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e` | Exit 0; 1 Chromium test passed | Tooling-story keyboard interaction and no browser page errors |
| `npm run check:release-boundaries` | Exit 1, expected failure | Fails closed because `src/composition/production-operations.ts` is absent |

Storybook emitted nonfatal warnings about saving global settings under sandbox
permissions, `use client` directives and chunk size. They did not fail the build
or browser smoke. Chromium was the executed browser; Firefox/WebKit and product
routes were not verified. The release-boundary failure is an open later gate,
not a successful release check.

## Task and requirement evidence

| Accepted prerequisite / output | Trace | What the evidence establishes |
| --- | --- | --- |
| T1.1, T1.2 — pinned toolchain and minimal bootstrap | TR1, TR2, TR6, TR9 | Compatible installed pins, strict compiler, minimal root layout/config and supported webpack build; no product page assembly |
| T1.3 — [assets](../assets.md) and [deviations](../design-deviations.md) | FR1, TR10 | Observed V1–V4/S1/A1–A3/C1–C11 provenance/deviation documentation; runtime font distribution/loading and weight 650 remain downstream work |
| T1.4 — independent stories/test roots | FR18, FR19, TR1, TR9 | RTL and Chromium tooling smoke plus built Storybook without product routes |
| T1.5 — eight feature-facing contract modules | FR2–FR16, FR20–FR21, TR4, TR5, TR7 | Framework/transport-free operation seams; ordered positional lossless values, distinct preview/SQL inputs and execute-only unknown outcome; page requests cannot carry SQL |
| T1.6, T1.7 — runtime and regression tests | FR3–FR6, FR19, FR21, TR6, TR7; partial AC5/AC19 | One generation, protected cleanup, pending identity withholding, expiry, stale success/metadata/error/intent rejection and current-generation failure side effects |
| T1.8 — synthetic adapters, scenarios, logs/provider | FR6–FR16, FR18–FR20, TR4–TR6 | All operation seams and adversarial fixtures, visible synthetic label, controlled delays and observable execute/page calls; no backend authorization claim |
| T1.9 — [live readiness revision 1](../contracts/live-readiness.md) | FR2–FR4, FR6–FR7, FR9, FR13, FR16, TR3, TR5, TR7, TR9 | Explicit unresolved Q2/Q3 and per-operation agreement/evidence gates |
| T1.10 — ownership/source/artifact checks | FR18, FR19, TR2, TR3, TR6, TR8, TR9; partial AC18/AC19 | Adversarial-tested boundary tooling; current bootstrap source graph and fresh output exclude fixture roots/signatures; release registration remains absent |
| T1.11 — [workflow](../../../development/verification.md) | FR19, TR1, TR8, TR9 | Reproducible commands, serialized build resources, ownership handoffs and separate fixture/live/visual evidence |

T1.C itself traces **FR4–FR6, FR18–FR19; TR1, TR6–TR9; AC5, AC18, AC19**.
The actual task assignment/review history remains in the coordinator-owned
[execution ledger](../execution-state.md).

## Behavioral and independent review closure

Controlled-promise tests cover Analyst logout → Viewer sign-in and capability
reduction before old catalog/schema successes, forbidden/unauthenticated errors
or transport rejections resolve. Old callbacks cannot publish metadata or
invalidate the newer session. The React consumer withholds identity while pending
and removes it on invalidation. Cleanup runs before subscribers observe the new
generation; expiry does not renew the application session.

Independent session review found two exception paths. Both were corrected and
regression-tested: cleanup/subscriber exceptions cannot prevent mandatory expiry
scheduling, and a throwing failure callback cannot prevent current unauthenticated
invalidation. The latter still rechecks generation before invalidation so a newer
session established by that callback remains valid.

Fixture behavior checks directly deny Viewer detail schemas/previews and
unauthorized cursor/query continuation, preserve original snapshot/expiry through
publication, reset through a new explicit selection and retain fixed SQL size.
They observe one unchanged SQL submission followed by ID-based next/previous
pages; explicit reruns receive new IDs. Whole-result truncation survives a short
page. Lost/expired results and unknown execute outcomes remain distinct without
automatic execution replay. Duplicate column labels/rows, opaque leading-zero
identifiers, huge exact values, half-up ties, null/zero and missing calendar dates
survive their feature-facing representation. National handoffs reject restricted
facility filters and prepare only unsent authorized drafts.

Independent boundary review closed layer-path, import-equals and indirect module
loading escapes with adversarial tests. The current source checker and fresh
artifact scan are complementary evidence; their documented static limits remain.
Production failure/browser proof and later feature graphs still need their own
checks. Fixture SQL uses predetermined synthetic projection scope and never
parses SQL; fixture date validation checks syntax/order only. Neither substitutes
for Flask authorization/SQL validation or live boundary validation.

## Evidence limits and handoff

**Fixture behavior:** passing foundation checks above. This is not a composed
four-feature harness, fixture page demo, production failure scenario or real
Cognito/current-session/independent-session proof.

**Visual comparison:** existing design inspection and asset/deviation documents
only. No new product component/screen comparison, font loading or responsive
acceptance is claimed by this checkpoint.

**Live integration:** none. Q2 backend/session contracts and responsibility,
environment/version/transport remain unresolved; Q3 SQL size/TTL/delivery/outcome
agreement remains unresolved. Q4 browser/viewport agreement and runtime
typography remain outstanding. The frontend models and test settings do not
approve live HTTP contracts.

The next dependency-ready task is **T2.1**. This run stops after Phase 1 under
the applied implementation skill's one-phase-per-run boundary; no Phase 2 work,
commit, push or deployment is performed. Downstream features still require their
exact UI readiness predecessors, the composed harness remains a page-assembly
gate, and all live/release gates remain required separately.

## Tooling demo affordance correction — October 4, 2026

User inspection found the smoke button looked like plain text because Tailwind
Preflight removed native button decoration. The test-only ToolingSmoke now restores
native button appearance with `all: revert` and separates the counter with layout
spacing. No production source or contract changed. Original digests above bind
the original checkpoint; ToolingSmoke.tsx now has SHA-256 `23e85546adddf5cbd314a00f3d5539f913f5b14ab0818e3de4fa96a4bf7ecda7`.
Scoped Vitest smoke tests (2), rebuilt Storybook and Chromium keyboard smoke (1)
passed after this correction. This is tooling interaction evidence, not product
visual acceptance.
