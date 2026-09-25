# Party lifecycle completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Group 4 items 4.1-4.4 are complete. Umbrella progress is **16/46 complete, 30 remaining**. Group 5 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. The Group 4 child was applied and synced from proposal checkpoint `e9df2e767547855aef15f6dcf9a63a1f813c579e` on 2026-09-25. No application source, configuration, database or deployment file was changed.
- Child change: [document-party-lifecycle](../../openspec/changes/document-party-lifecycle/proposal.md), applied and synced with **7/7 tasks complete**. Its [design](../../openspec/changes/document-party-lifecycle/design.md), [delta](../../openspec/changes/document-party-lifecycle/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-party-lifecycle/tasks.md) remain active and unarchived.
- The accepted delta is integrated into [party-discovery-and-management](../../openspec/specs/party-discovery-and-management/spec.md). PARTY-01, PARTY-02 and PARTY-06-PARTY-11 were preserved byte-for-byte; PARTY-03-PARTY-05 were updated and PARTY-12-PARTY-13 added.
- Completion commit: this handoff is included in the scoped `docs: complete party lifecycle specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 4 result

| Item | Delivered result |
|---|---|
| 4.1 | [party-lifecycle.md](party-lifecycle.md) records create/read/update/delete behavior for anonymous users, stored hosts, invitees, attendees and unrelated authenticated users. [Access rows 14-18](access-matrix.md#access-matrix) reflect the accepted visibility and ownership contract while preserving implementation mismatches. |
| 4.2 | PARTY-12 defines required/optional values, numeric and text boundaries, time/location/age cross-field rules, visibility handling and all-or-nothing failures. Age/capacity are lifecycle metadata; admission enforcement remains Q004 and Group 5. |
| 4.3 | PARTY-13 defines canonical plural CRUD routes, bearer identity, server-consistent failures and field preservation across browser/iOS without requiring UI parity. G006 and G030 retain exact client remediation scope. |
| 4.4 | The reviewed child delta was synced into the main party spec. Coverage, access, decisions, gaps, inventory, runbook and this handoff were reconciled to the integrated contract. |

D016 accepts an immutable creator/host, one public/private viewer predicate across query branches, stored-host-only update/delete, atomic validation, and shared client lifecycle behavior. It does not resolve invitation state, admission enforcement, supplementary roster/statistics exposure, notification delivery, map behavior, exact response/status schemas, or browser/iOS UI parity.

## Accepted coverage and retained work

- Accepted main-spec coverage is **6 capabilities, 44 requirements and 172 scenarios**. `party-discovery-and-management` is **13 requirements and 60 scenarios**.
- AUTH-01-AUTH-12 remain 12/43 and SOC-01-SOC-06 remain 6/35; their main specs are unchanged by Group 4.
- Q003 retains declined/revoked/reinvited visibility. Q004 retains admission-time age/capacity policy. Q010 retains supplementary invitation/roster/statistics exposure. Q014 retains partial-versus-replacement update, exact response/status and legacy-route migration.
- G003 remains the update ownership takeover path. G006 remains wrong party methods/routes. G009 remains missing private visibility predicates. G029 records incomplete lifecycle validation. G030 records unauthenticated viewer reads and client field overwrites.
- No application fix, client feature, database migration, runtime configuration change or archive was performed.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-party-lifecycle --type change --strict --no-interactive --json` | Pass, no issues; child checklist 7/7. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only; umbrella checklist 16/46. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Pass; integrated main spec is 13 requirements/60 scenarios. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Preservation | PARTY-01, PARTY-02 and PARTY-06-PARTY-11 match their pre-sync SHA-256 hashes. The complete auth and social main specs also match their pre-sync hashes. |
| Link/access checks | 756 local file/heading links across the 18 baseline, umbrella and Group 4 Markdown files resolve; all 58 access-matrix rows remain present. |
| Scope | The scoped diff changes only the party main spec, Group 4 child/umbrella checklists and baseline documentation. Preserved unrelated working-tree files remain unstaged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the completion commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 5: Invitations and attendance (5.1-5.4).

Read docs/openspec-baseline/handoff.md and runbook.md first, then the
umbrella design/checklist, accepted AUTH/SOC/PARTY specs, party-lifecycle.md,
access-matrix.md, coverage.md, decisions.md and gaps.md.

Complete documentation/specification work only; do not implement application
fixes. Preserve AUTH-01-AUTH-12, SOC-01-SOC-06, PARTY-01-PARTY-13, D001-D016,
stable gap IDs and explicit platform scope. Use Q003, Q004 and Q010 as Group 5
inputs while leaving Q014 for Step 11. Follow the workflow boundary and stop at
a separate domain proposal if one is needed.

Update the checklist, coverage records and handoff before stopping. Do not
start Group 6 and do not archive the umbrella.
```
