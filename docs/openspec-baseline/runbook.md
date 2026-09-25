# PartyHub OpenSpec baseline runbook

This is the entry point for executing [complete-partyhub-specification](../../openspec/changes/complete-partyhub-specification/proposal.md) across separate tasks. The authoritative sequence, boundaries and completion gates are in the [design](../../openspec/changes/complete-partyhub-specification/design.md); checkbox progress is in [tasks.md](../../openspec/changes/complete-partyhub-specification/tasks.md).

## Start here

1. Read [handoff.md](handoff.md) for the current revision, completed work and exact next prompt.
2. Read the relevant step in the design and checklist, then the affected main specs including their scenarios.
3. Use [inventory.md](inventory.md) to find source surfaces and ownership, [coverage.md](coverage.md) for requirements/scenarios/evidence, [decisions.md](decisions.md) for accepted rules and unresolved questions, and [gaps.md](gaps.md) for discrepancies.
4. Work only on the requested group. Update these records and the checklist before stopping.

Authentication evidence: [browser/iOS flows](authentication.md), [all 58 endpoint access rows](access-matrix.md), [JWT/bypass environments](auth-environments.md). Group 2 used the [bounded auth proposal](../../openspec/changes/document-authentication-and-identity/proposal.md), its [design](../../openspec/changes/document-authentication-and-identity/design.md), [delta](../../openspec/changes/document-authentication-and-identity/specs/user-auth-and-identity/spec.md) and [documentation tasks](../../openspec/changes/document-authentication-and-identity/tasks.md).

Profiles/social evidence: [profile fields, client scope and follow transitions](profiles-and-social.md). Group 3 used [document-profiles-and-social-relationships](../../openspec/changes/document-profiles-and-social-relationships/proposal.md), its [design](../../openspec/changes/document-profiles-and-social-relationships/design.md), [delta](../../openspec/changes/document-profiles-and-social-relationships/specs/social-and-notifications/spec.md) and [documentation tasks](../../openspec/changes/document-profiles-and-social-relationships/tasks.md). The child is applied and synced; the next permitted work package is Group 4.

## Snapshot and boundaries

- Foundation inspected revision: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-21.
- Starting durable baseline: 6 capabilities, 37 requirements, 106 scenarios.
- Latest review: same application-source revision, Group 3 integration completed 2026-09-25. The accepted profiles/social delta is synced into the main social spec. Only that main spec changed under `openspec/specs`; application code/configuration/data remain unchanged.
- Product deltas are intentionally absent from this documentation umbrella (`skip_specs: true`). Actual domain changes use the normal proposal/integration workflow.
- Source and test-file inspection do not prove runtime behavior. No application, API, UI, deployment or database tests were run in the foundation, Group 2 or Group 3 documentation reviews.
- Existing main-spec validation issue: `map-radius-control` has a placeholder Purpose; [G012](gaps.md#g012-radius-purpose-placeholder) belongs to Step 12.

## Progress

| Step | Work package | Depends on | Status | Domain change / next action |
|---|---|---|---|---|
| 1 | Foundation and durable handoff | None | Complete | Items 1.1-1.5 remain complete; evidence package retained and extended. |
| 2 | Authentication and identity | 1 | Complete | 2.1-2.4 complete; `document-authentication-and-identity` integrated and synced, all 8 child tasks complete, strict child/identity validation passes. Child remains active and unarchived. |
| 3 | Profiles and social relationships | 2 | Complete | 3.1-3.3 complete; `document-profiles-and-social-relationships` integrated and synced, all 7 child tasks complete, strict child/social validation passes. Child remains active and unarchived. |
| 4 | Party lifecycle | 2 | Not started | Ownership, visibility, party fields and client compatibility. |
| 5 | Invitations and attendance | 3, 4 | Not started | Invitation/membership transitions and events. |
| 6 | Discovery and maps | 2, 4 | Not started | Shared discovery and explicitly scoped iOS map controls. |
| 7 | Media and profile pictures | 2, 4, 5 | Not started | Upload/view permissions, platform support and storage lifecycle. |
| 8 | Notifications and preferences | 3, 4, 5 | Not started | Event/recipient/channel matrix and settings/delivery contracts. |
| 9 | QR login | 2 | Not started | Retained-flow decision and identity/expiry/reuse contract. |
| 10 | Extended client features | 2, 5, 6 | Not started | Explicit scope for live locations, visits/time tracking and calendar integration. |
| 11 | Runtime and quality contracts | 2-10 | Not started | Environments, API compatibility, persistence, validation and quality evidence. |
| 12 | Consolidation and acceptance | 1-11 | Not started | Integrate accepted changes, resolve documentation drift and pass all strict spec checks. |

Two domain changes have been applied and synced: `document-authentication-and-identity` and `document-profiles-and-social-relationships`. Both remain active and unarchived. The accepted baseline has 42 requirements/145 scenarios, including AUTH-01-AUTH-12 at 12/43 and SOC-01-SOC-06 at 6/35. Acceptance records contracts; gap records and the unrun-test record prevent them from being read as implementation conformance.

Current progress: **12 of 46 checklist items complete**; **34 remain**. Foundation 1.1-1.5, authentication 2.1-2.4 and profiles/social 3.1-3.3 are complete. Groups 4-12 have not started. G001-G028 preserve observed gaps; Q009 is resolved by D015, while Q001-Q008 and Q010-Q013 retain their later owners.

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
