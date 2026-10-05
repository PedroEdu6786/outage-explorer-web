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
and SQL execution. Viewers have national-only access; Analysts have access to
all analytical datasets; Admins additionally have backend refresh capability.
A dedicated Admin UI is conditional. The client consumes authorized backend
APIs and does not directly access EIA, S3, RDS or DuckDB.

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
The composed fixture harness is now accepted; see [Phase 5 verification](docs/specs/web-client/verification/phase-5.md). The four fixture page compositions are accepted; see [Phase 6 verification](docs/specs/web-client/verification/phase-6.md). Local data adapters are prepared; auth capability fields, target configuration and live checks still gate T6.L registration.
Source-boundary and emitted-fixture checks are executable. Product routes now build at `/sign-in`, `/overview`, `/datasets` and `/query`, with `/` redirecting to Overview. Production operations fail closed with explicit backend unavailability until live registration; fixture page demos remain in isolated Storybook roots. See the coordinator-owned
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
local proxy. Frontend mapping, environment configuration and live verification
remain pending. The subsequent [Data API v1 handoff](docs/specs/web-client/contracts/data-api.md)
now documents catalog/preview, prepared national metrics, SQL and refresh, with
local OpenAPI/fixture snapshots and a [comparison report](docs/specs/web-client/contracts/contract-review.md).
Backend data endpoints remain pending implementation; frontend hosting remains open.
The supplied published Figma
prototype has been inspected; live integration still needs expanded auth capabilities,
backend runtime/environment and live mapping verification, plus asset provenance; see
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
the assembled production routes with explicit unavailable operations until live contracts are configured. Both development
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
shown above. `npm run check:release-boundaries` remains expected to fail until
production operation registration is explicitly ready under T6.L; passing bootstrap checks does not
accept a release.

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
