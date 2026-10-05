# Authentication HTTP contract

Status: **backend handoff documented; web implementation and live verification
pending**. Received October 5, 2026. This document records the supplied auth
contract before implementation. The later [Data API v1 intake](data-api.md)
supplies the service contracts and extends CSRF usage to SQL/refresh POST.

## Accepted authorization boundary — October 5, 2026

Roles are assigned by the backend, and effective capabilities are controlled by
the backend. The frontend never assigns, sends or overrides either one.

- `GET /api/auth/session` sends the session cookie with `credentials: "include"`;
  it has no request body or role/capability query parameters or headers.
- The backend resolves identity and effective permissions. Returned capabilities
  guide UI navigation/actions; every API operation independently enforces
  current backend authorization.
- The frontend does not require a `role` field in the response and must not
  derive capabilities from role names or a client-maintained role matrix.
- The backend will add effective capabilities to its session response. Exact
  JSON field names await the updated backend contract. Capabilities describe
  permissions, not whether published data is currently available.

The role-bearing response below is the **original received handoff**, preserved
for provenance. It is not a frontend request or a requirement to expose roles in
the revised response. This newer user decision governs integration; no updated
backend implementation or live response is claimed.

### Backend implementation handoff

Return application identity (`user.id`, `user.email`), the existing expiry and
session-bound CSRF token, and backend-resolved capabilities for authorized dataset
IDs, national-series visibility and read-only SQL execution. The frontend maps
those values into its presentation model without assigning access.

Illustrative **response proposal**, not a request payload or finalized wire DTO:

```json
{
  "user": {
    "id": "application-user-id",
    "email": "user@mail.com"
  },
  "expires_at": "2026-10-05T15:00:00+00:00",
  "csrf_token": "opaque-session-bound-value",
  "capabilities": {
    "dataset_ids": ["national"],
    "can_read_national_series": true,
    "can_execute_query": true
  }
}
```

Confirm the proposed capability field names in the backend contract before auth
adapter implementation. A true SQL capability does not grant access to additional
datasets. No role-management or capability-setting endpoint is requested.

## Sources and authority

- Primary input: the user's October 5 auth endpoint handoff.
- Full reference: `docs/specs/user-access/http-contract.md` in the sibling
  `outage-explorer` backend repository, read locally on October 5, 2026.
- Backend checkout HEAD: `f9e691d72d267a5385f3ccf4655885310e7f0a4d`;
  the reference file had no working-tree changes. Its SHA-256 was
  `e450d0b0f938f9fa1b021491096032abbbfd7f5e91640d7902a497ec27bdfb10`.

The full reference describes auth as implemented and controlled-tested, with
integration choices still draft and ADR-0046/0047 proposed. This is source
provenance, not evidence of a running environment or approval of those ADRs.
Details below concerning exact Origin checks, cookie attributes, role values,
additional errors and configuration come from that full reference. Revalidate
against the backend revision selected for integration. Readiness and remaining
inputs are tracked in [live-readiness.md](live-readiness.md).

## Ownership and login flow

Flask owns authentication, Authorization Code with PKCE S256, provider callback,
code exchange and application sessions. Cognito owns email/password entry.
The web client starts browser navigation and receives the final UI redirect.
It never receives provider access, ID or refresh tokens.

```text
Web client → GET /api/auth/login?return_to=%2F
           → Cognito managed sign-in
           → GET /api/auth/callback on Flask
           → Flask establishes session and sets HttpOnly cookie
           → redirect to configured UI origin + allowlisted return path
           → web client calls GET /api/auth/session
           → resolve authenticated UI state
```

The callback is a backend route, even when publicly served through the UI's
same-origin proxy. Do not add a frontend OAuth callback or exchange provider
codes in browser code. Redirect completion alone does not establish UI identity.

## Received endpoint contract (handoff baseline)

| Endpoint | Request | Success |
| --- | --- | --- |
| `GET /api/auth/login` | Browser navigation; optional `return_to` | `302` to Cognito; sets login-binding cookie |
| `GET /api/auth/callback` | Cognito supplies `code` and `state`; browser supplies matching binding cookie | `302` to configured UI origin and stored return path; sets session cookie and clears binding cookie |
| `GET /api/auth/session` | Session cookie; fetch with `credentials: "include"` | `200` with identity, current role, original expiry and session-bound CSRF token |
| `POST /api/auth/logout` | Session cookie, exact permitted browser `Origin`, `X-CSRF-Token` from session response | `204` after committed current-session invalidation; clears session cookie; no response body |

`return_to` must match the backend-configured relative-path allowlist; the
default permits only `/`. The decoded path has no query, fragment, encoded or
external destination. Normal query encoding such as `return_to=%2F` is valid.
Do not assume `/overview`, `/datasets`, `/query` or arbitrary deep links are
allowed. Duplicate or malformed values fail generically. The configured public
origin determines the callback URI; the incoming Host does not.

Callback mismatch, expired/replayed attempts, invalid tokens or unlinked users
create no session. Provider callback failures clear the binding cookie and
return a generic error without exposing provider descriptions. A frontend error
redirect for these failures is not promised by this contract.

### Received session response (handoff baseline)

Illustrative payload supplied in the handoff, not a live account or session:

```json
{
  "user": {
    "id": "application-user-id",
    "email": "user@mail.com",
    "role": "viewer"
  },
  "expires_at": "2026-10-05T15:00:00+00:00",
  "csrf_token": "opaque-session-bound-value"
}
```

`user.id` is an opaque application-user identifier, not a Cognito subject.
Roles are `viewer`, `analyst` or `admin`, read from current PostgreSQL assignments
on each session check. `expires_at` is a timezone-bearing instant. The payload
does not contain a display name, permission catalog or authorized dataset IDs.
Identity and role presentation never replace backend authorization of services.

Keep `csrf_token` in application memory, scoped to the current session. Session
credentials remain in HttpOnly cookies. Do not persist the token or credentials
in localStorage, sessionStorage, URLs or logs; discard obsolete session tokens
when identity/session changes. Reloads obtain the token again from session
resolution.

### Browser request examples

These examples describe future integration and do not implement an adapter.

```ts
// Navigate the browser; do not fetch Cognito login as an API operation.
window.location.assign("/api/auth/login?return_to=%2F");

// On app startup and after the final backend redirect.
const response = await fetch("/api/auth/session", {
  credentials: "include",
});

// After successful session response validation, use its in-memory token.
const logoutResponse = await fetch("/api/auth/logout", {
  method: "POST",
  credentials: "include",
  headers: { "X-CSRF-Token": session.csrf_token },
});
```

The browser supplies Origin; application JavaScript must not synthesize it.
Decode status and payload before publishing identity. On `204`, clear
authenticated UI, protected caches/results, pending navigation and the CSRF
token; invalidate in-flight generations so stale responses cannot restore data.
On `503`, show a retryable logout failure: invalidation is unconfirmed and the
backend retains the cookie. Network failure also gives no success confirmation.
Do not report successful logout or discard the only retry token on that path.
Protect against stale publication while logout is pending; local removal of
protected content is distinct from confirmation of backend logout.

## Fixed session lifecycle and cookies

- Default application lifetime is one hour from establishment (3,600 seconds),
  with fixed expiry. API calls, page reloads and browser reopening do not extend it.
- Refreshing/reopening within that lifetime preserves login through the cookie;
  startup resolves the session again. Real browser persistence needs live proof.
- At expiry, require explicit sign-in. There is no automatic application renewal.
  Cognito SSO can complete a new flow without requiring password re-entry.
- Logout affects the current application session, not provider-wide SSO or
  independent browser-profile sessions. Tabs sharing the cookie share a session.
- Production cookies are `__Host-outage_session` and `__Host-outage_login`:
  `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`, no Domain, absolute Expires.
  Explicit loopback HTTP development uses `outage_session`/`outage_login`
  without Secure. Browser code must not inspect cookie contents.
- Repeated logout of an invalid, expired or revoked session clears its cookie
  after the Origin check. A valid session requires its own CSRF token; another
  session's token fails. Store resolution/invalidation failures return `503`.

## Errors and UI handling

```json
{
  "error": {
    "code": "unauthenticated",
    "message": "Authentication required"
  }
}
```

| HTTP | Auth error code | Public message | Client behavior |
| --- | --- | --- | --- |
| `400` | `login_failed` | Login failed | Generic sign-in failure; offer a new login where the UI receives the failure |
| `400` | `invalid_request` | Invalid request | Explain a request/configuration failure without inventing a successful session |
| `401` | `unauthenticated` | Authentication required | Clear protected state, show signed-out state and offer login |
| `403` | `forbidden` | Access denied | Show access denied and remove affected protected content; do not broaden access or mislabel it as logout success |
| `503` | `service_unavailable` | Service unavailable | Retryable service error; logout is unconfirmed |

Auth responses use `Cache-Control: no-store` and `Vary: Origin`. Error messages
contain no protected data or raw provider/exception details. The auth error table
does not establish service endpoint error contracts; the later
[Data API v1 record](data-api.md#service-errors) supplies their separate vocabulary.

## Local development transport

Use a same-origin `/api` proxy to Flask, forwarding redirects, cookies and
`Set-Cookie`, including the public `/api/auth/callback` route. Preserve the
configured allowed Origin for logout. The proxy is transport only; Flask remains
the session owner. No proxy has been configured by this documentation change.

The supplied example uses UI `http://localhost:5173`, Flask
`http://localhost:5000`, and public callback
`http://localhost:5173/api/auth/callback`. Port 5173 is illustrative, not a change
to this repository's Next.js stack or dev command. Use the actual selected UI
origin consistently in backend, proxy and Cognito callback configuration.

Backend auth requires `OUTAGE_AUTH_ENABLED=true`; local HTTP requires explicit
`OUTAGE_AUTH_DEVELOPMENT_HTTP=true` with loopback origins. Coordinate
`OUTAGE_AUTH_PUBLIC_ORIGIN`, `OUTAGE_AUTH_UI_ORIGIN`,
`OUTAGE_AUTH_CALLBACK_URI`, Cognito app-client callback configuration and
`OUTAGE_AUTH_RETURN_PATHS` (default `/`). Database/provider credentials stay
backend-owned; never place them in public frontend environment variables.

For separate same-site origins, the full reference permits explicit credentialed
CORS for exact configured UI/backend origins. No wildcard origins. Cross-site
hosting does not work merely by enabling CORS with `SameSite=Lax`; it needs a
same-origin proxy or a separately agreed transport change. Production hosting and
exact environment values remain open.

## Existing frontend seams and follow-up decisions

These are documented integration gaps, not changes to the accepted fixture code:

| Current seam | Backend contract / required follow-up |
| --- | --- |
| `SessionIdentity.subject` / `displayName` in `src/contracts/session.ts` | Backend returns application `user.id` and `email`. Agree the view-model mapping; never imply that `id` is a provider subject. |
| `SessionCapabilities.datasetIds`, `canReadNationalSeries`, `canExecuteQuery` | Session returns only a role. The later [catalog contract](catalog-preview.md) supplies authorized dataset IDs but no capability booleans; agree capability population or revise the seam; do not invent dataset IDs or permission payloads from fixtures. |
| `AuthenticatedSession.expiresAt` | Map validated `expires_at` without extending its instant; keep the CSRF token in session-scoped memory outside shared presentation props. |
| `beginLogin` | Browser navigation to Flask login; callback/code exchange stays entirely on Flask. |
| `createAuthService` in `src/features/auth/service.ts` | Currently invalidates local state before the logout request. Reconcile pending cleanup, confirmed logout and retryable `503` with CSRF lifetime before using real transport. |

Before transport coding, record the integration owner, target environment and
version; settle the capability/identity mapping and logout lifecycle; assign exact
proxy/configuration and adapter paths under T5.3. No frontend callback is needed.
Service, metric, preview and SQL endpoints are outside this auth-only handoff.

## Verification required when implementation is authorized

- Decode the revised identity/capability response and errors; withhold protected
  UI when capabilities are unresolved or expiry is invalid. Do not require role
  names to resolve UI permissions. Verify token isolation between sessions.
- Exercise browser navigation through Cognito, backend callback, cookie handling,
  final UI redirect and session restoration with the actual proxy/configuration.
- Verify reload/reopen before expiry, fixed expiry despite API calls, explicit
  re-login and no restricted-content flash during resolution.
- Verify `204` logout, repeat logout, `401`, Origin/CSRF `403`, and retryable `503`
  or lost response without false success; independent sessions remain independent.
- Verify identity/effective-capability changes, late responses and token cleanup
  cannot restore stale protected data. Confirm requests contain no role/capability
  claims and backend enforcement is independent of UI visibility.

No live calls, adapter tests or visual checks were run for this documentation-only
handoff. Fixture acceptance remains separate from live auth acceptance.

## User decision after intake — October 5

The backend will add capability fields. Preserve the existing frontend capability
model and await the expanded response for validation/mapping. Do not infer
capability flags from role as a substitute. No API responses are expected yet;
auth transport/session integration remains pending. See [the adaptation record](frontend-adaptation.md).
