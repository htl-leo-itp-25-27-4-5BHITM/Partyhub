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

Discovery and maps evidence: [visible-query ownership, client filters and radius states](discovery-and-maps.md). Group 6 used the applied and synced [document-discovery-and-maps](../../openspec/changes/document-discovery-and-maps/proposal.md), its [design](../../openspec/changes/document-discovery-and-maps/design.md), [party delta](../../openspec/changes/document-discovery-and-maps/specs/party-discovery-and-management/spec.md), [radius delta](../../openspec/changes/document-discovery-and-maps/specs/map-radius-control/spec.md) and [tasks](../../openspec/changes/document-discovery-and-maps/tasks.md). Items 6.1-6.3 and all seven child tasks are complete.

Media/profile-picture evidence: [gallery access, client state, upload validation and replacement](media-and-profile-pictures.md). Group 7 used the applied and synced [document-media-and-profile-pictures](../../openspec/changes/document-media-and-profile-pictures/proposal.md), its [design](../../openspec/changes/document-media-and-profile-pictures/design.md), [media delta](../../openspec/changes/document-media-and-profile-pictures/specs/party-media-gallery/spec.md), [social delta](../../openspec/changes/document-media-and-profile-pictures/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-media-and-profile-pictures/tasks.md). Items 7.1-7.3 and all nine child tasks are complete.

Notification/preferences evidence: [event-recipient-channel matrix, center/settings contract and delivery/client support](notifications-and-preferences.md). Group 8 used the applied and synced [document-notifications-and-preferences](../../openspec/changes/document-notifications-and-preferences/proposal.md), its [design](../../openspec/changes/document-notifications-and-preferences/design.md), [social delta](../../openspec/changes/document-notifications-and-preferences/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-notifications-and-preferences/tasks.md). Items 8.1-8.3 and all eight child tasks are complete; the child remains active and unarchived.

## Snapshot and boundaries

- Foundation inspected revision: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21.
- Starting durable baseline: 6 capabilities, 37 requirements, 106 scenarios.
- Latest accepted integration: Group 8 source review, child apply and main-spec sync completed on 2026-09-29 from proposal checkpoint `b9a44a69c5659f2c5c066c507882bd11b9ff98eb`. Accepted main-spec coverage is 52 requirements/274 scenarios. Only specification and documentation records changed; application code, configuration and data did not.
- Product deltas are intentionally absent from the documentation umbrella (`skip_specs: true`). Actual domain changes use the normal proposal/integration workflow.
- Source and test-file inspection do not prove runtime behavior. No application, API, UI, deployment, database, SMTP or APNs tests were run in the foundation or Groups 2-8 documentation reviews.
- Existing main-spec validation issue: `map-radius-control` has a placeholder Purpose; [G012](gaps.md#g012-radius-purpose-placeholder) belongs to Step 12.

## Progress

| Step | Work package | Depends on | Status | Domain change / next action |
|---|---|---|---|---|
| 1 | Foundation and durable handoff | None | Complete | Items 1.1-1.5 remain complete; evidence package retained and extended. |
| 2 | Authentication and identity | 1 | Complete | 2.1-2.4 complete; child applied and synced, 8/8 tasks, strict child/identity validation passes. |
| 3 | Profiles and social relationships | 2 | Complete | 3.1-3.3 complete; child applied and synced, 7/7 tasks, strict child/social validation passes. |
| 4 | Party lifecycle | 2 | Complete | 4.1-4.4 complete; child applied and synced, 7/7 tasks, strict child/party validation passes. |
| 5 | Invitations and attendance | 3, 4 | Complete | 5.1-5.4 complete; child applied and synced, 7/7 tasks, strict child/party validation passes. |
| 6 | Discovery and maps | 2, 4 | Complete | 6.1-6.3 complete; child applied and synced, 7/7 tasks; radius Purpose remains Step 12/G012. |
| 7 | Media and profile pictures | 2, 4, 5 | Complete | 7.1-7.3 complete; child applied and synced, 9/9 tasks; retention/deletion remains Step 11/Q006. |
| 8 | Notifications and preferences | 3, 4, 5 | Complete | 8.1-8.3 complete; child applied and synced, 8/8 tasks; D020 resolves Q007 and G040-G045 retain implementation/client gaps. |
| 9 | QR login | 2 | Not started | Retained-flow decision and identity/expiry/reuse contract. |
| 10 | Extended client features | 2, 5, 6 | Not started | Explicit scope for live locations, visits/time tracking and calendar integration. |
| 11 | Runtime and quality contracts | 2-10 | Not started | Environments, API compatibility, persistence, validation and quality evidence. |
| 12 | Consolidation and acceptance | 1-11 | Not started | Integrate accepted changes, resolve documentation drift and pass all strict spec checks. |

Seven domain changes have been applied and synced: `document-authentication-and-identity`, `document-profiles-and-social-relationships`, `document-party-lifecycle`, `document-invitations-and-attendance`, `document-discovery-and-maps`, `document-media-and-profile-pictures` and `document-notifications-and-preferences`. All remain active and unarchived. The accepted baseline is **6 capabilities, 52 requirements and 274 scenarios**, including AUTH-01-AUTH-12 at 12/43, SOC-01-SOC-11 at 11/82, PARTY-01-PARTY-16 at 16/97, MEDIA-01-MEDIA-03 at 3/20 and RADIUS-01-RADIUS-03 at 3/10. Acceptance records contracts; gap records and the unrun-test record prevent them from being read as implementation conformance.

Current progress: **29 of 46 checklist items complete**; **17 remain**. Foundation 1.1-1.5 and Groups 2-8 are complete; Groups 9-12 have not started. G001-G045 are the accepted gap register. Q007 is resolved by D020; Q006 and Q014 retain notification retention/retry and exact transport boundaries for Step 11.

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
