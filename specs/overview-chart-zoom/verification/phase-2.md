# Overview chart zoom: phase 2

Status: isolated chart feature accepted, October 7, 2026. T2.1–T2.4 and T2.C
complete. Page assembly and final native-input/live acceptance remain phases 3–4.

## Revision and implementation

- Branch `feat/overview-chart-zoom`; base `bfb76fb`.
- Tested tree SHA-256 before checkpoint/status/journal edits:
  `e6b01d2c123b94758e4b367cc40ca09cc14129412833dc429d89791d1f21cff8`.
  Sorted tracked/untracked nonignored path/content algorithm from the verification
  guide; source unchanged between final checks and digest capture.

| Changed source/test path | SHA-256 |
| --- | --- |
| `src/features/overview/useChartViewport.ts` | `50288323ffa13b623daadab48040704c2dcfe6c33438c82145cb061b97c55e78` |
| `src/features/overview/NationalTrend.tsx` | `cfee8f8d5d5e67d367be674bf452588ce8e9fa45a699679ce3957c9debcc6529` |
| `src/features/overview/national-trend-zoom.test.tsx` | `214d0dbc2dc3d1b656ff741c6ea38966bc3a2293c3959771bcf06d3f36f864c8` |
| `src/features/overview/NationalTrend.stories.tsx` | `4d8ae04512adc2b591ff6f9b45e28b1832783ae493b2558933ee2e60ffcafc24` |
| `tests/fixtures/overview-zoom.ts` | `b96c14ac327898b55d84e9485f1bbfc759afa718075571ba62cea0ae7c770ced` |
| `tests/fixtures/operations.ts` | `e03c78eb2b7fa0fb3374a0288cbead025fbf94ffde5671a1618404b97f7cc2a1` |

The local controller maps pointer coordinates through the inverse SVG screen
transform, owns only cancelable unmodified plot wheel input, coalesces frames and
accumulates fine deltas. Focus-only shortcuts and horizontal-intent touch use the
same bounded viewport. Reset, disable, unavailable state, applied-range changes,
unmount and unexpected capture loss invalidate queued work.

NationalTrend keeps both series/inspection on the same visible rows, uses the
full applied rows for vertical scale and retains the same SVG across zoom/gaps.
Departed inspection is cleared. An empty-window message overlays the persistent
plot with pointer events disabled, avoiding layout shift and preserving recovery.
New fixtures provide 365/730 calendar-day ranges, zero/exact/null/unavailable and
omitted dates with internally consistent invented metrics. Their operation seam
changes national coverage only when explicitly supplied; defaults remain intact.

## Actual checks

Environment: Node 24.18.0, npm 11.16.0, macOS, installed locked dependencies.

| Command / check | Result |
| --- | --- |
| `npm test -- src/features/overview` | 84/84 passed across seven files, including 12 new connected tests |
| `npm test -- src/features/overview/national-trend-zoom.test.tsx src/features/overview/overview.test.tsx` | Final affected rerun after overlay/assertion refinement: 31/31 passed |
| `npm run typecheck` / `npm run lint` | Passed; repeated after final source correction |
| `npm run test:boundaries` | 33/33 passed |
| `npm run check:boundaries` | Passed: 113 modules, 15 production roots |
| `npm run build-storybook` | Fresh final build passed; existing bundler directive warnings |
| `node /private/tmp/outage-overview-zoom-phase2-browser.mjs` | Passed after approved Chromium launch escalation; 12 responsive specimens and interaction/geometry checks |

The first connected test run exposed teardown ordering of mocked capture APIs;
tests now unmount before removing mocks. No test-only capture shim enters product
code. Final checks above passed. Staged diff/whitespace reviewed before commit.

## Acceptance mapping

| ACs | Evidence established here |
| --- | --- |
| AC1, AC11, AC19, AC20, AC21 | Toggle/button keyboard activation; focused-chart zoom/movement; descendant/selector focus isolation; native Chromium focus/keys and emulated-touch button activation |
| AC2, AC3, AC4, AC10, AC18 | Connected zoom direction, transformed interior anchor within one day, frame coalescing, fine delta accumulation, line/page normalization, fixed bounds and 15/short-range limits; actual Chromium wheel after narrow horizontal SVG scrolling |
| AC5, AC6, AC23 | Mode-off no handling, owned-event cancellation, modifier/noncancelable/outside/missing-geometry pass-through, horizontal dominant-axis pan, disabled buttons/keys and reset availability; native page-scroll/browser-zoom gate remains phase 4 |
| AC7, AC16 | Shared Reset, retained view on disable, no SVG remount and no reappearing departed inspection |
| AC9, AC12, AC14 | Both series align; supplied exact/zero labels and null/omitted/unavailable gaps survive zoom; full-applied vertical scale remains; immutable source; all 730-day source observations remain inspectable without aggregation |
| AC13 | Existing phase-1 calendar/timezone tests included in the 84-test run; presentation still uses calendar-date helpers |
| AC15, AC17 | **Chart-local only:** initially disabled, standalone applied-bound reset; pending work canceled on reset/bounds/unavailable/unmount. Page lifecycle proof remains phase 3 |
| AC22 | Synthetic pointer horizontal intent, vertical yield, multi-touch cancellation, pointercancel and capture-loss cleanup; physical touch swipe/pinch acceptance remains phase 4 |

AC8 (unchanged cards/table/filters/operation counts) is deliberately reserved for
Overview/page assembly. Fixture seam checks preserve matching coverage, default
four-day data, injected failures and deferred reads; they do not establish AC8.

## Browser and visual evidence limits

Fresh built Storybook was served locally on port 6007. Headless Chromium 1243
checked `Features/Overview/NationalTrend` stories OneYear, TwoYears,
NarrowedCompare, EmptyWindow, ShortRange and Unavailable at 1440px and 390px.
Checks cover contained controls, no document overflow/page errors, real browser
wheel delivery after SVG scrolling, focused keys, retained window/reset, stable
SVG identity and unchanged plot y/height entering/leaving an empty gap.

Agent reviewed two-year desktop, narrowed-compare narrow and final zoomed-gap
narrow captures in `/private/tmp/outage-overview-zoom-phase2/`. The first empty
render had excess padding; the final overlay corrected it without shifting the
plot. Capture files and script are temporary; committed stories reproduce these
states. Controls remain an extension to the previously inspected supplied
Overview design, not a claim of Figma fidelity or human visual sign-off.

Synthetic pointer dispatch is not proof of browser touch arbitration; emulated
touch taps are not physical touch gestures. No authenticated live observations,
native trackpad/pinch, production build or release acceptance is claimed here.
The user will perform live testing; phase 4 must record that pending gate honestly.
No new dependencies, external runtime/env changes, push or deployment.
