# Debate ledger

## Round 1 — independent critique

All six personas critiqued independently after three blind proposals. Each steelmanned the alternatives before raising objections. The Chair grouped duplicate objections below. The Engineering Manager used High/Medium and Infra used important; these are normalized to major/minor where their stated impact is nonblocking. Explicit blocking findings retain that severity.

| ID | Point | Raised by / targets | Severity | Failure scenario | Required revision |
| --- | --- | --- | --- | --- | --- |
| D1 | Shared metadata/session ownership and availability | gamachiel → A/C; rafachafa, estebanquito → B | major | SQL waits on Explorer or restores restricted metadata after downgrade | Integration-owned public catalog/schema/session contracts and fixtures available before fork; no sibling controller imports |
| D2 | Lane-specific foundation readiness versus final pages-last gate | kings, estebanquito → A/B; rafachafa, gamachiel → C | major | Auth waits for unrelated chart work, or early page assembly precedes shared seam proof | Per-lane component prerequisites; all four feature checks and composed harness before any product page |
| D3 | Evidenced live operation contract gate | ponykiller → A/B/C | blocking | Real auth/SQL adapters disagree on expiry, errors or credentials after fixture success | Integration owner records backend version/environment, request/response/errors, session transport and SQL limits/TTL/delivery before relevant live adapters |
| D4 | Production fixture exclusion | cuid → A/B/C | blocking | Hidden fixture selector still bundles restricted synthetic rows/persona controls, or missing config selects demo | Separate test composition root, no production transitive imports, fail-closed config, import/asset sentinels plus production-mode failure test |
| D5 | Shared generation guards both successful and failed responses | cuid → A/B/C | blocking | Analyst response restores schema to Viewer or old 401 logs out new session | One identity/access generation across results, metadata, autocomplete, errors and delayed handoffs; test whole composed lifecycle |
| D6 | Ambiguous execute-response loss | ponykiller → A/B/C | major | Browser timeout presented as no execution; retry duplicates work | Explicit unknown-outcome state, no invented cancellation/lookup/replay; deliberate new Run disclosed as new execution |
| D7 | Adversarial precision and retained-result proof | cuid → A/B/C | major | Tooltip binary-rounds a tie or pagination submits edited draft | Shared adversarial fixture values and observable execution/page call logs, with separate live traces |
| D8 | Mandatory composed seam gate | kings, estebanquito, ponykiller → B | major | Isolated features pass but handoff overwrites SQL or logout restores protected state | Required shared harness before pages; fixture gate separate from live release |

## Author responses and convergence

All three authors conceded the revisions with `tick tick tick`; their original arguments and concessions are retained in [03-decisions.md](03-decisions.md). No Chair vote or simulated persona agreement was used.

| Finding | Author revision | Round 2 closure | Status |
| --- | --- | --- | --- |
| D1/D2/D8 | Shared executable contract prerequisites, per-lane readiness, all-feature + composed fixture gate before pages | estebanquito: “E1, E2 and E3 are closed”; no sequencing contradiction | Closed in plan |
| D3/D6 | Evidenced per-operation live gate; unknown-outcome query recovery | ponykiller: “D3 closes”; recovery and parallel-readiness concerns close | Closed in plan |
| D4/D5/D7 | Separate test root; import/output/failure audit; generation guards errors and successes; adversarial precision and call logs | cuid: D4/D5 closed at planning level; precision/execution evidence addressed | Closed in plan |

Converged after one critique/response round and one focused closure round. Nonblocking final constraints: task graph must not depend on blanket phase-5 completion; production routes remain live-only; exact live owner/contract decisions remain unresolved release dependencies. No runtime acceptance test was claimed by this review.

## Executable task audit

estebanquito reviewed the completed task graph and found that late live-adapter
registration was assigned in prose but lacked a dependency checkpoint. Fixture
pages and isolated adapters could both pass while production still used
unavailable operations. The task breakdown adds a separate production
registration checkpoint before live release verification, outside the fixture
page milestone. The audit otherwise accepted parallel ownership, lane-specific
readiness, shared prerequisites and the all-feature/harness page gate.
