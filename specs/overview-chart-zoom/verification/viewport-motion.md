# Viewport motion follow-up — October 7, 2026

User requested visible graph animation after trying zoom. FR21/AC24 extend the
accepted chart behavior. This is an interaction extension to the supplied static
Overview designs, not a new Figma fidelity claim.

## Observed behavior and implementation

A browser probe of the preceding build (`edd99b4`) found the existing chart-wipe
entrance, but zero active transitions after zoom. The fix adds CSS-native 200ms
horizontal projection using shared movement/easing tokens. Original y values,
round markers, exact labels and gap segmentation are retained; axes and inspection
reflect the requested dates immediately. Stable full-range line segments are
clipped to plot bounds with marker padding; target-window circles share the
same animated projection. No dependency, data tween or service call was added.

Disable/unavailability synchronously settles presentation without changing the
accepted window. Reset remains animated with mode off. Applied-bound/snapshot
identity replaces only the projection, preserving the SVG entrance identity.
Reduced motion and Storybook motion-off immediately place the target geometry.

## Checks actually run

- Full unit suite: **487/487**, including the unchanged CSS-only motion guard.
- Typecheck and lint passed; boundary suite **33/33**, source scan **113 modules,
  15 roots** passed.
- Production build passed. Fixture-exclusion and required-live structural scans
  passed over **346 emitted files**; these are not authenticated live evidence.
- Fresh Storybook build passed with existing module-directive warnings.
- **26 existing** affected browser scenarios passed: seven native chart input,
  four assembled-page isolation/protected-state and fifteen feature-motion tests.
- **Five new** browser scenarios passed in `tests/motion/chart-viewport.spec.ts`:
  normal/reduced projection; motion-off; applied bounds/snapshot/unavailability;
  natural wheel settling at 390px. The normal-motion test pauses native CSS
  transitions at 25% and proves circle x lies strictly between old/target x,
  matches its projected line, and keeps y/radius/exact `1.01%` unchanged.
  Pan→Reset retarget starts at the current intermediate position; disable snaps,
  and mode-off Reset still animates. Narrow native wheel settles without test
  calls to finish transitions. Existing tests preserve zero/missing values and
  SVG identity across zoom/compare/reset.
- The combined browser run initially passed 30/31: a new reduced-motion Reset
  assertion incorrectly expected continuity. Correcting that assertion to expect
  immediate placement yielded **5/5** in the focused motion rerun. No product
  change was needed for that failure.
- Reviewed actual source/test diff, documentation traceability and staged
  whitespace. All 21 FR / 3 TR / 24 AC have documented design/validation mapping.

## Limits

Controlled synthetic Storybook/Chromium evidence only. No authenticated live,
physical device or human motion sign-off is claimed; T4.3/T4.4/T4.C and the
[user-owned live checklist](live.md) remain pending. Test-managed servers exit
with their runs; the manually started probe server was stopped. Preexisting
user servers were left untouched. No push or deployment.
