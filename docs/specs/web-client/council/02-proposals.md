# Outage Explorer web client — Proposals

Three independent blind proposals were returned by the named persona agents after reading only the canonical spec for domain context. This record preserves their approaches, differences, cuts and admitted risks; it is not a claim of independent votes by the Chair.

## Proposal A — Small shared UI, explicit feature controllers, separate release gates

Author: **rafachafa (Pragmatist Senior Dev)**.

- **Approach:** Build only shared UI required by the four inspected views; freeze public contracts, then run independent features in an isolated environment. Assemble product routes after feature checkpoints. Avoid an internal UI platform and wrappers with no reusable purpose.
- **Tooling recommendation:** Next.js App Router, npm/lockfile, strict TypeScript, Tailwind; Storybook for isolated demos; Vitest/React Testing Library for seams; Playwright for browser/screenshots; Zod at HTTP boundaries. Verify compatible versions at bootstrap. Start SQL editing with an accessible textarea. Use local React state/reducers and native fetch plus cancellation/session-generation checks; no global store or generic query cache.
- **Boundaries:** Shared components and slot templates; auth, catalog/preview, overview and SQL features; one API decoding/mapping boundary. Separate execute-SQL and read-result-page operations. Backend capabilities drive presentation; no reconstructed permission policy. Fixture and eventual live adapters implement the same feature-facing seam.
- **Phase outline:** (1) Evidence/contracts/deviations and cross-view intents; (2) tooling, atoms, molecules, table and templates; (3) parallel auth, Explorer, Overview and SQL fixture lanes; (4) cross-feature integration checkpoint with real adapters where available; (5) individual pages last and potentially concurrent; (6) separate release acceptance requiring live sessions/APIs, negative-access tests and visual evidence.
- **Data-model changes:** No durable frontend model. Ordered columns/positional cells, opaque IDs/calendar dates, precision-preserving values, preview sequence, retained SQL execution, session generation; draft distinct from submitted SQL.
- **Explicitly cut:** Global cache, query history, generic workflow framework, speculative component kit, SQL parser, custom credentials, universal paginator, Admin screen and deferred status card.
- **Author-admitted risks:** Textarea usability may require reassessment; chart renderer needs a bounded decision; manually owned requests require stale-response testing; foundation owner can bottleneck; live transport is a release dependency.
- **Traces to:** FR1–FR21; TR1–TR10, especially FR19/TR8/TR10.

## Proposal B — Contracted feature lanes with a shared presentation foundation

Author: **gamachiel (Architect)**.

- **Approach:** Establish stable presentation and feature contracts before concurrency. Foundation owns primitives, templates and generic tabular presentation; feature owners own behavior; pages connect completed features. App Router is proposed, with focused client boundaries and workflow-free templates.
- **Ownership:** Foundation owns tokens/components and shared contract changes. Session/integration owner defines identity/capabilities/expiry/invalidation generation and live transport. Dataset lane owns catalog/schema/preview and exposes a public catalog operation for SQL. Overview owns national cards/trend/exact display; chart coordinates do not replace authoritative values. SQL owns separate draft/submission/execution/page actions. Assembly owner owns routes/navigation and authorized handoffs that never silently replace edited SQL.
- **Phase outline:** (1) Evidence/contracts/ownership checkpoint with fixture scenarios; (2) atomic foundation and isolated templates, no product pages; (3) four parallel fixture lanes using already-available catalog/session contracts; (4) page assembly after feature checkpoints, serializing shared layouts/navigation; (5) live acceptance after API/session agreement.
- **Data-model changes:** Session/capabilities, catalog, calendar selection, preview sequence, exact metric observations, retained SQL execution, ordered metadata and positional rows; separate from raw DTOs. No database changes.
- **Explicitly cut:** Global domain store, universal grid, generic pagination lifecycle, shared SQL engine, speculative plugin system, production prototype-code dependency, Admin UI and additional charts.
- **Author-admitted risks:** Shared ownership bottleneck; fixture contracts may need live corrections; late routes may expose handoff defects, so exercise handoffs inside fixture previews; published evidence does not establish unread asset provenance.
- **Traces to:** FR1–FR21; TR1–TR10, especially FR4–FR6/TR6 and FR19/TR8.

## Proposal C — Demonstrate trustworthy workflows before assembling pages

Author: **kings (Product)**.

- **Approach:** Review operable milestones, always labeled synthetic. Establish the shared minimum, then start each feature when its own prerequisites pass; do not wait for a general component-library completion milestone. Validate Viewer national-only discovery, stable preview snapshots, one-execution SQL and accurate metric/missing-data meaning before route assembly.
- **Phase outline:** (1) Review contract: map four views, design deviations, operation/handoff contracts; (2) atoms upward into only needed fields/status/table/navigation/layout compositions; (3) parallel session/access, Overview, Explorer and SQL fixture demonstrations; (4) mandatory pre-page integration-seam proof, including access-loss and delayed responses, with real adapters wherever available; (5) final individual page assembly, then release qualification with separate live and design evidence.
- **Ownership:** Every lane receives fixtures implementing stable seams, not a sibling's unfinished controller. Shared changes have one owner and update dependents. Pages can be concurrent after shell/navigation contracts stabilize. Avoid a global feature-completion barrier beyond actual shared prerequisites.
- **Data-model changes:** View models for authorized metadata, exact values/dates, preview context, separate SQL draft/submission/execution, positional results, typed failures and authorized navigation intents. No durable storage or query history.
- **Explicitly cut:** Admin screen, saved queries, exports, speculative charts, component-framework project, prototype credential handling and deployment.
- **Author-admitted risks:** Fixture success can hide wrong integration assumptions; shared components may need revision after use; late routes can expose navigation defects, hence mandatory harness checks; unresolved responsive/API inputs block their sign-offs.
- **Traces to:** FR1–FR21; TR1–TR10, especially FR18–FR21/TR8–TR9.

## Outcome

- **Selected:** revised A/B/C synthesis: A's minimal tooling/controllers, B's explicit boundary ownership and C's reviewable fixture milestones.
- **Rejected as originally worded:** a whole-foundation barrier before any lane (kings/estebanquito objection); allowing individual pages before all feature/seam checks (rafachafa/gamachiel objection to C's ambiguity); dataset-owned availability that blocks SQL (rafachafa/estebanquito); optional rather than mandatory pre-page harness (kings/estebanquito/ponykiller objection to B).
- **Common omissions corrected:** verifiable live-contract gate, structural fixture exclusion, all-outcome session generation guards, unknown query outcome and adversarial exact-value/call-trace evidence.
- All three authors conceded the concrete revisions with `tick tick tick`; no proposal was accepted unchanged. Round 2 Risk, Infra and Delivery closure found no remaining planning blocker. See [decisions](03-decisions.md) and [debate ledger](04-debate.md).
