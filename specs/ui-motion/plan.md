# Plan: Animations and micro-interactions
> Status: draft · Slug: ui-motion · Spec: ./spec.md

This plan designs the accepted scope only. It does not authorize implementation;
that starts when the user requests it, after revalidating the codebase (spec
"Open items"). The spec has no TRs: its **Principles** (Subtle, Data-honest,
Accessible, No new dependency, Behavior-neutral) are the technical constraints
and are cited by name. "Decisions confirmed" (skeletons, chart wipe scope,
conservative intensity, motion off in captures) are final and not re-litigated.

## Approach

Build motion as a thin CSS layer on the existing Tailwind v4 pipeline: tokens and
one reduced-motion rule in `tokens.css`, a small set of named animation/utility
primitives exposed through `@theme`/`@utility`, then adopt them component by
component from atoms outward. Reduced motion is implemented **at the token level**
(movement distances, press scale and movement-class durations collapse to
zero; movement/looping `--animate-*` shorthands become `none`), so components
never carry `motion-reduce:` variants and the "single global rule" is literal
(FR1, FR5). Loading treatments reuse state the controllers already retain
(Explorer pages, SQL results) and add exactly one guarded retention (Overview
series) so no protected data lingers after logout or access change (FR4,
Behavior-neutral, AC5). Replaced content gets **enter-only** transitions; exits
are animated only for chrome that holds no protected data (drawer), because an
exit animation would otherwise require retaining unmounted data (Data-honest,
Behavior-neutral).

## Components affected

Foundation (A)
- **Motion tokens + reduced-motion rule** (`src/styles/tokens.css`) — durations
  (`--duration-fast` 120ms, `--duration-base` 200ms, `--duration-enter` 260ms),
  `--ease-out`, movement tokens (rise distance 4px, press shift 1px, press scale
  .96, nudge 2px, drawer shift), `--stagger-step`, movement-class duration
  alias, and the single `@media (prefers-reduced-motion: reduce)` override.
  (A1; FR1, FR5; AC1, AC2)
- **Shared motion primitives** (new `src/styles/motion.css`, imported by
  `globals.css`; keyframes inside `@theme`) — `--animate-*` entries (fade-in,
  fade-rise, scale-in, settle, nudge, expand, chart-wipe, progress, dot-pulse,
  spinner; shimmer defined but unused) and `@utility` composites (a control
  transition set covering color/border/outline/opacity/translate/scale, and a
  staggered-entrance utility driven by an index custom property). (A2; FR1, FR3)
- **Deterministic-output harness** (A3; AC6, AC7) — Storybook preview global
  `motion` (default off) plus a test-only CSS constant under `tests/support`;
  `reducedMotion: "reduce"` in the real-route Playwright configs; a source-scan
  Vitest guard; a new Playwright motion/reduced-motion spec. Detailed under
  Interfaces. (FR5)

Atoms / molecules (domain-free)
- **Skeleton** (new atom) and **TableSkeleton** (new molecule) — static
  placeholder blocks/rows, always `aria-hidden`, geometry matched to real content;
  shimmer exists only as an unused, default-off option (E1). (A2, E1; FR4)
- **Button** — 120ms color transitions, 1px press-down, label fade between idle
  and loading, disabled-opacity fade; same DOM geometry. (B1; FR2)
- **IconButton, Link** — hover transitions; press scale on IconButton only (Link is
  inline; see Risks). (B2; FR2)
- **Input, Textarea, Select, SearchField, FormField, DateRangeField** — border
  and focus-ring ease-in at constant size, error-border transition, one-shot 2px
  nudge on becoming invalid, error text fade-in. (B3, B11; FR2)
- **Checkbox** — draw-in check on a still-native input (see Alternatives). (B4;
  FR2)
- **Badge** — tone color crossfade. (B5; FR3)
- **Spinner** — 150ms fade-in; rotation moves onto the `spinner` token so the
  global rule replaces its per-element `motion-reduce:` variant. (B6; FR3, FR5)
- **Tabs** — sliding active underline (position measured from the selected tab and
  written as custom properties; motion is CSS) and panel fade-rise on re-show;
  panels remain mounted. (B7; FR3)
- **StatusMessage** — mount fade/rise, keyed icon crossfade (spinner/check/
  warning), success border-tint settle, no shake. Live-region markup unchanged.
  (B8; FR3)
- **EmptyState** — staggered fade-in of icon, title, description. (B9; FR3)
- **PaginationControls** — inherits Button hover/press and current-page color
  crossfade; no own logic. (B10; FR2)
- **MetricValue** — optional `loading` renders a skeleton in the value slot, then
  fades the real value in; no counting. (B12; FR4, FR6)

Organisms / templates
- **AppNavigation / NavigationItem** — sliding active indicator (same measured
  technique as Tabs; item keeps text/hover styling), 2px hover nudge, drawer slide
  and backdrop fade via `@starting-style`/`allow-discrete`, coverage-dot single
  pulse and coverage-date one-shot pulse on change. Native `showModal`/`close`,
  focus trap, return-focus and `cancel` handling are not edited. (C1, C2, C4, D2
  coverage pulse; FR2, FR3; AC4)
- **AppHeader** — menu/close icon crossfade-rotate on `navigationOpen` (label
  unchanged), optional scroll shadow as CSS scroll-driven progressive
  enhancement. (C3; FR3)
- **DataTable** — row hover/focus background transition, optional `loading`
  (dim to ~60%, `aria-busy`, content retained by the caller), capped row stagger on
  mount (index custom property, ≤10 rows, 20ms step), `entrance` opt-out. (C5;
  FR3, FR4)
- **Templates** (Overview, Explorer, Workspace, Auth) — fade-rise slot entrances
  with 40–60ms stagger; AuthTemplate card scale-in from .98 and a title/description
  block keyed by the supplied title for state fades. Templates stay reusable and
  receive no feature knowledge. (C6, C7, D1; FR3)

Features (own workflow, retention and wiring)
- **Overview** (`useOverview`, `OverviewFeature`, `NationalMetricCards`,
  `NationalTrend`, `RefreshControl`) — metric skeleton cards on first load;
  guarded retained series dimmed (~50%) during range-change refetch; trend wipe on
  `svg`; compare-series fade-in; inspected-observation card enter; refresh status
  via StatusMessage settle. (B12, D2; FR3, FR4, FR6; AC3, AC5)
- **Explorer** (`DatasetCatalog`, `DatasetHeader`, `DatasetPreview`,
  `DatasetSchema`, `PreviewFilters`, `ExplorerFeature`) — row hover/selected
  accent, keyed header/preview/schema fade on dataset switch, skeleton rows for
  preview and schema loading, dim of the retained page during `next()`, subtle
  filter-change transition. (D3, C5; FR3, FR4)
- **Queries** (`SqlEditorPanel`, `SchemaBrowser`, `QueryStatus`, `QueryResults`) —
  state-bound indeterminate bar under the editor toolbar, B8 status transitions,
  results fade-in, chevron rotation and expand (collapse is instant), Copy
  icon swap for ~1.5s, dim of the retained result during paging. (D4; FR2, FR3,
  FR4)
- **Auth** (`SignInPanel`) — state fades come from AuthTemplate keying and B8; no
  workflow edits. (D1; FR3)

Verification assets
- **Tests and records** — new motion/reduced-motion Playwright spec, token/guard
  Vitest scans, updates to the two existing reduced-motion Spinner assertions,
  verification records and `docs/development/verification.md` entries. (AC1–AC7)

## Data model changes

_None_ to contracts, adapters, session or persisted state. One presentation-state
addition: `useOverview` exposes a derived, in-memory `retainedSeries` (previous
`NationalSeries`) used only for the dimmed loading view. Invariants: non-null only
while a refetch is loading; bound to the session generation it was fetched under;
requires `authenticated` + `canReadNationalSeries`; cleared by the existing
runtime cleanup, on any failure (including `forbidden`), when loading ends, and on
`reloadMetadata`. It never feeds `series`, `explore()` or navigation guards.
(D2; FR4; AC5, Behavior-neutral)

## Interfaces & contracts

Tokens and primitives (A1, A2)
- Tokens in `tokens.css`: `--duration-fast|base|enter`, `--ease-out`, movement
  tokens, `--stagger-step`, movement-class duration alias. Durations live in
  `:root`; `--ease-out` and `--animate-*`/keyframes in `@theme` (Tailwind has no
  duration theme namespace; consumers use the shorthand that reads a variable).
  Overriding `--ease-out` replaces Tailwind's default `ease-out` curve app-wide.
- Reduced-motion rule (one block): zeroes movement tokens and the movement-class
  duration alias, sets movement/looping `--animate-*` to `none` (wipe, progress,
  dot-pulse, spinner, shimmer, nudge, expand), and shortens (not removes) opacity/
  color durations. Unlayered, so it wins over the `@theme` layer.
- `@utility` composites and `--animate-*` names above are the only way components
  express motion. Ad-hoc `duration-*`, `ease-*`, `animate-[...]` literals are not
  allowed outside `src/styles` (enforced by AC1 scan).

New components
- `Skeleton`: presentational block; sizing/shape via `className`; optional
  `shimmer` (default false, never enabled by call sites); always `aria-hidden`.
- `TableSkeleton`: `rows`, `columns`, `className`; `aria-hidden`, no caption/table
  semantics; used where a `DataTable` will replace it.
- Shared sliding-indicator hook (domain-free, under `src/components`, importable
  by molecules and organisms): inputs a container ref and the active key; writes
  position/size custom properties; no-ops without `ResizeObserver` (jsdom);
  first placement is untransitioned; re-measures on resize and on container
  display toggles (hidden drawer).

Changed props (all optional, defaults preserve today's output)
- `MetricValue.loading?: boolean` — skeleton in the value slot; `value`/
  `missingText` semantics unchanged; loading never renders zero or "Unavailable".
- `DataTable.loading?: boolean`, `DataTable.entrance?: "stagger" | "none"` (default
  stagger). `TableData` and cell rendering untouched (FR6).
- `NationalMetricCards.loading?: boolean` (feature-internal).
- `useOverview` return gains `retainedSeries` (see Data model).
- No change to `Button`, `StatusMessage`, `Tabs`, `AppNavigation`,
  `AuthTemplate`, `SessionRuntime`, controllers or any operation signature.

A3 mechanism per environment
- **Storybook / main Playwright project (port 6007):** preview adds a global
  `motion` (toolbar toggle, default `off`). When off, a decorator injects one
  test-support stylesheet that sets animation/transition duration and delay to 0
  and iteration count to 1 on all elements; end states are applied immediately.
  Story URL `globals=motion:on` re-enables motion for the motion spec and the
  Spinner `0.8s` assertion. Existing `animations: "disabled"` screenshot options
  and `emulateMedia({ reducedMotion: "reduce" })` calls stay.
- **Real-route Playwright configs** (development, controlled, production, auth):
  `use.reducedMotion: "reduce"`; they assert behavior, not captures.
- **Vitest (jsdom):** no stylesheet is loaded, so CSS motion cannot run. Guard by
  construction: a source-scan test forbids `animationend`/`transitionend`/
  `getAnimations` dependencies and ad-hoc motion literals (AC1); the only JS timer
  added is the Copy revert, driven with fake timers.
- **Reduced-motion check (separate):** new `tests/motion` Playwright spec toggling
  `emulateMedia` between `reduce` and `no-preference` with motion on, asserting
  computed `translate`/`scale`/`animation-name`/`transition-duration` per catalog
  group, plus a screenshot-free chart-wipe check.

Behavior contracts that must not change (AC4, AC5)
- Drawer: `showModal`/`close`, `closeButton.focus()`, return-focus + RAF restore,
  `containFocus`, `onCancel` stay byte-equivalent in behavior; transitions are
  CSS-only and nothing awaits `transitionend`.
- Live regions: every existing `role="status"|"alert"`/`aria-live` element keeps
  its node, role and text. Skeletons and decorative icon swaps are `aria-hidden`.
  Retained/dimmed stale content is `inert` and `aria-hidden` so assistive tech
  does not read stale values while the banner announces loading.
- Remount keys: only presentational wrappers or already-keyed elements are
  keyed; no keyed element contains focusable controls whose focus could be lost.

## Implementation phases

Four phases follow the spec's sequence. Phase 1 starts with a baseline capture.
Each phase is one commit and must end with: `typecheck`, `lint`, `npm test`,
`test:boundaries`, `check:boundaries`, `build` then `check:production-fixtures`,
`build-storybook` + affected `test:e2e` (motion off), the reduced-motion browser
check (`tests/motion`, reduce vs no-preference), regenerated captures compared to
baseline (AC7), a `specs/ui-motion/verification/phase-N.md` record, and the
required devlog entry.

1. **Foundation and controls** — Baseline: run the full visual suite on the
   unmodified tree and record any pre-existing drift against committed PNGs.
   Then tokens/reduced rule/primitives (A1, A2), harness and guards (A3),
   Button, IconButton, Link, inputs, Checkbox, Badge, Tabs, and AppNavigation
   desktop indicator + hover (C1); migrate Spinner rotation to the token without
   changing rotation. Done when AC1/AC2/AC6 hold for these items and captures
   differ only where intended (Checkbox, Tabs, nav indicator).
   (A1–A3, B1–B5, B7, C1; FR1, FR2, FR5; AC1, AC2, AC6, AC7)
2. **Status and loading** — Skeleton/TableSkeleton, Spinner fade (B6),
   StatusMessage, EmptyState, PaginationControls, DateRangeField validation,
   MetricValue skeleton and Overview first-load skeleton cards, DataTable `loading`
   dim wired for Explorer paging and SQL paging, Explorer preview/schema skeleton
   rows. Done when loading never leaves a layout-breaking blank, banners still
   announce, and AC3/AC4 pass.
   (B6, B8–B12, C5 loading, D3 skeletons; FR3, FR4, FR6; AC2–AC5)
3. **Entrances and chart** — Drawer slide/backdrop (C2), header icon morph and
   optional scroll shadow (C3), coverage-dot pulse (C4), template entrances and
   DataTable row stagger (C6, C5), AuthTemplate and sign-in state fades (C7, D1),
   chart wipe and guarded Overview range-change dim (D2). Done when focus/return
   tests and AC5 logout/access-change scenarios pass with the retained series in
   place. (C2–C4, C6, C7, D1, D2 chart/range; FR3, FR4, FR5, FR6; AC2–AC5)
4. **Feature micro-interactions** — Remaining D2 (compare-series fade, inspected
   card enter, publication coverage pulse, refresh status settle), D3 (row hover/
   selected accent, dataset-switch fades, filter transition), D4 (progress bar,
   status transitions, results fade, schema-tree chevron/expand, Copy swap).
   E1 stays off. Close with the full regenerated capture set and a recorded
   decision list of intentional visual differences. (D2–D4, E1; FR2–FR6; AC1–AC7)

## Dependencies & integrations

- No new runtime or dev dependency (AC6). Tailwind 4.3.3 already ships the
  `starting` variant and `transition-discrete` (verified in the installed
  package); `@theme` keyframes and `@utility` are core v4.
- Browser support: `@starting-style`/`allow-discrete` (Chromium 117+, Safari 17.4+,
  Firefox 129+), `grid-template-rows` animation, `inert`, scroll-driven animation
  (progressive only). Unsupported browsers degrade to instant state changes.
- Existing Playwright/Storybook/Vitest harness and baseline evidence under
  `docs/specs/web-client/evidence/`; `scripts/check-boundaries.mjs` (shared UI must
  not import features/contracts; `.storybook` and `tests/` are isolated);
  fixture-isolation scan (`check-production-fixtures`).
- Documentation sync: `docs/development/verification.md` (motion global, motion
  spec command, capture policy), README pointer if needed.

## Risks & tradeoffs

- **Stale protected data via dimming/retention (AC5, Behavior-neutral)** — only
  Overview needs new retention. Mitigate with the guarded `retainedSeries`
  invariants, `inert`+`aria-hidden`, and a test matrix: logout, expiry,
  `invalidate("pending")`, generation change, capability loss, forbidden/failure
  mid-refetch, publication reload. Explorer/SQL dimming reuses controller state
  already cleared by `registerCleanup`; the feature early-returns when not
  authenticated.
- **Motion implying data (FR6, AC3)** — wipe clips the whole `svg` and never moves
  points; no tween/count; no animation on cells; skeletons never render zero or
  "Unavailable"; gaps remain unconnected. The wipe class sits on the persistent
  `svg`, so the compare toggle does not replay it (decision 2), while the
  newly mounted reported series only fades in.
- **Live-region and focus regressions (AC4)** — keyed wrappers only around
  decorative parts; drawer logic untouched; nothing waits on animation events;
  tests assert focus order, return-focus, and single announcement per status.
- **Existing assertions/evidence (AC4, AC7)** — Spinner Playwright assertions
  (`animation-name: none` under reduce, `0.8s` otherwise) must keep passing via the
  token migration and `motion:on`. DOM wrappers (Button label span with the same
  inline-flex gap, Tabs/nav indicator, Checkbox pseudo-element) are checked against
  `getByRole`/text assertions; re-grep tests for loading text before skeleton work.
  Intentional capture differences are expected for Checkbox, Tabs/nav indicator
  and skeleton-bearing pending states; each is recorded, not silently accepted.
- **Measured indicators vs "CSS only" (No new dependency)** — Tabs and nav need
  position knowledge; JS writes two custom properties, CSS performs all motion.
  Fallback if rejected: per-tab underline scale-in (no slide). jsdom lacks
  `ResizeObserver`; the hook feature-detects. Pre-measure state keeps today's
  static active styling so evidence is unchanged.
- **Drawer specifics (C2, AC4)** — `close()` stays synchronous; during exit the
  dialog renders already-updated content, so logout never shows stale identity.
  Crossing the 1000px breakpoint with the drawer closed must not flash a slide;
  transitions are disabled at desktop width. Fallback without `allow-discrete`
  support is an instant open/close.
- **Infinite loops (Subtle)** — D4's indeterminate bar loops while `busy` and
  unmounts on completion (same class as the spinner); `none` under reduced motion
  (static bar). Shimmer (E1) would be a true loop; it stays unused until an
  explicit decision that also revises the Principle.
- **Entrances vs availability (FR3, Accessible)** — content is in the DOM and
  operable immediately; visual delay is capped (stagger index ≤4 at 50ms plus
  260ms enter). Display toggles (hidden tab panels) restart descendant animations;
  DataTable stagger is therefore opt-out and Tabs panels avoid double motion.
- **Geometry drift (static visuals unchanged)** — selected-dataset accent animates
  border width (layout-affecting), so it uses the movement-class duration alias and
  is instant under reduced motion; skeleton sizes are matched to real content to
  avoid layout shift when data lands.
- **Test determinism** — Storybook default `motion:off` means designers must toggle
  motion on; documented. Screenshots keep `animations: "disabled"`. In-flight
  transitions can race `toHaveCSS`; the motion spec asserts computed target values
  with retrying matchers, never timing.
- **Performance** — clip-path on a 920px svg, `grid-template-rows` and row stagger
  are bounded (≤10 rows, one wipe per mount). No scroll or layout polling beyond
  one `ResizeObserver` per indicator.
- **Boundary/fixture checks** — Skeleton (atom), TableSkeleton (molecule) and the
  indicator hook import no upward layer; test-only CSS/constants stay in `tests/`
  and `.storybook`, outside emitted output.
- **Collapse limitation (D4)** — schema-tree collapse is instant (chevron rotates);
  animating it would retain unmounted protected schema. Documented deviation.
- **Coverage pulse (C4, D2)** — composition does not currently pass `coverage` to
  `AppNavigation`; the pulse is implemented and verified in the organism/stories and
  activates when production supplies coverage. No composition change planned.

### Alternatives considered

- **Per-component `motion-reduce:` variants** — rejected: contradicts the single
  global rule (FR1) and scatters reduced-motion policy.
- **Blunt `*{animation/transition-duration:0}` reduced rule** — rejected: removes
  the opacity/color changes FR5 says may remain and breaks the Spinner static-ring
  assertion.
- **Checkbox via wrapper + SVG `stroke-dashoffset`** — rejected: changes DOM
  (wrapper, ref/className target); a `::after` mask with clip-path draw-in gives the
  same perceived effect on the unchanged native input.
- **Retain previous data inside the Overview hook's `series`** — rejected: alters
  `explore()` guards and failure semantics; a separate guarded field is
  behavior-neutral.
- **Global test-hook attribute in production CSS** — rejected: keep motion-off in
  test-only layers rather than shipping test affordances in the app stylesheet.
- **CSS anchor positioning for indicators** — rejected: insufficient browser
  support.

## Test strategy

Fixture/synthetic evidence only; none of this is live or Figma-fidelity evidence
(verification.md evidence classes). Commands per phase are listed above.

- **AC1** (tokens and rule, no ad-hoc durations) — Vitest source scan: tokens and a
  single reduced-motion block exist; no `duration-[`, `ease-[`, `animate-[`, raw
  `transition-duration` literals outside `src/styles`; Playwright computed-style
  checks that catalog items resolve to token values.
- **AC2** (reduced motion) — `tests/motion` spec with `emulateMedia` reduce per
  catalog group: no `translate`/`scale` change, `animation-name: none` for wipe/
  progress/pulse/spinner, drawer/indicator jump, chart fully visible without
  wipe, opacity/color transitions still present and shortened, state changes
  still observable (aria/text/color).
- **AC3** (data identical, gaps preserved) — existing overview/explorer/queries/
  DataTable RTL tests unchanged and green; additional assertions that metric text,
  table cells, polyline point sets and gap segments match with motion on vs off
  (DOM comparison in Playwright); skeleton never shows zero/"Unavailable".
- **AC4** (focus, announcements, keyboard, existing tests) — full `npm test`;
  extended navigation browser specs (focus trap, return focus after close,
  cancel/Escape) run under motion on and off; RTL assertions on live-region
  roles/text for StatusMessage and skeleton `aria-hidden`; keyboard Tab/Arrow/
  Space on Tabs and Checkbox.
- **AC5** (no lingering stale data) — RTL scenarios in the Overview, Explorer and
  Queries feature tests: invalidate during refetch/paging, expiry, generation and
  capability change, forbidden failure; assert the retained/dimmed content is gone
  in the same commit as the session state and no late response restores it;
  Playwright logout scenario under motion on.
- **AC6** (dependencies and gates) — `git diff` of `package.json`/lockfile empty;
  `typecheck`, `lint`, `npm test`, `test:boundaries`, `check:boundaries`, `build`,
  `check:production-fixtures` per phase, with revision and digest recorded.
- **AC7** (captures with animations disabled, compared) — baseline taken at the
  start of phase 1; every phase regenerates phase-2/3/4/6 evidence with motion off
  and compares file-by-file (byte hash, then visual review of differing files);
  intentional differences are listed in the phase record.
- **FR coverage** — FR1: AC1. FR2: AC2/AC4 on control items. FR3: AC3/AC4 on
  entrances. FR4: AC3/AC5 on loading items. FR5: AC2. FR6: AC3. Visual sign-off for
  motion is a separate reviewer record from Figma fidelity (spec "Open items").

## Assumptions

- Phase-ordering of C5 (loading dim in 2, stagger in 3) and B6/B8 (2) follows the
  spec's sequencing; item boundaries within a phase are refinements, not changes.
- D4's progress bar is the same class of state-bound indicator as the accepted
  spinner and not an "infinite loop" under the Principles; it is static under
  reduced motion.
- Link press scale applies only if Link is rendered as an inline-block; the default
  inline Link gets hover transitions only, to avoid reflowing text.
- Tailwind class names, token spellings and file placement above are design intent;
  `/tasks` finalizes exact names.

## Open decisions

- Tabs/nav sliding indicators need a small layout measurement (custom properties
  set by JS; motion still CSS-only). Default: accept; alternative is a non-sliding
  per-tab underline scale-in.
- Schema-tree collapse is instant (expand animates). Default: accept; the
  alternative retains unmounted protected schema purely for an exit animation.
- Checkbox draw-in uses a pseudo-element clip-path reveal rather than
  `stroke-dashoffset`. Default: accept (keeps the native input and DOM).
