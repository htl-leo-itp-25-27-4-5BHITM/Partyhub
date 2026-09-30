# Group 10 completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-10 are complete at **35/46 checklist items, 11 remaining**. Group 11 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 10 apply/sync started from proposal checkpoint `a487379115b6c8832f18d043475c774ae42d9742` on 2026-09-30. No application source, configuration, database, deployment, device calendar/location state or uploaded data was changed.
- [extended-client-features.md](extended-client-features.md) records the location endpoints/entities/tests, iOS attendee clients, current-location/radius relationship, GeoTimeTracking/SwiftData lifecycle, EventKit calendar flow, permission declarations and test limits.
- D022/PARTY-17-PARTY-19 resolve Q002: current device location remains private context for accepted iOS distance/radius behavior; shared current/attendee locations are deferred; optional visit tracking is explicitly enabled, permission-gated and device-local; optional calendar export is a user-controlled device snapshot. Browser parity is not required.
- [document-extended-client-features](../../openspec/changes/document-extended-client-features/proposal.md) is applied and synced with **8/8 tasks complete**. Its three requirements add 16 scenarios, bringing the party spec to **19 requirements/113 scenarios** and all accepted main specs to **55 requirements/290 scenarios**.
- G051-G056 preserve exposed location access, identifier/ownership, stale client identity, missing shared-location lifecycle, visit permission/tracking and calendar snapshot/feedback implementation gaps. Exact containment/status for unsupported endpoints remains Q014/Step 11; broader runtime/persistence policy remains Q006.

## Accepted Group 10 contract

- Current location may be consumed locally for finite distance/radius and enabled visit detection. It does not publish coordinates, create attendance, accept an invitation, authenticate a user or grant party visibility.
- `GET /api/parties/{id}/locations`, `GET /api/users/location/{id}` and `PUT /api/users/location` remain inventoried but unsupported/deferred. Retaining shared location later requires a separate proposal defining consent, audience, precision, freshness, revocation, deletion/retention and private-party behavior.
- Optional iOS visit tracking requires explicit enablement and platform permission, maintains coherent device-local intervals, exposes/deletes only local history, stops on permission/monitoring failure and follows local party-data ownership without mutating backend attendance.
- Optional iOS calendar export is user initiated and permission gated. It creates/removes one associated local snapshot from visible party fields, handles denial/stale mapping/failure without changing PartyHub state, and does not promise automatic synchronization after party edits or cancellation.

## Validation and evidence record

| Check | Result |
|---|---|
| Umbrella progress | Tasks 10.1-10.3 complete; 35/46 overall, with Group 11 untouched. |
| Child apply | Proposal, design and party delta are integrated; all 8 tasks complete. |
| Child strict validation | `openspec validate document-extended-client-features --type change --strict --no-interactive` passes. |
| Umbrella strict validation | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` passes. |
| Affected main spec | `party-discovery-and-management` passes strict validation at 19 requirements/113 scenarios; AUTH and radius specs are unchanged. |
| Main specs | Accepted total is 55 requirements/290 scenarios. Non-strict aggregate validation passes; strict aggregate retains only the pre-existing `map-radius-control` Purpose issue G012 for Group 12. |
| Evidence/access | PARTY-17 and location rows 28/55/56 preserve the defer disposition; all 58 endpoint rows remain present. PARTY-18/PARTY-19 link to visit/calendar evidence and G055/G056. |
| Runtime evidence | No application, JUnit, HTTPYac, browser, iOS simulator/device, CoreLocation, EventKit, database or deployment test was executed. |
| Preservation | Application source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Do not archive the umbrella or active child changes while later groups remain. The next bounded task is Group 11 runtime and quality contracts.

## Exact next prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 11: Runtime and quality contracts (11.1-11.5).

Read docs/openspec-baseline/handoff.md, runbook.md, inventory.md,
decisions.md, gaps.md and access-matrix.md first, then the umbrella context,
current main specs, runtime/configuration/API source, clients, tests and linked
evidence needed by Group 11.

Complete documentation/specification work only; do not implement application
fixes. Follow the bounded domain workflow: if Group 11 requires a separate
capability proposal, create and strictly validate that proposal, update the
umbrella evidence/checklist/handoff to the proposal boundary, and stop without
claiming unintegrated requirements as accepted.

Preserve PARTY-17-PARTY-19 and the Group 10 defer boundary: local current
location is private client context, shared user/attendee location is unsupported,
visit history is permission-gated and device-local, and calendar export is a
user-controlled snapshot. Update the checklist and handoff before stopping.
Do not start Group 12, archive changes or modify unrelated dirty files.
```
