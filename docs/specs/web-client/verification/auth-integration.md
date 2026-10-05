# Auth integration implementation and evidence

October 5, 2026: **T5.3 Auth intake accepted for coding; T5.4/T5.5 implemented**.
FR2–FR6/FR16/FR19; TR3/TR6/TR7. Combined T5.3, T5.9/T5.L, T6.L and release
acceptance remain open for data and full authenticated lifecycle evidence.

The user supplied the current role-only response and Viewer/Analyst/Admin
restrictions. That authorizes presentation mapping from backend-assigned roles,
superseding the earlier capability-only frontend decision. No permission claims
are sent. Viewer sees national only; Analyst/Admin see all three datasets;
SQL scope follows permitted datasets. Refresh UI remains excluded. See the
[current decision](../contracts/auth.md#current-response-and-revised-user-decision--october-5).

## Implementation

- Strict runtime decoding maps application ID to the existing opaque identity
  slot and email to display name, retaining the original timezone-bearing expiry.
  Unknown/missing role, malformed expiry or missing CSRF withholds access.
- Login navigates to Flask's `/api/auth/login?return_to=%2F`. Provider exchange
  and callback stay entirely on Flask. Session fetch sends cookies only.
- The server-only target config installs a Next `/api` rewrite. Only an enabled
  boolean crosses into client props. Missing target fails closed; invalid target
  rejects startup without echoing values. No secret or backend address appears
  in emitted client JavaScript.
- CSRF lives only inside the adapter. Admission to a resolved generation binds
  it to that identity and original expiry. Protected cleanup precedes logout;
  only its unresolved logout generation retains the retry token. Other changes,
  aborts, original expiry and confirmed logout discard obsolete material.
- Pending logout is distinct from confirmed signed-out state. Network/503/403
  failures do not confirm success; only 204 does. Remounting cannot resolve the
  retained cookie and restore access during uncertain logout. Late responses
  cannot invalidate another identity or transfer its CSRF token.
- Production registers auth only when configured. Data/navigation operations
  remain explicitly unavailable; no fixture or implicit data/SQL registration.

## Version and configuration binding

Source reference checkout: backend `808205158669836e52e107cbc626d1517e0df4e6`.
HTTP auth reference SHA-256:
`07bafab29790478a7364d12274c8dae8aa2996414ebad9bf6806da7672837e0e`.
Backend identity serializer SHA-256:
`6eed444c4f1091a2d76703f3b98b94a8dbc4980aedf2c4c742808076c8a635d6`.
The running API advertises no revision; these hashes identify the locally
inspected source, not an independently proven deployed revision.

Flask target is user-confirmed `http://localhost:8000`; Next UI is
`http://localhost:3000`. Gitignored `.env.local` sets server-only
`OUTAGE_API_ORIGIN`. With explicit sandbox approval, only backend `.env`
`OUTAGE_AUTH_UI_ORIGIN` changed from 8000 to 3000; the user restarted Flask.
Public/Cognito callback remains `http://localhost:8000/api/auth/callback`.
Default `/` is already allowlisted. No Cognito settings, accounts, provider
credentials or backend source changed. Use localhost consistently for host cookies.

Frontend pre-implementation HEAD: `5646588adacd3ef6658e9173652982a7148ee03d`.
[Digest manifest](auth-integration-digests.json) binds 186 source/test/script/asset
and root config/lock/example files, including untracked additions. It excludes
documentation, generated outputs and the private `.env.local`. Aggregate digest
hashes sorted paths, NUL, bytes, NUL. The manifest records the final configured
build ID and content hashes; the same source was also built with an empty target
for the separate unconfigured production browser check.

## Checks actually run

| Check | Result / scope |
| --- | --- |
| `npm run typecheck` | Passed; strict TypeScript and Next route generation |
| `npm run lint` | Passed across final source/config/tests |
| `npm test` | 179 tests across 22 files passed; includes auth transport/lifecycle and all affected feature consumers |
| `npm run test:boundaries` | 33 adversarial tests passed |
| `npm run check:boundaries` | 99 modules / 16 production roots passed |
| `npm run build` | Fresh configured webpack build passed; also separately passed with `OUTAGE_API_ORIGIN=''` |
| `npm run check:production-fixtures` | Fresh configured build scan passed, 158 emitted files; client target/env-name scan found no matches |
| `npm run build-storybook` | Passed; existing nonfatal module-directive warnings |
| Fixture Chromium: feature-harness, navigation, sign-in-page | 8 tests passed against the fresh Storybook build |
| Unconfigured production Chromium | 1 actual-Next scenario passed with empty target at build/start; no fixture interception or fabricated traffic |
| Real-Flask auth Chromium project | 3 tests passed: signed-out session/UI,302 managed-login redirect/HttpOnly binding cookie, browser-origin signed-out logout204 |
| `npm run check:release-boundaries` | Expected failure: combined live production registration remains unverified |

Controlled tests cover all three roles, unknown/missing roles, malformed expiry,
offset/microsecond expiry, token isolation, fixed original expiry, stale/aborted
resolution, late logout after identity change, retryable503/network/403,
unexpected logout200, logout401 and repeated204. They use clearly synthetic
identities/tokens; no actual user response or credential is recorded.

The live project uses actual Next/Flask with no fixtures/interception and disables
traces, screenshots and videos. Assertions avoid serializing cookie/PKCE values.
Initial logout failed 403 under the old UI origin; after correction/restart it
passed. The first post-restart login returned 503 once; a direct check returned 302,
and the subsequent complete auth suite passed. These failures are retained as
observed environment evidence rather than hidden with test retries.

## Remaining acceptance

No live authenticated Cognito completion, authenticated reload/reopen, backend
fixed-expiry enforcement, role mutation/access reduction, authenticated CSRF
logout or independent-session invalidation was exercised. Those require
coordinated accounts/lifecycle controls and remain open. Backend authorization
is not established by the presentation role map or signed-out smoke.

No new visual layout was designed or compared with Figma. Existing pending/error
components are reused; fixture browser checks verify behavior, not a new fidelity
review. Data adapters remain controlled preparations and are not registered in
production. No release, push, provider configuration change or deployment.
## Development login-return correction — October 5

User reported Runtime TypeError `Type error` at native `measure` on Next16.3.8
webpack. Local development logs and an isolated Chromium reproduction identified
`HomePage cannot have a negative time stamp`. The root page's rendering-time
`redirect("/overview")` triggered the failure with both signed-out and synthetic
authenticated responses. This matches the category of development timing failures
tracked in [Next issue86060](https://github.com/vercel/next.js/issues/86060),
although this repository's root-redirect reproduction is the decisive evidence.

Moved the root redirect to the
[Next redirect configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
with HTTP307 and removed the throwing root page. Corrected production-provider
cleanup to clear protected state to `pending`, allowing Strict Mode's next setup
to perform a fresh authoritative cookie-session check. Previously its simulated
unmount changed the runtime to `unauthenticated`, suppressing that check.

Controlled regression: four development Chromium scenarios cover signed-out,
Viewer, Analyst and Admin returns through `/` and `/sign-in`, using synthetic
session responses only. Runtime errors disappear, signed-in sessions reach the
real overview with data-service unavailability, and signed-out sessions keep
protected navigation hidden. First cold sign-in assertion exceeded the old
five-second timeout; warmed rerun passed and the dedicated project now allows
15 seconds for cold route compilation. Authenticated Cognito completion remains
unverified; existing live and fixture evidence above retains its original scope.
These changes supersede the earlier source/build binding for the affected files.

Checks:179 Vitest tests, four controlled development browser scenarios,
typecheck, lint, webpack build, source boundaries (98 modules/15 roots) and
production fixture exclusion (153 emitted files) passed. Initial typecheck saw
stale generated types for the deleted root page; the fresh build regenerated them
and the subsequent typecheck passed. No dependency upgrade or backend change.

## User-confirmed live login — October 5

After the runtime correction, the user confirmed both that the error was fixed
and that they successfully logged in to the app. This records a successful live
login as user-reported evidence, superseding the earlier absence of login
completion evidence at that narrow scope. No credentials or session data were
requested or captured, and no new automated live journey was run for this update.

Authenticated reload/reopen, fixed expiry, permission enforcement/access
reduction, authenticated CSRF logout and independent-session behavior remain
unverified. This confirmation does not close T5.L, T6.L or Phase7. The next
implementation remains data adapter integration T5.6–T5.8 and production wiring.

## Cognito browser logout — October 5

Implemented the user-requested provider navigation after guarded API `204`.
Local state and memory-only CSRF are cleared before the public Cognito logout
URL is passed to `window.location.assign()`. The domain/client ID were read from
the existing backend configuration and copied as public values into gitignored
frontend configuration; the explicit return is `http://localhost:3000/sign-in`.
No app client secret was read, copied, used or serialized. User confirmed the
return URL's Allowed sign-out registration.

Validation on the updated tree:

- 184 Vitest tests passed, including URL construction/configuration validation,
  confirmation-before-navigation, no provider fetch, errors/retry, unexpected
  status, aborted/stale `204` and independent runtime protection.
- Two Chromium scenarios on actual development routes passed with controlled
  API/provider responses: `204` → document navigation to Cognito → `/sign-in`
  return → controlled session `401`; `503` → retry without provider navigation.
- Typecheck, lint, webpack production build, source boundaries and emitted
  fixture exclusion passed. Initial checks found exact-optional typing and two
  lint issues in the new browser test; corrected and rerun successfully.
- Real local Next-to-Flask proxy, with an already signed-out caller: logout
  POST with UI Origin returned `204`; subsequent session GET returned `401`.

The controlled provider redirect does not establish real Cognito cookie
clearance. An authenticated real browser logout and the next login credential
prompt still require verification in the user's authenticated browser. No new
visual comparison, data acceptance, global revocation or release acceptance.

## User-confirmed Cognito logout — October 5

After configuration and testing, the user confirmed that the Cognito logout
flow works as expected. This records user-reported acceptance of the requested
browser logout behavior, superseding the pending user verification above.
No new automated live journey or individual HTTP/credential-prompt observations
were captured in this update. Earlier controlled tests retain their stated scope.
Reload/reopen, expiry, permission enforcement and independent-session checks,
data integration and release acceptance remain separate.

## Viewer Overview-only restriction — October 5, 2026

The user clarified Viewer web access is Overview-only, superseding earlier
national Explorer/SQL presentation access. Backend role mapping now retains
national metadata for Overview while withholding Explorer and SQL capabilities.
Navigation and handoffs use those restrictions. The protected layout returns
blocked `/datasets` and `/query` visits to `/overview` before feature mount,
and removes mounted content immediately on access reduction. Overview omits
exploration actions for Viewer. Analyst/Admin keep both analytical pages.

Verification on the updated working tree:

- `npm test -- --reporter=dot`: 190 tests passed across 22 files, including
  blocked direct entries, current handoffs, access reduction, preserved
  Analyst/Admin access and cleared drafts/results after access restoration.
- `npm run typecheck`, `npm run lint`, `npm run check:boundaries` and
  `git diff --check`: passed; source check covered 98 modules/15 roots.
- `npm run build-storybook`: passed, with existing module-directive warnings.
- Development Chromium project: 9 tests passed, including actual Next routes
  `/datasets` and `/query` for Viewer/Analyst/Admin, with synthetic intercepted
  session responses. Login-return and logout regressions also passed.
- Fixture Chromium suites `explorer-page`, `navigation`, `feature-harness`:
  9 tests passed, including no schema/preview/execution calls on Viewer direct
  Explorer entry and mobile access reduction returning to Overview.

These are controlled frontend checks. No live Cognito completion, backend
permission-policy change, deployment, fresh production build or new visual
comparison is claimed. Existing live/release gates remain open.

## Admin Overview refresh — October 5, 2026

The user requested the previously conditional Admin refresh control. Production
composition now registers refresh admission/status alongside configured auth,
using its in-memory CSRF token. Overview exposes controls only for Admin and
checks current capabilities before transport. Admission uses `{}` and one
idempotency key per attempt/retry sequence; status/latest GETs never start work.
Confirmed publication reloads Overview observations once; SQL is untouched.

Verification against the updated working tree:

- `npm test -- --reporter=dot`: 213 tests across 24 files passed. New coverage
  includes roles, CSRF/key validation, all run states, safe failures, stale
  responses, duplicate-click prevention, same-key uncertain retries and denied
  controls.
- `npm run typecheck`, `npm run lint`, `npm run check:boundaries` and
  `git diff --check`: passed. Boundaries covered 102 modules/15 roots.
- Fresh `npm run build` and `npm run check:production-fixtures`: passed; the
  emitted scan covered 272 files without fixture signatures.
- Development Chromium project: 12 tests passed, including actual Overview
  Admin refresh visibility, intercepted `503` then `202` admission with identical
  key/body/CSRF, GET status completion, Viewer/Analyst absence and existing
  role/navigation/logout regressions.

The current sibling backend OpenAPI was rechecked: refresh schemas match the
imported snapshot; operations are now marked implemented and latest adds `400`.
See the [refresh contract](../contracts/refresh.md) for the source hash. The
original Overview desktop reference was inspected; new controls reuse existing
variants as a user-requested design extension. No new screenshot comparison or
visual acceptance was performed. Browser responses were synthetic; no real
refresh/ingestion or live Admin session acceptance was triggered here.

## Reload restoration presentation — October 5, 2026

The user confirmed the sign-in screen only flashes until the existing cookie
session check completes. Pending restoration now uses a neutral heading and
no sign-in button. This changes presentation, preserving cookie-based session
restoration, role checks, fixed expiry and deliberate recovery.

- `npm test -- --reporter=dot`: all 213 tests passed, including withheld protected
  content/login actions during a held startup resolution.
- `npm run typecheck`, `npm run lint` and `git diff --check`: passed.
- Development Chromium: 15 tests passed. Three new role-specific cases each
  reload twice, hold the response to inspect restoration UI, verify a controlled
  HttpOnly cookie reaches the intercepted session endpoint, preserve the route
  and role navigation/refresh controls, and assert zero login requests.

Cookie values/responses in these tests are explicitly synthetic. These checks
are not live backend/Cognito acceptance. No new visual comparison was performed.
