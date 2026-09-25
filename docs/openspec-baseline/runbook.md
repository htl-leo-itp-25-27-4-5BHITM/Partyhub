# PartyHub OpenSpec baseline runbook

This is the entry point for executing [complete-partyhub-specification](../../openspec/changes/complete-partyhub-specification/proposal.md) across separate tasks. The authoritative sequence, boundaries and completion gates are in the [design](../../openspec/changes/complete-partyhub-specification/design.md); checkbox progress is in [tasks.md](../../openspec/changes/complete-partyhub-specification/tasks.md).

## Start here

1. Read [handoff.md](handoff.md) for the current revision, completed work and exact next prompt.
2. Read the relevant step in the design and checklist, then the affected main specs including their scenarios.
3. Use [inventory.md](inventory.md) to find source surfaces and ownership, [coverage.md](coverage.md) for requirements/scenarios/evidence, [decisions.md](decisions.md) for accepted rules and unresolved questions, and [gaps.md](gaps.md) for discrepancies.
4. Work only on the requested group. Update these records and the checklist before stopping.

Authentication evidence: [browser/iOS flows](authentication.md), [all 58 endpoint access rows](access-matrix.md), [JWT/bypass environments](auth-environments.md). Group 2 used [document-authentication-and-identity](../../openspec/changes/document-authentication-and-identity/proposal.md); it is applied, synced and active with all eight child tasks complete.

Profiles/social evidence: [profile fields, client scope and follow transitions](profiles-and-social.md). Group 3 used [document-profiles-and-social-relationships](../../openspec/changes/document-profiles-and-social-relationships/proposal.md); it is applied, synced and active with all seven child tasks complete.

Party lifecycle evidence: [CRUD actors, fields, validation and client compatibility](party-lifecycle.md). Group 4 used [document-party-lifecycle](../../openspec/changes/document-party-lifecycle/proposal.md), its [design](../../openspec/changes/document-party-lifecycle/design.md), [delta](../../openspec/changes/document-party-lifecycle/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-party-lifecycle/tasks.md). It is applied and synced with all seven child tasks complete.

Invitation and attendance evidence: [selection, transitions, projections and event inputs](invitations-and-attendance.md). Group 5 used [document-invitations-and-attendance](../../openspec/changes/document-invitations-and-attendance/proposal.md), its [design](../../openspec/changes/document-invitations-and-attendance/design.md), [delta](../../openspec/changes/document-invitations-and-attendance/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-invitations-and-attendance/tasks.md). It is applied and synced with all seven child tasks complete.

Discovery and maps evidence: [visible-query ownership, client filters and radius states](discovery-and-maps.md). Group 6 uses the planning-complete, unapplied [document-discovery-and-maps](../../openspec/changes/document-discovery-and-maps/proposal.md), its [design](../../openspec/changes/document-discovery-and-maps/design.md), [party delta](../../openspec/changes/document-discovery-and-maps/specs/party-discovery-and-management/spec.md), [radius delta](../../openspec/changes/document-discovery-and-maps/specs/map-radius-control/spec.md) and [tasks](../../openspec/changes/document-discovery-and-maps/tasks.md). Items 6.1-6.2 are complete; 6.3 remains open at the separate proposal boundary. Group 7 has not started.

## Snapshot and boundaries

- Foundation inspected revision: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21.
- Starting durable baseline: 6 capabilities, 37 requirements, 106 scenarios.
- Latest review: Group 6 source review and proposal planning completed on 2026-09-25 from checkpoint `5287ac8e4a4d54b0e50c528689ceea1b48eab07f`. The child is not applied, so accepted main specs and counts remain unchanged. Only proposal and documentation records changed; application code, configuration and data did not.
- Product deltas are intentionally absent from the documentation umbrella (`skip_specs: true`). Actual domain changes use the normal proposal/integration workflow.
- Source and test-file inspection do not prove runtime behavior. No application, API, UI, deployment or database tests were run in the foundation or Groups 2-6 documentation reviews.
- Existing main-spec validation issue: `map-radius-control` has a placeholder Purpose; [G012](gaps.md#g012-radius-purpose-placeholder) belongs to Step 12.

## Progress

| Step | Work package | Depends on | Status | Domain change / next action |
|---|---|---|---|---|
| 1 | Foundation and durable handoff | None | Complete | Items 1.1-1.5 remain complete; evidence package retained and extended. |
| 2 | Authentication and identity | 1 | Complete | 2.1-2.4 complete; child applied and synced, 8/8 tasks, strict child/identity validation passes. |
| 3 | Profiles and social relationships | 2 | Complete | 3.1-3.3 complete; child applied and synced, 7/7 tasks, strict child/social validation passes. |
| 4 | Party lifecycle | 2 | Complete | 4.1-4.4 complete; child applied and synced, 7/7 tasks, strict child/party validation passes. |
| 5 | Invitations and attendance | 3, 4 | Complete | 5.1-5.4 complete; child applied and synced, 7/7 tasks, strict child/party validation passes. |
| 6 | Discovery and maps | 2, 4 | Proposal boundary | 6.1-6.2 complete; `document-discovery-and-maps` is planning-complete and unapplied, so 6.3 remains open. |
| 7 | Media and profile pictures | 2, 4, 5 | Not started | Upload/view permissions, platform support and storage lifecycle. |
| 8 | Notifications and preferences | 3, 4, 5 | Not started | Event/recipient/channel matrix and settings/delivery contracts. |
| 9 | QR login | 2 | Not started | Retained-flow decision and identity/expiry/reuse contract. |
| 10 | Extended client features | 2, 5, 6 | Not started | Explicit scope for live locations, visits/time tracking and calendar integration. |
| 11 | Runtime and quality contracts | 2-10 | Not started | Environments, API compatibility, persistence, validation and quality evidence. |
| 12 | Consolidation and acceptance | 1-11 | Not started | Integrate accepted changes, resolve documentation drift and pass all strict spec checks. |

Four domain changes have been applied and synced: `document-authentication-and-identity`, `document-profiles-and-social-relationships`, `document-party-lifecycle` and `document-invitations-and-attendance`. All remain active and unarchived. `document-discovery-and-maps` is the fifth child and is planning-complete but unapplied. The accepted baseline remains **6 capabilities, 46 requirements and 200 scenarios**, including AUTH-01-AUTH-12 at 12/43, SOC-01-SOC-06 at 6/35 and PARTY-01-PARTY-15 at 15/88. Exact Group 6 integration would produce 47/212, with PARTY-16 and expanded radius scenarios. Acceptance records contracts; gap records and the unrun-test record prevent them from being read as implementation conformance.

Current progress: **22 of 46 checklist items complete**; **24 remain**. Foundation 1.1-1.5, authentication 2.1-2.4, profiles/social 3.1-3.3, party lifecycle 4.1-4.4, invitations/attendance 5.1-5.4 and discovery/maps 6.1-6.2 are complete. Group 6.3 and Groups 7-12 remain open. G001-G035 are stable; G009/G030/G034-G035 retain discovery implementation differences and G012 remains the Step 12 Purpose correction. Q008 has a proposed strict-AND answer but remains unresolved until apply; Q004 and Q014 retain their later boundaries.

## Recording rules

- Preserve existing capability paths and accepted semantics. Do not turn a source defect into a normative requirement.
- Track requirement disposition separately from implementation evidence. A test file is evidence of test presence until its assertions and execution have been assessed.
- Every surface has an owner step, including demos, legacy helpers and endpoints for features whose product scope is unresolved.
- Keep browser, iOS, backend and environment scope explicit. A platform-specific feature does not establish parity requirements for another client.
- Record any genuine product decision needed under a stable Q ID. Previously resolved rules stay under D IDs with their authoritative source.
- Keep implementation repairs in the gap register and subsequent bounded changes. Documentation execution does not authorize feature fixes or deployment.
- Before a new task, compare its revision/working tree to the handoff. Refresh affected evidence instead of assuming the old snapshot still applies.
- Stop after the requested work package or at a required workflow transition. Update the handoff even if a group is incomplete.

## Completion checks

For each documentation change, run strict change validation. For the durable specs, run strict spec validation and distinguish existing failures from new ones. Review inventory ownership, requirement/scenario links, evidence classifications and cross-capability decisions before checking off a group.

```sh
openspec validate complete-partyhub-specification --type change --strict --no-interactive
openspec validate --specs --strict --no-interactive
```

Final acceptance belongs to Step 12. The umbrella must remain open while later groups are incomplete.
