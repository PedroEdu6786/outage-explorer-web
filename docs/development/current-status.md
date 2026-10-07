# Current implementation and evidence — October 7, 2026

October 7 facility-preview update, including the Generators follow-up: Facilities
and Generators now offer Analyst/Admin an optional exact facility-ID input
combined with dates. Viewer restrictions remain.
See the [contract and verification](../specs/web-client/verification/facility-filter.md). Runtime acceptance requires a
matching protocol-v2 worker image and remains open.

Revalidated against web source at `e4cf965` for review item M4. This is a dated
navigation aid, not a new requirement, backend inspection or release approval.
Update it when accepted scope or implementation changes.

## Documentation authority

The five [UI context documents](../context/ui-client/README.md) define product
behavior and architectural boundaries. Newer explicit user decisions supersede
the original October 4 handoff: Viewer Overview-only access, role-derived
presentation mapping, Admin refresh on Overview and catalog retention.
[HTTP contracts](../specs/web-client/contracts/data-api.md) and
[auth decisions](../specs/web-client/contracts/auth.md) define the adapter boundary.
Frontend interfaces are not replacement HTTP APIs.

Sections marked historical record earlier intake, not current implementation
instructions. Dated verification and execution ledgers retain their original
paths, policies and test counts. Registration/build checks do not accept live
backend behavior or visual fidelity.

## Implemented in the web client

| Area | Current behavior | Source and evidence |
| --- | --- | --- |
| Stack/routes | Next App Router, React, TypeScript, Tailwind; `/sign-in`, `/overview`, `/datasets`, `/query` | [App source](../../src/app), [toolchain](toolchain.md) |
| Auth | Flask-owned login/callback; cookie sessions, memory-only CSRF; backend-assigned roles map to user-approved presentation capabilities. No role/capability claims sent. | [Mapping](../../src/adapters/live/auth-schema.ts), [auth contract](../specs/web-client/contracts/auth.md) |
| Viewer | National-only Overview and metadata; Explorer/SQL routes restricted. The backend contract requires independent request authorization. | [Route guards](../../src/composition/navigation.ts), [scope](../context/ui-client/01-product-scope.md) |
| Data | Configured production composition registers catalog/schema, cursor previews, complete national series and SQL execution/pages. Missing configuration or API failure fails closed without fixture fallback. | [Registration](../../src/composition/production-operations.ts), [composition](../../src/integration/live-composition.ts), [phase-4 evidence](../../specs/backend-integration/verification/phase-4.md) |
| Admin refresh | Overview controls with explicit admission/status and same-key retry for uncertain admission. Separate Admin page and new-data card are outside current scope. | [Refresh hook](../../src/features/overview/useRefresh.ts), [contract](../specs/web-client/contracts/refresh.md) |
| Catalog cache | One typed bundle, 256 KiB UTF-8 serialized cap, shared pending request; session/access/publication invalidation and reload end reuse. Oversized successes are usable without retention. | [Cache](../../src/resources/catalog-cache.ts), [M3 evidence](../../specs/data-reuse/verification/catalog-cache.md) |
| Dates/pagination | Apply dates/filters submits local edits. Overview/Explorer start at 10 rows; Overview pages its complete loaded series, Explorer uses cursors. SQL starts at 100, maximum 500, fixed per execution. | [Settings](../../src/integration/config.ts), [date evidence](../../specs/data-reuse/verification/navigation-and-dates.md), [experience](../context/ui-client/02-web-experience.md) |
| Denial | A current data denial clears all protected state and blocks old responses. Explicit Check session recovery neither claims backend logout nor replays SQL. | [Runtime](../../src/session/session-runtime.ts), [D1 evidence](../../specs/data-reuse/verification/access-denial.md) |
| Design/motion | Published prototype inspected; motion implemented with automated evidence. Human visual sign-off remains separate. | [Inventory](../specs/web-client/design-inventory.md), [motion sign-off](../../specs/ui-motion/verification/visual-signoff.md) |

Backend readiness is user-confirmed and supported by dated source handoffs. Web
registration cannot establish the current backend deployment, permissions, SQL
safety or ingestion behavior.

## Open evidence and deferred scope

- Full authenticated Cognito lifecycle and named-target data/permission,
  pagination, refresh and failure acceptance remain open. See
  [backend-integration Phase 5](../../specs/backend-integration/tasks.md) and
  the original [live gates](../specs/web-client/tasks/phase-5.md).
- Final visual/browser acceptance and human motion sign-off remain open.
  Intercepted HTTP, fixture flows and machine captures are separate evidence.
- Additional cross-route observation/preview/SQL-page caching is deferred.
  Existing retained SQL execution remains; pagination never reruns or rewrites
  SQL. No new TTL, polling or durable browser storage is selected.
- Frontend hosting/deployment, a dedicated Admin page and the deferred new-data
  status card require their own decisions/authorization.

M3 reports 407 unit tests, 33 boundary tests, eight controlled production browser
tests and 13 fixture browser flows. Those are prior checks bound to M3, not tests
rerun by this documentation-only update.
