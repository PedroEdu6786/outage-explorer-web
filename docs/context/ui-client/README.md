# Outage Explorer web client context

This context pack describes the web client to build in `outage-explorer-web`,
separately from its Python/Flask backend. It captures the user's selected stack and component architecture,
the product's accepted behavior, and the backend integration gaps as of
October 4, 2026. It does not claim that the product APIs or Figma implementation
are complete.

Imported on October 4, 2026 from the sibling `outage-explorer` repository at
`docs/context/ui-client/`. The product, experience, architecture and integration
documents retain the handoff content; this index and the delivery document are
adapted to the destination repository. The six files are self-contained; backend
source references are optional verification material in the backend repository.
No Figma URL or design contents were supplied for the original backend handoff.
The user subsequently provided a Make project and deployed preview; see the
[inspected design inventory](../../specs/web-client/design-inventory.md) and
[active implementation handoff](../../specs/web-client/README.md) for current
screen evidence, planning decisions and tasks. Statements about missing design
access in the imported documents describe the earlier handoff snapshot.

## Documents to load

| Order | Document | Purpose |
| --- | --- | --- |
| 1 | [Product scope](01-product-scope.md) | Purpose, personas, data meaning, expected capabilities and non-goals |
| 2 | [Web experience](02-web-experience.md) | User journeys, pagination behavior, visible states and Figma workflow |
| 3 | [Component architecture](03-component-architecture.md) | Atomic design, feature boundaries, Next.js structure and state ownership |
| 4 | [Backend integration](04-backend-integration.md) | Implemented versus specified behavior, auth, API seams and contract gaps |
| 5 | [Delivery and acceptance](05-delivery-and-acceptance.md) | Implementation sequence, verification, open inputs and source index |

Read all five before planning. During implementation, reload only the documents
relevant to the feature plus any newer agreed contracts. The imported snapshot
summarized the backend working tree, including uncommitted documentation, at
handoff time; it is not a released API contract or a live status check.

The destination repository and council planning documents are now established.
Phase 1 application scaffolding, frontend contracts, session runtime and isolated
fixture tooling are implemented; see the
[Phase 1 evidence](../../specs/web-client/verification/phase-1.md). The October 5
[auth handoff](../../specs/web-client/contracts/auth.md) now documents session
transport and endpoints; frontend mapping, target configuration and live checks
remain pending. The subsequent [Data API v1 handoff](../../specs/web-client/contracts/data-api.md)
now supplies service contracts, with [frontend/source differences](../../specs/web-client/contracts/contract-review.md);
backend runtime remains pending. Published prototype asset sources and font licenses are
recorded in the [asset ledger](../../specs/web-client/assets.md); local licensed fonts and actual loaded-weight evidence are now recorded in the
[token map](../../specs/web-client/token-map.md) and
[Phase 2 verification](../../specs/web-client/verification/phase-2.md). Shared
molecules, table/navigation organisms and slot templates are implemented with
per-feature readiness records in
[Phase 3 verification](../../specs/web-client/verification/phase-3.md). Auth, Overview, Explorer and Queries fixture compositions are now accepted;
see [Phase 4 verification](../../specs/web-client/verification/phase-4.md).
The composed harness is accepted; see [Phase 5 verification](../../specs/web-client/verification/phase-5.md). Phase 5 live adapters remain blocked on Q2/Q3; the four fixture page compositions are now accepted under [Phase 6](../../specs/web-client/verification/phase-6.md). Production routes fail closed until T6.L live registration.
See the
[project README](../../../README.md) and [agent guidance](../../../AGENTS.md)
for repository entry points. Keep accepted requirements separate from suggested
implementation choices when updating this context.

## Optional starting prompt

The following handoff prompt is retained for a future planning session. It is
context, not an instruction to start implementation as part of this import.

```text
You are working on the Outage Explorer web client in a separate repository
from its Python/Flask backend. Read docs/context/ui-client/01-product-scope.md
through 05-delivery-and-acceptance.md before planning or implementation.

We are building an authenticated analytical web app for exploring stored U.S.
nuclear outage observations from EIA at national, facility and generator grains.
Users discover permitted datasets and schemas, preview/filter records, inspect
the ready-made daily national offline-capacity metric, and run broad read-only
analytical SQL. Viewer access is national-only; Analysts can access all analytical
datasets; Admins have Analyst access plus the backend refresh capability.
An Admin screen is conditional, not part of the required initial UI.

Use React with Next.js, TypeScript and Tailwind CSS. An existing Figma design
governs the visual implementation. Inspect its actual frames, components,
variants, assets and tokens before making visual decisions; if its URL/access
is missing, request it and continue independent architecture/contract work.
Do not invent a replacement design or claim visual fidelity without inspection.

Organize components using atomic design:
- Atoms: reusable text, buttons, links, labels, inputs and similar primitives.
- Molecules: simple compositions of atoms with no product/domain logic.
- Organisms: contextual compositions that can display data/status and own
  cohesive UI interactions. Keep API transport and workflows outside them.
- Templates: reusable page layouts expressed through composition/slots.
- Pages: thin route-level composition of features and templates.
Keep feature hooks/services, API adapters and transport types outside shared
presentation components. Prefer clear typed props, accessible semantic HTML,
design tokens and actual reuse over speculative abstractions.

Preserve these behaviors: Cognito managed login with Authorization Code + PKCE;
one-hour application sessions, explicit re-login and current-session logout;
backend-authoritative permissions; snapshot-bound preview cursors; numbered SQL
pages from ONE execution with a fixed page size; explicit result expiry,
truncation and busy states. Never rerun SQL implicitly to paginate or retry a
failed execution. Never modify submitted SQL by adding pagination clauses.

The backend currently exposes GET /health only. Product behavior is specified,
but routes, payloads and session transport remain to be finalized. Use explicit
fixture adapters for independent UI development; label proposed contracts and
mock data. Never present fixtures as EIA findings or live integration.

The client consumes the authorized backend API. Do not access EIA, S3, RDS or
DuckDB directly, duplicate backend authorization/ingestion, add registration or
role management, infer outage causes/durations, or expand beyond agreed scope.

First provide a concise understanding of scope, a Figma-to-component inventory
(once accessible), a proposed structure and implementation sequence, and the
specific missing contracts. Distinguish requirements from recommendations.
Implement only when that work is requested; this prompt establishes context.
Report checks actually run and separate fixture validation, live integration
and visual comparison results.
```

## Frontend contract adaptation — October 5, 2026

The user accepted date-only filters and independently optional start/end bounds;
valid ranges outside coverage show empty results. The backend will add auth
capability fields, so auth mapping awaits the expanded DTO. Local data decoders,
injected operations, complete national preview assembly, exact fractions, richer
tables and explicit SQL recovery are prepared; production remains unavailable.
See the [expected-versus-available proposal and implementation record](../../specs/web-client/contracts/frontend-adaptation.md).
Controlled tests do not establish live readiness; no backend responses are
expected yet. Earlier fixture milestones remain historical evidence.
