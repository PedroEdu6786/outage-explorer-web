# Observed token map — T2.1

Implemented October 4, 2026. Trace: **FR1, FR17, TR1, TR10**, partial
**AC1/AC17**. Source is the published stylesheet
[`index-DHmpQo6U.css`](https://apply-less-42002887.figma.site/assets/index-DHmpQo6U.css),
SHA-256 `9f06167867059c843d368433807df06968acd9f286fb60eab5a26f394f39768c`.
The [inventory](design-inventory.md), [asset ledger](assets.md) and
[deviations](design-deviations.md) remain the design references. Before editing,
the worker visually inspected V1 sign-in, V3 preview desktop/narrow and V4 ready
desktop saved captures. No editable-node fidelity is claimed.

`src/styles/tokens.css` supplies shared font faces, Tailwind `@theme` utilities
and a small set of CSS dimensions. `src/app/globals.css` imports it once after
Tailwind and applies semantic typography, background and focus. Storybook uses
that same stylesheet; its `staticDirs` serves `public` exactly as Next does.
Root layout documents this choice; no client font loader or external font
request is needed. No product page is assembled by this task.

| Token group / exact values | Evidence selector | Consumer mapping |
| --- | --- | --- |
| Background `#f5f7f8`; surface `#fff`; muted `#f8fafb`; active `#eef7f7` | `:root`, `.panel`, `.dataset-item.active` | Global canvas; A3 Surface; V2–V4 panels/catalog |
| Border `#dce3e7`, strong `#c8d2d8`; text `#16252d`, muted `#5f707a`, faint `#81919a` | `:root`, `.field`, `.button.secondary` | A1 actions, A2 controls, A3 surfaces; metadata uses faint only after contrast review |
| Accent `#087d82`, dark `#05666a`, light `#dff2f2` | `:root`, `.button.primary`, `.brand-mark` | A1 primary action/BrandMark; selected tabs/catalog; focus extension |
| Info `#246b9e/#eaf3f9`; success `#24774f/#e8f5ee`; warning `#98671b/#fff7df`; error `#ad3d3d/#fff0ef` | `:root`, `.badge.blue/green/amber/red` | A3 visual Badge tones; no permission meaning |
| Neutral badge `#576973/#eef2f4` | `.badge` | A3 neutral Badge |
| Sidebar `#12272f`; editor `#172830`; toolbar `#1d333d` | `.sidebar`, `.editor-panel`, `.editor-toolbar` | S1 shell, V4 editor; later consumers |
| Control radius 5px; badge 4px; brand 6px; panel 8px; auth 9px | `.button`, `.badge`, `.brand-mark`, `.panel`, `.login-card` | A1/A2/A3; S1/V1 |
| Panel shadow `0 1px 2px #12262e0d, 0 1px 5px #12262e06`; auth shadow `0 8px 30px #192f3814` | `.panel`, `.login-card` | A3 Surface and V1 template |
| Inter; page title 25px/650/1.25/−.025em, panel title 16px/650/1.3; narrow h1 21px | `:root`, `h1`, `h2`, 480px rule | Global headings, V1–V4; feature-specific heading sizes remain their own mapped styles |
| Action 11px/600; badge 9px/650; JetBrains Mono 400/500 | `.button`, `.badge`, `.editor`, `code,kbd` | A1 action, A3 badge, A2 code textarea; later readability review |
| Control height 32px; action padding 7px 11px/gap 6px; input padding 6px 8px; badge padding 3px 6px/gap 4px | `.button`, `.field input`, `.badge` | A1/A2/A3 defaults; no exhaustive spacing scale |
| Sidebar 232px, brand header 66px, topbar 50px; page max 1450px/padding 28px 32px; panel gap 16px | `.sidebar`, `.brand`, `.topbar`, `.page`, `.explorer-layout` | Later reusable S1/V2–V4 templates |
| Explorer catalog 275px, SQL browser 250px; compact browsers 220px | `.explorer-layout`, `.sql-layout`, 1000px rule | Later V3/V4 templates |

Responsive evidence uses CSS media queries at/below **1000, 760 and 480px**.
Only the global h1 480px rule is implemented here. Drawer/master-detail/filter
rules belong to later consumers; CSS custom properties cannot serve as media
query thresholds. Reference widths remain 1440×1100 and 390×1100.

## Explicit accessibility extensions

**D5 focus:** source outline was 3px translucent `#087d823b` with 2px offset.
The shared default uses 3px solid existing accent `#087d82` with the same offset
and covers all `:focus-visible` elements, including links. This is a documented
extension, pending actual consumer keyboard/dark-surface review in T2.6.

**D1 readable text/targets:** observed compact action/badge sizes are retained
as tokens, not asserted accessible. Consumers must inspect contrast, zoom,
wrapping and touch behavior and record targeted extensions. Faint text is
preserved as evidence, not blanket approval for small body labels. No general
type-scale redesign or minimum target enlargement is silently applied here.

## Local font provenance

Official releases retrieved with `curl -fLsS` October 4, 2026; binaries extracted
unchanged, and full original SIL OFL 1.1 notices redistributed beside them.

| Distribution and member | Local path / SHA-256 |
| --- | --- |
| [Inter v4.1 official release](https://github.com/rsms/inter/releases/tag/v4.1), `web/InterVariable.woff2` | `public/fonts/inter/InterVariable.woff2` — `693b77d4f32ee9b8bfc995589b5fad5e99adf2832738661f5402f9978429a8e3` |
| Inter release `LICENSE.txt` | `public/fonts/inter/LICENSE.txt` — `262481e844521b326f5ecd053e59b98c8b2da78c8ee1bdbb6e8174305e54935a` |
| [JetBrains Mono v2.304 official release](https://github.com/JetBrains/JetBrainsMono/releases/tag/v2.304), `fonts/webfonts/JetBrainsMono-Regular.woff2` | `public/fonts/jetbrains-mono/JetBrainsMono-Regular.woff2` — `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2` |
| Same distribution, `fonts/webfonts/JetBrainsMono-Medium.woff2` | `public/fonts/jetbrains-mono/JetBrainsMono-Medium.woff2` — `086c48dfbea9ddaff1320f7e09399b8e2924e88ce67453721255db3bdbb5a353` |
| JetBrains release `OFL.txt` | `public/fonts/jetbrains-mono/OFL.txt` — `30f0c136e3c88e422d0791acd97238870f9054a9729bc34cf2ff0d4ed8cac4ad` |

Archive hashes: Inter-4.1.zip
`9883fdd4a49d4fb66bd8177ba6625ef9a64aa45899767dde3d36aa425756b11e`;
JetBrainsMono-2.304.zip
`6f6376c6ed2960ea8a963cd7387ec9d76e3f629125bc33d1fdcd7eb7012f7bbf`.
Installed Next's bundled fontkit decoded Inter's `fvar`: **wght 100–900,
default 400; opsz 14–32, default 14**. The normal face declares 100–900;
650 is available without synthesis. No italics or unused full family added.
Google Fonts' prototype response and old screenshots do not establish the
exact distribution previously rendered; this choice establishes reproducible
local typography for new comparisons.

## Checks actually run

- Node **24.18.0**, npm **11.16.0** confirmed.
- `npm run typecheck` and `npm run lint`: exit 0.
- `npm run build-storybook`: exit 0; public fonts copied; existing nonfatal
  `use client`/chunk-size warnings, plus no production stories yet.
- `node tests/tooling/serve-storybook.mjs`: sandbox binding initially denied;
  approved escalation served port 6007.
- Temporary `/private/tmp/outage-t21-font-probe.cjs` with Playwright Chromium,
  `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`: sandbox browser
  initially denied; approved escalation passed, exit 0. The built tooling
  iframe received an ephemeral h1/mono specimen, not a product screen/story.
  All three local font requests returned 200; FontFaceSet reported Inter
  100–900 and mono 400/500 loaded. Computed h1 weight **650**, family Inter,
  synthesis **none**; `document.fonts.check('650 25px Inter')` true. CDP
  `CSS.getPlatformFontsForNode` confirmed custom **Inter Variable**, 16 rendered
  glyphs, PostScript `InterVariable_opsz190000_wght28A0000` (weight 650).

This is actual local font loading evidence, not product visual acceptance,
screen fidelity, live integration or full AC17. Next production font delivery
and atomic variant comparisons remain downstream integrated checks.
