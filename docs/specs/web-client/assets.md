# Asset provenance — T1.3

Inspected and retrieved **October 4, 2026**. This record identifies usable
published sources for FR1/TR10 and contributes to AC1; it does not approve
implemented visuals, editable Figma nodes or live behavior.

## Published source evidence

The user-supplied [published prototype](https://apply-less-42002887.figma.site/)
was retrieved again with `curl -fLsS`. Its HTML still points to the two assets
below. `shasum -a 256` of the fresh downloads matches the
[design inventory](design-inventory.md) and earlier inspection files.

| Source | SHA-256 | Inspected locator |
| --- | --- | --- |
| [Application bundle](https://apply-less-42002887.figma.site/assets/index-mB5q-oe1.js) | `c8b9aff70860b393e5ca16039caf833669a538af582d1dbd67fbefa2cf2cd3dc` | Original `src/App.tsx` markers; icon dictionary lines 69–84, icon wrapper 89, brand 110 |
| [Stylesheet](https://apply-less-42002887.figma.site/assets/index-DHmpQo6U.css) | `9f06167867059c843d368433807df06968acd9f286fb60eab5a26f394f39768c` | `.brand-mark`, `.icon`, typography declarations and leading Google Fonts import |

The original-source markers identify compiled provenance, not files in this
repository or Figma node IDs. Temporary retrievals are
`/private/tmp/outage-web-t13.html`, `.js`, `.css` and `-fonts.css`.
They are inspection material, not production dependencies.

## Brand and inline icons

The visible **BrandMark** is a CSS tile containing three empty spans, not a
raster logo. The tile is 25×25px, accent `#087d82`, radius 6px, padding 5px,
gap 2px and bottom-aligned flex. Each white bar is 3px wide with top corners
rounded 2px; heights are 6/11/15px, opacity `.65`/`.82`/`1`. It appears in V1
and S1. The adjacent wordmark is text, not an image.

The bundle explicitly defines these SVG symbols. No external icon library,
author attribution or third-party license is identified in those definitions;
do not label them Lucide or replace them with lookalikes. The usable source is
the supplied published bundle. Implementation can transcribe the individual
geometry into domain-free icons without importing the prototype application.

All symbols share `viewBox="0 0 24 24"`, no fill, `currentColor` stroke,
stroke width 1.8 and round caps/joins. Default size is 18px; buttons usually
use 16px, browser chevrons 14px and table symbols 15px. Decorative icons are
`aria-hidden`; their controls still need semantic text/accessible names.

| Bundle symbol / source line | Geometry or source locator | Observed consumer |
| --- | --- | --- |
| `overview` / 69 | Four outlined dashboard regions; path starts `M4 13h6V4H4` | S1 Overview navigation |
| `datasets` / 70 | Ellipse `(12,5)`, radii `(8,3)`; two stacked cylinder paths | S1 Explorer navigation |
| `sql` / 71 | Path `m8 9-4 3 4 3M16 9l4 3-4 3M14 5l-4 14` | S1 SQL navigation; V3 SQL handoff |
| `calendar` / 72 | Calendar outline, binding marks, horizontal header | V2 date-range leading icon; native date-input indicators are browser chrome |
| `info` / 73 | Circle `(12,12)`, radius 9; information stem/dot | V2 notices/trend; V3 schema notice; V4 ready status |
| `chevron` / 74 | Path `m9 18 6-6-6-6` | V2 Explore dataset; V4 expansion controls |
| `play` / 75 | Path `m9 7 8 5-8 5V7Z` | V4 Run |
| `copy` / 76 | Rounded 11×11 square at `(8,8)` plus rear outline | V4 Copy |
| `refresh` / 77 | Two arrowheads and circular arcs | Compiled deferred Admin behavior; no core asset consumer authorized |
| `logout` / 78 | Path `M10 5H5v14h5M14 8l4 4-4 4M8 12h10` | S1 logout |
| `menu` / 79 | Path `M4 7h16M4 12h16M4 17h16` | S1 narrow drawer trigger |
| `close` / 80 | Path `m6 6 12 12M18 6 6 18` | S1 narrow drawer close |
| `check` / 81 | Path `m5 12 4 4L19 6` | V4 success |
| `warning` / 82 | Triangle plus warning stem/dot | Compiled V1/V4 error/status variants; absent from saved happy-path captures |
| `search` / 83 | Circle `(11,11)`, radius 7; handle `m16 16 4 4` | V4 schema search |
| `table` / 84 | Rounded 18×16 rectangle at `(3,4)`; dividers `M3 10h18M9 4v16` | V3 catalog; V4 schema browser |

Status dots, loading spinner and the compare switch are CSS primitives.
V4 column insertion uses the text `+`. V2 chart is plotted SVG data geometry,
not a logo/illustration to export. Figma's bottom publication/remix banner and
its icons are hosting chrome and excluded from product assets.

## Fonts

The stylesheet requests **Inter** normal weights 400/500/600/650/700 for body
UI and **JetBrains Mono** normal 400/500 for code/editor, through
[its Google Fonts request](https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;650;700&family=JetBrains+Mono:wght@400;500&display=swap).
Fallbacks are `system-ui,sans-serif` and `monospace`; `font-synthesis:none`
appears in the prototype. A successful CSS fetch alone does not establish
which fonts rendered in the earlier screenshots.

Both families have official SIL Open Font License 1.1 sources:

| Family | Authoritative source and license | Implementation treatment |
| --- | --- | --- |
| Inter | [Inter repository](https://github.com/rsms/inter), [license](https://github.com/rsms/inter/blob/master/LICENSE.txt) | Use an official compatible font distribution; retain its copyright and license if redistributing font binaries |
| JetBrains Mono | [JetBrains repository](https://github.com/JetBrains/JetBrainsMono), [license](https://github.com/JetBrains/JetBrainsMono/blob/master/OFL.txt) | Use official font distribution; retain copyright and license with redistributed binaries |

The inspected licenses permit embedding/redistribution under their conditions;
font files keep the OFL. An official variable Inter distribution is a candidate
for the evidenced 650 weight; the runtime font acquisition/hosting choice and
exact binary version are still to be recorded by the implementation owner.

The re-fetched Google CSS response using curl's default user agent has SHA-256
`e5f52c9183fe8c2563b05f0db1d2adfd7579da3918dfa530a6bb2cb89f3aae44`.
It returns Inter TTF URLs under `fonts.gstatic.com/s/inter/v20/` for
400/500/600/700 and JetBrains Mono under `/s/jetbrainsmono/v24/` for 400/500.
It omits a distinct 650 declaration. This response is user-agent dependent;
it is not proof that a browser loaded the intended 650 face. Do not silently
claim exact typography from fallback/nearest-weight rendering.

## Evidence mapping and scoped gates

All ten repository captures were opened with `view_image` in this task.

| Inventory IDs | Inspected references | Asset treatment |
| --- | --- | --- |
| V1, A1–A3 | [Sign in](evidence/sign-in-desktop.png) | CSS brand, Inter text, input/button/surface primitives; C1 changes credentials flow |
| V2, A1–A3 | [Overview desktop](evidence/overview-desktop.png), [narrow](evidence/overview-mobile.png) | Inline calendar/info/chevron, Inter, CSS compare/status primitives; chart stays data-driven |
| V3, A1–A3 | [Preview](evidence/datasets-preview-desktop.png), [Schema](evidence/datasets-schema-desktop.png), [narrow](evidence/datasets-mobile.png) | Table/SQL/info vectors, Inter and monospace schema labels |
| V4, A1–A3 | [Ready](evidence/sql-ready-desktop.png), [Results](evidence/sql-results-desktop.png), [narrow](evidence/sql-mobile.png) | Search/table/chevron/copy/play/check/info vectors, Inter and JetBrains Mono |
| S1, A1/A3 | Desktop V2–V4 and [drawer](evidence/navigation-mobile.png) | Same CSS brand/navigation/logout/menu/close vectors; backend identity replaces persona demo |
| C1–C11 | [Deviation ledger](design-deviations.md) | Required behavior corrections and proposed accessibility extensions remain explicit |

| Gate | Affected work | Current disposition |
| --- | --- | --- |
| Visible logo/icon source | A1 BrandMark/Icon and consumers | Source identified and retrievable; no missing PNG/export required for observed CSS/vector geometry |
| Runtime font selection | Typography checks for A1–A3, V1–V4/S1 | Licensed source identified; pin actual distribution/binaries and prove loaded fonts/650 before typography sign-off |
| Four unread Make PNGs | Only a future consumer shown to require one | Unread, purpose unknown, **unassigned**; no invented logo/chart/background role; not a blanket UI blocker |
| Editable Figma exports/node mapping | Only claims requiring editable nodes | Still unavailable; published evidence is the accepted inspection basis, not editable-node fidelity |
| Q4 browser matrix | Final responsive/browser acceptance | Pending; does not block semantic components or reference-width comparisons |

## Checks actually performed

- Fresh `curl -fLsS` retrieval of published HTML, JS, CSS and requested font CSS;
  all succeeded. `shasum -a 256` verified unchanged JS/CSS source.
- Read icon dictionary, brand DOM/CSS and font import; visually opened all ten
  saved 1440×1100/390×1100 references. No new screenshot or live interaction
  was produced during T1.3.
- Opened both official font repositories and their license files through web
  tooling on the retrieval date.
- No runtime assets/fonts were installed or implemented. No build, visual
  parity, keyboard, browser-font-load or backend integration check is claimed.

Task evidence is ready for coordinator review. Acceptance and task-checkbox
updates belong to the coordinator.
