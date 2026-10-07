# Outage Explorer — frontend product notes

Outage Explorer helps users inspect U.S. nuclear outage data without exporting
and reshaping it by hand. This client implements the challenge's login, permitted
dataset discovery, backend-paginated preview and SQL input/results workflows.

## Added stories

- As a Viewer, follow national trends through Overview's daily offline-capacity
  share, EIA-reported percentage, chart and accessible observations table.
- As an Analyst, inspect dataset schemas and combine optional dates with an
  exact Facility ID for Facilities and Generators previews.
- As an Admin, start a refresh from Overview and inspect its progress/outcome.
- As a user, receive clear loading, empty, denied, expired and error states,
  with responsive layouts, keyboard access and reduced-motion support.

## Key UX decisions

- Viewers use Overview only; Analyst/Admin also use Explorer and SQL. Navigation
  follows that scope, while the backend independently authorizes every request.
- Dates and preview filters apply explicitly, keeping edits separate from the
  displayed results. Facility IDs preserve leading zeros and case.
- Explorer follows snapshot-bound backend cursors. SQL pages reuse one execution
  and fixed page size; expired or lost results require a deliberate rerun.
- Percentages use two-decimal half-up rounding. Missing observations remain
  missing, and the chart has a table alternative. The metric describes reported
  capacity out of service, without inferring outage causes or durations.
- Logout/access changes clear protected state and reject late responses.
  Backend failures show an error; synthetic Storybook demos stay separate.
- Reusable atomic components support the inspected prototype's four views.
  Extra interaction states and design differences have explicit records.

## Left out

Registration/user management, saved queries, query history, export, alerts,
maps and a findings page are outside current scope. Refresh lives on Overview;
a dedicated Admin page and the new-data status card remain deferred.
Frontend hosting remains open. Backend ingestion, SQL safety and data findings
are documented in the API project.

## Next

Complete named-target Cognito, permissions, data, pagination and refresh
verification, followed by final accessibility/visual review and human motion
sign-off. Controlled tests and screenshots do not close those acceptance gates.
After current delivery, design the deferred new-data card with explicit reload
and no automatic SQL rerun. Reconcile the challenge's single-repository delivery
requirement while preserving both projects' incremental histories.

See [current evidence and limitations](docs/development/current-status.md),
[design deviations](docs/specs/web-client/design-deviations.md) and the
[shared submission documents](README.md#submission-documentation).
