# Controlled frontend contract adaptation

October 5, 2026. Base revision `3b0cbe3`; working-tree changes, uncommitted.
The [179-file implementation manifest](contract-adaptation-digests.json) records
SHA-256 `08003d8457454153bc2d3212d27dfd4abdc2db572d67e284894a2f0d1fda735b`
for the tested source, tests, tooling and imported response snapshots.
User decisions and expected-versus-available behavior are in
[frontend-adaptation](../contracts/frontend-adaptation.md).

## Scope and evidence boundaries

Date-only v1, optional bounds, catalog/schema/preview/query decoding, rich cells,
exact metric fractions, complete national series assembly and explicit retained
SQL recovery are implemented locally. Injected HTTP transport uses cookie
credentials and a caller-provided in-memory CSRF token; no auth field shape is
invented. Auth integration awaits the backend capability addition. Production
operations remain unavailable; no live API/provider requests, backend writes,
proxy configuration, deployment, commit or push occurred.

The supplied OpenAPI/fixture snapshots remain byte-identical. New decoder tests
consume their synthetic response bodies; B2 SQL projection fidelity is not
claimed, and the B3 inconsistent row-limit case is deliberately rejected. Legacy
feature fixtures remain independent synthetic data/settings, not wire DTOs.

## Verification actually run

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm test -- --reporter=dot` | 147 tests passed across 20 files |
| `npm run test:boundaries` | 33 adversarial checks passed |
| `npm run check:boundaries` | Passed; 95 modules, 14 production roots |
| `npm run build-storybook` | Passed |
| Chromium Explorer, Overview, Queries and composed feature-harness browser suites | 9 scenarios passed, one worker, cached Chromium; initial sandbox server-binding failure resolved with approved execution |
| `npm run build` | Fresh webpack production build passed |
| `npm run check:production-fixtures` | Passed; source graph and 156 emitted files |
| Documentation links and imported snapshots | 192 local links checked; OpenAPI/fixtures unchanged |
| `git diff --check` | Passed |

Browser command:

```sh
PLAYWRIGHT_BROWSERS_PATH=/private/tmp/outage-web-playwright npm run test:e2e -- tests/browser/explorer-page.spec.ts tests/browser/overview-page.spec.ts tests/browser/query-page.spec.ts tests/browser/feature-harness.spec.ts --workers=1
```

Behavior tests cover open/out-of-coverage dates, unsupported facility inputs,
large numeric strings, nested/duplicate cells, schema-dependent invalid values,
wrong page counters, full national cursor collection and generation mismatch,
exact `10/3` versus displayed `3.33`, uncertain execution without retry,
GET-only retained recovery with captured page size (including retryable GET
failure), missing CSRF and unavailable HTTP responses without fixture fallback.

The browser scenarios exercise existing page compositions, national-only Viewer
metadata, handoffs, cursor expiry, stale-session/access changes and same-execution
SQL pages. New wire mappings are controlled unit/integration evidence; those
browser stories use the legacy synthetic operations. No live authorization,
Cognito, cookie/proxy behavior or backend execution isolation is certified.

## Design and acceptance

Uses existing inspected V2/V3/V4 components and layout; accepted v1 scope removes
the facility selector. Required states add unknown nullability, richer table text,
empty-truncated explanation and explicit retained-page recovery. No new Figma
visual comparison or pixel-fidelity acceptance is claimed. Historical Phase 4–6
visual captures remain evidence of their original revision, not these changes.

Affected shared seams and feature consumers were revalidated above. Full
T5.3/T5.L/T6.L and release remain incomplete; source corrections are user-owned,
and expanded auth DTO/production registration/target configuration/live checks
remain required.
