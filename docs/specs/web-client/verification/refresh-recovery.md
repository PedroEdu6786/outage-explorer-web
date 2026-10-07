# Refresh admission recovery — review D2

October 7, 2026. Based on `544fab4` (D1). The user requested D2 next, with a
separate local commit. This evidence covers controlled frontend behavior only.

Implementation/test fingerprint: SHA-256
`fabbdb92633f340e546c19143e8fcef62b6daf7da22e8f1a4a7845d1e6f9c11f`,
using path, NUL, contents, NUL in this order: `src/features/overview/useRefresh.ts`,
`src/features/overview/RefreshControl.tsx`,
`src/features/overview/refresh.test.tsx`,
`tests/development/data-production.spec.ts`. The base revision binds unchanged
configuration and dependencies; documentation/journal additions are outside this
implementation fingerprint.

## Problem and correction

After completed refresh A, an unconfirmed admission B kept A displayed. Checking
status read A and its terminal state discarded B's idempotency key. The next
admission could use a fresh key rather than recovering B.

The hook now tracks an unconfirmed admission key separately from displayed run
status. Starting admission clears the prior displayed run. Until admission is
confirmed, status reads use `/latest`; their responses never discard that key.
Because latest is global across Admin requesters, the UI explains that it may
describe another request and keeps deliberate same-key retry available even for
an active or publication-unknown latest run. Only successful admission/replay
identifies this request. Confirmed active runs continue to block new admission;
later new admissions use a fresh key. Session/access cleanup remains unchanged.

## Regression evidence

- Six new cases failed against the original hook because the old success was
  still shown after a new admission failed. All now pass through status lookup
  and replay: previous terminal run, another Admin's running/publication-unknown/
  succeeded run, no run, and unavailable status.
- Each case asserts latest lookup, no status-triggered POST, unchanged retry key,
  a different key from the prior admission, and a fresh key for following work.
- Session reduction removes the uncertain key; a later Admin resolution starts
  with a fresh key. Existing delayed-response, denied-access, double-click,
  publication and known-run status tests remain passing.
- A new actual production-route browser scenario uses intercepted synthetic HTTP
  to verify completed A, uncertain B, unrelated publication-unknown latest,
  same-key B replay, and a subsequent admission with a new key.

## Checks

- 399 Vitest tests passed; the final targeted refresh run passed all 14 tests.
- Typecheck (including fresh Next route generation), lint and 33 boundary tests
  passed.
- Configured Next webpack production build and fresh release/source/emitted
  fixture boundary checks passed.
- Eight controlled production-route browser tests passed, including D1's two
  retained/pending SQL denial regressions and the new D2 scenario.
- `git diff --check` passed. Generated `next-env.d.ts` was restored.

Browser checks used the existing Chromium cache and permitted localhost:6009
server binding. No dependencies were installed, no backend refresh was admitted,
and no push/deployment occurred. Live backend idempotency and authenticated
Cognito acceptance remain unverified; no visual/Figma sign-off is claimed.
