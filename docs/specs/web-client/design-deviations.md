# Design deviations — T1.3

Recorded October 4, 2026 from the [design inventory](design-inventory.md),
the ten saved references and freshly revalidated published JS/CSS sources in
[asset provenance](assets.md). This ledger contributes to FR1/TR10/AC1;
implementation and visual acceptance remain separate.

**Required** entries implement accepted scope/behavior. **Proposed** entries
identify a solution to inspect during implementation; they are not silently
approved visual decisions. Preserve the prototype's hierarchy, panels, color
and density while documenting concrete differences in downstream evidence.

## Required corrections C1–C11

| ID / affected views | Inspected evidence | Required treatment and verification trace |
| --- | --- | --- |
| C1 — V1, S1, V2–V4 | V1 local username/password form; S1 persona selector; bundle initially authenticated | Replace form with Cognito code/PKCE entry CTA, omit production persona control, withhold protected shell while pending; add callback/expiry/denial/error presentations. Branded centered card stays. FR2–FR6, TR6; AC2–AC6. Exact session transport remains Q2-gated |
| C2 — V2–V4, S1 | Fixed June 2025 sample values, 2018–2025 coverage, hardcoded catalog/SQL names | Use authorized catalog/coverage/contracts in live UI and label fixture demos synthetic. No claim that sample counts/names are live. FR7/FR18, TR7; AC7/AC18 |
| C3 — V3 | Preview footer shows `1–6 of 14`; hardcoded slice navigation | Snapshot-bound opaque cursor continuation; reset selection/filter/size; explicit expiry/restart. Show previous only with same-context valid cached pages or agreed support; totals only when supplied. FR8–FR9/TR4; AC8–AC9 |
| C4 — V4 | Bundle timer/string matching and fixed national result table; captures show only ready/success | Explicit backend execute through adapter; arbitrary ordered positional columns/duplicates; query-ID numbered retained pages with fixed size; draft/result origin distinction. Never rerun for paging/retry/focus. FR12–FR16/TR5; AC12–AC16 |
| C5 — V4 | Compiled timeout message claims 30-second prototype limit | Describe accepted 10-second backend execution deadline separately from end-to-end timing; no invented cancellation or elapsed guarantee. FR16/TR5; AC16; live response details Q3-gated |
| C6 — V2–V4 | Card 7.15%, tooltip 7.2%, reported table 7.2; JS number formatting | Both calculated/reported values use agreed exact/display decimal half-up two-decimal labels everywhere; zero differs from missing. Approximate chart coordinates never supply labels; no mismatch flags. FR10–FR11; AC10–AC11/AC20 |
| C7 — V2–V4 | Compiled incomplete date/search demo controls; V4 Ctrl+Enter hint | Real controlled filters/search; valid date range; explicit keyboard Run submits once. Authorized schema only. FR7–FR8/FR12/FR17; AC7–AC8/AC12/AC17 |
| C8 — compiled Admin path | Admin refresh/reload-new-data source, absent from four core views | Exclude Admin UI and deferred new-data action/card until separately scoped. No core atom/feature solely for refresh. Scope; T1.3 does not authorize implementation |
| C9 — S1 | Read-only available-through/updated sidebar box | Keep coverage display when authorized metadata exists; do not turn it into the deferred new-data notification/refresh flow. FR7; AC7 |
| C10 — all views | Happy-path captures omit full loading/access-loss/expired/busy/unknown-outcome states | Add distinct required states and deliberate recovery, stable pending layouts and async announcements. Expired preview restarts; lost query result needs explicit Run; lost execute response explains uncertainty. FR3–FR6/FR9/FR14–FR18; AC3–AC6/AC9/AC14–AC18 |
| C11 — V1, S1, A1–A3 | Visible CSS brand/inline vectors; unknown Make image links | Use identified brand/icon geometry and licensed fonts; screenshots remain references. Four Make PNGs stay unread/unassigned. Verify installed font weight/loading before exact typography sign-off. FR1/TR10; AC1 |

C1/C10 require new layouts/content for states absent from screenshots. Their
necessity is accepted; precise geometry/copy remains reviewable in stories.
Q2/Q3 block affected live behavior only, not deterministic synthetic states.

## Accessibility and responsive extensions

| ID / status | Evidence and affected consumers | Treatment / downstream acceptance |
| --- | --- | --- |
| D1 — required behavior, visual values proposed | A1–A3 across V1–V4: observed metadata 8–11px and buttons minimum 32px | Keep readable contrast/text and usable targets; propose targeted text/target increases where keyboard/zoom/touch checks show a need. Record actual before/after values and wrapping changes; no blanket type-scale redesign. FR17/AC17 |
| D2 — required behavior, mechanism proposed | S1 narrow drawer screenshot only demonstrates appearance | Keyboard trigger/close, appropriate semantics, managed focus and return focus; propose Escape close and background interaction exclusion. Verify deterministic open/closed states at 390px and 999/1000/1001px. FR5/FR17; AC5/AC17 |
| D3 — required data alternative, layout proposed | V2 narrow chart scales labels/marks very small | Preserve gaps and supply complete accessible observations with both exact percentages. Propose a responsive plotting area/label density adjustment if legibility fails; retain all underlying observations. Compare at 759/760/761px and 390px. FR17/FR20; AC17/AC20 |
| D4 — required usability, mechanism proposed | V3 wide table overflows; V4 narrow textarea wraps while line gutter reflects logical lines | Contain overflow while retaining meaningful columns/editor content. Propose no-wrap horizontal editor scrolling or synchronized visual-line gutter after usability review; preserve submitted SQL unchanged. Check keyboard/zoom and 479/480/481px. FR11–FR12/FR15/FR17; AC11–AC12/AC15/AC17 |
| D5 — required semantics, styling proposed | A2 compare control/tabs; A3 CSS spinner/dots | Semantic labeled controls, visible focus, keyboard tabs/compare, textual status, async announcements; reduced-motion loading presentation if needed. Newly styled focus/disabled/loading states are extensions to the saved static evidence. FR16–FR17; AC16–AC17 |
| D6 — required scope exclusion | All saved captures show Figma publication/remix banner | Omit hosting banner; synthetic fixture label stays visible separately under FR18. Do not count banner absence as a fidelity defect. AC1/AC18 |

Observed responsive rules remain at/below 1000px drawer, 760px stacked layouts,
480px stacked filters/pagination. Reference comparisons use 1440×1100 and
390×1100. Q4 final browser acceptance is unresolved; boundary checks and these
static references do not establish browser certification or approve a
pixel-difference threshold.

## Mapping and evidence contract

- **V1:** sign-in desktop, A1 brand/text/actions, A2 obsolete credential fields,
  A3 card/loading/error: C1/C10/C11, D1/D5/D6.
- **V2:** Overview desktop/narrow, A1 typography/icons, A2 dates/compare,
  A3 cards/status: C2/C6/C7/C10/C11, D1/D3/D5/D6.
- **V3:** preview/schema desktop and narrow, A1 table/SQL/info icons,
  A2 filters, A3 grain/status/surfaces: C2/C3/C6/C7/C10/C11, D1/D4/D5/D6.
- **V4:** ready/results desktop and narrow, A1 copy/play/schema/status icons,
  A2 search/editor, A3 read-only/results/status: C2/C4–C7/C10/C11,
  D1/D4/D5/D6.
- **S1:** desktop V2–V4 shell and narrow drawer, A1 brand/navigation/logout,
  A3 coverage/role/status: C1/C2/C8/C9/C10/C11, D1/D2/D5/D6.

Downstream records must name task/component ID, story or route, state,
viewport, screenshot, actual difference, FR/TR/AC trace and reviewer result.
Keep fixture behavior, visual comparison and live evidence separate. Mark
proposed values accepted only after review; do not infer acceptance from this
ledger's existence or from a successful build.

## T1.3 verification limits

All ten saved images were visually inspected. Fresh bundle/stylesheet hashes
match the inventory; actual inline sources and official font licenses were
verified as recorded in assets.md. This task adds documentation only: no
new visual, keyboard, font-load, fixture-runtime or live checks ran. C1–C11
and A1–A3/V1–V4/S1 mapping is ready for coordinator review; no downstream
acceptance checkbox is marked here.
