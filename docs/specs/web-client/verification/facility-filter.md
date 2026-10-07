# Facility-filtered preview verification — October 7, 2026

Scope: user-requested Facilities ID input for Analyst/Admin, preserving date
filters, opaque IDs, cursor lifecycle and Viewer restrictions. Source intake and
snapshot hashes are in [Data API intake](../contracts/data-api.md#facility-filter-contract-intake--october-7-2026).
Backend feature `6142ec5` is source evidence only. No backend files were changed.

The existing controller owns sequence reset, original expiry and version/session
checks. A shared pure validator serves the feature and live adapter, rejecting
invalid identity data without changing valid strings. Catalog decoding accepts
expanded detail capabilities and the prior date-only catalog, while rejecting
facility capability on national. The UI uses capability-gated `FormField`/`Input`
on Facilities; no reliable selector/discovery API is available. Generators retains
contract/adapter compatibility without adding a control. Production requests use
`facility` plus optional date bounds and the existing explicit `page_size`;
continuations contain only `cursor`. Clearing the input omits `facility`.

## Behavioral evidence

- `src/lib/facility-id.test.ts`: empty/non-string IDs, surrounding Unicode
  whitespace, Cc controls, malformed surrogates, UTF-8 byte boundaries, leading
  zeros, case, internal spaces, quotes and wildcard-shaped identity strings.
- `src/adapters/live/data-adapter.test.ts`: Analyst/Admin expanded catalogs,
  legacy compatibility, national rejection, combined filters including `001`,
  encoded exact IDs, clearing omission and cursor-only continuation for Facilities
  and Generators. Transport is injected; no HTTP requests reach a backend.
- `src/features/explorer/explorer.test.tsx`: Analyst/Admin combined dates/ID,
  exact leading-zero rows, clearing and Reset, local validation, unmatched empty
  results, Viewer absence of detail controls/metadata, pagination reset and late
  initial/continuation responses after facility changes. Existing access-loss,
  loading, API-error, snapshot and expiry scenarios remain passing.
- `tests/browser/explorer-page.spec.ts`: composed route flow applies the ID with
  dates, pages, changes to an unmatched ID, resets paging, then clears the ID.
  Viewer direct-entry restriction is also covered.

## Checks actually run

Node 24.18.0, npm 11.16.0; existing installed dependencies. Base web revision
`eb12366`. SHA-256 of sorted tracked/untracked nonignored `src/` and `tests/`
paths/contents (each NUL-separated), 207 files:
`266f9bb3fb5bf813d562b101c548448b74d0b717c42817eb1b27930b2a294ca4`.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test` | 446 passed, 33 files |
| `npm run test:boundaries` | 33 passed |
| `npm run check:boundaries` | Passed, 110 modules/15 production roots |
| `npm run build` | Passed, configured `.env.local`, webpack |
| `npm run check:production-fixtures` | Passed, 532 emitted files |
| `npm run check:release-boundaries` | Passed; structural registration/isolation only |
| `npm run build-storybook` | Passed, existing module-directive warnings |
| Affected Storybook Chromium checks | 12 passed, two workers |
| Controlled Next production Chromium checks | 8 passed, one worker |
| `git diff --check` | Passed |

Browser commands:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/browser/explorer-page.spec.ts tests/visual/features.spec.ts tests/visual/pages.spec.ts --workers=2
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npx playwright test --config playwright.controlled.config.ts --workers=1
```

Initial focused/full runs exposed old date-only expectations, which were updated
to the new contract before the passing full run. Typecheck/lint caught and fixed
a test matcher option and an unused fixture binding. The first Storybook browser
attempt was blocked from binding port 6007 in the sandbox; the authorized rerun
passed. Generated `next-env.d.ts` was restored. No dependency changes.

## Evidence limits

All behavioral evidence is synthetic or intercepted HTTP. Controlled production
checks cover actual Next composition/roles but do not establish live facility
filtering or backend authorization. No live API/Cognito checks, backend changes,
service activation, deployment or push occurred. Matching protocol-v2 worker
image and reviewed runtime identity are required before live acceptance; runtime
availability was not assumed. Existing loading, validation and API errors remain
in use; production failures never substitute fixtures.

The supplied desktop Explorer reference was inspected. The new input is a
recorded behavioral extension using existing primitives/layout. Browser checks
cover responsive behavior; no new screenshot promotion, full Figma comparison
or human visual sign-off is claimed. Review remains pending.
