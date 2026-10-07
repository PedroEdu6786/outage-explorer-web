# Outage Explorer web

Authenticated web client for exploring stored U.S. nuclear outage observations
from EIA at national, facility and generator levels. Users inspect national
metrics, browse permitted datasets and run read-only analytical SQL through the
separate Python/Flask backend.

Built with **Next.js App Router, React, TypeScript and Tailwind CSS**. The supplied
Figma prototype guides the UI; shared components follow atomic design.

## Setup

### Prerequisites

- Node **24.18.0** (`.nvmrc`) and npm **11.16.0** (`package.json`).
- For connected use, the separate Outage Explorer Flask backend, its Cognito
  configuration and seeded Viewer, Analyst or Admin accounts. Authentication
  alone does not configure analytical storage: the backend must also enable its
  data services and have published observations.
- For browser tests, Playwright Chromium. Python 3 is needed only for the
  optional devlog-hook checks.

From the repository root:

```sh
nvm install
nvm use
node --version
npm --version
# If npm differs from the pinned version:
npm install --global npm@11.16.0
npm ci
```

See [toolchain details](docs/development/toolchain.md) for exact dependency pins
and compatibility evidence. Development and production builds use webpack.

### Connect the backend

Create a gitignored `.env.local` in the repository root with the following
values, replacing the example Cognito domain and public app client ID with
those from your backend environment:

```dotenv
OUTAGE_API_ORIGIN=http://localhost:8000
COGNITO_DOMAIN=https://your-domain.auth.your-region.amazoncognito.com
COGNITO_APP_CLIENT_ID=yourPublicAppClientId
OUTAGE_AUTH_LOGOUT_URI=http://localhost:3000/sign-in
```

| Variable | Purpose |
| --- | --- |
| `OUTAGE_API_ORIGIN` | Server-side Flask origin; Next proxies `/api/*` to it. Use an HTTPS origin, or loopback HTTP for local development, without a path or credentials. |
| `COGNITO_DOMAIN` | Cognito managed-login HTTPS origin used to construct the public logout URL. |
| `COGNITO_APP_CLIENT_ID` | Public Cognito app client ID for provider logout. |
| `OUTAGE_AUTH_LOGOUT_URI` | Explicit `/sign-in` return URL registered in Cognito's Allowed sign-out URLs. |

Configure **the backend** with `OUTAGE_AUTH_UI_ORIGIN=http://localhost:3000` so
login returns and logout Origin checks match the UI. Retain its configured
Cognito callback on Flask (port 8000 in this local setup). See the
[auth contract](docs/specs/web-client/contracts/auth.md) for the full transport
and callback requirements; backend startup and AWS provisioning belong to the
backend repository.

Keep backend secrets, including `COGNITO_APP_CLIENT_SECRET`, out of this project
and all `NEXT_PUBLIC_*` variables. Flask owns OAuth code exchange, provider
tokens, HttpOnly session cookies and authorization. The client keeps the logout
CSRF token in memory. These settings are read server-side; only the constructed
public Cognito logout URL is passed to the browser.

Start Flask on port 8000 using its own setup instructions, then run:

```sh
npm run dev
```

Open **http://localhost:3000**. Use `localhost` consistently for both services;
cookies are host-scoped, so mixing it with `127.0.0.1` breaks this local setup.
Restart the development server or rebuild production after configuration changes.
Missing backend configuration and API failures show explicit unavailable/error
states; production never substitutes synthetic data.

For a local production build:

```sh
npm run build
npm run start
```

Frontend hosting, domain and release configuration remain open decisions.

### Preview components without a backend

```sh
npm run storybook
```

Open **http://localhost:6006** for isolated components, feature states and page
demos. Stories use explicitly synthetic fixtures, including role and failure
scenarios. Fixtures live under `tests/fixtures/` and are excluded from production;
these demos do not establish live integration or real EIA findings.

## Modules and routes

`/` redirects to `/overview`. Protected pages wait for session resolution before
rendering permitted content.

| Module | Route / access | What it provides |
| --- | --- | --- |
| [Auth](src/features/auth) | `/sign-in`; all personas | Cognito sign-in entry, session resolution, expiry, access recovery and current-session logout followed by provider logout. |
| [Overview](src/features/overview) | `/overview`; Viewer, Analyst, Admin | National offline-capacity cards, calculated and EIA-reported percentages, trend chart, daily observations and date-range controls. Admins also get **Refresh data** and **Check refresh status**. |
| [Dataset Explorer](src/features/explorer) | `/datasets`; Analyst, Admin | Authorized catalog, schema inspection, date-only filters and snapshot-bound cursor previews. |
| [SQL Workspace](src/features/queries) | `/query`; Analyst, Admin | Schema browser, editable SQL, explicit execution, column metadata, numbered retained-result pages and expiry/truncation/error recovery. |

Viewer navigation exposes Overview only; direct `/datasets` and `/query` visits
redirect to Overview before restricted content mounts. These presentation rules
come from the backend-assigned role; Flask authorizes every API request.

Overview date edits stay local until **Apply dates** submits a valid changed
range. Its daily table starts at 10 rows and offers 10, 20, 50, 100 or 500 rows;
paging leaves the full selected chart range and latest-day cards intact.
Explorer starts at 10 rows, supports sizes 1–500 and starts a new cursor sequence
when filters or size change. SQL starts at 100 rows per page (maximum 500),
selected independently and fixed for each execution. Cross-page handoffs prepare
filters or unsent SQL in memory; SQL still requires an explicit Run.

### Code organization

| Location | Responsibility |
| --- | --- |
| `src/app/` | Thin Next route pages, layouts and root providers. |
| `src/components/` | Domain-free atoms/molecules, shared table/navigation organisms and reusable slot-based templates. |
| `src/features/` | Auth, Overview, Explorer and Queries UI, hooks and workflow state. |
| `src/contracts/` | Typed feature-facing operations, models and failure states. |
| `src/adapters/live/` | Auth/data/refresh HTTP adapters, response validation and lossless transport mapping. |
| `src/integration/` | Server configuration, session-aware HTTP transport and live adapter assembly. |
| `src/composition/` | Production operation registration, providers and navigation handoffs. |
| `src/session/` | Session lifecycle, access invalidation and guards against stale responses. |
| `src/resources/` | One shared authorized catalog cache with a 256 KiB serialized UTF-8 admission cap; oversized responses remain usable without retention. |
| `src/styles/` | Design tokens and reduced-motion-aware animation styles. |
| `tests/`, `.storybook/`, `scripts/` | Synthetic fixtures, behavior/browser tests, component previews and boundary/devlog checks. |

Catalog reuse lasts within the open app until reload or invalidation. Logout,
access changes and successful Admin publication clear protected metadata;
observation rows and SQL pages are outside this cache. See the
[catalog-cache record](specs/data-reuse/verification/catalog-cache.md).

## Frontend challenge requirements

The challenge's **Part 4 — Web application** requires login, permitted dataset
discovery, a backend-paginated table and SQL input/results. The table below maps
that core to this client's accepted behavior. The local
[product scope](docs/context/ui-client/01-product-scope.md) and
[acceptance criteria](docs/context/ui-client/05-delivery-and-acceptance.md#acceptance-criteria)
record the UI requirements. The original challenge PDF is outside this repository;
the backend's [challenge criteria index](../outage-explorer/docs/challenge/README.md)
contains its reviewed paraphrase and broader deliverables (requires the sibling
backend checkout).

| Requirement | Frontend behavior to demonstrate |
| --- | --- |
| Login and authenticated access | Sign in through the agreed backend, restore the current session, require explicit sign-in on expiry and invalidate the current session on logout. |
| Permitted datasets | Show only authorized catalog/schema information. Viewer web access is national Overview only; Analyst/Admin can browse facility and generator data. |
| Backend-paginated records | Render schema-driven tables, apply accepted date-only filters and follow opaque snapshot-bound cursors. Expiry offers an explicit restart. |
| SQL input and results | Support open-ended read-only analysis, show positional columns/rows (including duplicate labels/rows), and paginate one execution by its query ID and fixed page size. Never rewrite SQL or rerun it implicitly to page, retry or recover. |
| Ready-made national metric (US-08) | Display `100 × outage / capacity` alongside EIA's reported percentage from the same observation, using two-decimal half-up percentages. Preserve calendar dates, opaque IDs, units and missing-versus-zero values. |
| Safe, usable workflows | Explain pending, empty, unavailable, denied, busy, timeout, expired and truncated states. Clear protected data on logout/access loss and block late responses from restoring it. |
| Reproducible delivery | Document runnable setup and checks, preserve incremental commits and provide evidence that can be explained and extended during the live session. |

React/Next.js/TypeScript/Tailwind, atomic design, the Figma-based Overview/chart,
Viewer's Overview-only navigation and the Admin refresh control are subsequent
accepted project decisions. They refine the challenge's minimal web experience.
Keyboard access, focus, labels, announcements, narrow-screen table/editor use,
accessible chart data and reduced-motion behavior are part of UI acceptance.
Percentage rounding differs intentionally from MW and preview decimal display,
which truncates extra digits to at most two decimal places while preserving
exact source values.

The backend owns ingestion, persistent storage, authorization, SQL safety and
execution, metric calculation and refresh publication. The overall challenge
also requires a documented data model/ER diagram, at least 30 days of
reconciliation, three reproducible real anomalies, decisions/findings and
Engineering Notes covering AI contributions, a concrete AI mistake and independent
verification. Those are submission-wide deliverables; this README and synthetic
UI demos do not establish their completion. No separate findings page is required,
and the UI must not invent causes, outage durations or anomalies.

A separate Admin page, registration/password recovery, user management, saved
queries, exports and scheduling are outside the current UI scope. The
**new data available** card remains deferred. The client accesses authorized
Flask APIs rather than EIA, S3, RDS or DuckDB directly.

## Verification and delivery status

Run the standard source and production checks:

```sh
npm run typecheck
npm run lint
npm test
npm run test:boundaries
npm run check:boundaries
npm run build
npm run check:production-fixtures
npm run check:release-boundaries
```

Artifact scans require a fresh production build. For fixture browser checks:

```sh
npx playwright install chromium
npm run build-storybook
npm run test:e2e
```

Playwright serves built Storybook on port 6007. If using this workspace's temporary
browser cache, set `PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright`
for installation and execution. Serialize builds and browser projects that share
output. The [verification guide](docs/development/verification.md) documents
separate development, controlled-production and real-Flask auth configurations,
their prerequisites and evidence limits.

The four feature modules, composed fixture pages, production auth/data adapters,
Admin refresh, catalog reuse and motion improvements are implemented. Controlled
behavior/browser and build evidence is recorded in
[backend integration](specs/backend-integration/verification/phase-4.md),
[fixture page verification](docs/specs/web-client/verification/phase-6.md),
[catalog reuse](specs/data-reuse/verification/catalog-cache.md) and
[motion verification](specs/ui-motion/verification/phase-4.md).

**Release acceptance remains open:** named-target live data/session/permission
and pagination scenarios, full authenticated Cognito lifecycle, Figma visual
sign-off and human [motion review](specs/ui-motion/verification/visual-signoff.md)
remain separate gates. Passing structural registration/fixture-exclusion checks
or controlled synthetic browser tests does not close those gates. Report fixture,
live-integration and visual evidence separately.

## Project documentation

Start with the [UI context index](docs/context/ui-client/README.md), then read its
five documents: [product scope](docs/context/ui-client/01-product-scope.md),
[web experience](docs/context/ui-client/02-web-experience.md),
[component architecture](docs/context/ui-client/03-component-architecture.md),
[backend integration](docs/context/ui-client/04-backend-integration.md) and
[delivery/acceptance](docs/context/ui-client/05-delivery-and-acceptance.md).
Imported October 4 handoff statements retain historical provenance; newer
accepted contracts and verification records supersede earlier pending-status
claims.

The [implementation handoff](docs/specs/web-client/README.md) links the spec,
plan and tasks; [auth](docs/specs/web-client/contracts/auth.md) and
[Data API v1](docs/specs/web-client/contracts/data-api.md) define transport.
The [design inventory](docs/specs/web-client/design-inventory.md) and
[deviation record](docs/specs/web-client/design-deviations.md) trace prototype
inspection and required extensions. Consult the
[execution plan](docs/specs/web-client/execution-plan.md) and
[ownership guide](docs/development/ownership.md) for implementation handoffs.

Contributor/agent instructions live in [AGENTS.md](AGENTS.md). Conversation
summaries and explicit change/check notes are preserved in `docs/devlog/` before
local commits. See [devlog setup](docs/development/devlog.md) for optional Codex
hook enablement and `npm run test:devlog`.
