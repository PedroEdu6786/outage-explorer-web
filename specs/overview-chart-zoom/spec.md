# Spec: Overview chart zoom
> Status: draft · Slug: overview-chart-zoom

## Problem
Long date ranges on Overview make spikes and individual daily observations
difficult to inspect. Users need to examine a smaller period without changing
the scope of the rest of Overview.

## Goal
Users can deliberately magnify a period around the pointer, inspect neighboring
dates and restore the full applied range within the Overview graph.

## Requirements
### Functional (EARS)
- **FR1:** WHEN the user operates the Zoom mode toggle THE SYSTEM SHALL switch between enabled and disabled Zoom mode.
- **FR2:** WHEN the user scrolls to zoom in over the plot with Zoom mode enabled and above a 15-day window THE SYSTEM SHALL narrow the displayed time span across the same chart width without passing the 15-day minimum.
- **FR3:** WHEN the user scrolls in the opposite direction over the plot with Zoom mode enabled and below the full applied range THE SYSTEM SHALL widen the displayed time span.
- **FR4:** WHEN pointer-driven zoom changes the visible window THE SYSTEM SHALL keep the date under the pointer approximately anchored at its horizontal position, subject to the applied date bounds.
- **FR5:** WHILE Zoom mode is disabled THE SYSTEM SHALL leave ordinary scrolling over the plot available to the page without changing the chart window.
- **FR6:** WHEN the user scrolls horizontally over the plot with Zoom mode enabled THE SYSTEM SHALL move the zoomed window toward earlier or later dates in the requested direction without changing its time span, up to the applied date bounds.
- **FR7:** WHEN the user selects Reset zoom THE SYSTEM SHALL restore the full applied date range in the graph.
- **FR8:** WHEN the user changes chart zoom, moves the window or resets zoom THE SYSTEM SHALL preserve the scope of the daily table, metric cards and page-level date filters.
- **FR9:** WHILE the graph displays a narrowed time window THE SYSTEM SHALL use that window for the date axis, plotted series and observation inspection.
- **FR10:** THE SYSTEM SHALL keep the visible chart window within the applied date range.
- **FR11:** THE SYSTEM SHALL support keyboard operation of the toggle, zoom, window movement and reset with visible focus. [NEEDS CLARIFICATION: What keyboard and touch controls should accompany scrolling?]
- **FR12:** WHEN Overview is initially opened THE SYSTEM SHALL start Zoom mode disabled.
- **FR13:** WHEN the user disables Zoom mode THE SYSTEM SHALL retain the current chart window.
- **FR14:** WHEN the user applies changed page-level date bounds THE SYSTEM SHALL reset the graph to the full newly applied date range.
- **FR15:** WHILE the visible chart window is 15 days THE SYSTEM SHALL prevent further narrowing through zoom.

### Technical / Non-functional
- **TR1:** Zoom preserves the existing daily observations and their original values; magnification does not introduce finer-grained observations.
- **TR2:** Observation dates retain their calendar-date meaning without timezone shifts.
- **TR3:** Missing observations remain unavailable; zoom does not present them as measured values or zero.

## Inputs & Outputs
- Inputs: the applied Overview date range, its existing national daily observations and comparison series, pointer position over the plot, vertical/horizontal scroll actions, Zoom mode selection and Reset zoom.
- Outputs: the graph's visible time window and corresponding daily observations across the available chart width; the rest of Overview retains its existing scope.
- Behavioral contract touched: Overview graph interaction and observation inspection. No new observation fields are requested.

## Scope
### In scope
- Pointer-centered scroll zoom controlled by an explicit Zoom mode toggle.
- Horizontal-scroll window navigation, full-range reset and keyboard access.
- Preservation of existing chart data meaning and applied date boundaries.

### Out of scope (non-goals)
- Filtering the daily table, metric cards or page-level dates through chart zoom.
- Finer-than-daily observations, new metric calculations or altered source values.
- Zoom interactions on other pages.

## Assumptions
- The accepted October 7 discussion defines zoom as narrowing/widening time across the existing graph width.
- Existing Overview data and accessibility rules continue to apply; interaction details marked below remain undecided.
- Proposed interpretation, not yet explicitly accepted: the 15-day minimum counts inclusive calendar days. If the full applied range contains fewer than 15 days, show that entire range and disable further zoom-in, preserving the applied bounds rather than expanding them.

## Acceptance Criteria
- [ ] **AC1:** Operating the Zoom mode toggle changes whether scroll zoom is enabled. (verifies FR1)
- [ ] **AC2:** With Zoom mode enabled and a window longer than 15 days, scrolling to zoom in shows fewer days across the same chart width without narrowing below 15 days. (verifies FR2)
- [ ] **AC3:** With Zoom mode enabled and below the full range, opposite scrolling shows a wider time window. (verifies FR3)
- [ ] **AC4:** Zooming around an interior date keeps it approximately at the same horizontal position while the surrounding dates change; applied bounds take precedence at the edges. (verifies FR4)
- [ ] **AC5:** With Zoom mode disabled, ordinary scrolling over the graph can scroll the page and leaves the visible chart window unchanged. (verifies FR5)
- [ ] **AC6:** With Zoom mode enabled, horizontal scrolling reveals earlier or later dates with the same window span until an applied bound is reached. (verifies FR6)
- [ ] **AC7:** Reset zoom restores the graph's full applied date range. (verifies FR7)
- [ ] **AC8:** Zooming, moving and resetting the graph leave table scope, metric-card scope and page-level date filters unchanged. (verifies FR8)
- [ ] **AC9:** The date axis, plotted series and inspectable observations correspond to the same visible window. (verifies FR9)
- [ ] **AC10:** Zooming out or moving toward either edge cannot display a time window outside the applied dates. (verifies FR10)
- [ ] **AC11:** A keyboard user can toggle Zoom mode, narrow/widen the window, move it and reset it with visible focus. (verifies FR11)
- [ ] **AC12:** Inspecting the same date before and after zoom returns the same daily observation values, with no finer-grained observations introduced. (verifies TR1)
- [ ] **AC13:** Observation dates remain unchanged when zooming in different timezones. (verifies TR2)
- [ ] **AC14:** A missing observation remains unavailable after zoom, while a measured zero remains zero. (verifies TR3)
- [ ] **AC15:** On initially opening Overview, Zoom mode is disabled. (verifies FR12)
- [ ] **AC16:** Disabling Zoom mode leaves the current chart window unchanged. (verifies FR13)
- [ ] **AC17:** Applying changed page-level date bounds restores the full newly applied range in the graph. (verifies FR14)
- [ ] **AC18:** At a 15-day window, further zoom-in actions leave the time span unchanged. (verifies FR15)

## Open Clarifications
- **FR11:** What keyboard and touch controls should accompany scrolling?
