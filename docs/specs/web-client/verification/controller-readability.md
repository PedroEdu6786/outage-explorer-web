# Review improvement M1 — feature state readability

October 7, 2026. Base: `24eab6e`. This is a local readability refactor,
not a new product requirement or a change to operation contracts.

## Changes

- SQL and Explorer controllers: put cancellation, request-version changes,
  cleanup and state publication on separate lines. Name counters, abort
  controllers, expiry checks and failure handlers after their responsibilities.
- Overview: distinguish applied-range preservation, series retries, metadata
  reloads and previous-series display. Replace nested response callbacks with
  early returns and the retained-series nested ternary with explicit branches.
- Refresh: distinguish the active request's abort controller from the last
  published run ID. Preserve D2's separate unconfirmed admission key.

For example, `activeSeries.current?.abort(); selection.current += 1;`
becomes two statements on separate lines using `activeSeriesAbort` and
`seriesRequestVersion`. The order and the stale-response guard remain intact.

No extra store, wrapper or abstraction was introduced. Public operation shapes,
effect dependencies (apart from local renames), request ordering, permission
checks, expiry checks and lifecycle ownership are preserved. SQL paging still
reads one execution's query ID and fixed page size; it never runs SQL implicitly.
Refresh recovery still requires deliberate same-key replay.

## Verification

- Initial mechanical formatting/renaming: compared TypeScript AST signatures
  with local names normalized in all four files. All passed. This comparison
  preceded the explicit Overview branch rewrites and added single-statement
  braces; those final changes were reviewed separately, not claimed AST-identical.
- `node_modules/.bin/vitest run --no-cache --maxWorkers 2`: 30 files,
  399 tests passed after the final control-flow edits.
- `npm run test:boundaries`: 33 passed.
- `npm run typecheck`, `npm run lint`, `npm run build`: passed.
- `npm run check:release-boundaries`: passed; 108 source modules,
  15 production roots and 299 emitted files checked.
- Configured production Playwright (`playwright.controlled.config.ts`, one
  worker, existing Chromium): eight passed. Includes Viewer access, retained
  SQL, handoffs, pagination, explicit failures, D1 cross-feature denial and D2
  refresh recovery. Every API response was synthetic and intercepted.
- Final whitespace tidying was token-identical; one comment was clarified.
  `git diff --check` passed. Generated `next-env.d.ts` is excluded.

No dependencies installed. No live backend, Cognito acceptance or visual
comparison performed. No presentation changes or Storybook rebuild. M2 and
the other review items remain separate work.
