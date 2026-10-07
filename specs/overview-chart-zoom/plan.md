# Plan: Overview chart zoom
> Status: draft · Slug: overview-chart-zoom · Spec: ./spec.md

## Approach

Extend the existing national SVG chart with a feature-owned calendar viewport and input controller. Keep the authorized applied-range observations intact; derive only the graph's window, plotted rows and inspection choices from zoom state. Reuse existing Checkbox, Button, PanelHeader and Surface primitives, with no new chart dependency or backend contract. This preserves chart-only scope, exact data and the existing protected lifecycle. (FR1–FR20, TR1–TR3)

Grounded at revision `5507fe7`: NationalTrend uses a 920×300 SVG, a horizontal scroll container and plot bounds x=60–870; presentation already supplies calendar-day coordinates and gap-preserving segments. OverviewFeature keys the chart by session generation, applied dates and snapshot; retained content is inert. The supplied [desktop](../../docs/specs/web-client/evidence/overview-desktop.png) and [mobile](../../docs/specs/web-client/evidence/overview-mobile.png) prototype captures were inspected alongside the [design inventory](../../docs/specs/web-client/design-inventory.md). Zoom controls are an explicitly documented extension to that evidence, not an existing Figma interaction. (FR4, FR8, FR9, FR11, FR14, TR1–TR3)

## Components affected

- **Calendar viewport model** — pure, feature-owned range normalization, anchored zoom and fixed-span translation; reuse the existing UTC day-coordinate convention. The viewport counts calendar days, including gaps, rather than observation rows. (FR2, FR3, FR4, FR6, FR10, FR15, TR2)
- **Chart interaction controller** — own mode, viewport actions, wheel/keyboard/touch arbitration and gesture cleanup; no service calls or global event handlers. Start disabled, retain the window on disable and route all inputs through the same limits. (FR1, FR5, FR12, FR13, FR16, FR17, FR18, FR19, FR20)
- **NationalTrend presentation** — derive both plotted series, axis bounds and inspection options from one viewport, preserving existing segment and exact-label helpers. Keep the SVG identity stable while zooming and maintain comparison selection. (FR4, FR7, FR9, TR1, TR2, TR3)
- **Chart controls composition** — feature-local composition of existing atoms for Zoom mode, +, − and Reset zoom, with visible range and concise input help. Retain the compare control in the panel header; put the wrapping zoom row above the plot, outside horizontal overflow so controls remain reachable on narrow screens. (FR1, FR7, FR11, FR18, FR20)
- **Overview composition/lifecycle boundary** — pass interaction availability to the chart and preserve its existing generation/date/snapshot identity. Cards, DailyObservations, useOverview and operation inputs retain their current ownership and applied-range scope. (FR8, FR12, FR14, FR20)
- **Overview fixtures and verification harness** — extend existing feature/page stories with a labeled long-range synthetic series, gaps and edge cases; verify chart interactions before the final assembled-page gate. (FR1–FR20, TR1–TR3)

## Data model changes

- No persistent, observation or transport-model changes. NationalSeries and its exact/display values remain immutable inputs. (FR8, TR1, TR3)
- Local **ChartWindow**: inclusive start/end CalendarDate values, represented internally by integer UTC day coordinates; minimum span is 15 inclusive days or the full applied span when shorter. **ChartViewportState**: enabled boolean, optional narrowed window (absent means full), and transient gesture state. Nothing is stored in URLs, browser storage or a shared cache. (FR10, FR12, FR13, FR15, TR2)
- Resolve the full window from explicit applied bounds, filling omitted bounds with the first/last observations already filtered to the applied selection, matching existing behavior. Without a finite ordered window, show the existing empty state and disable manipulation. Explicit date bounds may include unobserved dates; do not shrink them to row coverage. (FR9, FR10, TR2, TR3)

## Interfaces & contracts

| Contract | Inputs | Outputs / boundary behavior | Trace |
| --- | --- | --- | --- |
| NationalTrend | Existing series and optional applied range; optional `interactive` boolean, default true | Chart-local presentation; Overview passes false for retained content; no viewport callback to page filters | FR8, FR9, FR14, FR20 |
| Viewport operations | Full window, current window, zoom factor and normalized anchor, or requested day displacement | Inclusive bounded window and enabled-action flags; invalid/nonfinite geometry yields no change; same-span movement clamps at bounds | FR2, FR3, FR4, FR6, FR10, FR15 |
| Interaction controller | Viewport, mode, interaction availability, plot geometry and local browser input | Mode/zoom/move/reset actions and input-help state; listeners and gesture buffers are removed or cleared on disable, unavailable interaction or unmount | FR1, FR5, FR7, FR12, FR13, FR16–FR20 |
| Controls composition | Mode, visible range, zoom availability and action callbacks | Labeled native Checkbox and Buttons; + / − have accessible names Zoom in / Zoom out; Reset zoom remains available while mode is off | FR1, FR7, FR11, FR18, FR20 |

### Window and rendering policy

- For anchored zoom, choose the new inclusive day count, retain the pointer's fractional position within the old window and position the new window around that date. Round to calendar-day bounds, then translate the whole window back inside the full range without shortening its intended span. Interior anchor error is at most one day of rounding; clamping takes precedence at edges. A 15-day window has 14 intervals between its endpoint dates. Full-range reset restores the exact original bounds. (FR2, FR3, FR4, FR7, FR10, FR15, TR2)
- Keyboard/buttons zoom around the current window midpoint using a tunable interaction scale: one activation changes the day count by a factor of 1.25, rounded with at least one day of progress where possible. Arrow movement is 10% of the current inclusive span, rounded to at least one day; wheel/touch movement is proportional to horizontal displacement. These are tunable design choices, not new product requirements. (FR6, FR16, FR17, FR18, FR19)
- Use the same visible rows for both series and observation selection. Clear an inspected date when it leaves the window; do not let it reappear solely because a later pan returns. Keep controls and the window caption mounted when a zoomed window contains no observations so users can move/reset out of the gap. Preserve unavailable rows and omitted-day segment breaks; never interpolate. (FR7, FR9, TR1, TR3)
- Keep the vertical scale based on the full applied-range rows and current comparison setting during zoom, so magnifying time does not imply a change in value. Preserve original exact/display labels; approximate numbers remain restricted to SVG coordinates. Reuse the current SVG and mount-only wipe rather than remounting/animating each wheel update; respect existing reduced-motion behavior. (FR4, FR9, TR1, TR3)

### Input policy

- Map client coordinates through the inverse SVG screen transform into plot coordinates, then measure the anchor between x=60 and x=870; ignore events outside the plot rectangle. This accounts for CSS scaling, page position and the current horizontal scroll offset without applying scroll displacement twice. Re-read geometry after resize/scroll; missing or singular transforms cause no action. The browser's [SVG screen-transform API](https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM) supplies this transform. (FR4, FR10)
- While enabled and interactive, a plot-scoped non-passive wheel listener normalizes pixel/line/page deltas. Dominant vertical motion zooms (negative in, positive out); dominant horizontal motion pans (positive toward later dates). Select one axis per event to avoid diagonal double actions. Accumulate fine deltas and coalesce drawing updates to animation frames; apply bounded zoom factors and calendar rounding without dropping every small trackpad event. Consume owned cancelable events even at a chart limit, preventing a sudden page jump; leave noncancelable events unmodified. (FR2, FR3, FR5, FR6, FR15)
- Leave Ctrl/Meta-modified wheel and keyboard inputs to browser zoom. Wheel handling is scoped to the plot and removed when mode is off; surrounding page scrolling and the chart's native horizontal scrollbar remain available. No document-level wheel interception. Browser wheel cancellation and Ctrl-marked trackpad zoom require this distinction; see [wheel event guidance](https://developer.mozilla.org/en-US/docs/Web/API/Element/wheel_event). (FR5, FR11, FR20)
- Keyboard shortcuts operate only when the chart region itself has focus: + / − zoom; Left / Right move. Do not intercept keys from the inspection selector, checkbox, buttons, text fields or other regions. Native controls retain Tab, Space and Enter behavior. Controls have visible focus, mode-dependent disabled states and adjacent help; Reset does not alter mode. (FR1, FR7, FR11, FR16, FR17, FR18, FR20)
- In enabled mode, use single-touch pointer gestures with horizontal-intent detection and capture after commitment; a leftward swipe reveals later dates. Vertical swipes remain page scrolling and multi-touch remains browser pinch zoom. Use `touch-action: pan-y pinch-zoom` on the interactive plot surface; mode off restores normal touch handling. Clear gestures on pointer cancellation, release, mode change or unmount. [Touch-action guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action) explains browser gesture ownership and cancellation; test the scrollable ancestor interaction on actual touch browsers. (FR5, FR19, FR20)

### Lifecycle policy

- Keep the existing chart key based on generation, applied dates and snapshot. New applied bounds reset to the full window and initial disabled mode; draft edits and unchanged submissions do not. Standalone chart consumers must also reset a stale viewport before rendering changed applied bounds, rather than relying only on the parent key. Toggling compare and ordinary same-identity renders preserve zoom. (FR8, FR12, FR13, FR14)
- Preserve the current inert retained-series wrapper and explicitly pass `interactive=false` so native listeners cannot consume events during refetch. Invalidate pending animation-frame/gesture work immediately when unavailable or unmounted. Existing session guards remain authoritative: logout/access loss removes chart data and a late response cannot recreate the old chart. A new snapshot intentionally starts fresh local state. (FR8, FR12, FR14, FR20, TR1)

## Implementation phases

1. **Viewport and controls foundation** — validate range math and isolated reusable-atom control composition, including accessible states and short-range behavior. Reuse accepted atomic/readiness predecessors rather than rebuilding them. (FR1, FR2, FR3, FR4, FR7, FR10, FR11, FR12, FR13, FR15, TR2)
2. **Chart feature integration** — connect viewport, renderer and all accepted inputs in isolated NationalTrend/Overview feature stories; prove exact values, gaps, empty-window recovery and gesture ownership. (FR5, FR6, FR9, FR16, FR17, FR18, FR19, FR20, TR1, TR3)
3. **Overview assembly and regression gate** — only after the feature checks pass, verify the existing page composition, date/snapshot/session resets, inert retained data and unchanged cards/table/network calls. No new route or template layout is needed. (FR7, FR8, FR12, FR13, FR14, FR20)
4. **Browser, visual and live acceptance** — verify desktop/narrow input behavior, prototype-extension layout and a named live Overview range; record fixture, visual and live evidence separately. (FR1–FR20, TR1–TR3)

## Dependencies & integrations

- Existing React/SVG, feature presentation helpers, native browser inputs and accepted UI atoms are sufficient; no package, API or backend change is planned. Zoom never invokes readNationalSeries or changes table pagination. Existing Vitest/Testing Library, Storybook and Playwright provide the verification seams. (FR8, FR9, TR1)
- Reuse completed Overview lane prerequisites **T3.O → T4.O1 → T4.O2 → T4.O3 → T4.O4 → T4.OC**, documented in the [phase-4 handoff](../../docs/specs/web-client/tasks/phase-4.md), with T3.O's accepted T1.C/T3.1/T3.2/T3.5/T3.8 dependencies. This feature keeps atomic-first development and feature acceptance before page assembly; any later parallel assignments need disjoint ownership and the execution ledger. (FR1, FR8, FR11)
- Follow [development verification](../../docs/development/verification.md): typecheck, lint, behavior tests, boundary tests/checks, serialized production build and artifact scans, then fresh Storybook and affected browser suites. Live acceptance depends on existing configured authentication/national observations; its absence does not prevent fixture implementation. (FR8, TR1–TR3)

## Risks & tradeoffs

- **R1 — Narrow-chart coordinate drift:** existing SVG overflow and scaling can misplace pointer anchors. Use SVG-space mapping and verify after physical horizontal scrolling, resizing and browser zoom; retain the scrollbar rather than introduce a responsive-chart redesign. (FR4, FR10)
- **R2 — Gesture conflicts:** trackpads, touch browsers and default browser zoom differ. Scope cancellation, preserve vertical touch scroll/pinch, clean up canceled gestures and verify real input; do not treat synthetic pointer dispatch as native-scroll evidence. (FR5, FR6, FR11, FR19, FR20)
- **R3 — Day rounding and missing data:** count calendar days inclusively, clamp after anchoring and exercise short/leap-year/sparse ranges. Retain source values and existing gap segmentation. (FR4, FR10, FR15, TR1–TR3)
- **R4 — Stale lifecycle state:** native listeners and queued drawing updates could outlive an interactive chart. Gate them on availability and cancel on teardown; preserve keyed remounts and session/retained-series regressions. (FR8, FR12, FR14, FR20)
- **R5 — Long-series rendering cost and visual stability:** reuse one sorted applied-range series, memoize derived segments and coalesce updates; evaluate a two-year synthetic range at desktop and narrow widths. Avoid new aggregation/downsampling because every daily observation remains inspectable; add optimization only on observed evidence. (FR2, FR9, TR1)

### Alternatives considered

- Replace the SVG with a zoom-enabled chart library — rejected because the existing exact-label, missing-data and lifecycle behavior would require migration for a bounded local interaction. (FR9, TR1, TR3)
- Reapply page date filters for zoom — rejected because it changes cards/table scope and triggers data workflows. (FR8)
- Use whole-chart CSS magnification — rejected because it enlarges labels and geometry rather than laying out fewer days over the existing chart width. (FR2, FR9)

## Test strategy

- **AC1, AC11, AC15:** component and browser tests for initial disabled mode, labeled Tab order/focus and pointer/Space/touch toggle activation; inspect responsive wrapping and screen-reader input help.
- **AC2, AC3, AC4, AC10, AC18:** pure viewport tests for narrowing/widening, 15-day and shorter windows, clamping and one-day anchor tolerance; real browser wheel tests map an interior date at desktop/narrow sizes and after physical SVG scrolling. Include both edges, large deltas and no-op limits.
- **AC5, AC23:** browser checks confirm mode-off wheel/touch page scrolling and unchanged window; mode-on gestures are contained to the plot, browser Ctrl/Meta zoom is not canceled, and off-mode keys/buttons do not manipulate the chart. Confirm Reset stays available.
- **AC6, AC20, AC22:** pure same-span movement invariants plus browser horizontal-wheel/focused-arrow tests; touch-device checks cover horizontal swipes, vertical page scroll, multi-touch and pointer cancellation. Confirm key events in other controls are untouched.
- **AC7, AC16, AC17:** component/page checks for shared Reset, retained window on disable and full-range reset only after changed dates are applied; draft edits and unchanged submissions preserve state. Cover snapshot changes, retained refetch, session loss and late results.
- **AC8:** Overview integration verifies unchanged metric/table/date scope, table pagination and operation call counts through zoom/pan/reset. Repeat with comparison enabled and verify protected content removal.
- **AC9, AC12, AC14:** long-range synthetic fixtures exercise both series, visible inspection options, clearing departed selections, zero/null, omitted days, empty subwindows and exact half-up display values before/after zoom. Assert unchanged source observations and accessible table data.
- **AC13:** calendar tests across timezone settings, leap days and daylight-saving boundaries, verifying identical date labels, bounds and day counts.
- **AC19, AC21:** component/browser tests exercise chart-focused + / − and visible buttons by keyboard/touch, bound enforcement and focus isolation. Zoom does not remount the SVG or replay its entrance wipe; run motion/reduced-motion regressions.
- Fixture acceptance uses at least 365 days plus a two-year stress case; the existing four-day fixture alone cannot establish zoom behavior. Final page evidence follows feature acceptance. A live smoke with an authorized long range verifies no extra data requests from chart actions; final visual/input review records viewport, device/browser, revision and synthetic/live provenance. No such implementation checks are claimed by this planning update. (AC1–AC23)

## Assumptions

- Carry forward the spec's explicit interpretation: 15 inclusive calendar days; a shorter full applied range stays fully visible with no further zoom-in. These are recorded planning assumptions rather than a separately confirmed user decision. (FR10, FR15, TR2)
- Keep existing date/snapshot remount behavior, including restarting mode disabled, and use midpoint anchoring for keyboard/buttons because these actions have no plot pointer. Wheel gain and key-step sizes are reversible design choices to validate with real input. (FR12, FR14, FR16, FR17, FR18)
- The prototype has no supplied zoom-state design; control placement follows inspected panel/atom patterns as a scoped extension requiring its own visual review. (FR1, FR7, FR11, FR18)

## Open decisions

_None._


## October 7 viewport-motion extension (FR21 / AC24)

Use the existing 200ms movement and ease-out tokens for CSS transitions of two
registered, inherited horizontal projection numbers. Stable full-applied-range
line segments retain source gap topology; only x is transformed, with non-scaling
strokes. Target-window circles inherit the same projection for cx; cy and radius
stay unchanged. Clip the plot with marker-radius padding. Axis labels and
inspection choices reflect the requested window immediately while presentation
settles, with no service/state work waiting for animation completion.

Native CSS transitions retarget from their current position. Mode/availability
changes synchronously suppress and restore transitions to place the accepted
target; Reset while mode is off can still animate. Applied-bound or snapshot
identity replaces only the projection group, preventing old movement continuing.
The SVG entrance identity is unchanged. Existing global reduced-motion and
Storybook motion-off durations make placement immediate. No animation runtime,
frame tween, chart dependency or metric interpolation is introduced.

Validate actual intermediate circle and line geometry, round markers and exact
labels; rapid pan/reset, mode-off Reset, unavailable/identity changes, natural
wheel settling at a narrow viewport, and reduced-motion/off end states. Keep the
existing page-scope, input ownership, missing-data and protected-state suites.
This interaction extends the supplied static Overview Figma evidence; it does
not claim a new animation was specified by those captures.
