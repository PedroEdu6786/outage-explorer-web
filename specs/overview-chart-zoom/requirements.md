# Requirements: Overview chart zoom

> Status: draft · Slug: overview-chart-zoom

## Problem statement

Long date ranges on Overview make spikes and individual daily observations
difficult to inspect. The user wants to focus on a smaller time window directly
within the graph.

## Target user / context

An Overview user inspecting national outage trends across a long applied date
range and wanting a closer look at a particular period.

## Success criteria

The user can point at an interesting period, narrow the graph around it, inspect
individual days, move to neighboring dates and return to the full applied range.
An explicit Zoom mode toggle makes scrolling behavior deliberate.

## Acceptance criteria

- With Zoom mode enabled, scrolling over the plot narrows or widens the visible
  time window around the pointer. The date under the pointer stays approximately
  anchored as the graph changes.
- Fewer days occupy the same chart width when zoomed in, making them easier to
  distinguish. Observations retain their daily granularity and original values.
- With Zoom mode disabled, ordinary scrolling scrolls the page rather than
  changing the visible chart window.
- Zoom mode starts disabled; switching it off retains the current chart window.
- The minimum zoom window is 15 days.
- With Zoom mode enabled, horizontal scrolling moves the zoomed window left or
  right to inspect neighboring dates.
- Reset zoom restores the full applied date range.
- Applying changed page-level date bounds resets zoom to the full new range.
- Zoom affects only the graph. The daily table, metric cards and page-level date
  filters retain their existing scope.

## Non-goals

- Filtering the rest of Overview through chart zoom.
- Introducing observations at a finer resolution than the existing daily data.
- Changing observation values or treating magnification as new data.

## Open questions

- What keyboard and touch controls should accompany scrolling? Alternative
  controls were proposed; the repository requires keyboard access, but their
  exact behavior remains to be specified. The user requested a recommendation.

## Assumption for planning

- Proposed interpretation, not yet explicitly accepted: count the 15-day minimum
  as inclusive calendar days. If the applied range is shorter, display its full
  span and disable further zoom-in without expanding outside the applied dates.

## Discussion provenance

On October 7, 2026, the user confirmed the difficulty inspecting long ranges,
selected graph-only zoom, accepted the pointer-centered time-window behavior
and explicitly requested the Zoom mode toggle. This brief captures that
discussion; implementation and verification have not started.

In the subsequent clarification, the user selected a 15-day minimum, horizontal
scrolling for left/right navigation, Zoom mode initially disabled with the
current zoom retained when switched off, and zoom reset when applied dates
change. Keyboard and touch controls await agreement after a recommendation.
