# Plan: Outage Explorer web client
> Status: backend auth working and ready for frontend integration (user-confirmed October 5); data adapters prepared; frontend integration and live acceptance pending · Slug: web-client · Spec: ./spec.md

## Approach

Use a small shared atomic UI foundation and four independently owned feature compositions for the inspected Sign in, Overview, Dataset Explorer and SQL Workspace views. Start each feature when its own shared components and fixture contracts are ready; require all four feature checkpoints and a composed integration-harness checkpoint before assembling individual product pages. Keep fixture demos and live adapters behind the same feature-facing operations, with physically separate composition roots and distinct release evidence. This is the revised A/B/C synthesis recorded by the council, grounded in the [design inventory](design-inventory.md). (FR1–FR21; TR1–TR10)

## Components affected

- **Foundation:** tokens/styles, semantic atoms, domain-free molecules, reusable DataTable/AppNavigation/AppHeader organisms and slot-based templates. Implement evidenced variants and required states; do not wrap every element. Shared UI receives view props/callbacks, never transport/session storage or feature internals. (FR1, FR17, FR19; TR2, TR10)
- **Shared contracts and session runtime:** public operation/view models, one identity/access generation, request guards and authorized catalog/schema seam. The integration owner supplies these contracts and executable fixtures before concurrent consumers start. Every success, error, metadata response and handoff is checked against the captured generation before publication or global side effects. (FR4–FR7, FR19, FR21; TR6–TR8)
- **Auth feature:** managed-login entry, session pending/expired/denied states and logout cleanup. The branded sign-in card remains; local password inputs and persona switching are demo-only and excluded from product composition. (FR2–FR6, FR16)
- **Overview feature:** national metric cards, controlled date range, two-series national trend/compare control, precise tooltip labels and accessible daily-observation table. Start with the bounded SVG chart shape evidenced in the prototype; no general chart framework. Missing dates produce separate segments, not interpolation. Approximate plotting coordinates never supply display percentages. (FR10–FR11, FR17, FR20)
- **Explorer feature:** authorized dataset selection, schema, applicable filters, preview lifecycle and explicit restart. Catalog metadata is supplied through the shared operation, not an Explorer-private implementation required by SQL. (FR6–FR9, FR16, FR21; TR4)
- **Queries feature:** authorized searchable schema browser, controlled textarea/line numbers, Copy and explicit Run/keyboard action, distinct draft/submission/retained execution, numbered pages, truncation and typed recovery. No SQL parser, global query cache or implicit execution. (FR11–FR17, FR21; TR5)
- **API adapters:** runtime decoding and mapping for agreed live operations. Use Zod at untrusted JSON boundaries; transport DTOs are separate from feature models. Credential exchange/forwarding belongs only to the agreed auth integration. (TR3, TR6–TR7)
- **Composition and routes:** proposed paths `/sign-in`, `/overview`, `/datasets`, `/query`; root navigation redirects into the session-gated experience. These are production choices, not observed prototype URLs. Product route modules remain thin; the shared layout/navigation registration has one owner. Feature entries expose narrow public exports. (FR1–FR6, FR19, FR21; TR2, TR8)
- **Verification:** Storybook fixture composition root; Vitest/React Testing Library behavior tests; Playwright composed/browser/visual tests; import-boundary and production fixture-exclusion checks. (FR17–FR19; TR8–TR9)

## Data model changes

No durable frontend store or backend database changes. Proposed frontend contracts below are not HTTP schemas. (TR3, TR7)

| Model | Required semantics | Trace |
| --- | --- | --- |
| Session state | Pending, unauthenticated, authenticated or expired; backend identity/capabilities/expiry; monotonically changing local identity/access generation | FR2–FR6 |
| Authorized catalog/schema | Opaque dataset IDs, agreed SQL names, ordered columns/types/units, applicable filters and coverage; permissions already applied by backend | FR6–FR7 |
| Preview sequence | Dataset/applied filters/effective size, original snapshot, opaque next cursor and original expiry; local selection generation | FR8–FR9, TR4 |
| National observation | Calendar date, exact/display capacity/outage/percentages, null availability and provenance; independent plotting coordinates | FR10–FR11, FR20 |
| Tabular view | Ordered column IDs/labels/types and positional typed cells; duplicate labels and rows preserved; row identities include position/execution context | FR11, FR15 |
| Query lifecycle | Draft; captured submitted text; executing/unknown-outcome/failure; retained query ID/snapshot/fixed size/selected page/expiry/truncation | FR12–FR16, TR5 |
| Navigation intent | Authorized dataset/filter context and captured identity/access generation; no credentials or SQL in URLs; expired intents discarded | FR21, TR6 |

Keep state in feature React controllers/reducers. The common session runtime coordinates invalidation without becoming a global domain store. Clear protected results/metadata/pending handoffs on logout, identity change or capability reduction; do not let a delayed old error invalidate a new session. (FR4–FR6; TR6)

## Interfaces & contracts

These are feature-facing responsibilities, not invented endpoint paths. The integration owner controls shared changes and affected consumer tests. (TR7–TR8)

October 5 current agreement: cookie sessions, backend-owned Cognito callback and
CSRF transport are documented. The backend assigns roles and controls effective
capabilities; the frontend sends no permission claims, does not derive capabilities
from role names, and does not require a role in the response. The user confirms
backend auth works and is ready for frontend implementation. Confirm the current
session capability fields during T5.3 intake; do not wait for backend auth to be
built or for data endpoints to become available. The [data contract](contracts/data-api.md)
and SQL settings are supplied; local data adaptations are implemented and tested
with controlled responses. Backend source corrections are user-owned. See
[auth authority](contracts/auth.md), [adaptation evidence](verification/contract-adaptation.md)
and [readiness revision 6](contracts/live-readiness.md).

| Operation | Input → output / behavior | Trace |
| --- | --- | --- |
| Resolve session / begin login / logout | Resolve backend identity/capabilities/expiry; navigate to backend login (Flask owns PKCE/callback); confirm current-session logout | FR2–FR6 |
| List datasets / read schema | Session context and dataset ID → authorized catalog/schema/coverage; shared by Explorer and Queries | FR6–FR7 |
| Start/continue preview | Selection/effective size or opaque cursor → ordered rows, snapshot, cursor/expiry and supported navigation metadata | FR8–FR9 |
| Read national series | Authorized date selection → exact observations, coverage and same-observation metric values for cards/trend/table | FR10–FR11, FR20 |
| Execute query | Explicit submitted SQL and agreed positive page/size → result or execution state; no automatic replay | FR12, FR16 |
| Read query page | Query ID, requested page, fixed effective size → same execution's columns/rows/truncation; no SQL argument | FR13–FR15 |
| Consume navigation intent | Authorized dataset/filter context → selection or proposed unsent draft; edited draft replacement is explicit | FR21 |

- Failure states: unauthenticated, forbidden, invalid input, unsupported SQL, unavailable data, expired preview, expired/lost result, busy, execution timeout, unknown execution outcome and service failure. Do not invent HTTP status/error identifiers before agreement. (FR16, TR7)
- A lost execute response is not proof of failure/cancellation. Preserve safe submitted/draft context, explain uncertainty and require a new deliberate Run; it may receive busy. Do not invent an execution ID, lookup or idempotent retry. (FR12–FR16)
- Preview previous navigation can revisit locally retained pages only within the same identity/snapshot/expiry, or use an agreed backend facility; otherwise omit it. Never promise random cursor jumps or totals. SQL navigation stays independently numbered. (FR8–FR9, FR13–FR14)
- Freeze only shared session invalidation, catalog/schema, operation/failure models, positional table data, cross-view intents and consumed shared props. Feature internals remain adjustable. Data transport is locally prepared; auth DTO/configuration and live verification remain pending. SQL contract settings are resolved. (FR19; TR7–TR10)
- **Live-contract gate:** record integration responsibility, backend environment/version, each operation's request/response/error/encoding/authorization semantics and applicable session exchange/storage/transport/callback/logout decisions. SQL additionally requires size defaults/maxima, TTL, delivery mode, out-of-range and unknown-outcome semantics. A completed record gates only its affected live adapter; all live records and evidence are required for release. (TR3, TR5, TR7, TR9)
- **Fixture boundary:** Storybook and test-only composition roots inject synthetic adapters/session providers. Production composition imports only live modules, fails closed when unavailable/misconfigured, and never imports an adapter selector that references fixtures. Verify both the source import graph and emitted artifacts; a missing marker alone is insufficient proof. (FR18; TR6, TR9)

## Implementation phases

The [technical execution plan](execution-plan.md) specifies exact cross-phase
start conditions, worker capacity, ownership handoffs and architectural/visual
review gates. Its [execution ledger](execution-state.md) records dispatch and
evidence when implementation is authorized.

1. **Evidence, toolchain and cross-lane contracts** — lock the observed scope/deviations and asset provenance, establish minimal Next.js bootstrap/tooling and public session/catalog/operation fixtures. Record Q2/Q3 gates without inventing transport. No product view implementation. Done: reproducible build/check commands, isolated preview, public contract examples and named ownership. (FR1, FR4–FR7, FR18–FR19, FR21; TR1, TR3, TR6–TR10)
2. **Tokens and atoms** — build the inspected token baseline and semantic primitives with typed variants, focus and disabled/loading states. Done: isolated atom examples and accessible interactions, with each component linked to an actual consumer. (FR1, FR17, FR19; TR1–TR2, TR10)
3. **Molecules, shared organisms and templates** — compose fields/date/search, statuses/tabs/pagination, positional tables, navigation/header and slot layouts. Done: named readiness checks for each lane's consumed components; no product pages. Auth can become ready without waiting for table/chart work. (FR1, FR11, FR15, FR17, FR19; TR2, TR8, TR10)
4. **Parallel feature compositions** — independent Auth, Overview, Explorer and Queries lanes own controllers, organisms, fixtures/stories and adversarial behavior checks. Each starts after phase 1 contracts plus its own phase 2/3 readiness checks, not an unrelated lane. Done: all four lane checkpoints and their public integration contracts pass. (FR2–FR21; TR2–TR9)
5. **Integration seams and gated live adapters** — mandatory composed fixture harness exercises common session/catalog context, cross-view intents, all protected invalidation paths and query call logs; separately implement live adapters only after their contract gate. Done for page readiness: all four feature checkpoints plus this harness pass. Live-adapter tasks may remain explicitly blocked without blocking fixture page assembly. (FR2–FR21; TR3–TR9)
6. **Individual pages last** — first finish shared protected layout/navigation wiring under one owner, then assemble Sign in, Overview, Dataset Explorer and SQL Workspace independently from approved templates/features. Verify each page's fixture journeys and observed-design comparison, then combined navigation. A separate live-registration checkpoint binds all completed adapters to production composition and reruns affected page checks before live release verification; it does not block fixture-page acceptance. This is the final UI implementation layer. (FR1–FR21; TR2, TR8–TR10)
7. **Release verification** — run the production build, fixture-exclusion/import audit, backend-failure test, actual session/permission/pagination/precision integration and responsive/keyboard/visual checks. Done: all ACs have separate fixture/visual/live evidence as applicable; missing live gates keep release incomplete. Deployment is not part of this plan. (AC1–AC21; TR1–TR10)

The numbered phases describe delivery layers, not a blanket prohibition on starting a lane whose actual predecessors have passed. Phase 6 is deliberately a global product-page gate. If API availability delays phase 5 live tasks, complete those transport tasks when inputs arrive; this does not create new UI pages or turn fixture demos into a release. (FR19; TR8–TR9)

## Dependencies & integrations

- **Selected by the user:** React, Next.js, TypeScript, Tailwind; separate Flask backend; existing visual design. **Recommended by this plan:** App Router, npm with committed lockfile, Storybook, Vitest/React Testing Library, Playwright and Zod. Exact compatible versions and Node runtime are pinned in phase 1, not inferred from the prototype bundle. (TR1, TR7, TR9)
- Use server rendering for suitable layout/composition and focused client boundaries for controllers/editor/filter interactions; keep credentials/server modules out of client serialization. [Next.js guidance](https://nextjs.org/docs/app/getting-started/server-and-client-components). (TR1–TR3, TR6)
- Use the supported Next.js integration for the isolated preview and feature stories; validate compatibility during bootstrap. [Storybook guidance](https://storybook.js.org/docs/get-started/frameworks/nextjs-vite). (FR19)
- Use Vitest/React Testing Library for controllers and synchronous components, and browser coverage for routing/async server integration. [Next.js Vitest guidance](https://nextjs.org/docs/app/guides/testing/vitest), [Playwright guidance](https://nextjs.org/docs/app/guides/testing/playwright). (TR9)
- Map inspected design tokens consistently to Tailwind; Zod validates agreed external payloads. [Tailwind theme variables](https://tailwindcss.com/docs/theme), [Zod documentation](https://zod.dev/). (TR1, TR7, TR10)
- No global state manager, grid/editor kit or additional chart package initially. The simple evidenced chart and textarea remain feature-local; revisit only if required usability fails. (FR17, FR20; TR10)
- Backend/Cognito configuration and versioned API/session agreement are external dependencies, not authorization to provision or deploy anything. (TR3, TR9)

## Risks & tradeoffs

- Shared contract ownership can bottleneck; keep only cross-lane minimum shared, serialize changes and name affected consumer checks. (FR19; TR8)
- Fixture contracts can diverge from backend; per-operation live gates and separate acceptance evidence prevent false completion. (FR18; TR7, TR9)
- Published prototype contains behavior conflicts; the inventory's C1–C11 corrections are part of delivery, not visual defects to reproduce. (FR1–FR18)
- Pages-last can hide integration defects; mandatory real-controller fixture harness resolves that risk before routes. (FR19, FR21)
- UI-state cancellation is insufficient for stale errors; common generation guards protect both response paths. Server requests still require backend authorization. (FR4–FR6; TR3, TR6)
- Small typography, dense mobile chart and textarea wrapping may require recorded accessibility extensions. Avoid copying inaccessible pixel values without review. (FR1, FR17, FR20)
- Simple SVG/textarea limits advanced interactions; those are not current scope. Reassess on acceptance evidence, not speculative future needs. (TR10)

### Alternatives considered

- Copy the Make application wholesale — rejects separate ownership, accepted session rules and real pagination/precision requirements. (TR2–TR7)
- Complete an exhaustive component library before feature work — delays independent lanes and creates unused abstractions. (FR19; TR10)
- Start pages as each feature finishes — conflicts with the user's final page-assembly stage and bypasses composed integration proof. (FR19, FR21)
- Universal preview/SQL paginator or auto-retrying query library — blurs distinct semantics and risks extra execution. (FR8–FR9, FR12–FR16)
- Implement a frontend OAuth exchange — conflicts with the accepted Flask-owned callback. Same-origin `/api` proxy is selected for local development; target values remain pending. (TR3, TR6–TR7)

## Test strategy

- **AC1:** Compare component/feature/page renders to saved design evidence at 1440/390 widths and around observed breakpoints; record approved behavior/accessibility deviations and asset provenance.
- **AC2–AC6:** Fixture session lifecycle plus composed Analyst → logout → Viewer and capability-reduction races; delayed metadata/results/errors must be ignored. Real Cognito/backend tests separately prove current-session invalidation, independent sessions and unauthorized direct/continuation requests.
- **AC7–AC9:** Contract fixture and live tests for permitted catalog/coverage, filter resets, stale selection results, publication during continuation, original preview expiry and explicit restart.
- **AC10–AC11, AC20:** Shared adversarial data: decimal ties, null/zero, missing calendar days, leading-zero/alphanumeric IDs; compare exact labels in cards/table/tooltips while allowing approximate plotted coordinates. Test date changes and accessible reported comparison.
- **AC12–AC16:** Observable call trace for Run → edit draft → next/previous → focus/reconnect → expired result → explicit rerun. Assert one execute before deliberate rerun, stable ID/size, unchanged submitted SQL, preserved duplicates/columns, whole-result truncation and unknown-outcome recovery. Repeat relevant traces against live backend.
- **AC17:** Keyboard-only labels/focus/tab/drawer/editor operation, status announcements, zoom and narrow overflow; scoped chart has equivalent accessible data. Browser matrix decision is Q4.
- **AC18:** Source import reachability plus emitted production artifact fixture sentinels; reject demo configuration in production and test backend failure on a production build. Fixtures remain test-only injections even for page demos.
- **AC19, AC21:** Verify exact task predecessors/ownership; four feature checkpoints and composed cross-view harness before page assembly; intents never trigger execution or silently replace edited drafts. Access loss invalidates pending intents.
- Run type, lint, production build and relevant behavior/browser checks selected by this plan. Existing controlled evidence is recorded in verification documents; future live acceptance requires actual connected checks. (TR9)

## Assumptions

- The user explicitly chose fixture demos first and required live integration before release.
- Product pages are the final UI assembly layer; framework bootstrap, isolated stories and integration harnesses precede them.
- Observed four-view grouping is selected; national Overview chart belongs to the supplied core design. Admin refresh UI and deferred status card remain excluded.
- Proposed production URLs and component names may differ from Make internals while preserving view behavior.
- Dependency-compatible versions, asset provenance and browser acceptance are verified at their named foundation gates. No duration/headcount estimate is implied.

## Open decisions

- **Q2:** Auth transport/routes/payloads are documented in the [auth handoff](contracts/auth.md). Backend integration owner/person, target environment/version, frontend identity/capability/logout mapping and [data-contract reconciliation](contracts/contract-review.md) remain pending; v1 service DTO/error/encoding artifacts are now received. Blocks affected phase 5 live tasks and release, not fixtures.
- **Q3:** [SQL v1 contract](contracts/sql.md) now supplies default100/max500, fixed15-minute expiry, synchronous delivery and out-of-range recovery. Source fixture corrections, frontend reconciliation and backend runtime/live evidence remain pending.
- **Q4:** Browser/viewport acceptance beyond inspected references. Proposed baseline includes current Chromium/Firefox/WebKit, 1440/390 widths and observed breakpoint boundaries; confirm before final visual/browser sign-off.
- **Asset gate:** Resolve font/icon/logo provenance and usable authoritative assets during phase 1. The unread Make PNGs are not assumed necessary; if a visible asset cannot be sourced faithfully, block only its visual implementation and record the missing item.

## Frontend contract adaptation — October 5, 2026

The user accepted date-only filters and independently optional start/end bounds;
valid ranges outside coverage show empty results. The user now confirms backend
auth works and is ready for frontend integration; confirm current capability
fields during intake and implement the auth adapter next. Local data decoders,
injected operations, complete national preview assembly, exact fractions, richer
tables and explicit SQL recovery are prepared; production remains unavailable.
See the [expected-versus-available proposal and implementation record](contracts/frontend-adaptation.md).
Controlled tests do not establish live acceptance. Backend auth is ready per the
user; the earlier expectation of no API responses now applies to data services.
Earlier fixture milestones remain historical evidence.

## Remaining implementation sequence — reconciled October 5

This sequence governs the remaining work; earlier numbered phases retain their
accepted fixture milestones. No new implementation is performed by this plan update.

**Auth integration is implemented (T5.3 Auth intake → T5.4 → T5.5).**
The user supplied the current role-bearing session response, role restrictions
and Flask8000 target. Auth-only production composition, same-origin proxy,
fixed expiry and scoped CSRF logout are verified; see
[auth integration evidence](verification/auth-integration.md). This newer
role presentation decision supersedes earlier capability-only notes. Full
Cognito/authenticated lifecycle acceptance remains open; data operations are
not registered. Next implementation reuses T5.6–T5.8 after their own gates.

| Order / task | Work and completion criteria | Dependencies / current status |
| --- | --- | --- |
| 1 — T5.3 Auth | Capture the working backend's current session DTO and target revision/origins/return paths. Confirm the current role response and user-approved presentation restrictions; retain user-owned data corrections in their separate subgates. | Auth intake accepted for coding; local target and role mapping recorded. Combined T5.3 remains open for data. |
| 2 — T5.4 | Finish fail-closed configuration and injected transport/composition seams. Reuse prepared data HTTP client; configure same-origin `/api` proxy from explicit backend target. Preserve redirects and cookies. | Implemented and verified for opt-in auth; missing configuration fails closed. No frontend OAuth callback or exchange. |
| 3 — T5.5 | Implement session decoding, browser login navigation, fixed expiry and memory-only CSRF. Clear protected state and reject stale completions; retain scoped logout retry context on `503`, confirm sign-out only on `204`. Handle `401`/`403`/network errors. | Implemented with current role DTO and controlled lifecycle tests plus limited real-Flask smoke. Full authenticated lifecycle remains pending. |
| 4 — T5.6–T5.8 | Reuse and finish integration of existing catalog/preview/metric/query modules. Preserve date-only optional bounds, embedded schemas, exact fractions, complete preview series and GET-only SQL recovery. Revalidate affected consumers against corrected artifacts. | Local implementation already tested; remaining shared-module changes serialized under Integration. |
| 5 — T6.L and T5.9/T5.L | Wire auth/data factories into production operations and author real-environment scenarios. Verify configuration failures without fixtures; exercise accepted adapters against the target when available. | Completed adapter contracts/composition; live checks also need backend/environment/accounts. |
| 6 — Phase 7 | Verify real auth/permissions, snapshot/expiry, exact values, SQL request traces and failure isolation; complete agreed accessibility/visual review and release evidence. | T6.L/T5.L plus actual live and visual prerequisites. No release from mock responses. |

Concrete remaining paths and acceptance are owned by [Phase 5](tasks/phase-5.md).
Auth is opt-in through configured transport; data operations stay explicitly unavailable until registration is ready. Backend
unavailability does not prevent agreed controlled tests, and is never counted as
live success. Admin UI, new-data card and deployment remain outside this work.
