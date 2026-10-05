# Outage Explorer web agent instructions

## Read before planning or implementation

Read [README.md](README.md), the [UI context index](docs/context/ui-client/README.md)
and all five documents it lists. Read `CLAUDE.md` and `.claude/CLAUDE.md` if
present. During implementation, reload relevant context and newer agreed
contracts. Current user instructions take precedence.

For web-client implementation, also read the active
[specification and planning handoff](docs/specs/web-client/README.md), then the
relevant task phase and its explicit predecessors. Preserve atomic-first
development, independently owned feature lanes and the final page-assembly gate.
Fixture demos are the first milestone; live integration is required for release.

For coordinated parallel implementation, follow the
[technical execution plan](docs/specs/web-client/execution-plan.md): dispatch by
accepted task dependencies, reserve one coordinator slot, assign disjoint files,
and keep shared contracts/configuration under one writer. Record assignments and
evidence in the execution ledger. Planning alone does not authorize implementation.

The context pack is the starting reference for product scope, domain behavior,
selected technologies, architecture and acceptance criteria. Preserve its
distinction between requirements, recommendations and open decisions. Backend
implementation claims are dated October 4, 2026; revalidate them against the
integration version before treating them as current facts.

This is the separate Outage Explorer web client. Do not apply Palace/TPC
conventions or the backend's Python structure and tooling to this repository.
Use project-scoped Engram memories under `outage-explorer-web` when available;
search relevant decisions before architectural changes and preserve significant
decisions with their rationale. Revalidate historical findings.

## Implementation boundaries

- Use the selected React, Next.js, TypeScript and Tailwind CSS stack. App Router,
  source layout and supporting libraries remain recommendations or open choices
  as described in the [architecture](docs/context/ui-client/03-component-architecture.md).
- Inspect the supplied Figma design before making visual decisions. If access
  is missing, request it and continue independent work; do not claim fidelity.
- Keep shared atoms/molecules domain-free, pages thin and templates reusable.
  Feature hooks/services own workflows; adapters own HTTP and transport types.
- Delegate authoritative permissions, metrics, SQL validation and ingestion to
  Flask. Never access EIA, S3, RDS or DuckDB directly from the client tier.
- Preserve national-only Viewer access across navigation, metadata and data.
  UI hiding does not enforce authorization. Clear protected client state on
  logout or access changes and prevent stale responses from restoring it.
- Keep snapshot-bound preview cursors separate from numbered SQL pages.
  SQL pagination uses one execution's query ID and fixed page size. Never
  rewrite SQL or implicitly execute it again to paginate, retry or recover.
- Preserve opaque identifiers, calendar dates, missing-versus-zero semantics
  and the specified two-decimal half-up metric presentation. Do not invent
  outage causes, durations or findings; follow the [domain rules](docs/context/ui-client/01-product-scope.md).
- Label proposed API contracts and synthetic fixtures explicitly. Keep fixtures
  isolated from production; never silently substitute them after API failures.
  Finalize session transport with the backend rather than assuming it exists.
- Keep the Admin UI conditional and the new-data status card deferred as stated
  in [delivery and acceptance](docs/context/ui-client/05-delivery-and-acceptance.md).

## Conversation devlog before commits

Commit each completed repository update, including documentation changes, as
requested by the user on October 5, 2026. This is standing authorization for local
commits; pushing and deployment require their own authorization.

Preserve the append-only journal in `docs/devlog/YYYY-MM-DD.md`. Repo-local
Codex hooks in `.codex/hooks.json` buffer completed-turn assistant summaries
and append pending summaries before literal `git commit` tool calls. See
[devlog setup and behavior](docs/development/devlog.md).

Before every commit, review appended notes, record the current unfinished
turn's request, decisions, changes and checks explicitly, and stage the relevant
devlog file with the implementation. Do this even when the buffer is empty or
hooks are unavailable. Never record credentials or raw tool output. When the
hook pauses a commit after writing notes, review and stage them and retry;
the hook requires no additional user confirmation. Preserve concurrent work
and existing journal entries.

## Verification and documentation

Use the [acceptance criteria and verification guidance](docs/context/ui-client/05-delivery-and-acceptance.md)
when implementing and reviewing features. Report checks actually run and
separate fixture validation, live integration and visual comparison evidence.
Phase 1 tooling is established; use the commands and prerequisites in
[development verification](docs/development/verification.md). Keep these entry points and the context pack in
sync when requirements or contracts change, retaining provenance and unresolved
questions rather than silently presenting proposals as accepted decisions.
