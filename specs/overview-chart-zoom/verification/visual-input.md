# Overview zoom: visual and input review

Status: automated Chromium/agent review complete; **physical-device and human
visual acceptance pending**. T4.3 remains unchecked for those manual portions.

## Provenance and environment

October 7, 2026; application source `a3f9a92` on `feat/overview-chart-zoom`.
Final test hashes and checkpoint tree binding are in [phase 4](phase-4.md).
macOS headless Chromium 1243 (Playwright 1.63.0), viewport widths 1440/390px;
anchor checks additionally resize to 1100/480px. Fixtures are explicitly
synthetic 365/730-calendar-day scenarios, not live EIA observations.

The supplied Overview desktop/mobile images under
`docs/specs/web-client/evidence/` were inspected before design. Added controls
reuse the existing Checkbox/Button and panel patterns; they are a user-requested
prototype extension. The existing wide SVG remains horizontally scrollable.

## Automated browser evidence

`tests/browser/overview-chart-zoom.spec.ts` passed seven scenarios:

- Real Chromium wheel delivery preserves pointer anchors within one calendar day
  after SVG horizontal scrolling and viewport resize; pan keeps span, honors
  applied bounds and stops zoom-in at 15 inclusive days.
- Disabled mode allows real page wheel scrolling. Enabled plot wheel changes
  dates without scrolling the page. Ctrl-modified wheel is not canceled and
  leaves chart dates unchanged; this proves event pass-through, not browser
  chrome zoom controls on every desktop/browser.
- Tab/Space/Enter and focused-chart shortcuts work with visible focus; selector
  focus is isolated. Entering/leaving a wholly unobserved gap keeps the plot's
  y-position/height and its reset/navigation controls.
- CDP `Input.dispatchTouchEvent` in a mobile/touch Chromium context drives the
  browser's touch pipeline: horizontal swipes pan chart dates without page
  movement; vertical swipes scroll the page in both modes; touch buttons reset.
- A two-contact CDP pinch increases `visualViewport.scale` without changing
  chart dates. These are **emulated Chromium native-input results**, not physical
  touchscreen or Safari evidence.

`tests/motion/features.spec.ts` passed 15 scenarios, including two new chart
checks under normal/reduced-motion preferences. SVG identity and its own wipe
remain stable; comparison fades do not count as a new chart wipe. Exact/zero
labels and omitted/unavailable/null segment gaps survive zoom.

## Agent screenshot and responsiveness review

Final fresh Storybook captures were generated with approved local Chromium via
`/private/tmp/outage-overview-zoom-phase4-review.mjs`, saved outside the repository
as `/private/tmp/outage-overview-zoom-phase4/overview-{full,zoomed}-{1440,390}.png`.
The agent inspected the zoomed desktop/narrow actual-page images, following the
isolated gap/compare images in [phase 2](phase-2.md). Controls/caption/help wrap
inside the panel; cards and daily table retain their page scope; overflow stays
within the SVG/table. The sticky navigation and fixture controls in those
captures belong to the existing page harness and are not new zoom UI.

Ten sequential wheel updates per width on the two-year/compare case completed
without an action timeout. Observed wheel-to-caption acknowledgement (including
automation overhead): desktop 39–59ms, narrow 38–58ms. This local 20-event sample
does not establish frame-rate or performance on other hardware. Temporary
captures may expire; committed stories/tests reproduce the reviewed states.

## Remaining manual record

No named human has signed off this extension. No physical mouse wheel, trackpad,
touchscreen, Safari pinch/scroll arbitration or browser chrome zoom test was
performed. A reviewer should use the [live checklist](live.md), recording device,
browser/version, date, web revision and results. Verify pointer anchoring after
scroll/resize, natural gesture feel, page-scroll/browser-zoom coexistence and
legible controls/focus at narrow widths. Keep T4.3 and T4.C open until this evidence
is supplied; agent image review and emulation do not substitute for it.
