# Page design and fixture evidence

Recorded October 4, 2026; T6.2–T6.6. Reviewer: implementation worker.
Source/build/check binding is in [Phase 6](phase-6.md). Saved references from
[design inventory](../design-inventory.md) were inspected directly before page
visual decisions. No editable Figma node or new connector resource was claimed.
These comparisons reuse previously accepted atoms/templates/features; no new
visual replacement was designed. Q4 final browser/viewport sign-off remains open.

## Mapped captures

| Inventory and actual test-root story | Desktop 1440 × 1100 viewport | Narrow 390 × 1100 viewport | Comparison |
| --- | --- | --- | --- |
| V1/O5/T1/P1, pages-sign-in--signed-out | [Sign in](../evidence/phase-6/sign-in-1440.png) | [Sign in narrow](../evidence/phase-6/sign-in-390.png) | Source centered branded card, color, typography and primary CTA retained; credential fields removed under C1 |
| V2/O2/T1/P1, pages-overview--ready | [Overview](../evidence/phase-6/overview-1440.png) | [Overview narrow](../evidence/phase-6/overview-390.png) | Source heading/date/cards/trend/table order and narrow stacking retained; gap/zero/unavailable fixture observations replace prototype counts |
| V3/O3/T1/P1, pages-explorer--viewer | [Preview](../evidence/phase-6/explorer-1440.png), [Schema](../evidence/phase-6/explorer-schema-1440.png) | [Preview narrow](../evidence/phase-6/explorer-390.png), [Schema narrow](../evidence/phase-6/explorer-schema-390.png) | Source catalog/master-detail, tabs, filters, table and unsent SQL action retained; national-only Viewer catalog is deliberate |
| V4/O4/T1/P1, pages-query--ready | [Ready](../evidence/phase-6/query-1440.png), [Results](../evidence/phase-6/query-results-1440.png) | [Ready narrow](../evidence/phase-6/query-390.png), [Results narrow](../evidence/phase-6/query-results-390.png) | Source browser/dark editor/status/result hierarchy and stacking retained; editor starts empty and results remain arbitrary positional columns |
| S1/O1/T1, pages-overview--ready | Sidebar included in analytical desktop captures | [Drawer](../evidence/phase-6/navigation-390.png) | 232px sidebar, 50px topbar, brand/icons and active destination retained; modal focus behavior proved by navigation scenario |

All 13 implementation captures were viewed directly, including schema/results/drawer,
and compared with the source desktop V1/V2/V3/V4 and narrow V2/V3/V4/S1 references.
Source Sign-in has no inspected narrow reference; its narrow composition is a
recorded template/accessibility extension. Source references are fixed viewport
captures; implementation images are full-page captures from the same CSS viewport
and can be taller. No pixel-threshold pass or release-level fidelity claim.

Fixture controls are hidden for captures only; the global Storybook synthetic
notice remains visible. It adds a 27px document-flow strip above page headers,
so the source topbar starts at y0 and specimen topbar at y27. This is test chrome,
not a production spacing decision. Sidebar remains fixed at x0, width232. Fonts
are local licensed assets and captures await document.fonts.ready. Clock is fixed
at 2026-10-04T12:00:00Z with reduced motion and animation-disabled screenshots.

## Width, keyboard and behavior evidence

The actual Chromium matrix checks all four pages at 1440,390,479,480,481,
759,760,761,999,1000,1001px, height1100. Desktop navigation appears above1000;
its mobile trigger remains visible at/below1000. Master-detail/metrics and
filter/pagination controls inherit accepted inclusive760/480 boundaries. Page
headings, editor/tabs and table equivalents remain usable without outer-document
horizontal overflow. Wide tables and the 920px chart retain named keyboard-focusable
scroll regions, preserving meaningful columns and complete dates.

Nine page browser scenarios verify managed-login intent plus expired/pending/error,
exact metric inspection/compare and date handoff, Viewer metadata, tabs, cursor
expiry/restart, edited SQL consent through route remounts, unchanged Run submission,
fixed execution pages, busy/lost recovery, drawer keyboard/focus, logout and access
reduction. Four additional existing composed-harness scenarios revalidate stale
success/denial and handoff cleanup after the public Queries lifecycle change.

## Deviations separate from backend evidence

- C1: managed-login CTA replaces local credentials; no production persona selector
  or inferred role badge. Actual backend display name/capabilities govern navigation.
- C2/C9: synthetic authorized catalog/date/value differences are explicit. Sidebar
  coverage is omitted because the current session seam provides no coverage; no
  fixed prototype date/update metadata is fabricated. Coverage remains in dataset
  metadata and Overview, returned through their authorized operations.
- C3: preview size/cursor/snapshot summary replaces prototype fixed totals. A new
  rows-per-page field is intentional, with explicit restart after cursor expiry.
- C4/C6: SQL starts empty until typed/handoff text; positional duplicate columns/rows,
  fixed retained pages and exact supplied half-up values replace prototype demos.
- C7/C10: accessible native compare checkbox and exact observation selector replace
  pointer-only presentation. The narrow chart scrolls at920px instead of shrinking
  tiny labels; this inherited approved extension increases panel height. Missing
  latest observation correctly displays unavailable cards, never a fake zero.
- C10: query page-size field explains a new explicit execution; pending/unavailable
  UI and consent are inherited designed extensions. No canceled/replayed SQL implied.
- Existing readable label/focus/native-control extensions from Phases2–4 remain;
  final subjective visual sign-off is not implied by these mapped comparisons.

Production failure proof is separate: real Next root and all four route URLs
with unavailable operations, no interception, synthetic state or fabricated traffic.
It establishes unconfigured fail-closed behavior. It does not establish a connected
backend outage, real PKCE/callback/logout or real authorization; those await Q2/Q3
and T6.L/T5.L before Phase7 live checks.
