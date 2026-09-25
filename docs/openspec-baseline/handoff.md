# Invitations and attendance proposal-boundary handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Group 5 items 5.1-5.3 are complete. Item 5.4 remains open because the required domain delta reached the separate `openspec-propose` boundary. Umbrella progress is **19/46 complete, 27 remaining**. Group 6 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 5 planning started from repository checkpoint `4e919f24779b71f8ab23bca6378565965b8ee143` on 2026-09-25. No application source, configuration, database or deployment file was changed.
- Child change: [document-invitations-and-attendance](../../openspec/changes/document-invitations-and-attendance/proposal.md), planning-complete and unapplied with **0/7 tasks complete**. Its [design](../../openspec/changes/document-invitations-and-attendance/design.md), [delta](../../openspec/changes/document-invitations-and-attendance/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-invitations-and-attendance/tasks.md) remain active and unarchived.
- The accepted [party-discovery-and-management](../../openspec/specs/party-discovery-and-management/spec.md) main spec was not changed. PARTY-01-PARTY-13, AUTH-01-AUTH-12, SOC-01-SOC-06 and D001-D016 remain accepted exactly as before this task.
- Completion commit: this handoff is included in the scoped `docs: prepare invitations and attendance specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 5 planning result

| Item | Delivered result |
|---|---|
| 5.1 | [invitations-and-attendance.md](invitations-and-attendance.md) records stored-host selection, current mutual-contact eligibility, one logical invitation, duplicate/renewal/withdrawal behavior and private-visibility effects. [Access rows 2-7](access-matrix.md#access-matrix) distinguish accepted floors, observed source and proposed child behavior. |
| 5.2 | The invitation/attendance transition table covers public/private join, invitation-action acceptance, decline, leave, missing targets and repeated actions with prior/next invitation, membership, visibility and event effects. Q004 remains outside the selected contract. |
| 5.3 | Projection and event tables define proposed self/host/viewer audiences and one event per committed transition, while preserving notification channel/preferences/delivery/retry for Step 8. Access rows 20-25 and G031-G033 retain source/client mismatches. |
| 5.4 | Not complete. The child proposal/design/delta/tasks are ready for an explicit apply task; main-spec sync, accepted anchors/counts and final Group 5 validation remain pending. |

The proposed delta modifies PARTY-06 and PARTY-07 and adds PARTY-14/PARTY-15. It proposes stored-host invitation authority, current mutual-contact checks, one logical invitation, acceptance through atomic attendance, pending-only invitation visibility, actor-scoped projections and transition event inputs. It does not define age/capacity admission, notification delivery, host moderation/eviction, exact response/status/schema behavior or browser/iOS UI parity.

## Accepted versus projected coverage

- Accepted main-spec coverage remains **6 capabilities, 44 requirements and 172 scenarios**. `party-discovery-and-management` remains **13 requirements and 60 scenarios**.
- AUTH-01-AUTH-12 remain 12/43 and SOC-01-SOC-06 remain 6/35; their main specs are unchanged.
- Exact later sync would make `party-discovery-and-management` **15 requirements and 88 scenarios** and the full baseline **46 requirements and 200 scenarios**.
- Projected PARTY-06 has 8 scenarios, PARTY-07 has 9, PARTY-14 has 9 and PARTY-15 has 6. Proposed PARTY-14/PARTY-15 are intentionally absent from the accepted requirement index until apply.

Q003 has a proposed answer: pending invitations qualify, accepted users qualify through membership, declined/withdrawn invitations do not qualify without another role, reinvitation renews the same logical invitation to pending, and current-state retries are no-ops. Q010 has proposed host/self/viewer projection audiences. Both remain unresolved until child apply. Q004 remains unresolved for age/capacity admission; Q014 remains with Step 11 for exact methods, statuses, envelopes, fields and compatibility.

G009 and G017 remain for missing private visibility and mutual/stored-host enforcement. G031 records inconsistent invitation/attendance authority and transitions, G032 records broad/inconsistent projections and statistics, and G033 records browser/iOS/backend payload and state mismatches. G006 still owns singular/wrong route variants. No application fix or archive was performed.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-invitations-and-attendance --type change --strict --no-interactive --json` | Pass, no issues; child planning complete with 0/7 apply tasks. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only; umbrella checklist 19/46. |
| `openspec validate party-discovery-and-management --type spec --strict --no-interactive --json` | Pass; accepted main spec remains 13 requirements/60 scenarios. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Preservation | The complete accepted auth, social and party main specs match their pre-task SHA-256 hashes. Application-source paths match snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. |
| Link/access checks | All checked local file/heading links across baseline, umbrella and Group 5 Markdown resolve; all 58 access-matrix rows remain present. |
| Scope | The scoped diff contains only the Group 5 child proposal artifacts, umbrella checklist and baseline documentation. Preserved unrelated working-tree files remain unstaged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the completion commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for document-invitations-and-attendance.
This resumes complete-partyhub-specification group 5 only, to finish 5.4.

Read docs/openspec-baseline/handoff.md and runbook.md first, then the child
proposal, design, delta and tasks plus invitations-and-attendance.md,
party-lifecycle.md, access-matrix.md, coverage.md, decisions.md and gaps.md.

Execute the child documentation-only checklist. Integrate its accepted delta
using openspec-sync-specs. Preserve AUTH-01-AUTH-12, SOC-01-SOC-06 and
PARTY-01-PARTY-05/PARTY-08-PARTY-13 byte-for-byte; modify only PARTY-06 and
PARTY-07 and add PARTY-14/PARTY-15. Update accepted counts and anchors. Keep
G009/G017/G031-G033 as implementation gaps. Preserve Q004 and Q014.

Validate the child, umbrella, party main spec and all main specs; mark 5.4 only
after integration. Preserve unrelated dirty files, stop before Group 6, make no
application fixes and do not archive any change.
```
