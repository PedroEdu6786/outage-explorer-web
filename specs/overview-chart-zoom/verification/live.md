# Overview zoom: live acceptance

Status: **pending, user-owned**. On October 7 the user said “ill test it” when
asked about the authenticated live check. No credentials, authenticated live
session or real observations were accessed for this feature's acceptance.

The coordinator reported a local backend health200 and unauthenticated session401
prerequisite check. Those are availability/signed-out observations, not evidence
that chart interactions preserve authorized live data. Build/registration and
synthetic fixture results cannot close T4.4.

## User test checklist

1. Sign in to the intended environment and apply an authorized long date range.
   Confirm Zoom mode starts off and scrolling over the chart scrolls normally.
2. Enable mode and scroll over a recognizable spike. Confirm zoom stays around
   the pointer, preserves daily values/gaps and stops at 15 days. Move through
   dates using horizontal scrolling without crossing the applied bounds.
3. Focus the chart and try + / − and Left / Right. Try visible touch buttons and
   horizontal swipe; vertical touch scroll and browser pinch should still work.
4. Disable mode: retain the current dates and restore ordinary scrolling. Reset:
   restore full applied dates. Edit a date without applying: retain zoom. Apply
   changed dates: reset to the full new range with mode off.
5. Compare both series and inspect the same observations before/after zoom.
   Confirm cards, table rows/page size and page date fields remain unchanged.
   In network tools, verify zoom/pan/reset make no new observation requests.

Record environment URL/name, backend/web revision, date, browser/device, applied
range, reviewer and results. Record privacy-safe request counts/status only;
exclude cookies, tokens, credentials and sensitive raw responses. Until supplied,
T4.4 and the live part of T4.C remain unchecked. This does not block completion
of independent implementation/automated verification work.
