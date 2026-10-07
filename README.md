# outage-explorer-web

Authenticated web client for exploring stored U.S. nuclear outage observations
from EIA at national, facility and generator levels. Users browse permitted
datasets, preview records, inspect the daily national offline-capacity metric
and run read-only analytical SQL through the separate Outage Explorer backend.

## Project context

Start with the [UI context index](docs/context/ui-client/README.md). Read the
five documents in order before planning or implementation.

| Document | Defines |
| --- | --- |
| [Product scope](docs/context/ui-client/01-product-scope.md) | Personas, permissions, domain meaning, metric precision and non-goals |
| [Web experience](docs/context/ui-client/02-web-experience.md) | Journeys, Figma workflow, session behavior, pagination and accessible states |
| [Component architecture](docs/context/ui-client/03-component-architecture.md) | Technologies, atomic design, feature boundaries and state ownership |
| [Backend integration](docs/context/ui-client/04-backend-integration.md) | API responsibilities, fixture isolation and unresolved contracts |
| [Delivery and acceptance](docs/context/ui-client/05-delivery-and-acceptance.md) | Delivery sequence, acceptance criteria, verification and remaining inputs |

Contributor and agent guidance lives in [AGENTS.md](AGENTS.md).

Conversation summaries are buffered by `.codex/hooks.json` and appended to
`docs/devlog/` before Codex commits. Review and enable **Stop** and
**PreToolUse** through `/hooks`, then start or resume a repository session.
The agent reviews and stages new notes before retrying the commit. See
[devlog setup and checks](docs/development/devlog.md).

The [web-client implementation handoff](docs/specs/web-client/README.md) contains
the inspected Figma prototype, council-reviewed spec/plan and dependency-ordered
tasks for atomic-first, parallel feature development with individual pages last.
The [technical execution plan](docs/specs/web-client/execution-plan.md) defines
when downstream tasks can start and how a coordinator runs concurrent workers
with separate ownership, architecture checks and Figma review evidence.

## Selected technologies and boundaries

The selected client stack is **React, Next.js, TypeScript and Tailwind CSS**.
The existing Figma design governs visual implementation. Components follow
atomic design: atoms, domain-free molecules, contextual organisms, reusable
templates and thin route pages. Feature hooks/services own workflows; API
adapters own transport and response validation.

The separate Python/Flask backend owns authorization, data ingestion, metrics
and SQL execution. Viewers have national-only Overview access; `/datasets` and `/query` are restricted
to Analysts and Admins. Analysts have access to
all analytical datasets; Admins additionally have backend refresh capability.
A dedicated Admin UI is conditional. The client consumes authorized backend
APIs and does not directly access EIA, S3, RDS or DuckDB.

## Current integration intake — October 5, 2026

The user confirms the documented backend services are implemented and ready for
frontend integration. The updated source handoff confirms all seven operations
are implemented and opt-in, closes the former B1–B3 artifact issues and permits
null query generation identity for reference-free SQL. See the [Integration completion spec](specs/backend-integration/spec.md)
and [state/security assessment](docs/specs/web-client/integration-assessment.md) for current source hashes, remaining frontend behavior,
state-management options and SQL-security recommendations.

This update supersedes backend-pending statements below, which retain historical
intake provenance. Production auth/data adapters are registered; connected acceptance remains open. Backend analytical resources must be
explicitly configured for the named live target; user-owned isolation validation
is outside this frontend work. No live or visual acceptance gate is closed here.

## Current state and open decisions

Phases 1–4 have established a pinned toolchain, minimal Next.js App
Router bootstrap, frontend operation contracts, a generation-guarded session
runtime, synthetic fixtures and isolated Storybook/behavior/browser tooling.
Observed design tokens, local licensed fonts and reusable atoms now have isolated
Storybook previews, interaction tests and desktop/mobile capture evidence. See
the [Phase 2 verification record](docs/specs/web-client/verification/phase-2.md).
Reusable fields, status displays, tabs, pagination, positional tables, navigation
and slot templates are also implemented. All four feature lanes have shared
readiness records; see [Phase 3 verification](docs/specs/web-client/verification/phase-3.md).
Auth, Overview, Explorer and Queries now expose injected feature entries,
synthetic Storybook stories and adversarial lifecycle coverage; see
[Phase 4 verification](docs/specs/web-client/verification/phase-4.md).
The composed fixture harness is accepted; see [Phase 5 verification](docs/specs/web-client/verification/phase-5.md). The four fixture page compositions are accepted; see [Phase 6 verification](docs/specs/web-client/verification/phase-6.md). Auth and data now have opt-in production composition; full live acceptance still gates T6.L.
Source-boundary and emitted-fixture checks are executable. Product routes build at `/sign-in`, `/overview`, `/datasets` and `/query`, with `/` redirecting to Overview. Configured auth and data use a same-origin Flask proxy; missing configuration and backend failures fail closed. Fixture page demos remain in isolated Storybook roots. See the coordinator-owned
[execution state](docs/specs/web-client/execution-state.md) for accepted tasks
and the [Phase 1 verification record](docs/specs/web-client/verification/phase-1.md)
for the integrated checkpoint evidence.

The context pack was imported from the sibling `outage-explorer` repository's
`docs/context/ui-client/` on October 4, 2026. Its backend implementation status
is a dated handoff snapshot, not a verified live API contract. Revalidate it
against the backend version used for integration.

Next.js App Router is now used by the minimal bootstrap. Exact compatible
versions and their official compatibility evidence are recorded in the
[toolchain documentation](docs/development/toolchain.md). The October 5
[auth HTTP handoff](docs/specs/web-client/contracts/auth.md) documents Flask-owned
Cognito login/callback, HttpOnly cookie sessions, CSRF logout and a same-origin
local proxy. The current role-bearing response and user-approved presentation
mapping are integrated; see [auth integration evidence](docs/specs/web-client/verification/auth-integration.md).
Full authenticated browser lifecycle acceptance remains pending. The subsequent [Data API v1 handoff](docs/specs/web-client/contracts/data-api.md)
now documents catalog/preview, prepared national metrics, SQL and refresh, with
local OpenAPI/fixture snapshots and a [comparison report](docs/specs/web-client/contracts/contract-review.md).
Backend data endpoints remain pending implementation; frontend hosting remains open.
The supplied published Figma
prototype has been inspected; release still needs connected data/lifecycle
verification and visual sign-off; see
the [remaining inputs](docs/context/ui-client/05-delivery-and-acceptance.md#inputs-still-needed-for-implementation).
Explicit synthetic fixtures support independent UI work while live integration
is pending. They are isolated from production and do not establish EIA findings.

## Local development and checks

Select the pinned Node 24.18.0 and npm 11.16.0, then install the lockfile:

```sh
nvm install
nvm use
npm ci
```

`npm run storybook` serves isolated previews on port 6006. `npm run dev` serves
the assembled routes with configured live auth and data operations. Both development
and production framework builds explicitly use webpack because Turbopack's
PostCSS worker port binding failed in this runtime.

```sh
npm run typecheck
npm run lint
npm test
npm run test:boundaries
npm run check:boundaries
npm run build
npm run check:production-fixtures
npm run build-storybook
npx playwright install chromium
npm run test:e2e
```

The browser smoke test serves the built Storybook on port 6007. This workspace's
downloaded browser uses a temporary cache; run
`PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e`
to use it. Alternatively install Chromium into Playwright's default cache as
shown above. `npm run check:release-boundaries` now checks structurally registered live operations and fixture exclusion; its pass does not accept T5.L/T6.L or a release.

See [verification](docs/development/verification.md) for prerequisites, actual
evidence, build freshness and separate fixture/live/visual reporting, and
[ownership](docs/development/ownership.md) for shared-file handoffs.

Delivery is evaluated against the
[acceptance criteria](docs/context/ui-client/05-delivery-and-acceptance.md#acceptance-criteria).
Report fixture behavior, live integration and Figma comparison separately,
with the checks actually run and any remaining gaps.

## Frontend contract adaptation — October 5, 2026

The user accepted date-only filters and independently optional start/end bounds;
valid ranges outside coverage show empty results. The user now confirms backend
auth works and is ready for frontend integration; confirm current capability
fields during intake and implement the auth adapter next. Local data decoders,
injected operations, complete national preview assembly, exact fractions, richer
tables and explicit SQL recovery are prepared; production remains unavailable.
See the [expected-versus-available proposal and implementation record](docs/specs/web-client/contracts/frontend-adaptation.md).
Controlled tests do not establish live acceptance. Backend auth is ready per the
user; the earlier expectation of no API responses now applies to data services.
Earlier fixture milestones remain historical evidence.

## Selective metadata reuse — October 5, 2026

The [data-reuse scope review](specs/data-reuse/scope-review.md) narrows current
work to shared dataset models, schemas and catalog metadata. The controlled
[phase-1 foundation](specs/data-reuse/verification/phase-1.md) shares one decoded
catalog loader across consumers; observation rows and SQL-page reads retain
existing retrieval behavior. The user selected a one-entry / 256 KiB serialized JSON admission budget.
Production completed-response retention remains disabled pending a live catalog
size check and explicit production enabling; the cap is not a heap-size guarantee.
Successful Admin publication now invalidates catalog metadata before Overview
reloads metadata and observations, preserving selected dates; see the
[publication follow-up](specs/data-reuse/verification/publication.md).
Reuse is scoped to the open app until page reload, with existing session/access
cleanup and explicit invalidation. Broader row retention remains deferred.

## Connected local auth — October 5, 2026

Set the server-only `OUTAGE_API_ORIGIN=http://localhost:8000` in `.env.local`
(configured in this workspace), then run `npm run dev` and open
`http://localhost:3000`. Restart/rebuild Next after configuration changes.
Flask remains on port 8000 with its existing Cognito callback there; its
`OUTAGE_AUTH_UI_ORIGIN=http://localhost:3000` makes final login redirects and
logout Origin checks match the UI. Cookies are shared by the localhost host,
not by port; use localhost consistently rather than mixing it with 127.0.0.1.

For complete browser logout, copy only `COGNITO_DOMAIN` and
`COGNITO_APP_CLIENT_ID` from the backend configuration into `.env.local`, and set
`OUTAGE_AUTH_LOGOUT_URI=http://localhost:3000/sign-in` explicitly. That return
URL is already registered in Cognito Allowed sign-out URLs per the user.
Never copy `COGNITO_APP_CLIENT_SECRET`. Configured auth requires these logout
settings; restart/rebuild Next after changes. Only the constructed public URL
is passed to the browser. After API logout returns `204`, protected state is
cleared and local logout confirmed, then `window.location.assign()` opens Cognito
`/logout`. Cognito returns to `/sign-in`. API errors or uncertain outcomes keep
the existing deliberate retry and never navigate to Cognito.

The user confirmed the role-only response and supplied Viewer/Analyst/Admin
presentation restrictions. Backend-assigned role now maps to UI capabilities;
Flask still enforces every request. No capability expansion is required for this
auth integration. Data adapters are registered and do not use fixtures.

After a configured fresh build, run the separate real-Flask smoke tests:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.auth.config.ts --workers=1
```

These cover signed-out resolution, login redirect/binding cookies and idempotent
logout Origin handling. They do not prove authenticated Cognito completion,
reload/reopen, backend role changes or independent-session logout; see the
[evidence and remaining checks](docs/specs/web-client/verification/auth-integration.md).

## Admin refresh on Overview — October 5, 2026

Admin users now see **Refresh data** and **Check refresh status** on Overview.
Configured auth connects these controls to `/api/refresh`, using the current
session's CSRF token and an admission idempotency key. Retry uncertain admission
with the offered retry button; status checks do not start another run. Viewer
and Analyst users have no refresh controls. See the [refresh contract](docs/specs/web-client/contracts/refresh.md).
Analytical data registration is complete; live acceptance remains separate.

## Production data registration — October 5, 2026

Backend-integration Phase 4 registers catalog, embedded schema, cursor previews,
complete national metrics and retained SQL operations using the existing
auth-owned session and memory-only CSRF transport. Preview and next-execution
SQL settings are independent: preview starts at 10, SQL at 100, maximum 500.
Overview's Daily observations table starts at 10 with an adjustable size and
Previous/Next controls over its complete loaded series; the chart and latest-day
cards retain the full selected range. Explorer uses backend cursor pagination.
Overview → Explorer →
SQL handoffs stay in memory and prepare unsent SQL; edited drafts still require
consent. Viewer routes remain Overview only.

Configured actual Next browser checks intercept every API with explicitly
synthetic responses; missing-configuration checks use an unconfigured fresh
build without interception. These are controlled evidence, not named-target
live acceptance or Figma sign-off. See [Phase 4 evidence](specs/backend-integration/verification/phase-4.md)
and [verification commands](docs/development/verification.md). Phase 5 and original
T5.L/T6.L remain open until named enabled backend resources and authorized
persona/lifecycle scenarios are verified.

## UI motion improvements — October 6, 2026

Subtle animations and micro-interactions are **implemented with evidence across
all four phases**: shared tokens/reduced-motion policy, control feedback,
status/loading and skeletons, drawer/template/chart entrances, guarded Overview
refetch dimming, compare/inspection and coverage pulses, Explorer switching and
filters, and SQL busy progress, Copy feedback, results and schema expansion.
Exact values, gaps, authorization and explicit execution/pagination remain
unchanged. E1 shimmer stays off; schema removal is immediate. The catalog and
exclusions are in the [motion spec](specs/ui-motion/spec.md), with its
[plan](specs/ui-motion/plan.md), [tasks](specs/ui-motion/tasks.md) and
[final verification](specs/ui-motion/verification/phase-4.md). Human
[motion visual sign-off](specs/ui-motion/verification/visual-signoff.md) remains
pending and separate from Figma fidelity and live integration.
