# Overview chart zoom: phase 1

Status: foundation accepted, October 7, 2026. T1.1–T1.4 and T1.C complete;
NationalTrend, input controller and page integration remain phases 2–4.

## Revision and scope

- Branch: `feat/overview-chart-zoom`; base revision: `53d5c9b`.
- Tested working-tree SHA-256 before adding checkpoint/status/journal records:
  `5151a7253613082842e3a2624f12df4db21c9bc855ccf137bdcad1d1db8d2632`.
  Uses the verification guide's sorted tracked/untracked nonignored path/content
  algorithm. Source did not change between the last checks and this digest.
- New source/test/story SHA-256 values:

| File under `src/features/overview/` | SHA-256 |
| --- | --- |
| `chart-viewport.ts` | `a6ba7f66cb6e7b69a69834637b0f60093d95c4de0b0b7dc5ea671e1153db3659` |
| `chart-viewport.test.ts` | `ffdb9182cc5f8f3c77d4227127a29d17522a84a4614232c3821e84d3e3527b24` |
| `ChartZoomControls.tsx` | `8c70c10b040b63e1e7056ff1eaf9978f9b02747897874091f16a999ffc9032d9` |
| `ChartZoomControls.test.tsx` | `ce857d9166553323a36bbfb6732da4415aadbc7d9a35dcc357408fdd208f6bb3` |
| `ChartZoomControls.stories.tsx` | `289ff6bb202f3e44eec630a9ba175ce92eee1a5156814f1755ddc4955163d151` |

The pure viewport resolves open bounds against eligible observations, clamps
anchored zoom and fixed-span movement to explicit calendar bounds, and preserves
the documented inclusive-day/short-range assumptions. Controlled controls reuse
Checkbox/Button, retain caller ownership, and keep Reset available with mode off.
No dependencies, transport, chart rendering or page behavior changed.

## Executed checks

Environment: Node 24.18.0, npm 11.16.0, macOS; installed lockfile dependencies.

| Command | Result |
| --- | --- |
| `npm test -- src/features/overview/chart-viewport.test.ts src/features/overview/ChartZoomControls.test.tsx` | 21/21 passed (16 viewport, 5 controls) |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run test:boundaries` | 33/33 passed |
| `npm run check:boundaries` | Passed: 112 modules, 15 production roots |
| `npm run build-storybook` | Passed; existing bundler `use client` directive warnings |
| `node /private/tmp/outage-overview-zoom-phase1-browser.mjs` | Passed: eight specimens, keyboard/focus and emulated-touch controls; no overflow or page errors |

The browser inspection used the fresh Storybook build served by
`node tests/tooling/serve-storybook.mjs` on port 6007 and installed Chromium
headless-shell 1243. Its first launch failed under the sandbox; the explicit
escalated retry was approved and passed. The temporary script and captures are
local review artifacts, not committed automated regression coverage.

## Partial acceptance evidence

Every AC below is **partial foundation evidence**, not connected acceptance.

| ACs | Observed foundation behavior | Remaining evidence |
| --- | --- | --- |
| AC1, AC11, AC21 | Mode-off controls, accessible names/help, Tab/Space/Enter and emulated-touch tap callbacks | Actual chart mode/defaults and focused chart shortcuts |
| AC2, AC3, AC4 | Zoom direction/progress, finite inputs, anchor error at most one day away from clamping; edge clamping preserves span | Wheel-to-SVG mapping and browser pointer anchoring |
| AC6 | Fixed-span calendar translation and bounded movement | Horizontal scroll and touch swipe integration |
| AC7 | Full-range reset helper and operable Reset with mode off | Connected chart reset/inspection behavior |
| AC10, AC13, AC18 | Full-range bounds, 15/14/1-day ranges, open bounds, sparse observations, invalid/reversed dates, leap/timezone invariance, years 0000/9999 | Rendered bounds and minimum controls within NationalTrend |
| AC23 | Unavailable controls dispatch no actions; limit buttons disabled | Empty-window recovery and stale chart lifecycle/input cancellation |

Viewport tests also check source nonmutation and nonfinite gestures. Timezone
cases cover UTC, America/New_York and Pacific/Auckland. No daily values or gap
presentation are reimplemented by this foundation.

## Isolated visual and browser review

Inspected supplied `docs/specs/web-client/evidence/overview-desktop.png` and
`overview-mobile.png` before composing controls. The controls are a prototype
extension using existing atoms, panel treatment and tokens; Figma fidelity and
human visual sign-off are not claimed.

The four `Features/Overview/ChartZoomControls` stories (`ModeOff`,
`NarrowedWindow`, `RetainedZoomModeOff`, `Unavailable`) were checked at 1440px
and 390px. Browser assertions verified visibility and button bounds, disabled
states, no document overflow, retained range when disabling, Reset behavior,
native keyboard activation and a visible computed focus outline. The narrow
context used emulated touch taps, not a physical touch device.

Agent image review of `keyboard-focus-1440.png`, `narrowed-window-390.png` and
`retained-zoom-mode-off-390.png` found legible wrapping help, contained controls
and visible focus. Captures reside temporarily in
`/private/tmp/outage-overview-zoom-phase1/`. Reproduce the specimens using the
committed stories after a fresh build; temporary artifacts may expire.

No connected chart, native wheel/trackpad/swipe/pinch, production build, live
backend, human visual sign-off, push or deployment is claimed. Those gates remain
in the later tasks; this checkpoint accepts the independently testable foundation.
