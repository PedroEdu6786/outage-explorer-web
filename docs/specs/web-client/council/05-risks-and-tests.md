# Outage Explorer web client — Risks & Test Scenarios

## Edge cases

| ID | Case → expected handling | Trace |
| --- | --- | --- |
| EC1 | Initial unresolved session → no protected shell/data flash | FR5 |
| EC2 | Analyst logs out, Viewer signs in before metadata/result/401 resolves → obsolete success/error cannot affect Viewer | FR4–FR6 |
| EC3 | Capability reduction while schema menu or intent is pending → clear restricted metadata and reject old intent | FR6, FR21 |
| EC4 | Filter/dataset/size changes with old preview request in flight → new sequence wins | FR8 |
| EC5 | Publication during preview; first-page fixed expiry reached → retain original snapshot then explicit restart | FR9, TR4 |
| EC6 | Missing national date, zero outage, decimal tie, leading-zero ID → distinct availability and exact display | FR10–FR11, FR20 |
| EC7 | Draft changes while pages of earlier execution are visible → result origin remains submitted SQL | FR12–FR13 |
| EC8 | Same SQL deliberately rerun → new execution identity; no cache reuse as authority | FR12–FR14 |
| EC9 | Duplicate row/column labels, null, huge integer/decimal → positional representation preserves all values | FR11, FR15 |
| EC10 | Final short page of truncated result → whole-result truncation remains visible | FR15 |
| EC11 | Execute request response lost → unknown outcome; no automatic replay or fake cancellation | FR16 |
| EC12 | Focus/reconnect/keyboard double event during Run → no unintended extra execution | FR12–FR16 |
| EC13 | Query ID lost on backend restart/TTL expiry → no implicit page 1 or rerun | FR14 |
| EC14 | Mobile drawer, long labels/table columns, wrapped editor, chart gap → keyboard/narrow access retained | FR17, FR20 |
| EC15 | Production backend misconfiguration or outage → fail closed, never fixture identity/data | FR18 |
| EC16 | Explorer opens SQL with unsaved edited draft → explicit replacement action and zero execution | FR21 |

## Failure modes

| ID | Failure / blast radius | Mitigation and gate |
| --- | --- | --- |
| FM1 | Features independently own incompatible catalog/session contracts | D1/D5 shared prerequisite contracts and fixtures; per-lane dependency audit |
| FM2 | Runtime adapter selector bundles detail fixtures/persona controls | D4 source reachability + emitted artifacts + production failure browser check |
| FM3 | Prototype copied as production authority | Inventory C1–C11 deviation ledger; live contract record; no mock password/SQL parsing |
| FM4 | “Pages last” delays all integration learning | D8 composed harness before any product page |
| FM5 | Large shared-foundation gate idles independent lanes | D2 lane-specific prerequisite acceptance; shared changes serialized |
| FM6 | Fixture semantics differ from real SQL/session transport | D3 per-operation contract gate and separate live evidence; release stays incomplete |
| FM7 | Exact table values but imprecise card/chart labels | D7 common decimal-tie fixtures at every display surface; plotting approximation never reused as value |
| FM8 | Generic error handler signs out current user on stale previous-session response | D5 generation check before side effects, not only before assigning rows |
| FM9 | Network loss interpreted as failed SQL and retried | D6 unknown-outcome state/call trace; deliberate new execution disclosure |
| FM10 | Shared-file edits collide under parallel markers | One owner for root configuration, contracts, shared exports/layout/navigation; explicit predecessors |

## Key test scenarios

- **TS1:** Given unresolved session, when any protected composition mounts, then no protected data/navigation appears; later permitted capability resolution reveals only authorized content. Covers AC5–AC6.
- **TS2:** Given Analyst catalog, schema and query requests, when logout then Viewer sign-in occurs before late successes and failures arrive, then every old callback is ignored and Viewer remains valid without detail metadata. Repeat capability reduction. Covers AC4–AC6, AC19.
- **TS3:** Given session A and independent session B in a real environment, when A signs out or expires, then A loses backend access and B follows its independent policy. Fixture results cannot prove this. Covers AC2–AC4.
- **TS4:** Given a preview cursor and snapshot, when filters/size change or new data publishes, then selection resets only when requested and continuation retains its snapshot; expiry from first page requires restart. Covers AC7–AC9.
- **TS5:** Given exact decimal ties, `null`, valid zero, missing dates and opaque IDs, when cards, tables and tooltip labels render across timezones, then two-decimal half-up labels and calendar dates remain correct. Chart coordinates may approximate but never invent observations. Covers AC10–AC11, AC20.
- **TS6:** Given draft A, when Run → draft B edit → next → previous → focus/reconnect → expire → explicit rerun occurs, then the call log shows one execution before rerun, unchanged A, original ID/size for pages and a new ID only after deliberate rerun. Covers AC12–AC14.
- **TS7:** Given arbitrary SQL projections with duplicate labels/rows and whole-result truncation, when a short page renders, then ordered metadata and multiplicity survive and truncation stays visible. Covers AC15.
- **TS8:** Given each failure fixture including lost execute response, when recovery is offered, then unknown outcome differs from confirmed timeout/denial and no replay/cancellation promise is made. Covers AC16.
- **TS9:** Given production import graph and build outputs, when fixture sentinels/demo identities are searched and backend fails, then no fixture path/chunk/persona/synthetic fallback is present. Include import analysis beyond string scanning. Covers AC18.
- **TS10:** Given all four feature entries and shared session/catalog context in the harness, when Overview→Explorer→SQL intent transfers, then context is authorized, draft replacement explicit and no query runs automatically; repeat after access loss. Covers AC19, AC21.
- **TS11:** Given inspected views at 1440 and 390 and breakpoint boundaries, when keyboard/zoom/narrow interactions are exercised, then controls/tables/editor remain operable, drawer focus returns correctly, chart data has an accessible equivalent and deviations are recorded. Covers AC1, AC17, AC20.

## Accepted risks

- Live contracts remain unprovided: accepted for fixture progress by the user and council D3; not accepted for release.
- Published preview replaces inaccessible editable Make context for planning; asset provenance and missing interaction states remain explicit phase 1/visual gates.
- Shared ownership creates a small coordination cost: accepted in D1/D2 to prevent cross-lane contract drift.
- Bounded SVG/textarea may need usability corrections: keep corrections local and evidence-driven; advanced chart/editor scope needs a new requirement.
- No timing/team capacity estimate, deployment platform, backend readiness or completed test result is inferred from these documents.
