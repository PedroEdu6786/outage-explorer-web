# Phase 2 verification

October 4, 2026 — **T2.1–T2.C accepted by coordinator**. T2.1, T2.2, T2.3, T2.4 and
T2.5 were accepted before T2.6 started. This run implements a mapped shared
atomic vocabulary for later features, not product pages or live adapters.

## Tested source and artifacts

The [digest manifest](phase-2-digests.json) covers **66 source, test, script,
configuration and font/license files**, including untracked additions. Its
aggregate SHA-256 is
`973cd73f04165b4f9140775b151d3d31d08c4084b7c35ca985f3d661cf2dd3f8`.
Documentation, screenshots, this manifest and generated output are excluded
to avoid recursive evidence hashes. Git revision: `d85410486de5055237a4f66cde197250555e9bd8` on
`feat/web-client-foundation`; content binding includes the uncommitted tree.

Fresh Next webpack build ID: **`wJ-Sh8z2Bqol6_LqF-EGG`**. Source digest was
verified unchanged after the final production build and fixture scan. The
bootstrap still builds only Next's internal `/404`; product route assembly
and Next route font-delivery proof remain later work.

## Actual checks

| Command | Observed result | Scope |
| --- | --- | --- |
| `npm run typecheck` | Exit 0 | Integrated strict TypeScript/Next type generation |
| `npm run lint` | Exit 0 | Integrated code, stories, RTL and browser specs |
| `npm test` | Exit 0; 6 files, 47 tests | Includes 9 meaningful atomic behavior tests |
| `npm run test:boundaries` | Exit 0; 31 tests | Existing adversarial layer/source/emitted checks |
| `npm run check:boundaries` | Exit 0; 24 modules, 1 production root | No feature/transport/session dependencies in atoms |
| `npm run build` | Exit 0 | Fresh webpack bootstrap build, serialized |
| `npm run check:production-fixtures` | Exit 0; 49 emitted files | Fresh bootstrap artifact plus transitive source checks |
| `npm run build-storybook` | Exit 0 | All four atomic story groups and local static fonts |
| `npx playwright test --list` | 6 tests in 2 files | Existing smoke plus 5 new visual/keyboard tests discovered |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e` | Exit 0; 6 Chromium tests | Keyboard, computed styles, font proof, motion, captures and boundary overflow |
| `npm run check:release-boundaries` | Exit 1, expected | Production operation registration remains absent; release fails closed |

Storybook's existing nonfatal `use client`/chunk-size warnings remain. No
Firefox/WebKit/browser certification or live/backend check ran. Browser and
localhost execution used previously approved workspace escalation. A scoped
`--grep` invocation was denied localhost binding in the sandbox; the approved
full command executed the final suite.

Initial lint detected deprecated React FormEvent and shorthand-void/template
interpolation issues in the new tests; they were fixed and integrated lint
rerun. Initial Chromium native-select ArrowDown expectations did not commit
on this macOS headless menu; the final test verifies native **typeahead**
selection (`s` selects Synthetic option A) plus actual keyboard focus. It
does not assert cross-platform popup-menu behavior. No component defect was
hidden by substituting a custom select.

T2.4 review found `text-badge` had both color and size meaning; Badge now uses
explicit color, length and weight utilities. Browser regression checks prove
neutral color `rgb(87,105,115)` and success color/background, **9px/650**.
Action checks prove **11px/600**, accent color, 5px radius and 32px minimum
height, so the compiled `text-action` consumer is also verified.

## Task and acceptance trace

| Task / files | Verified behavior and evidence | Trace |
| --- | --- | --- |
| T2.1 — `src/styles/tokens.css`, globals/layout, local fonts, Storybook staticDirs, [token map](../token-map.md) | Exact observed palettes/radii/spacing/shell dimensions; shared licensed fonts; real Inter 650 rendering; documented focus/readability extensions | FR1/FR17, TR1/TR10; partial AC1/AC17 |
| T2.2 — Button/IconButton/Link and action stories | Native semantics, safe default button type, explicit submission, callbacks, names, disabled/loading suppression, keyboard tab/Enter/Space and native link destination | A1; FR1/FR17, TR2/TR10; partial AC1/AC17 |
| T2.3 — Input/Select/Textarea/Checkbox and control stories | Label/description IDs, refs, validation, editable values/whitespace, disabled retention, native select and checkbox keyboard/label interaction | A2; FR1/FR17, TR2/TR10; partial AC1/AC17 |
| T2.4 — Badge/Spinner/Surface and status stories | Tones confer no authority; one named loading status, quiet decorative spinner; reduced-motion ring stops; semantic section/heading composition | A3; FR1/FR16/FR17, TR2/TR10; partial AC1/AC17 |
| T2.5 — BrandMark/Icon and brand stories | Source CSS tile and 15 exact SVG geometries, decorative/meaningful distinction, nonfocusable SVG; no refresh/unknown PNG substitution | A1/S1/V1; FR1, TR10; partial AC1 |
| T2.6 — `tests/components/atoms.test.tsx`, `tests/visual/atoms.spec.ts` | 9 RTL cases, 5 actual Chromium atomic checks, source-reference comparison, 14 captures and viewport boundaries | FR1/FR17, TR2/TR10; atomic portions AC1/AC17 |
| Supporting config — Playwright discovery and Vitest exclusion | Playwright discovers e2e/visual only; Vitest excludes both to preserve independent runners | FR19, TR1/TR2; partial AC19 |

The tests observe behavior rather than asserting implementation class strings.
Full AC1/AC17/AC19 remain cross-phase screen, usability and independent-feature
obligations. Atoms have no direct feature, transport or session imports.

## Visual comparison record

Reviewer: implementation worker; coordinator accepted T2.6 after code review,
direct action-narrow/badge-desktop capture review and the worker's complete
14-capture comparison report.
All 14 captured specimens below were opened with `view_image` and compared
to the inspected saved V1/V3/V4 sources at atom scope. These are Storybook
specimens, visibly labeled synthetic; no full-screen pixel threshold is
invented, and no whole-page fidelity or mobile-device certification is claimed.

| Inventory / story and state | 1440×1100 / 390×1100 evidence | Observed comparison / difference |
| --- | --- | --- |
| A1, V3 — `atoms-actions--vocabulary`, ready/disabled/loading | [desktop](../evidence/phase-2/actions-1440.png), [narrow](../evidence/phase-2/actions-390.png) | Teal primary/white secondary/ghost and density follow V3 controls. Generic specimen wraps; link underline and textual loading are explicit extensions. Close glyph uses accepted source Icon |
| A2, V3 — `atoms-controls--date-filters`, ready | [desktop](../evidence/phase-2/controls-1440.png), [narrow](../evidence/phase-2/controls-390.png) | White 32px bordered controls and 10px labels follow V3. Synthetic dates differ, browser date locale/indicator are native. This generic specimen keeps two fields side by side at 390; later feature/template must apply observed 480px filter stacking |
| A2, V4 — `atoms-controls--code-entry`, ready | [desktop](../evidence/phase-2/code-1440.png), [narrow](../evidence/phase-2/code-390.png) | Exact dark field, mono 11px/1.65 and code color; native resize handle is visible. Source editor's line gutter/toolbar/no-resize belong to the later editor organism, not this shared textarea |
| A3, S1/V3/V4 — `atoms-status-and-surfaces--tones`, all tones | [desktop](../evidence/phase-2/badges-1440.png), [narrow](../evidence/phase-2/badges-390.png) | Observed 4px corners, uppercase 9px/650 and neutral/info/success colors. Warning/error synthetic required states share source tone values; narrow specimen wraps |
| A3, V2/V3 — `atoms-status-and-surfaces--panel`, loading | [desktop](../evidence/phase-2/surface-1440.png), [narrow](../evidence/phase-2/surface-390.png) | White panel/shadow/8px radius/header follow source; generic slot content. Source overflow clipping is opt-in so focus rings remain visible (documented accessibility extension) |
| A1/S1/V1 — `atoms-brand--wordmark`, ready | [desktop](../evidence/phase-2/brand-1440.png), [narrow](../evidence/phase-2/brand-390.png) | Exact teal tile/three bars beside text on source navy. Generic specimen padding is not complete sidebar/header composition |
| A1/S1/V1–V4 — `atoms-brand--icons`, core vocabulary | [desktop](../evidence/phase-2/icons-1440.png), [narrow](../evidence/phase-2/icons-390.png) | 15 source symbols visibly retain stroke geometry/currentColor. Grid labels/arrangement are a test specimen, not product UI; no deferred refresh icon |

**Viewport checks actually run:** all four action/date/code/icon specimens
retain content without document horizontal overflow at **479/480/481,
759/760/761 and 999/1000/1001px**, each 1100px high. Reference captures use
1440×1100 and 390×1100 with reduced motion. This does not verify later drawer,
chart, table/editor organisms or template breakpoints.

**Font proof:** Inter normal 100–900 and JetBrains Mono normal 400/500 load
locally in actual Chromium. Computed panel heading weight 650; CDP identifies
custom `Inter Variable` with weight-650 PostScript suffix `wght28A0000`.
The local official distribution is documented in token-map.md; old prototype
screenshots' actual loaded font distribution remains unknown.

**D1/D5 limits:** solid teal 3px focus/2px offset is a documented extension,
verified by keyboard. Native compare checkbox replaces hidden source switch.
Reduced-motion spinner retains its accessible status. Observed compact type
(action/control 11px, labels 10px, badge 9px) remains; screenshots and keyboard
checks establish these specimens, not final user zoom/touch/readability
acceptance. Final Q4 browser/viewport agreement remains unresolved.
Consumer-specific target enlargement/contrast/zoom review remains
required; no blanket accessibility sign-off is asserted.

## Handoff

No product routes, API/session transport or live integration was introduced.
Fixtures remain isolated; synthetic labels stay visible. All live-contract,
page-assembly and release gates remain in force. T2.C accepts mapped
A1–A3 for their explicit downstream consumers after coordinator review;
unrelated feature readiness still follows exact task predecessors.

Review the diff, then run /implement for phase 3.

## Later fixture-preview update

Phase 3 changed the Storybook-only synthetic banner to stay fully visible above
the fixed desktop sidebar. Its integrated browser suite regenerated the Phase 2
PNG specimens with that fixture chrome; atomic component source acceptance
remains unchanged. See [Phase 3 evidence](phase-3.md) for the current integrated
source digest and browser result.
