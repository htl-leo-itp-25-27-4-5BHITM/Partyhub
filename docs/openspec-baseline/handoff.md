# Party lifecycle proposal-boundary handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Completed in Group 4: items 4.1-4.3. Item 4.4 remains open because the required `openspec-propose` workflow ends after planning and must not apply or sync the child in the same task.
- Umbrella progress: **15/46 complete, 31 remaining**. Group 5 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, inspected again from repository HEAD `c4e19b8505fd185075cb3bd94802aaae7751f418` on 2026-09-25. Application source and configuration remain unchanged.
- Child change: [document-party-lifecycle](../../openspec/changes/document-party-lifecycle/proposal.md), planning-complete with **0/7 apply tasks complete**. Its [design](../../openspec/changes/document-party-lifecycle/design.md), [delta](../../openspec/changes/document-party-lifecycle/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-party-lifecycle/tasks.md) are ready for a later apply task.
- No child apply, spec sync or archive was performed. The main `party-discovery-and-management` spec is unchanged in this checkpoint.
- Checkpoint commit: this handoff is included in the scoped `docs: prepare party lifecycle specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 4 evidence and proposal

| Item | Delivered result |
|---|---|
| 4.1 | [party-lifecycle.md](party-lifecycle.md) records create/read/update/delete behavior for anonymous users, stored hosts, invitees, attendees and unrelated authenticated users. [Access rows 14-18](access-matrix.md#access-matrix) separate accepted D007 access from the proposed immutable-host/atomic-denial target and G003/G009 source mismatches. |
| 4.2 | The evidence record maps every party DTO/model field across backend, browser and iOS, including proposed required fields, exact length/range constraints, time/location/age cross-field rules and all-or-nothing failures. Age/capacity are lifecycle metadata; admission enforcement remains Q004 and Group 5. |
| 4.3 | The client matrix records active canonical browser/iOS create/update/delete paths, the browser helper's wrong filter/update methods, singular iOS notification polling paths, unauthenticated viewer-dependent reads, missing capacity and destructive defaults. G006/G030 retain exact call-site remediation scope. |
| Proposal boundary | The child delta fully modifies PARTY-03 through PARTY-05, preserves their original scenario names, leaves PARTY-01/PARTY-02/PARTY-06-PARTY-11 unchanged, and proposes PARTY-12 atomic validation plus PARTY-13 shared client behavior. Strict child validation passes. |

The proposal makes the authenticated creator the immutable host, applies one viewer predicate to every list/detail branch, validates a complete lifecycle mutation before side effects, uses the plural CRUD resource, and requires clients to preserve fields outside their editing surface. It does not decide invitation state, admission enforcement, supplementary roster/statistics exposure, notification delivery, map behavior, exact response/status schemas, or browser/iOS UI parity.

## Accepted and projected coverage

- Accepted decisions D001-D015, AUTH-01-AUTH-12 and SOC-01-SOC-06 remain unchanged.
- Accepted main-spec counts remain **6 capabilities, 42 requirements and 145 scenarios**. The party spec remains **11/33**.
- If the child delta is accepted and synced, projected counts are **44/172** overall and **13/60** for `party-discovery-and-management`.
- Q003 retains declined/revoked/reinvited visibility. Q004 now explicitly carries only admission-time age/capacity policy into Group 5. Q010 retains supplementary invitation/roster/statistics exposure. Q014 records partial-versus-replacement update, exact response/status, and legacy-route migration for Step 11.
- G003 remains the update ownership takeover path. G006 remains wrong party methods/routes. G009 remains missing private visibility predicates. G029 records incomplete lifecycle validation; G030 records unauthenticated viewer reads and client field overwrites.
- No application fix, client feature, database migration, runtime configuration change or archive was performed.

## Validation record

| Command or check | Result |
|---|---|
| `openspec status --change document-party-lifecycle --json` | Planning complete; proposal, design, delta and tasks present. Child apply checklist remains 0/7. |
| `openspec validate document-party-lifecycle --type change --strict --no-interactive --json` | Pass, no issues. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Main spec passes and remains unchanged in this checkpoint. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Coverage counts | Accepted 42/145 and party 11/33; proposed integrated 44/172 and party 13/60. |
| Link/access checks | 701 local file/heading links across 18 baseline/umbrella/Group 4 Markdown files resolve; all 58 access-matrix rows remain present. |
| Preservation | No application source/configuration or main spec was changed for Group 4. The unrelated working-tree files listed below remain excluded. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the checkpoint commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for document-party-lifecycle.
This resumes complete-partyhub-specification group 4 only, to finish 4.4.

Read docs/openspec-baseline/handoff.md and runbook.md, then the child
proposal, design, delta and tasks, plus party-lifecycle.md,
access-matrix.md, coverage.md, decisions.md and gaps.md.

Execute the child documentation-only checklist. Integrate the accepted
delta using openspec-sync-specs. Preserve PARTY-01, PARTY-02 and
PARTY-06-PARTY-11 byte-for-byte, plus AUTH-01-AUTH-12 and SOC-01-SOC-06.
Update exact counts, anchors and baseline records. Keep G003, G006, G009,
G029 and G030 as implementation gaps, and preserve Q003, Q004, Q010 and
Q014 for their assigned later stages.

Validate the child, umbrella, party main spec and all main specs. Mark
umbrella 4.4 complete only after integration. Preserve unrelated working-tree
changes. Stop before group 5. Do not implement application fixes or archive
the umbrella.
```
