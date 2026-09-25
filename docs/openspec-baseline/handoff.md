# Discovery and maps proposal-boundary handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Group 6 items 6.1-6.2 are complete. Item 6.3 remains open because the required domain deltas reached the separate `openspec-propose` boundary. Umbrella progress is **22/46 complete, 24 remaining**. Group 7 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 6 planning resumed from repository checkpoint `5287ac8e4a4d54b0e50c528689ceea1b48eab07f` on 2026-09-25. No application source, configuration, database or deployment file was changed.
- Child change: [document-discovery-and-maps](../../openspec/changes/document-discovery-and-maps/proposal.md), planning-complete and unapplied with **0/7 tasks complete**. Its [design](../../openspec/changes/document-discovery-and-maps/design.md), [party delta](../../openspec/changes/document-discovery-and-maps/specs/party-discovery-and-management/spec.md), [radius delta](../../openspec/changes/document-discovery-and-maps/specs/map-radius-control/spec.md) and [tasks](../../openspec/changes/document-discovery-and-maps/tasks.md) remain active and unarchived.
- The accepted [party-discovery-and-management](../../openspec/specs/party-discovery-and-management/spec.md) and [map-radius-control](../../openspec/specs/map-radius-control/spec.md) main specs were not changed. PARTY-01-PARTY-15, AUTH-01-AUTH-12, SOC-01-SOC-06 and D001-D017 remain accepted exactly as before this task.
- Completion commit: this handoff is included in the scoped `docs: prepare discovery and maps specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 6 planning result

| Item | Delivered result |
|---|---|
| 6.1 | [discovery-and-maps.md](discovery-and-maps.md) records visibility-first query ownership, AND composition, shared/local search fields, inclusive time and metadata rules, deterministic post-filter pagination, and browser/iOS responsibility. [Access row 14](access-matrix.md#access-matrix) preserves accepted access and proposed PARTY-16 separately. |
| 6.2 | The iOS filter matrix and radius transition table define explicit platform scope, finite/unlimited behavior, location-loss normalization, reset synchronization, and Q008's proposed strict-AND resolution without imposing iOS UI mechanics on the browser. G035 records the source's missing 5 km circle/camera behavior. |
| 6.3 | Not complete. The child proposal/design/two deltas/tasks are ready for an explicit apply task; main-spec sync, accepted decision/count/anchor updates and final Group 6 validation remain pending. G012 remains assigned to Step 12. |

The proposed party delta adds PARTY-16 and modifies PARTY-08-PARTY-11. It proposes one viewer-eligible server candidate set before query operations, conjunctive criteria, stable pages, explicit client narrowing, iOS-only map controls, precise missing-data boundaries and a strict missing-theme rule. The radius delta modifies RADIUS-01-RADIUS-03 for finite/unlimited, reset, unavailable-location and synchronized result/visualization state. It does not repair the existing radius Purpose, require browser UI parity, add live attendee location, choose exact Step 11 wire behavior, or implement application fixes.

## Accepted versus projected coverage

- Accepted main-spec coverage remains **6 capabilities, 46 requirements and 200 scenarios**. `party-discovery-and-management` remains **15 requirements/88 scenarios** and `map-radius-control` remains **3 requirements/7 scenarios**.
- AUTH-01-AUTH-12 remain 12/43 and SOC-01-SOC-06 remain 6/35; their main specs are unchanged.
- Exact later sync would make `party-discovery-and-management` **16 requirements/97 scenarios**, `map-radius-control` **3 requirements/10 scenarios**, and the full baseline **47 requirements/212 scenarios**.
- Proposed PARTY-16 has 8 scenarios. Proposed PARTY-08/PARTY-09/PARTY-10/PARTY-11 have 5/4/8/2 scenarios; proposed RADIUS-01/RADIUS-02/RADIUS-03 have 3/1/6. PARTY-16 is intentionally absent from the accepted requirement index until apply.

Q008 has a proposed answer: while a theme filter is active, missing or non-matching displayable theme metadata excludes the party and no other active filter overrides it. It remains unresolved until child apply. Q004 and Q014 remain unresolved at their existing boundaries. G010/G011 remain specification gaps until sync; G009/G030/G034/G035 retain source/client mismatches. G012 remains the Step 12 Purpose-only correction.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-discovery-and-maps --type change --strict --no-interactive --json` | Pass, no issues; child planning complete with 0/7 apply tasks. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only; umbrella checklist 22/46. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Pass; accepted main spec remains 15 requirements/88 scenarios. |
| `openspec validate map-radius-control --type spec --strict --no-interactive --json` | Expected pre-existing failure only: Purpose placeholder G012; requirement/scenario changes are not in the main spec. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder reserved for Step 12. |
| Preservation | The complete accepted auth, social, party and radius main specs match their pre-task SHA-256 hashes. Application-source paths match snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. |
| Link/access checks | All 876 checked local file/heading links across 21 baseline, umbrella and Group 6 Markdown files resolve; all 58 access-matrix rows remain present. |
| Scope | The scoped diff contains only the Group 6 child proposal artifacts, umbrella checklist and baseline documentation. Preserved unrelated working-tree files remain unstaged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the completion commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for document-discovery-and-maps.
This resumes complete-partyhub-specification group 6 only, to finish 6.3.

Read docs/openspec-baseline/handoff.md and runbook.md first, then the child
proposal, design, both deltas and tasks plus discovery-and-maps.md,
party-lifecycle.md, invitations-and-attendance.md, access-matrix.md,
coverage.md, decisions.md and gaps.md.

Execute the child documentation-only checklist. Integrate both accepted deltas
using openspec-sync-specs. Preserve AUTH-01-AUTH-12, SOC-01-SOC-06 and
PARTY-01-PARTY-07/PARTY-12-PARTY-15 byte-for-byte; modify only PARTY-08
through PARTY-11, add PARTY-16, and modify RADIUS-01 through RADIUS-03.
Keep the map-radius Purpose byte-for-byte unchanged for G012/Step 12. Update
accepted counts, anchors and the Q008 decision. Keep G009/G030/G034/G035 as
implementation gaps and preserve Q004/Q014.

Validate the child, umbrella, party main spec, radius main spec and all main
specs; mark 6.3 only after integration. Preserve unrelated dirty files, stop
before Group 7, make no application fixes and do not archive any change.
```
