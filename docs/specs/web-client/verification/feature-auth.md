# Auth fixture feature — T4.A1–T4.A4 / T4.AC

Implementation and scoped behavior checkpoint recorded October 4, 2026. Root
coordinator review and integrated browser/visual evidence remain pending.
Trace: FR2–FR6, FR16–FR19; TR2, TR6, TR8–TR9; AC2–AC6, AC16, AC19.
Predecessor T3.A was accepted in the execution ledger; root reviewed and accepted
T4.A1 before organisms were authored. Later lane milestones ran sequentially
under root authorization and each passed scoped checks before its successor.

## Public composition seam

`src/features/auth/index.ts` exports `AuthFeature`, `AuthFeatureProps` and
`AuthControls` only. The entry takes injected `SessionOperations` and the
composition-owned `SessionRuntime`. Its optional render child receives
`signOut()` and is invoked only with an authenticated runtime snapshot.
Composition supplies the same runtime to the shared `SessionProvider` and all
feature entries. Auth does not create a separate authoritative session store.
Without a render child, the entry shows a signed-in identity and Sign out action.

The controller resolves an initially pending runtime. Other recoveries are
explicit actions. Successful `beginLogin` never establishes identity: the
managed-login pending state supplies a deliberate Check session action; only
`resolveSession` establishes backend-supplied identity/capabilities/expiry.
The existing runtime enforces the supplied expiry, with no automatic renewal.
Logout invalidates local protected state before invoking the injected logout
operation in the new generation. Failure says local content was cleared but
service confirmation is missing and supplies Retry sign out. This local test
behavior does not prove backend invalidation or independent backend sessions.

`SessionBoundary` withholds the entire protected subtree pending, signed out
or expired. `AuthFeature` also withholds render-child invocation, including
server rendering where its snapshot is always pending. Shared generation guards
reject stale success, normalized failure and transport rejection. Unmount aborts
publication; unexpected adapter details are replaced with generic safe text.
Sign-in clicks during an in-flight operation do not duplicate dispatch.

## Checks actually run

- `npx eslint src/features/auth` — passed.
- `npx tsc --noEmit --incremental false` — passed on the shared tree after
  concurrent lane fixes; this does not emit a production build.
- `npx vitest run src/features/auth/auth.test.tsx` — **16 tests passed**.

Behavior assertions cover server and held-pending withholding, StrictMode
effect remount, explicit login/check-session call sequence, repeated clicks,
one-hour fixture expiry with no renewal, local-before-delayed logout,
independent frontend runtime preservation, logout uncertainty/retry, denied and
service-failure recovery, four stale resolution outcome variants after an
Analyst-to-Viewer generation change, unmount and generic transport recovery.

The explicit synthetic call trace for sign-in is `beginLogin` followed by
`resolveSession` only after Check session; logout retry is exactly `logout`,
`logout` after the user clicks Retry sign out. Expiry alone dispatches neither
operation. The one-hour fixture setting matches the requirement but is not
provider lifetime evidence. The capability race verifies the new runtime retains
only `synthetic-national`; other feature/catalog enforcement remains its own
checkpoint and the composed fixture harness's responsibility.

Base git revision: `d85410486de5055237a4f66cde197250555e9bd8`. Lane source/test/story
SHA-256 digest (sorted basenames, NUL separators and file contents under
`src/features/auth/`) is
`563ac312d4cd73a280bb3d4aca1818bef285a5913f5229248cd13d2f4dbd73b5`.
The coordinator records the broader integrated-tree digest; uncommitted
implementation is included. A passing bootstrap build predating these files
must not be used as current emitted-fixture evidence.

## Design and story evidence

Inspected saved original [V1 reference](../evidence/sign-in-desktop.png) and
accepted [Phase 3 managed-entry capture](../evidence/phase-3/auth-entry-1440.png)
before composition. O5 retains the shared AuthTemplate centered 390px card,
30px desktop/23px narrow padding, 15px spacing, brand geometry, typography and
teal top rule. C1 replaces local credentials with the managed-login CTA; C10
adds pending, expired, denied and recovery content. D1 shared readability
extensions remain inherited from the accepted template.

Feature story IDs are `features-auth--managed-login-entry`, `--pending`,
`--expired`, `--denied`, `--error` and `--signed-in`. These use the test-only
FixtureProvider and its visible synthetic label. Runtime entry imports do not
reach stories or fixtures. No role selector, password field, callback URL,
credential storage, HTTP path or live adapter was introduced.

New feature screenshots and comparisons at 1440×1100, 390×1100 and the
1000/760/480 boundary matrix are pending root's serialized Storybook/browser
run. Existing Phase 3 captures verify the reused template only; they are not new
Auth feature visual evidence. Keyboard/focus and state announcements use native
Button and StatusMessage primitives; actual feature browser checks remain
outstanding until that run.

## Remaining live and integration gates

AC2–AC6 live portions remain unverified. Q2 still requires agreed session
transport, backend version/routes, Cognito callback/client configuration,
PKCE/code exchange and actual current-session invalidation. No real login,
logout, independent backend session, denied HTTP request or token behavior was
tested. Q4 final browser acceptance remains separate. T5.H must compose these
controllers with other feature lanes before any product pages; no routes,
production registration or deployment are part of this lane.

## Coordinator acceptance

Accepted fixture checkpoint after source review and integrated verification: 
123 Vitest tests, 31 boundary tests, 6 Chromium tests and 16 reviewed captures;
type/lint, fresh production/Storybook builds and emitted fixture exclusion passed.
The final [Phase 4 record](phase-4.md) and [manifest](phase-4-digests.json)
supersede worker-handoff pending integration/visual statements above. Live and
final browser-matrix acceptance remain unresolved as documented.
