# Extended client features proposal handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-9 are complete; Group 10 tasks 10.1-10.2 are complete and 10.3 remains open. Overall progress is **34/46 checklist items, 12 remaining**. Group 11 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 10 planning started from Group 9 completion commit `2aabedc7003e13e7f15408d3acf791b2796dcd12` on 2026-09-29. No application source, configuration, database, deployment, device calendar/location state or uploaded data was changed.
- [extended-client-features.md](extended-client-features.md) records the location endpoints/entities/tests, iOS attendee clients, current-location/radius relationship, GeoTimeTracking/SwiftData lifecycle, EventKit calendar flow, permission declarations and test limits.
- D022 resolves Q002 at scope level: retain current device location as private context for already accepted iOS distance/radius behavior; defer shared current/attendee locations; retain visit tracking as optional explicitly enabled device-local history; retain calendar export as an optional user-controlled device snapshot. Browser parity is not required.
- The required child [document-extended-client-features](../../openspec/changes/document-extended-client-features/proposal.md) has complete proposal/design/delta/tasks planning artifacts, passes strict validation and has **0/8 apply tasks complete**. Its party delta proposes 3 requirements/16 scenarios. The planning boundary stops before apply/sync, so the main specs remain **52 accepted requirements/274 scenarios** and umbrella 10.3 stays open.
- G051-G056 preserve exposed location access, identifier/ownership, stale client identity, missing shared-location lifecycle, visit permission/tracking and calendar snapshot/feedback gaps. Exact containment/status for unsupported endpoints remains Q014/Step 11; broader runtime/persistence policy remains Q006.

## Proposed Group 10 contract

- Current location may be consumed locally for finite distance/radius and enabled visit detection. It does not publish coordinates, create attendance, accept an invitation, authenticate a user or grant party visibility.
- `GET /api/parties/{id}/locations`, `GET /api/users/location/{id}` and `PUT /api/users/location` remain inventoried but unsupported/deferred. Retaining shared location later requires a separate proposal defining consent, audience, precision, freshness, revocation, deletion/retention and private-party behavior.
- Optional iOS visit tracking requires explicit enablement and platform permission, maintains coherent device-local intervals, exposes/deletes only local history, stops on permission/monitoring failure and follows local party-data ownership without mutating backend attendance.
- Optional iOS calendar export is user initiated and permission gated. It creates/removes one associated local snapshot from visible party fields, handles denial/stale mapping/failure without changing PartyHub state, and does not promise automatic synchronization after party edits or cancellation.

## Validation and evidence record

| Check | Result |
|---|---|
| Umbrella progress | Tasks 10.1-10.2 complete; 34/46 overall, 10.3 open and Group 11 untouched. |
| Child planning | Proposal, design, party delta and 8-task checklist exist; apply state is ready at 0/8. |
| Child strict validation | `openspec validate document-extended-client-features --type change --strict --no-interactive` passes. |
| Umbrella strict validation | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` passes. |
| Main specs | Unchanged at 52 requirements/274 scenarios. Non-strict aggregate validation passes; strict aggregate retains only the pre-existing `map-radius-control` Purpose issue G012 for Step 12. |
| Evidence/access | Location rows 28/55/56 carry D022 defer dispositions; all 58 endpoint rows remain present. Extended evidence, decisions, gaps, inventory, coverage and runbook link to the child checkpoint. |
| Runtime evidence | No application, JUnit, HTTPYac, browser, iOS simulator/device, CoreLocation, EventKit, database or deployment test was executed. |
| Preservation | Application source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Do not archive the umbrella or active child changes while later groups remain. The next bounded task is applying `document-extended-client-features` and completing Group 10 only.

## Exact next prompt

```text
Use openspec-apply-change for document-extended-client-features, then complete
only Group 10 task 10.3 in complete-partyhub-specification.

Read docs/openspec-baseline/handoff.md, extended-client-features.md and
runbook.md first, then every child context file and the current party, auth and
radius specs. Execute all eight child documentation/specification tasks, sync
the accepted party delta, and update access, coverage, decisions, gaps,
inventory, runbook, umbrella checklist and handoff.

Verify that local current location never becomes shared identity/attendance,
shared user/attendee location remains deferred, optional visit tracking is
permission-gated and device-local, and calendar export remains a user-controlled
snapshot. Strictly validate the child, umbrella and affected main spec, record
the new requirement/scenario totals, and create a scoped Group 10 completion
commit.

Do not implement application fixes, do not start Group 11, and do not archive
the umbrella or active child changes. Preserve unrelated dirty files.
```
