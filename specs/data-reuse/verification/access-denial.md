# Cross-feature access denial — review D1

October 7, 2026. The user requested sequential review fixes with a local commit
after each completed item. This change addresses D1 only; refresh admission
recovery (D2) and readability findings remain separate work.

## Behavior

A current protected-operation denial now advances the shared session generation
and enters a local `access-denied` state. Existing runtime cleanup removes
retained SQL results/drafts/metadata, catalog resources, feature data, navigation
handoffs and auth-owned CSRF. Responses captured under the old generation cannot
restore them, including when SQL's route is absent. Backend logout is not
claimed. The client conservatively clears all protected state because arbitrary
SQL dependencies cannot safely be inferred in the browser.

The auth boundary offers an explicit **Check session** action. Recovery resolves
current backend identity and presentation capabilities without replaying SQL or
refresh admission. Ordinary refresh publication still invalidates metadata
without clearing valid retained SQL. Old denials cannot revoke a new identity.

## Controlled evidence

- The two added live-composition tests failed before the fix: the session stayed
  authenticated after another feature's denial. Both now clear retained SQL and
  reject pending SQL publication, using injected synthetic HTTP.
- Auth tests verify immediate protected-subtree removal, no automatic session
  check and deliberate recovery with reduced Viewer capabilities.
- Guard tests verify cleanup survives a throwing feature callback and its own
  cancellation, while a newer session remains protected from obsolete failures.
- Existing denial tests now assert global access revocation rather than the
  former authenticated/local-failure behavior.
- Two production-route browser regressions cover ready and pending SQL followed
  by an Overview denial, hidden navigation/data, explicit recovery and an empty
  revisited SQL workspace. Exactly one SQL POST occurs in each scenario.

Checks: 392 Vitest tests; 33 boundary tests; typecheck; lint; configured Next
webpack production build; source and emitted production fixture/release boundary
checks; seven controlled production-route Playwright tests; `git diff --check`.

The first browser launch was blocked by sandbox port binding and was rerun with
permission. An initial browser regression used the wrong field label; that test
was corrected before the passing run. An initial auth test included a Playwright
option unsupported by Testing Library; typecheck caught it and the option was
removed. No dependency installation, backend changes, push or deployment.

All HTTP evidence is explicitly synthetic. These checks do not establish live
Flask authorization, authenticated Cognito acceptance or visual/Figma sign-off.
