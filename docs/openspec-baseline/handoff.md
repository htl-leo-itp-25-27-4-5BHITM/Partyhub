# Invitations and attendance completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Group 5 items 5.1-5.4 are complete. Umbrella progress is **20/46 complete, 26 remaining**. Group 6 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. The Group 5 child was applied and synced from proposal checkpoint `d1765ee015c09a496b672868a77d07749bc26fe0` on 2026-09-25. No application source, configuration, database or deployment file was changed.
- Child change: [document-invitations-and-attendance](../../openspec/changes/document-invitations-and-attendance/proposal.md), applied and synced with **7/7 tasks complete**. Its [design](../../openspec/changes/document-invitations-and-attendance/design.md), [delta](../../openspec/changes/document-invitations-and-attendance/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-invitations-and-attendance/tasks.md) remain active and unarchived.
- The accepted delta is integrated into [party-discovery-and-management](../../openspec/specs/party-discovery-and-management/spec.md). PARTY-01-PARTY-05 and PARTY-08-PARTY-13 were preserved byte-for-byte; PARTY-06/PARTY-07 were updated and PARTY-14/PARTY-15 added. AUTH-01-AUTH-12 and SOC-01-SOC-06 remain unchanged.
- Completion commit: this handoff is included in the scoped `docs: complete invitations and attendance specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 5 result

| Item | Delivered result |
|---|---|
| 5.1 | [invitations-and-attendance.md](invitations-and-attendance.md) records stored-host selection, current mutual-contact eligibility, one logical invitation, duplicate/renewal/withdrawal behavior and private-visibility effects. [Access rows 2-7](access-matrix.md#access-matrix) now reflect the accepted contract while preserving source mismatches. |
| 5.2 | PARTY-07 defines public/private join eligibility, invitation-action acceptance, decline, leave, missing targets and repeated actions with atomic invitation, membership, visibility, projection and event effects. Age/capacity admission remains Q004. |
| 5.3 | PARTY-14 defines self/host/viewer projection audiences, and PARTY-15 defines one event per committed invitation/attendance transition while preserving notification delivery details for Step 8. |
| 5.4 | The reviewed child delta was synced into the main party spec. Coverage, access, decisions, gaps, inventory, runbook and this handoff were reconciled to the integrated contract. |

D017 accepts stored-host invitation management, current private mutual-contact eligibility, one logical invitation, pending-only invitation visibility, attendance-linked acceptance/decline, actor-scoped projections and committed transition events. It does not define age/capacity admission, notification delivery, host moderation/eviction, exact response/status/schema behavior or browser/iOS UI parity.

## Accepted coverage and retained work

- Accepted main-spec coverage is **6 capabilities, 46 requirements and 200 scenarios**. `party-discovery-and-management` is **15 requirements and 88 scenarios**.
- AUTH-01-AUTH-12 remain 12/43 and SOC-01-SOC-06 remain 6/35; their main specs are unchanged by Group 5.
- PARTY-06 contains 8 scenarios, PARTY-07 contains 9, PARTY-14 contains 9 and PARTY-15 contains 6.
- D017 resolves Q003 and Q010. Q004 retains admission-time age/capacity policy. Q014 retains exact methods, statuses, envelopes, field names and compatibility behavior.
- G009 remains missing private visibility checks, G017 remains missing mutual/stored-host invitation enforcement, G031 remains inconsistent transition paths, G032 remains broad/inconsistent projections, and G033 remains client/backend payload and state mismatch.
- No application fix, client feature, database migration, runtime configuration change or archive was performed.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-invitations-and-attendance --type change --strict --no-interactive --json` | Pass, no issues; child checklist 7/7. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only; umbrella checklist 20/46. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Pass; integrated main spec is 15 requirements/88 scenarios. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Preservation | PARTY-01-PARTY-05 and PARTY-08-PARTY-13 match their pre-sync SHA-256 hashes. The complete auth and social main specs also match their pre-sync hashes. |
| Link/access checks | 842 local file/heading links across the 19 baseline, umbrella and Group 5 Markdown files resolve; all 58 access-matrix rows remain present. |
| Scope | The scoped diff changes only the party main spec, Group 5 child/umbrella checklists and baseline documentation. Preserved unrelated working-tree files remain unstaged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the completion commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 6: Discovery and maps (6.1-6.3).

Read docs/openspec-baseline/handoff.md and runbook.md first, then the umbrella
design/checklist, accepted AUTH/SOC/PARTY specs, party-lifecycle.md,
invitations-and-attendance.md, access-matrix.md, coverage.md, decisions.md,
gaps.md and the archived map-filter/radius changes.

Complete documentation/specification work only; do not implement application
fixes. Preserve AUTH-01-AUTH-12, SOC-01-SOC-06, PARTY-01-PARTY-15, D001-D017,
stable gap IDs and explicit platform scope. Reconcile visible-party queries,
search/pagination/filter responsibility, iOS-only controls, finite/unlimited
radius, unavailable location, reset behavior and Q008. Keep the existing
map-radius Purpose placeholder G012 assigned to Step 12.

Follow the workflow boundary and stop at a separate domain proposal if one is
needed. Update checklist, coverage records and handoff before stopping. Do not
start Group 7 and do not archive the umbrella or child changes.
```
