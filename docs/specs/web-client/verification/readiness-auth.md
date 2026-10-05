# Auth lane readiness — T3.A

Accepted presentation prerequisites: **T1.C, T2.2, T3.2, T3.7**. Recorded
October 4, 2026. Trace: FR2, FR5, FR17, FR19, TR8, AC5, AC17, AC19.
The coordinator accepted T3.2 and T3.7 after source review and scoped checks.
This gate permits the Phase 4 Auth fixture lane; it does not start that lane,
assemble a product route, or accept live authentication.

## Ready vocabulary

- A1 `Button` provides native explicit actions and loading/disabled states.
- A3 `BrandMark`, `Surface` and `Spinner` preserve identified source assets,
  surfaces and loading semantics. Their Phase 2 evidence remains authoritative.
- M2 `StatusMessage` supplies pending/error/recovery slots and explicit polite,
  assertive or quiet announcements. Action slots remain outside live text.
- T1 `AuthTemplate` supplies the V1 centered branded card with title,
  description, content, actions and footer slots. It has no credentials form,
  session workflow, feature import, fetching or route dependency.

Story IDs are `templates-authtemplate--managed-login-entry`, `--pending`,
`--expired` and `--error`. Global Storybook decoration visibly labels these
synthetic. Story buttons do not perform authentication. Template mapping retains
the 390px card, 30px padding, 15px gap, 9px radius, auth shadow and 4px teal
top rule. At/below 760px, outer/card padding becomes 18/23px. The original
25px brand geometry is unchanged. D1 increases the strapline 9→10px and
footer 9px faint→11px muted. C1/C10 account for the managed-login action and
new states replacing prototype credentials/happy-path-only content. Browser
capture comparison passed in the final Phase 3 integrated check: 21 Chromium
tests and 32 shared-component captures. See [Phase 3 evidence](phase-3.md).

## Existing shared runtime and fixture seams

Use the established `SessionOperations` public contract (`resolveSession`,
`beginLogin`, `logout`), not invented callback URLs or HTTP routes.
`SessionProvider` accepts a single composition-owned runtime;
`useSessionState` reads its generation-aware snapshot. The server snapshot is
pending. `createSessionRuntime()` provides `capture`, `isCurrent`,
`setResolution`, `invalidate` and `registerCleanup`; every authoritative
transition advances the generation and clears registered protected state.

`guardOperation` guards success, failure and rejection publication and does
not replay an operation. Session operations must deliberately pass
`requireAuthenticated: false`. A resolve example using the existing seam is:

```ts
const context = runtime.capture();
await guardOperation(runtime, context,
  () => operations.resolveSession(context), {
    requireAuthenticated: false,
    onSuccess: (resolution) => { runtime.setResolution(resolution); },
    onFailure: (failure) => { reportFailure(failure); },
    onRejected: (error) => { reportTransportFailure(error); },
  });
```

`operations`, `reportFailure` and `reportTransportFailure` above are future
caller-owned dependencies, not implemented Auth controllers. Before logout,
invalidate locally and capture the new generation for the logout operation.
Keep the real backend invalidation requirement distinct from local cleanup.
Do not treat `beginLogin` success as authenticated identity; resolve the
authoritative session through the agreed integration.

For isolated fixtures, `createFixtureOperations({ persona: "viewer" })`
returns `operations`, `sessionResolution`, `callLog` and explicit scenario
controls. `FixtureProvider` supplies this controller plus one runtime through
`useFixtureController`; `setPersona` updates both the fixture resolution and
runtime. It is test/story-only and visibly labels invented data. Useful
existing scenarios include:

- `controller.deferNext("resolveSession")` with `release()`/`reject(error)`
  holds a captured response for stale-generation tests.
- `controller.failNext("beginLogin", { kind: "service-failure", message:
  "Synthetic sign-in failure." })` injects a supplied failure using the
  existing `OperationFailure` discriminant.
- `controller.setPersona("viewer")` followed by
  `runtime.setResolution(controller.sessionResolution())` models access
  reduction outside `FixtureProvider`; inside it, use its `setPersona` helper.
- `callLog.read()` reports operation, generation, input and outcome without
  claiming real provider/network integration.

The fixture's initial state is signed in. Explicitly resolve/logout or inject
an unauthenticated state when exercising entry screens. Its login operation
is an invented test action; the one-hour session setting is a fixture choice
matching the application requirement, not proof of Cognito transport.

## Checks actually run and remaining gates

T3.7 scoped ESLint and `tsc --noEmit --incremental false` passed. This readiness
run executed existing runtime/guard/feature-contract tests: **21 passed** across
three files. Existing fixture-operation/display tests: **18 passed** across two
files. These checks verify controlled frontend behavior and existing seams;
they do not test a new Auth feature. Phase 1 and Phase 2 integrated source
revision/digests remain recorded in their own verification files. The Phase 3
coordinator will bind integrated evidence to the final working-tree digest.

Q2 session transport, Cognito callback/client configuration and actual backend
invalidation remain unresolved. Q3 affected live payload/errors and Q4 final
browser acceptance remain separate. No fixture-to-production registration,
live login/logout, backend permissions or product visual fidelity is accepted
by this readiness document.
