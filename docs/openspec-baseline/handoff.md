# Discovery and maps completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Group 6 items 6.1-6.3 are complete. Umbrella progress is **23/46 complete, 23 remaining**. Group 7 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 6 integration resumed from repository commit `5b817876153fab02e04e9fe9bd4fa1080645ab02`. No application source, configuration, database or deployment file was changed.
- Child change: [document-discovery-and-maps](../../openspec/changes/document-discovery-and-maps/proposal.md), applied and synced with **7/7 tasks complete**. Its [design](../../openspec/changes/document-discovery-and-maps/design.md), [party delta](../../openspec/changes/document-discovery-and-maps/specs/party-discovery-and-management/spec.md), [radius delta](../../openspec/changes/document-discovery-and-maps/specs/map-radius-control/spec.md) and [tasks](../../openspec/changes/document-discovery-and-maps/tasks.md) remain active and unarchived.
- The scoped completion commit uses message `docs: complete discovery and maps specification`; use `git log -1` for its immutable SHA.

## Delivered Group 6 result

| Item | Delivered result |
|---|---|
| 6.1 | [discovery-and-maps.md](discovery-and-maps.md), PARTY-16 and [access row 14](access-matrix.md#access-matrix) establish one visibility-first candidate set, AND-composed supported predicates, inclusive query boundaries and deterministic post-filter pagination. Client narrowing cannot restore server-excluded parties. |
| 6.2 | PARTY-08-PARTY-11 and RADIUS-01-RADIUS-03 explicitly govern the iOS home map. They define finite/unlimited distance, location-loss normalization, complete reset synchronization, one result/summary/slider/circle/camera state and no browser UI-parity requirement. |
| 6.3 | Both deltas are synced into the main specs. D018 is accepted, Q008 is resolved with strict missing-theme AND behavior, G010/G011 are resolved as specification ambiguities, and G012 remains the Step 12 Purpose-only correction. |

No application fix was implemented. G009/G030/G034/G035 remain source/client gaps. Q004 and Q014 remain unresolved at their existing owner boundaries.

## Accepted coverage

- Main-spec coverage is **6 capabilities, 47 requirements and 212 scenarios**.
- `party-discovery-and-management` is **16 requirements/97 scenarios**. PARTY-16 has 8 scenarios; PARTY-08/PARTY-09/PARTY-10/PARTY-11 have 5/4/8/2.
- `map-radius-control` is **3 requirements/10 scenarios**. RADIUS-01/RADIUS-02/RADIUS-03 have 3/1/6.
- AUTH-01-AUTH-12 remain 12/43, SOC-01-SOC-06 remain 6/35, and PARTY-01-PARTY-07/PARTY-12-PARTY-15 remain byte-for-byte unchanged from the pre-sync snapshot.
- The existing `map-radius-control` Purpose remains byte-for-byte unchanged for G012 and Step 12.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-discovery-and-maps --type change --strict --no-interactive --json` | Pass, no issues; child checklist 7/7. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only; umbrella checklist 23/46. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Pass; 16 requirements/97 scenarios. |
| `openspec validate map-radius-control --type spec --strict --no-interactive --json` | Expected pre-existing failure only: Purpose placeholder G012; requirements contain 3/10. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder reserved for Step 12. |
| Preservation | AUTH, SOC, PARTY-01-PARTY-07/PARTY-12-PARTY-15 and the radius Purpose match their pre-sync SHA-256 snapshots. Application-source paths match snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. |
| Link/access checks | All 900 checked local file/heading links across 21 baseline, umbrella and Group 6 Markdown files resolve; all 58 access-matrix rows remain present. |
| Scope | The scoped diff contains only Group 6 specifications, child/umbrella checklists and baseline documentation. Preserved unrelated working-tree files remain unstaged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the completion commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 7: Media and profile pictures (7.1-7.3).

Read docs/openspec-baseline/handoff.md and runbook.md first, then the umbrella
proposal, design and tasks plus the current media main spec, inventory,
coverage, decisions, gaps and access matrix.

Complete documentation/specification work only; do not implement application
fixes. Follow the domain workflow boundary: if accepted media/profile-picture
behavior requires a main-spec delta, create a separate bounded proposal with
openspec-propose and stop at that proposal boundary until an explicit apply
task. Preserve all accepted Group 2-6 contracts, the application-source
snapshot and unrelated working-tree changes.

Update the checklist, coverage records, runbook and handoff before stopping.
Do not start Group 8 and do not archive any change.
```
