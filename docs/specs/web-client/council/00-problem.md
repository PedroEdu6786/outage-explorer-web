# Outage Explorer web client — Problem Anchor

> Status: council converged; original user sequencing retained, published prototype inspected.

## The Main Problem

Outage Explorer needs a web client faithful to its Figma design and accepted
product behavior, with reusable components that let multiple contributors
develop views without duplicating UI or conflicting over shared contracts.
The delivery plan must establish atomic components first, enable parallel
feature development, and leave individual page assembly until the final stage.

## Context

- The repository contains documentation only; there is no application scaffold.
- The [UI context pack](../../../context/ui-client/README.md) defines product
  scope, domain rules, selected technologies and delivery acceptance criteria.
- The user requested Figma inspection, a planning council, and executable tasks
  under `docs/specs` for parallel development, with atomic components first and
  individual pages last.
- The user supplied the Figma Make link and then its deployed preview. The Make
  resource reader failed; published HTML/CSS/JavaScript and desktop/narrow renders
  were inspected successfully. See [design inventory](../design-inventory.md).
- Engram initially had no registered frontend project. After an explicit session
  start against this repository, its project-scoped search returned no prior
  matching architecture/design memories.
- Backend availability in the context pack is a dated handoff snapshot, not a
  current integration verification.

## Known constraints

- React, Next.js, TypeScript and Tailwind CSS are selected.
- Atomic design responsibilities and domain/backend boundaries remain as
  documented in the context pack. App Router and source layout are recommendations.
- Figma inspection must establish actual screens, components, tokens, variants
  and assets before design-specific planning claims are made.
- Viewer access is national-only. Authorization remains backend-authoritative.
- Preview cursors and SQL result pages have distinct lifecycles; pagination
  must never implicitly rerun SQL or rewrite the submitted statement.
- Session transport, API contracts and supporting tooling remain open.
- Task breakdown must identify dependencies, parallel opportunities, file
  ownership, integration checkpoints and traceable acceptance criteria.
- Team size and delivery deadline have not been specified.

## Out of scope (declared up front)

- Application implementation, deployment and external publication during planning.
- Backend implementation or infrastructure provisioning.
- Invented Figma layouts, API contracts or claims of live integration.
- Product expansion beyond the accepted context; Admin UI remains conditional,
  and the new-data status card remains deferred.

## Council seated

All six personas completed interrogation; three authors returned independent
blind proposals. Critique and response are recorded in the council companions.

| Persona | Seat | Why seated |
| --- | --- | --- |
| rafachafa | Pragmatist Senior Dev | Keep shared components and parallel work minimal |
| gamachiel | Architect | Component boundaries, contracts and dependency direction |
| estebanquito | Engineering Manager | Sequencing, ownership and acceptance checkpoints |
| kings | Product | Screen scope and useful end-to-end behavior |
| cuid | Risk & Verifiability | Permissions, sessions, precision and pagination correctness |
| ponykiller | Infra / SRE | API/session networking and fixture-to-live integration |

## Mode & sizing

Greenfield system design: three blind proposals and up to three debate rounds,
with a target budget of roughly 40 persona calls. The runtime allows three
concurrent subagents alongside the Chair, so council calls must run in batches.
Use `docs/specs/web-client/` as explicitly requested by the user.

The council produces `spec.md`, `plan.md` and companion records. After synthesis,
the tasks workflow produces the requested `tasks.md` and, if warranted by size,
per-phase task files. The user's explicit task-breakdown request authorizes that
handoff in this session. No implementation follows automatically.

## Intake checkpoint

- Repository guidance and all five context documents read.
- Planning council protocol and canonical spec/plan/tasks templates read.
- User continued the original request by providing the requested design URLs; no
  scope change was introduced. The atomic-first/parallel/pages-last anchor comes
  directly from that original instruction.
- User explicitly confirmed: "Fixture demos first; live integration required before release."
- Design inspection, six-person interrogation, spec, three blind proposals, critique,
  author responses and focused closure are complete; council converged with no
  remaining planning blockers. Canonical plan and executable task breakdown are
  the handoff; live contract inputs remain explicit implementation gates.
