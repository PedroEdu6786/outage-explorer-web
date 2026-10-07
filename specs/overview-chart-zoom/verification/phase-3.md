# Overview chart zoom: phase 3

Status: assembled fixture behavior accepted, October 7, 2026. T3.1–T3.3/T3.C
complete; final browser/motion/device/live gates remain phase 4.

## Revision and changes

- Branch `feat/overview-chart-zoom`; base `555d02f`.
- Tested tracked/untracked nonignored tree SHA-256 before checkpoint/status/log
  edits: `7f52564f5be1c7d0c04a5827017599268c56e3c2208caf37fcbdfe70d07ec590`.
  Uses the verification guide's sorted path/content algorithm; source remained
  unchanged between the final run and digest capture.
- OverviewFeature passes `interactive=false` to retained chart content while
  preserving its inert wrapper and existing generation/date/snapshot key.
- Overview and retained-series regressions cover chart-only scope and protected
  lifecycle; opt-in long-range feature/page stories use the phase-2 fixture seam.
- PageDemo imports actual routes. Existing default scenarios are unchanged;
  two long-range scenarios are explicit synthetic-only options.

## Executed checks

Node 24.18.0, npm 11.16.0, macOS, existing locked dependencies and Chromium 1243.

| Command | Result |
| --- | --- |
| `npm test -- src/features/overview/overview.test.tsx src/features/overview/retained-series.test.tsx` | 39/39 passed; six additional zoom scope/lifecycle cases |
| `npm run typecheck` / `npm run lint` | Passed |
| `npm run test:boundaries` | 33/33 passed |
| `npm run check:boundaries` | Passed: 113 modules, 15 production roots |
| `npm run build-storybook` | Fresh build passed; existing directive warnings |
| `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/browser/overview-page.spec.ts` | 4/4 passed; includes long-range actual-page scenarios at 1440px and 390px |

The first browser launch hit sandbox port6007 restrictions; approved escalation
started the managed server/browser. Initial new assertions compared rendered
table innerText with raw textContent; using innerText consistently corrected the
test-only mismatch. Final four scenarios passed. The phase-2 manually started
server was stopped before this managed run; Playwright owns cleanup of its server.
Staged whitespace/diff and append-only journal reviewed before commit.

## Acceptance evidence

| ACs | Assembled fixture proof |
| --- | --- |
| AC7, AC16, AC23 | Reset restores full applied dates; disable retains the current window; retained content exposes disabled controls and an unfocusable chart, with no consumed wheel event |
| AC8 | Cards, paginated table rows/page size, applied date fields and complete fixture call log remain unchanged through zoom/pan/reset/compare; actual-page browser checks repeat at desktop/narrow widths |
| AC15, AC17 | Actual Overview begins mode-off; draft/unchanged date submit preserves zoom; changed applied bounds reset to full new range and mode-off; exactly one additional series read occurs for the date apply |
| AC17 / lifecycle constraints | Published snapshot reload preserves applied dates but creates a fresh disabled full viewport; logout/expiry/pending/capability loss removes zoomed retained data immediately and a late response cannot restore it |

Existing page checks still verify exact values, date filtering and authorized
handoff, plus immediate protected-content removal during session withholding.
Feature acceptance preceded this page assembly; no services, route architecture,
external runtime configuration or shared atoms were changed.

No authenticated live request, physical-device gesture, Figma fidelity or human
visual acceptance is claimed. The user will perform the live test. Native gesture,
motion and final build/artifact checks remain phase 4; no push/deployment.
