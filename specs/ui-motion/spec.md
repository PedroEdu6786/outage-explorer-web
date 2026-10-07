# Spec: Animations and micro-interactions
> Status: implemented-with-evidence; human motion visual sign-off pending · Slug: ui-motion · Date: October 6, 2026

## Decision record

The user asked for subtle animations and micro-interactions across all views and
components of the web client, proposed first. After review, the user accepted
the whole proposal except the items listed under [Excluded](#excluded) and asked
to leave it documented for now. The user subsequently authorized each implementation phase; all four phases
now have recorded evidence. The original proposal by itself authorized no
implementation.

Motion is not part of the inspected Figma prototype. It is an extension, recorded
like the existing "D5 extension" spinner note. Static visuals, geometry, tokens
and copy do not change.

## Baseline observed October 6, 2026

- The only animation is the `Spinner` (800ms linear rotation, static under
  reduced motion). The only transition is `transition-colors` on `NavigationItem`.
- `Button`, inputs, `Tabs`, dataset rows, table rows, `StatusMessage`, the chart
  and the mobile navigation `<dialog>` change state instantly.

## Principles (requirements on every item)

- **Subtle.** Feedback 120–200ms, entrances 200–280ms, ease-out, travel at most
  4–8px, no bounce or overshoot, no infinite loops except the existing spinner.
- **Data-honest.** Metric values never count up or tween. Chart animation never
  interpolates between data points and never renders a missing observation as
  zero or as a connected line. Exact decimal presentation is unchanged.
- **Accessible.** Honors `prefers-reduced-motion`: movement and scaling are
  removed; opacity or color changes may remain at reduced duration. Motion never
  delays focus, `aria-live` announcements, keyboard operation or availability of
  content, errors or results.
- **No new dependency.** CSS only: Tailwind v4 utilities, `@starting-style`,
  `@keyframes` and `<dialog>` transitions. Timing/easing come from shared tokens.
- **Behavior-neutral.** No change to session, authorization, pagination, SQL
  execution, retry or invalidation semantics. Loading must not hide stale
  protected data after logout or access change.

## Requirements

- **FR1:** THE SYSTEM SHALL define shared motion tokens (durations, easing) in
  `src/styles/tokens.css` and a single global reduced-motion rule.
- **FR2:** WHEN a user hovers, presses, focuses or invalidates a control THE
  SYSTEM SHALL give subtle animated feedback as listed in the catalog.
- **FR3:** WHEN content appears, changes state or is replaced THE SYSTEM SHALL
  transition it as listed in the catalog without delaying its availability.
- **FR4:** WHILE data is loading THE SYSTEM SHALL show the catalog's placeholder
  or dimmed-previous-content treatment, never a layout-breaking blank.
- **FR5:** WHERE the user prefers reduced motion THE SYSTEM SHALL suppress
  movement, scale and the chart wipe while retaining accessible state changes.
- **FR6:** IF motion would imply unverified data (counting, interpolation, gap
  filling) THEN THE SYSTEM SHALL NOT animate it.

## Catalog (accepted)

IDs are stable references for tasks and evidence.

### A. Foundation
- **A1** Motion tokens (`--duration-fast` ≈120ms, `--duration-base` ≈200ms,
  `--duration-enter` ≈260ms, `--ease-out`) and one reduced-motion rule.
- **A2** Shared utilities: fade, fade-and-rise (4px) entrance, skeleton block.
- **A3** Deterministic output for Vitest, Storybook captures and Playwright
  (animations disabled in those environments).

### B. Atoms and molecules
- **B1 Button:** 120ms background/border/color transitions; 1px press-down;
  label crossfade between idle and loading; disabled opacity fade.
- **B2 IconButton, Link:** hover transitions; soft press scale (≈0.96).
- **B3 Input, Textarea, Select, SearchField:** border-color transition on focus;
  focus ring eases in without changing its size; error-border transition and a
  single 2px nudge when becoming invalid.
- **B4 Checkbox:** check mark draws in (`stroke-dashoffset`) with a fill fade.
- **B5 Badge:** tone color crossfade on change.
- **B6 Spinner:** 150ms fade-in so short loads do not flash; rotation and the
  static reduced-motion ring are unchanged.
- **B7 Tabs:** active underline slides between tabs; panel content fades and
  rises 4px on switch; panels stay mounted as today.
- **B8 StatusMessage:** fade/slide-in on mount; icon crossfade between spinner,
  check and warning; brief border-tint settle on success; no shake on errors.
- **B9 EmptyState:** staggered fade-in of icon, title and description.
- **B10 PaginationControls:** hover/press as Button; current-page highlight
  crossfade.
- **B11 DateRangeField:** calm validation color transition.
- **B12 MetricValue:** skeleton placeholder while loading, then fade to the real
  value. Never a counting animation.

### C. Organisms and templates
- **C1 AppNavigation (desktop):** active indicator slides to the new item; hover
  nudges padding by about 2px.
- **C2 AppNavigation (mobile `<dialog>`):** slide-in from the left and backdrop
  fade using `@starting-style`/`allow-discrete`; slide-out on close. Focus trap,
  return-focus and `cancel` behavior unchanged.
- **C3 AppHeader:** menu icon morphs to close icon; optional soft shadow after
  scroll.
- **C4 UserSummary / coverage card:** status dot gets at most one slow pulse
  cycle, not infinite.
- **C5 DataTable:** row hover/focus background transitions; new page fades in
  with a capped stagger (≈20ms per row, at most about 10 rows); table dims to
  about 60% while the next page loads instead of being replaced.
- **C6 Templates (Overview, Explorer, Workspace):** content fade-and-rise
  entrance; 40–60ms stagger across panels.
- **C7 AuthTemplate:** card scales in from 0.98 with fade.

### D. Feature views
- **D1 Sign-in:** card entrance; crossfade between restoring, failure, expired
  and ready states.
- **D2 Overview:** staggered metric-card entrance; range-change refetch dims old
  content (about 50%) and fades new content in; trend-chart left-to-right
  clip-path wipe; hover/compare-series fade-in; inspected-observation card
  slides open; refresh status uses B8 and a successful publication pulses the
  coverage date once.
- **D3 Explorer:** dataset row hover and selected-accent transition; dataset
  switch crossfades header, preview and schema; skeleton rows for preview and
  schema loading; subtle filter-change transition.
- **D4 Queries/SQL:** indeterminate progress bar under the editor toolbar while
  running (the backend provides no progress); B8 transitions between running,
  success and failure; results fade in on completion; schema-tree chevron
  rotation and height expand/collapse; Copy button icon swaps to a check for
  about 1.5s.

### E. Low priority (accepted)
- **E1** Skeleton shimmer, **off by default**; static placeholders are the
  default. Enable only on a later explicit decision.

## Excluded

Not to be implemented, and left documented as deliberate non-goals:

- Count-up or tweened metric numbers (violates exact-value presentation).
- Chart line morphing or interpolation between ranges/series (implies data).
- Hover-lift on surfaces (noisy in a data-dense analytical UI).
- Parallax, bounce, overshoot or infinite loops other than the spinner.
- Any motion that delays results, SQL errors or protected-state clearing.

## Decisions confirmed October 6, 2026

The user confirmed all four defaults (skeletons, chart wipe, conservative
intensity, animations disabled in test captures). They are accepted decisions,
not assumptions:

1. **Skeletons** replace spinner-only banners for preview, schema and metric
   loading; the banner remains for announcements (`aria-live` unchanged).
2. **Chart wipe** runs on first render and when range or snapshot changes (the
   chart already remounts on those keys), not on the compare toggle.
3. **Intensity** stays at the conservative values above.
4. **Test policy:** animations are disabled globally in Playwright, Vitest and
   Storybook captures so existing evidence stays valid; reduced-motion behavior
   is verified separately.

## Acceptance criteria

- [x] **AC1:** Tokens and the reduced-motion rule exist; every catalog item uses
  them rather than ad-hoc durations. (FR1)
- [x] **AC2:** With reduced motion emulated, no catalog item moves or scales and
  the chart is shown without a wipe; state changes remain perceivable. (FR5)
- [x] **AC3:** Metric values, chart points and table cells are identical with
  and without motion; missing observations still render as gaps. (FR6)
- [x] **AC4:** Focus order, focus return after the drawer closes, `aria-live`
  announcements and keyboard operation are unchanged; existing tests pass. (FR3)
- [x] **AC5:** Logout, expiry and access change still clear protected content
  immediately, without a lingering dim or fade of stale data. (behavior-neutral)
- [x] **AC6:** No new runtime dependency; `typecheck`, `lint`, `npm test`,
  boundary checks and `build` pass; fixture-isolation scan unchanged.
- [x] **AC7:** Existing desktop/mobile capture evidence is regenerated with
  animations disabled and compared; any intentional differences are recorded.

## Suggested sequencing (for the later plan)

1. **Foundation and controls:** A1–A3, B1–B5, B7, C1.
2. **Status and loading:** B6, B8–B12, C5 loading behavior, skeletons (D3).
3. **Entrances and chart:** C2–C4, C6, C7, D1, D2 chart/range behavior.
4. **Feature micro-interactions:** remaining D2–D4 items, E1 left off.

Each step is a separate commit with the checks in AC6 and a reduced-motion
browser check. The design plan is [plan.md](plan.md) and the task breakdown is
[tasks.md](tasks.md) (hybrid layout, per-phase files under `tasks/`), both
drafted October 6, 2026 and implemented in four phases. Final acceptance mapping
and actual gates are in [verification/phase-4.md](verification/phase-4.md).

## Open items

- Named-target live acceptance remains separate from this authorized motion work.
- Human [motion visual sign-off](verification/visual-signoff.md) remains pending, separate from Figma fidelity evidence.


## October 7 accepted chart viewport extension

The subsequent [Overview zoom requirement](../overview-chart-zoom/spec.md)
(FR21/AC24) adds smooth zoom/pan/reset timeline projection using the existing
movement token. The exclusion of chart value/series interpolation still applies:
only horizontal projection moves; original y values, gaps and marker shape do
not morph. CSS-only, reduced-motion and immediate protected-state removal
principles remain in force.
