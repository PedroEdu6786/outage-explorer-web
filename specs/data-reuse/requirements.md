# Requirements: Reuse already fetched data

> Status: draft · Slug: data-reuse

## Problem statement

The app repeatedly fetches data it has already retrieved when users revisit
pages or need that data again. This creates a weird, unnecessarily slow user
experience and consumes endpoints unnecessarily. Users should benefit from
data already available to the app rather than repeatedly waiting for the same
information to load.

## Target user / context

Outage Explorer users moving between permitted pages and reusing information
during their work. The user reported repeated fetching on already visited
pages; investigation confirmed that behavior for Overview and Dataset Explorer,
with repeated catalog reads in SQL Workspace as well.

## Success criteria

Previously retrieved, still usable data is available promptly when needed again.
Repeat visits feel responsive, and ordinary use avoids unnecessary repeated
requests for the same information.

## Acceptance criteria

- Returning to a previously visited page can show its already fetched, still
  usable data without making the user wait for everything to load again.
- Information already retrieved can be reused wherever the app needs the same
  information, including dataset listings and schemas.
- New requests remain available when the user needs different information or
  the previously retrieved information is no longer usable.
- Existing access and expiry rules continue to apply: reuse does not expose
  data after logout, lost access, or an expired preview or SQL result.
- Revisiting SQL results does not automatically run the SQL again.

## Non-goals

Remembering where the user left off is not the objective of this effort.
Restoring navigation position, selected controls, or unfinished work is not
a substitute for reusing already fetched data.

This brief does not select a state-management library or an implementation.

## Open questions

- How long should each kind of data remain usable, and what should cause the
  app to retrieve updated data? Existing preview and SQL expiry rules remain
  constraints.
- Does reuse need to extend beyond navigation within the open app to browser
  reloads or closing and reopening it? The user's correction establishes data
  reuse as the goal but does not settle this lifetime.

## Discussion grounding

The user identified UX, reduced endpoint consumption, and faster responses as
the benefits. They clarified that the issue is constantly fetching everything
again when it is needed, rather than remembering where they left off.
Access cleanup, snapshot expiry, and explicit SQL execution are existing
project constraints, not newly requested capabilities.
