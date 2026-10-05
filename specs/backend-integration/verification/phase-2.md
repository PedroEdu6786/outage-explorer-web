# Backend integration phase 2: Protected lifecycle completion

Completed T2.1–T2.4 and T2.C on October 5, 2026. Evidence is controlled frontend
behavior with synthetic operations and injected transport responses. No backend,
connected browser, anti-forgery enforcement, visual or release acceptance is claimed.

## Source binding

Base revision: `4bff809d0aabc60ffcad0675f0569ddba6c401dd` on
`feat/backend-integration`. SHA-256 of sorted paths and contents, each separated
by a NUL byte: `57aead98e29014b3b188ca7eedb8c1ed7b8aa9963510057b97665dc96181a6c2`.
The digest covers these six completed implementation/task/handoff files:

- `src/features/queries/service.ts`
- `src/features/queries/queries.test.tsx`
- `src/adapters/live/data-adapter.ts`
- `src/adapters/live/data-adapter.test.ts`
- `specs/backend-integration/tasks.md`
- `docs/specs/web-client/README.md`

This record and the coordinator-owned journal are excluded to avoid self-reference
and concurrent journal writes. Generated files are excluded. Type generation
normalized `next-env.d.ts`; both preexisting `.next/dev` declaration imports were
restored after checks. Existing `query-state.ts` and `useQueries.ts` already support
this controller's state and externally owned persistent lifetime; no ownership
migration or new state cache was required.

## Failed-before-fixed reproduction

`npx vitest run src/features/queries/queries.test.tsx` initially failed two added
catalog/schema denial cases. In the decisive red run, a delayed same-generation
Run success republished protected results after metadata denial; submitted SQL
also remained. The repaired matrix covers both metadata denial sources against
late Run, page and owned recovery success. Reverse late metadata publication after
query denial is also rejected. Generic forbidden responses clear protected
metadata, submitted context, results and owned recovery without signing out.
The draft remains available for deliberate editing/Run. A new publication abort
context prevents stale callbacks, including stale unauthenticated failures, from
affecting the current context. Authoritative session transitions retain the
existing full protected-state reset.

## Scoped criterion evidence

| Criterion contribution | Controlled observation |
| --- | --- |
| AC6 | An explicit Run forwards the unchanged SQL with original page size once. Accepted ASCII and multibyte SQL is not trimmed, rewritten or replayed. Phase-1 null-generation coverage remains passing. |
| AC7, AC21 | Page/revisit and recovery use retained query ID and fixed size; page responses must retain original identity and expiry. A halfway page request does not extend the original deadline. Preview defaults/continuation and connected 15-minute retention are outside this phase. |
| AC8 | Unknown execution outcome, focus/online/visibility/pageshow resume and route remount never automatically submit SQL. Existing navigation/composition tests remain passing. |
| AC9, AC22 | Idle retained rows disappear at original expiry with no request; the UI offers enabled explicit Run. Recovery-only metadata also expires. Expired/lost identity requires explicit Run and never silently returns a new execution. |
| AC10 | Owned first-page recovery sends retained-only GET using captured size; retry remains deliberate. Expired or denied recovery is removed. |
| AC11 | Draft/page-size edits preserve the submitted statement and retained execution's original size until deliberate Run. Denial preserves ordinary draft while clearing submitted protected context. |
| AC13 | Catalog/schema denial against late Run/page/recovery and reverse metadata race cannot restore protected state. Session changes/logout retain generation guards. A late page403 crossing expiry before a throttled timer still clears metadata/context while the session remains authenticated. |
| AC19 | Adapter rejects SQL exceeding 65,536 UTF-8 bytes before transport dispatch. ASCII, é and emoji cover 65,535/65,536/65,537-byte boundaries. Controller Run preserves oversized draft and dispatches nothing. These checks establish no backend CSRF/Origin enforcement. |
| TR10 | All observations are synthetic/injected frontend evidence tied to source above; no connected or visual gate is closed. |

The deadline timer and focus/online/visibilitychange/pageshow listeners belong to
the controller's lifetime, so a route-away controller still clears expired rows.
Tests cover replacement and disposal cancellation, route unmount/remount, delayed
GET success/failure/rejection and absolute-deadline resume checks when timers have
not run. Disposal removes resume listeners and the result timer. Each publication
checks its original absolute expiry; pagination/recovery never renew it.

## Checks actually run

| Command | Result |
| --- | --- |
| `npx vitest run src/features/queries/queries.test.tsx` before repair | Failed: two new same-generation denial reproductions; 17 existing tests passed. |
| Targeted query/adapter tests after first repair | 42 passed across two files before later added edge cases. |
| `npm run typecheck` | Final pass after pageshow addition. Initial narrow-type error was corrected before final checks. |
| `npm run lint` | Final pass after pageshow addition. Earlier unbound-method and unnecessary-condition findings were corrected. |
| `npm test` | 237 tests passed across 24 files before the final pageshow listener/assertion addition. Earlier full run caught abort-on-initial-attach suppressing the child-dispatched catalog request; attach now preserves that first lifetime and full suite subsequently passed. |
| `npx vitest run src/features/queries/queries.test.tsx` final | 31 passed after pageshow addition; includes all changed deadline/race scenarios. |
| `npm run test:boundaries` | 33 passed. |
| `npm run check:boundaries` | Final pass: 102 modules, 15 production roots; live registration not required. |
| `git diff --check` | Passed. |

No build or browser run was required by this phase's checkpoint or performed.
Phase 3 connected-operation readiness is next. Backend anti-forgery, named live
target/personas, registration, connected lifecycle and visual/release gates remain
open. No acceptance checkbox in the integration spec is closed by this evidence.

Review the diff, then run /implement for phase 3.
