# Phase 3 verification

October 4, 2026 — **All 13 tasks T3.1–T3.C accepted by coordinator**. All 13 Phase 3 tasks
are covered below. This checkpoint accepts shared presentation and fixture-lane
readiness, not finished screens, live integration or release readiness.

## Tested source and actual checks

The [manifest](phase-3-digests.json) binds **101 source/test/script/configuration
and font/license files**, including untracked implementation. Aggregate SHA-256:
`1cd07f99e3b23abdaad48d16b39da2b8d1a20138f75a797cc4d718fcd90ab65a`.
Docs, screenshots, manifests and generated output are excluded; evidence does
not recursively hash itself. Git metadata remains in the coordinator's
[execution ledger](../execution-state.md).

Fresh serialized Next webpack build: **`Sji_VuXxa0ZrIyXlh3U4-`**. The same
source digest was verified unchanged after build and emitted-fixture scanning.
Only the framework's internal `/404` builds; product pages remain unassembled.

| Actual command | Result |
| --- | --- |
| `npm run typecheck` / `npm run lint` | Both exit 0, integrated tree |
| `npm test` | Exit 0; **12 files, 67 tests** |
| `npm run test:boundaries` | Exit 0; **31 tests** |
| `npm run check:boundaries` | Exit 0; **43 modules, 1 production root** |
| `npm run build` | Exit 0; fresh build above |
| `npm run check:production-fixtures` | Exit 0; source graph plus **49 emitted files** |
| `npm run build-storybook` | Exit 0; final shared specimens/fonts/decorator rebuilt by browser owner |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e` | Final **21 Chromium tests passed**, coordinator-accepted browser-owner evidence |
| `npm run check:release-boundaries` | Exit 1, expected: live production registration absent |

The browser owner ran scoped checks while correcting defects and then supplied
the final complete suite result against rebuilt artifacts. No further tests
were rerun for this documentation-only checkpoint. Existing nonfatal Storybook
module-directive/chunk warnings remain. Sandbox localhost/browser runs used
approved escalation; failed startup attempts were not counted as passes.

## Accepted tasks and requirement trace

| Tasks / output | Evidence scope | Trace |
| --- | --- | --- |
| T3.1 — FormField, DateRangeField, SearchField | Controlled raw values; label/help/error IDs; no date policy, coverage, API or session ownership | M1; FR1/FR17, TR2/TR10 |
| T3.2 — StatusMessage, EmptyState, MetricValue, PanelHeader | Explicit announcements, recovery outside live text, precise supplied display strings; null differs from zero | M2; FR1/FR11/FR16/FR17, TR2 |
| T3.3 — Tabs, NavigationItem, UserSummary | Controlled tab/panel relations, Arrow/Home/End focus, disabled skipping; supplied links/identity only | M3; FR1/FR17, TR2 |
| T3.4 — PaginationControls | Supplied cursor-style or numbered actions/current state; no totals, arithmetic or lifecycle invention | M2; FR9/FR13/FR17, TR2/TR10 |
| T3.5 — DataTable | Ordered positional columns, duplicate labels/rows, opaque identifiers/large decimals/nulls, literal source text; keyboard horizontal overflow | O1; FR1/FR11/FR15/FR17, TR2 |
| T3.6 — AppNavigation, AppHeader | Supplied session-ready metadata; pending withholding; modal focus/background exclusion, closure/restoration and responsive header | S1/O1; FR1/FR5/FR6/FR17, TR2 |
| T3.7 — AuthTemplate | Independent centered branded slots; managed-login entry/pending/expiry/error specimens, no credentials form | T1/V1; FR1/FR17/FR19, TR2/TR10 |
| T3.8 — AppShell, Overview/Explorer/WorkspaceTemplate | Local drawer state only; protected child/accessory withholding; measured stacked/master-detail slots without features/routes | T1/V2–V4; FR1/FR17/FR19, TR2 |
| T3.A / T3.O / T3.E / T3.Q | Accepted individual lane prerequisites and existing guarded runtime/operation/fixture examples | FR2/FR5/FR7–FR13/FR15/FR17/FR19/FR20; TR8 |
| T3.C — this record and digest manifest | Integrated shared boundaries, behavior, visual references and readiness acceptance | FR1/FR11/FR15/FR17/FR19; TR2/TR8/TR10; partial AC1/AC11/AC15/AC17/AC19 |

Readiness records: [Auth](readiness-auth.md), [Overview](readiness-overview.md),
[Explorer](readiness-explorer.md), [Queries](readiness-queries.md). These gates
permit their exact fixture lanes; this run does not start Phase 4.

## Visual and responsive evidence

The browser suite produced **32 Phase 3 captures** at **1440×1100 and
390×1100**, with local loaded fonts, synthetic labels and reduced motion.
Six captures were visually inspected by the browser owner; the coordinator
also reviewed source-linked shell/table/template specimens. Capturing every
specimen is not a claim that all 32 received individual human comparison or
that a full product screen passed a pixel threshold.

| Source mapping / specimen states | Durable desktop / narrow evidence |
| --- | --- |
| M1/V2–V4 — controlled fields, compact range and search | [fields](../evidence/phase-3/fields-1440.png) / [fields](../evidence/phase-3/fields-390.png); [compact](../evidence/phase-3/compact-range-1440.png) / [compact](../evidence/phase-3/compact-range-390.png); [search](../evidence/phase-3/search-1440.png) / [search](../evidence/phase-3/search-390.png) |
| M2/V2–V4 — pending/error/recovery and precise values | [status](../evidence/phase-3/status-1440.png) / [status](../evidence/phase-3/status-390.png); [values](../evidence/phase-3/values-1440.png) / [values](../evidence/phase-3/values-390.png) |
| M2/V3–V4 — supplied continuation and numbered actions | [continuation](../evidence/phase-3/pagination-1440.png) / [continuation](../evidence/phase-3/pagination-390.png); [numbered](../evidence/phase-3/numbered-actions-1440.png) / [numbered](../evidence/phase-3/numbered-actions-390.png) |
| O1/V2–V4 — typed records and duplicate projections | [table](../evidence/phase-3/table-1440.png) / [table](../evidence/phase-3/table-390.png); [duplicates](../evidence/phase-3/table-duplicates-1440.png) / [duplicates](../evidence/phase-3/table-duplicates-390.png) |
| M3/V3 and S1 — ready tabs and shell | [tabs](../evidence/phase-3/tabs-1440.png) / [tabs](../evidence/phase-3/tabs-390.png); [shell](../evidence/phase-3/shell-1440.png) / [shell](../evidence/phase-3/shell-390.png) |
| T1/V1 — managed-login entry and supplied error | [entry](../evidence/phase-3/auth-entry-1440.png) / [entry](../evidence/phase-3/auth-entry-390.png); [error](../evidence/phase-3/auth-error-1440.png) / [error](../evidence/phase-3/auth-error-390.png) |
| T1/V2–V4 — slot-only analytical layouts | [Overview](../evidence/phase-3/overview-template-1440.png) / [Overview](../evidence/phase-3/overview-template-390.png); [Explorer](../evidence/phase-3/explorer-template-1440.png) / [Explorer](../evidence/phase-3/explorer-template-390.png); [Workspace](../evidence/phase-3/workspace-template-1440.png) / [Workspace](../evidence/phase-3/workspace-template-390.png) |

Geometry is source-linked through the [inventory](../design-inventory.md) and
[deviations](../design-deviations.md). Actual Chromium checks cover boundaries
**479/480/481, 759/760/761, 999/1000/1001px**, narrow keyboard table overflow,
and a **720×550 CSS viewport** modeling 200% reflow from 1440×1100. The latter
is not real browser zoom certification. Inclusive checks prove 480px field/
pagination stacking; 760px analytical stacking/header and page padding; 1000px
compact 220px columns/mobile navigation; desktop 232px sidebar, 50px header
and 275px/250px master columns. Native dialog background/focus, long header,
pending exclusions, supplied pagination and literal table text passed.

Documented corrections/extensions:

- Tailwind `max-[Npx]` excluded equality, unlike the observed `<=` rules.
  Inclusive arbitrary media variants corrected affected molecules, AuthTemplate,
  AppHeader and analytical templates; compiled CSS and actual equality checks
  passed after affected consumers were rebuilt.
- Native modal behavior excluded background interaction but allowed a keyboard
  focus edge; explicit Tab wrapping fixed it. Hash navigation moved focus after
  immediate close; cancellable deferred restoration now respects deliberate
  destination focus, reopening/unmount/viewport changes. Resize focuses the
  active second destination before falling back to the first. These are D2
  extensions, not evidence of live route/session behavior.
- Long headers truncate visually while retaining full accessible text/title;
  identity names wrap. Cyan focus on navy, readable Auth strapline/footer and
  independent error/loading states retain documented D1/D5/C1/C10 provenance.
- The test-only synthetic banner was obscured by the fixed sidebar. Storybook's
  decorator now puts it visibly above fixture chrome; production styling is
  unaffected. Phase 2 PNGs were regenerated with this banner change by the full
  suite. Their historical source evidence remains in [Phase 2](phase-2.md);
  unchanged atomic consumers passed again. New PNGs are current test captures,
  not byte-identical historical artifacts.

## Evidence limits and handoff

**Fixture/shared behavior:** accepted supplied-prop composition, lossless table
presentation, pending withholding and existing operation/runtime readiness.
Feature controllers, complete SQL/preview lifecycles and chart behavior remain
Phase 4 work. Shared components do no permission fetching or network work.

**Visual:** shared specimens and explicit extensions only. Finished-screen
fidelity, final Q4 browser matrix, real zoom/touch/readability and complete
table/editor/chart usability remain downstream acceptance.

**Live:** none. Q2/Q3 contracts, actual Cognito/backend authorization, production
operation registration/failure behavior and release checks remain unresolved.
Individual feature checkpoints and the composed harness still precede page
assembly; fixture success never substitutes for release evidence.

Review the diff, then run /implement for phase 4.
