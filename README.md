# Outage Explorer web

Explore U.S. nuclear outage data: view national trends, browse datasets and run
read-only SQL. This is the **Next.js + React + TypeScript + Tailwind CSS** frontend;
the separate Flask backend handles authentication, permissions and data.

## Users

The app supports three user roles:

| User | What they can do |
| --- | --- |
| **Viewer** | View national metrics, the trend chart and daily observations on Overview. |
| **Analyst** | Everything a Viewer can do, plus browse national/facility/generator datasets and run read-only SQL. |
| **Admin** | Everything an Analyst can do, plus refresh data and check refresh status from Overview. |

Sign in with an existing **seeded Cognito account**. Get the account email and
password privately from the environment owner. Accounts and roles are configured
in the backend; this app has no registration or user-management screen.

Viewers cannot open Dataset Explorer or SQL Workspace. The backend checks
permissions on every request. Sessions expire after one hour and require signing
in again; signing out clears protected client data and ends the current session.

## Run locally

### 1. Install dependencies

Use Node **24.18.0** and npm **11.16.0**:

```sh
nvm install
nvm use
npm --version
# Only if npm is not 11.16.0:
npm install --global npm@11.16.0
npm ci
```

### 2. Configure the connection

Create `.env.local` in this repository. Replace the Cognito examples with the
values for your backend environment:

```dotenv
OUTAGE_API_ORIGIN=http://localhost:8000
COGNITO_DOMAIN=https://your-domain.auth.your-region.amazoncognito.com
COGNITO_APP_CLIENT_ID=yourPublicAppClientId
OUTAGE_AUTH_LOGOUT_URI=http://localhost:3000/sign-in
```

The backend must use `OUTAGE_AUTH_UI_ORIGIN=http://localhost:3000`, retain its
configured Cognito callback, and register `http://localhost:3000/sign-in` as an
allowed Cognito sign-out URL. Keep backend secrets, including the Cognito client
secret, out of the frontend configuration.

See the backend's [local setup guide](../outage-explorer/docs/development/local-setup.md)
for its dependencies, accounts and analytical resources. This link assumes a
sibling `outage-explorer` checkout. The full app needs configured data services
and published observations as well as working authentication.

### 3. Start both applications

Keep these commands running in separate terminals:

```sh
# In the configured backend checkout
make run-analytical
```

```sh
# In this frontend checkout
npm run dev
```

Open **http://localhost:3000** and sign in. Flask runs on port **8000**; Next
proxies `/api/*` to it. Use `localhost` for both apps, and restart Next after
changing `.env.local`. Ctrl+C stops each process.

Missing configuration or backend failures show an error; the app never switches
to mock data automatically. For a local production build, run `npm run build`
and then `npm run start`.

### Preview without a backend

```sh
npm run storybook
```

Open **http://localhost:6006** to explore components and page demos with labeled
synthetic data. These fixtures are excluded from production.

## Modules

| Module | Route | Main features |
| --- | --- | --- |
| **Authentication** | `/sign-in` | Cognito login, session checks and logout. |
| **Overview** | `/overview` | National capacity metrics, trend chart, date filters and daily table. Admin refresh controls. |
| **Dataset Explorer** | `/datasets` | Permitted datasets, schemas, date filters and paginated previews. |
| **SQL Workspace** | `/query` | SQL editor, schema browser, results and numbered result pages. |

`/` redirects to Overview. Dataset Explorer and SQL Workspace require Analyst
or Admin access.

Dates apply when you submit **Apply dates** or the preview filters. Overview and
Explorer tables start at 10 rows; SQL starts at 100. Explorer follows backend
preview cursors. SQL pages reuse one execution with a fixed page size; paging
never runs the query again. Expired results require an explicit rerun.

### Where the code lives

| Folder | Contains |
| --- | --- |
| `src/app/` | Routes, layouts and providers. |
| `src/features/` | Auth, Overview, Explorer and Queries workflows. |
| `src/components/` | Shared atoms, molecules, organisms and page templates. |
| `src/contracts/` | Typed operations, data models and errors. |
| `src/adapters/live/` | API adapters and response validation. |
| `src/integration/`, `src/composition/` | Backend configuration, HTTP transport and feature wiring. |
| `src/session/`, `src/resources/` | Session guards and shared catalog cache. |
| `src/styles/` | Design tokens and motion styles. |
| `tests/`, `.storybook/`, `scripts/` | Tests, synthetic fixtures, previews and tooling. |

## What the challenge requires

**Part 4 — Web application** requires a working web experience that lets users:

1. **Log in** and access only what their account permits.
2. **Discover datasets** and inspect their schemas.
3. **Browse records** in a table paginated by the backend.
4. **Enter read-only SQL** and inspect its results.

The agreed project scope also includes the ready-made daily national
**offline-capacity share** (`100 × outage / capacity`), shown alongside EIA's
reported percentage. Percentages use two-decimal half-up rounding; dates,
identifiers and missing values retain their meaning.

The selected stack, atomic components, supplied Figma design, Overview chart,
Viewer-only Overview access and Admin refresh button are later accepted project
choices. UI acceptance includes keyboard access, responsive layouts, accessible
chart data, reduced motion and clear loading, empty, denied and error states.
Logout or access loss must clear protected data and block stale responses.

The backend owns ingestion, storage, authorization, SQL safety, metrics and
refresh publication. Submission-wide requirements also include the data model
and ER diagram, 30-day reconciliation, three real anomalies, decisions/findings,
Engineering Notes about AI use and verification, tests and incremental commits.
A separate findings page is not required.

See the [frontend acceptance criteria](docs/context/ui-client/05-delivery-and-acceptance.md#acceptance-criteria)
and backend [challenge criteria index](../outage-explorer/docs/challenge/README.md)
for details. The latter paraphrases the original challenge PDF and requires the
sibling backend checkout.

## Checks

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

Browser checks use the built Storybook and Playwright Chromium:

```sh
npx playwright install chromium
npm run build-storybook
npm run test:e2e
```

Run artifact checks after a fresh production build. See the
[verification guide](docs/development/verification.md) for additional browser
suites, temporary browser-cache settings and environment prerequisites.

## Current status and further reading

The four modules, production API adapters, Admin refresh, catalog reuse and UI
motion are implemented. **Release acceptance remains open:** full Cognito
lifecycle, live data/permission/pagination/refresh checks and visual sign-off
still need their own evidence. Synthetic tests do not establish live acceptance.
Frontend hosting, a separate Admin page and the new-data status card remain open
or deferred.

- [Current implementation and evidence](docs/development/current-status.md)
- [UI context and product scope](docs/context/ui-client/README.md)
- [Implementation spec, plan and tasks](docs/specs/web-client/README.md)
- [Auth contract](docs/specs/web-client/contracts/auth.md) and [Data API contract](docs/specs/web-client/contracts/data-api.md)
- [Design inventory](docs/specs/web-client/design-inventory.md)
- [Toolchain](docs/development/toolchain.md)
- [Contributor instructions](AGENTS.md) and [devlog setup](docs/development/devlog.md)
