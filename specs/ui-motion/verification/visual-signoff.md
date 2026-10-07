# Motion visual sign-off — pending human review

This record is separate from automated motion checks, static capture comparison,
live-integration acceptance and Figma-fidelity evidence. Motion extends the
inspected prototype; it is not a Figma-fidelity claim.

- Status: **pending**
- Reviewer: pending
- Review date/time: pending
- Reviewed revision: pending (bind the final phase-4 commit)
- Browser/device/viewport: pending
- Motion preference(s): pending (`no-preference` and `reduce`)
- Decision and follow-ups: pending

Review with the Storybook Motion global **on** after a fresh `build-storybook`.
Record actual state IDs reviewed and any concerns; do not infer approval from
motion-off capture hashes or passing browser checks.

| States to review | Story / interaction | Human review |
| --- | --- | --- |
| Controls, tabs and desktop indicator | Actions/fields/navigation stories | pending |
| Status/loading, skeletons and retained dim | Status stories, Explorer Paging, Queries Paging | pending |
| Drawer, header and template entrances | Shell DrawerOpen, template entrance stories | pending |
| Chart wipe, range refetch, compare and inspection | Overview Ready, RangeChangeRefetch, Compare, InspectedObservation | pending |
| Coverage date change | Shell CoverageDateChange | pending |
| Dataset row/switch, filters and schema | Explorer DatasetSwitch, Analyst | pending |
| SQL busy/progress, results and Copy | Queries Running, AnalystResults, Copy | pending |
| Chevron/expand and immediate controlled collapse | Queries SchemaExpanded, SchemaCollapse | pending |

Scope limits: coverage is story-only until production supplies it; schema collapse
is controlled-component evidence because the production controller reloads a
selected dataset. E1 shimmer is off. Named-target live acceptance remains separate.
