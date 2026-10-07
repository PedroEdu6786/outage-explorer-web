# Design evidence and component inventory

> Inspected October 4, 2026. Published prototype evidence; no editable Figma node mappings or live backend verification claimed.

## Provenance and limits

- Authoring reference: [Figma Make](https://www.figma.com/make/9k3dy9IWG5UavJ0VgaZJ1G/Outage-Explorer-Prototype).
- User-supplied inspection target: [published prototype](https://apply-less-42002887.figma.site/).
- The Make connector returned source/image links, but resource reads failed with `Unknown resource`. The screenshot tool does not support Make files.
- Fallback succeeded: retrieved the published HTML, application JavaScript and CSS, then inspected the running prototype in an isolated headless Chrome instance. Rendered desktop references use 1440 × 1100; narrow references use 390 × 1100. These are CSS viewport captures, not full-page images or mobile-device certification.
- Published bundle: `assets/index-mB5q-oe1.js`, SHA-256 `c8b9aff70860b393e5ca16039caf833669a538af582d1dbd67fbefa2cf2cd3dc`.
- Published stylesheet: `assets/index-DHmpQo6U.css`, SHA-256 `9f06167867059c843d368433807df06968acd9f286fb60eab5a26f394f39768c`.
- Compiled source contains references to its original `src/App.tsx` line numbers. These aid provenance but are not local source files or Figma node IDs. Do not copy its monolithic application structure, demo auth or mock SQL engine.
- The four PNG resource links from Make remain unread and their purpose unknown. Visible branding/icons are vector/CSS content in the published prototype; no role is assigned to those PNGs. Asset/font licensing and authoritative export remain a foundation check. Screenshots are reference evidence, never implementation assets.
- Figma's publication/remix banner is hosting chrome, not a product component.

## Screen inventory

| ID | Observed view and reference | Repeated composition | Production correction |
| --- | --- | --- | --- |
| V1 | [Sign in](evidence/sign-in-desktop.png), original source lines 131–140 | Centered branded card, heading, field labels, primary button, error message | Keep branding/layout; replace local username/password collection with Cognito managed-login entry and callback/expiry states |
| V2 | [Overview](evidence/overview-desktop.png), lines 254–272 | Shared shell/header; date range; sample-data notice; three metric cards; trend panel with compare toggle; daily observations table; Explore dataset action | Both percentages use accepted precision; missing days stay gaps; data/coverage come from backend; chart gets accessible equivalent |
| V3 | [Dataset Explorer preview](evidence/datasets-preview-desktop.png) and [schema tab](evidence/datasets-schema-desktop.png), lines 300–322 | Selectable dataset list, header/coverage/grain badge, Preview/Schema tabs, date/facility filters, table, pagination, Open in SQL action | Server-authorized catalog/schema; opaque cursor lifecycle; no invented totals; facility/generator identifiers preserved |
| V4 | [SQL Workspace ready](evidence/sql-ready-desktop.png) and [results](evidence/sql-results-desktop.png), lines 381–403 | Searchable expandable schema browser; dark editor/line numbers; Copy/Run toolbar; status region; results panel/table | One explicit execution; arbitrary typed columns/rows; fixed-size numbered retained-result pages; honest errors/truncation/expiry |
| S1 | Shared shell on V2–V4; [mobile drawer](evidence/navigation-mobile.png), lines 156–182 | Brand, three navigation items, data-coverage status, user identity/role and logout; topbar/title/sample badge | Remove persona selector from production; pending session state; backend identity/capabilities; focus-managed drawer |

There are four product views, not separate pages for every tab/dataset. Production paths are proposed in the plan. All prototype navigation currently uses local component state at the same URL.

## Atomic component mapping

Names below are implementation proposals mapped to observed responsibilities, not original component names.

| Level / IDs | Proposed components | Evidence / reuse | Owner boundary |
| --- | --- | --- | --- |
| Atoms A1 | Text/Heading, Button/IconButton, Link, Icon, BrandMark | All views; primary/secondary/ghost buttons, inline vectors and headings | Shared UI; semantic props only |
| Atoms A2 | Label, Input, Select, Textarea, Checkbox/Switch | V1 fields; V2 date range/compare; V3 filters; V4 search/editor | Shared UI; no dataset/session rules |
| Atoms A3 | Badge, Spinner, Separator, Surface | Grain/role/sample/read-only/status badges; loading buttons; panels | Shared UI; visual tone, not role authority |
| Molecules M1 | FormField, DateRangeField, SearchField | V1/V2/V3/V4 repeated labeled input composition | Value/error/change props; caller owns validation policy |
| Molecules M2 | StatusMessage, EmptyState, MetricValue, PanelHeader, PaginationControls | Notices, metric cards, empty/SQL statuses, preview controls | Generic display/action slots; no query IDs or permission checks |
| Molecules M3 | Tabs, NavigationItem, UserSummary | V3 Preview/Schema; shared sidebar | Keyboard/selection semantics; authorized options supplied |
| Shared organisms O1 | DataTable, AppNavigation, AppHeader | Tables across V2/V3/V4; shell across V2–V4 | Positional typed view data and callbacks; no transport imports |
| Feature organisms O2 | NationalMetricCards, NationalTrend, DailyObservations | V2 | Overview owns metric meaning, dates and series state |
| Feature organisms O3 | DatasetCatalog, DatasetHeader, DatasetSchema, PreviewFilters, DatasetPreview | V3 | Explorer feature owns catalog/selection/cursor lifecycle |
| Feature organisms O4 | SchemaBrowser, SqlEditorPanel, QueryStatus, QueryResults | V4 | Queries feature owns draft/submission/result lifecycle |
| Feature organisms O5 | SignInPanel, SessionBoundary | V1 and protected pending/expiry extensions | Auth feature owns session lifecycle through an adapter |
| Templates T1 | AuthTemplate, AppShell, OverviewTemplate, ExplorerTemplate, WorkspaceTemplate | V1 centered card; S1 shell; V2 stacked panels; V3/V4 master-detail | Slot composition only; no data fetching or workflows |
| Pages P1 | Sign in, Overview, Dataset Explorer, SQL Workspace | V1–V4 | Final thin route composition after feature checkpoints |

Not every listed atom needs a separate wrapper. Use semantic HTML directly when no reusable contract is gained. Only build variants evidenced here or necessary for required accessibility/error states.

## Observed token baseline

Values below come from the published stylesheet, not invented design-system choices.

| Purpose | Observed value |
| --- | --- |
| Background / surface / muted surface / active surface | `#f5f7f8` / `#ffffff` / `#f8fafb` / `#eef7f7` |
| Border / strong border | `#dce3e7` / `#c8d2d8` |
| Primary / secondary / faint text | `#16252d` / `#5f707a` / `#81919a` |
| Accent / dark / light | `#087d82` / `#05666a` / `#dff2f2` |
| Blue / success / warning / error | `#246b9e` / `#24774f` / `#98671b` / `#ad3d3d` |
| Success / warning / error backgrounds | `#e8f5ee` / `#fff7df` / `#fff0ef` |
| Sidebar / editor / editor toolbar | `#12272f` / `#172830` / `#1d333d` |
| Body / editor families | Inter with system sans fallback / JetBrains Mono with monospace fallback |
| Desktop heading | 25px, weight 650, line height 1.25, letter spacing −0.025em |
| Typical button / panel radii | 5px / 8px |
| Panel shadow | `0 1px 2px #12262e0d, 0 1px 5px #12262e06` |
| Desktop sidebar / topbar | 232px wide / 50px high |
| Button baseline | Minimum height 32px; padding 7px 11px; gap 6px; text 11px weight 600 |

Many prototype metadata labels are 8–11px. Treat readable text, focus and touch targets as accessibility review items; record any necessary increase instead of silently claiming exact visual parity. Extract remaining spacing/type variants during foundation work, with reuse evidence, rather than inventing a large scale.

## Responsive evidence

- CSS breakpoints: at/below 1000px sidebar becomes a sliding drawer; at/below 760px metrics and master-detail grids stack; at/below 480px filters and pagination stack and minor editor text is hidden.
- Captures: [Overview narrow](evidence/overview-mobile.png), [Explorer narrow](evidence/datasets-mobile.png), [SQL narrow](evidence/sql-mobile.png), [drawer open](evidence/navigation-mobile.png).
- The narrow chart is visibly dense. Preserve missing-data semantics and provide the complete accessible table; improve legibility with an explicitly recorded extension.
- Plan boundary checks around 1000/760/480px, keyboard drawer operation and table/editor overflow. Browser compatibility and zoom/focus testing remain implementation verification, not inspection claims.

## Required behavior corrections and extensions

| ID | Prototype evidence | Required production treatment | Trace |
| --- | --- | --- | --- |
| C1 | Local demo password check; starts signed in; persona dropdown | Cognito managed login, backend-authoritative capabilities, unresolved-session state; persona controls only in isolated fixtures | FR2–FR6, TR6 |
| C2 | Fixed 2018–2025 coverage, sample counts and named SQL tables | Agreed catalog/coverage/identifiers; all synthetic examples labeled; no sample data in live UI | FR7, FR18, TR7 |
| C3 | Preview flips hardcoded slices, displays total 14 | Opaque snapshot-bound cursor, correct reset/expiry; previous only if safely cached or supported; totals only if contract provides them | FR8–FR9, TR4 |
| C4 | SQL timer/string matching; result is a fixed national table; no query ID pages | Real isolated backend execution through adapter, arbitrary positional rows, numbered same-execution pagination and deliberate recovery | FR12–FR16, TR5 |
| C5 | SQL timeout text says 30 seconds | Accepted 10-second backend execution deadline, without claiming end-to-end latency; contract-driven message | FR16, TR5 |
| C6 | Percentages use JavaScript formatting and differing decimal places | Backend exact/display values or agreed decimal handling; both percentages two decimals, half-up; no mismatch flags | FR10–FR11 |
| C7 | Schema search field and date controls have incomplete demo behavior; Ctrl+Enter is shown as a hint | Implement scoped search/filter/keyboard interactions deliberately; an explicit shortcut must still submit only once | FR7–FR8, FR12, FR17 |
| C8 | Admin-only refresh panel exists in compiled source; “Reload new data” action | Excluded from current core tasks; separate scope decision required; deferred status card remains deferred | Scope |
| C9 | Data-available-through sidebar card | Read-only coverage metadata is in scope; it is not the deferred new-data notification/refresh action | FR7 |
| C10 | Missing busy, expired-preview/query, session-expiry, arbitrary SQL columns and full loading/access-loss states | Add designed extensions using shared states; verify with explicit fixtures and later real integration | FR3–FR6, FR9, FR14–FR18 |
| C11 | Static vector logo/icons and unknown Make PNG files | Preserve the actual visible assets with provenance; obtain usable source/export before asset implementation; never substitute unknown PNGs | FR1, TR10 |

## Inspection is not acceptance

The captures establish visual planning evidence. They do not verify backend security, accessible keyboard behavior, true query execution, exact decimal calculations or a finished implementation. Feature/visual/live verification must be recorded separately against the specification.

## Authorized Overview refresh extension — October 5

The user requests an Admin-only refresh button on Overview. The V2 desktop
reference was inspected again; its date controls and heading remain intact.
Refresh uses existing secondary/ghost button variants beneath the heading and
shared status messages for admission/publication outcomes. This is a requested
extension to the inspected prototype, not an existing Figma control or a new-data
status card. No new visual-fidelity acceptance is claimed.


## October 7 Facilities ID extension

The supplied `evidence/datasets-preview-desktop.png` reference was inspected
again for this change. Its filter strip is extended with an optional Facility ID
text input on Facilities, reusing `FormField`/`Input` and the existing wrap/stack
layout. No facility selector or discovery endpoint is evidenced. The input is a
user-requested behavioral extension, not an observed prototype control. Browser
layout checks pass; final visual comparison and human sign-off remain open.


The subsequent October 7 request extends this same input to Generators. It reuses
the Facilities filter strip without a new visual pattern or generator-ID filter.

## October 7 Overview chart zoom extension

The supplied Overview desktop/mobile captures informed a wrapping control row
above the existing SVG, using Checkbox/Button atoms and existing panel tokens.
Zoom mode, + / −, Reset and the visible date caption are accepted extensions;
the prototype does not supply these states. Comparison stays in the header;
chart controls stay outside horizontal overflow. Empty-window text overlays the
plot without taking input or moving the SVG underneath the pointer.

Agent inspection and automated 1440px/390px specimens found contained controls,
legible wrapping and visible focus; actual-page captures include long and zoomed
two-year ranges. See the [input/visual record](../../../specs/overview-chart-zoom/verification/visual-input.md).
This is implementation-review evidence, not Figma fidelity or human sign-off.
