# Profiles and social proposal-boundary handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Completed in Group 3: items 3.1 and 3.2. Item 3.3 remains open because the required `openspec-propose` workflow ends after planning and must not apply or sync the child in the same task.
- Umbrella progress: **11/46 complete, 35 remaining**. Group 4 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, inspected again from repository HEAD `6866f3fed3d6a438d3e6a9463a1e6b14da88419f` on 2026-09-23. Application source and configuration remain unchanged.
- Child change: [document-profiles-and-social-relationships](../../openspec/changes/document-profiles-and-social-relationships/proposal.md), planning-complete with **0/7 apply tasks complete**. Its [design](../../openspec/changes/document-profiles-and-social-relationships/design.md), [delta](../../openspec/changes/document-profiles-and-social-relationships/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-profiles-and-social-relationships/tasks.md) are ready for a later apply task.
- No child apply, spec sync or archive was performed. The main `social-and-notifications` spec is unchanged in this checkpoint.
- Checkpoint commit: this handoff is included in the scoped `docs: prepare profiles and social specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 3 evidence and proposal

| Item | Delivered result |
|---|---|
| 3.1 | [profiles-and-social.md](profiles-and-social.md) maps stored profile fields, proposed self/cross-user projections, editing boundaries, identifiers, search, party context and browser/iOS support. [Access rows 37-54 and 57](access-matrix.md#access-matrix) separate observed open/raw behavior from the proposed Q009 target and later Step 7/11 concerns. |
| 3.2 | The same evidence record includes the full directed transition table for creation, self-request rejection, duplicate actions, recipient-only acceptance, cancellation, rejection, unfollow, follower removal and reverse-direction preservation. One-way acceptance and two-way mutual-contact semantics remain explicit. |
| Proposal boundary | The child delta fully modifies the existing follow and profile requirements, preserves their original scenarios, leaves SOC-02/SOC-03 unchanged, and adds bounded projection and self-edit requirements. Strict child validation passes. |

The browser currently supplies search, another-user profiles, follow actions and profile party context. The iOS evidence supports an authenticated self profile, picture and accepted counts; inert controls do not establish cross-user parity. These are source observations, not runtime verification.

## Accepted and projected coverage

- Accepted decisions D001-D014 and AUTH-01-AUTH-12 remain unchanged.
- Accepted main-spec counts remain **6 capabilities, 40 requirements and 122 scenarios**. Authentication remains **12/43** and social remains **4/12**.
- If the child delta is accepted and synced, projected counts are **42/145** overall and **6/35** for social.
- Q009 has a concrete proposed resolution: authenticated profile/social reads, bounded cross-user fields, extra self-only fields, a recipient-private pending inbox, caller-relative relationship status and self-only profile editing. It remains unresolved until integration.
- G024 remains the legacy follow-parameter contract mismatch. G026 records open raw user serialization and profile-field exposure, G027 records open pending/status reads and mutation-direction problems, and G028 records browser/iOS support differences. They remain implementation gaps after specification integration.
- Profile-picture serving stays with Step 7, notification event/delivery behavior with Step 8, and exact routes, response schemas and status codes with Step 11. Q011 and Q012 remain outside this child.

## Validation record

| Command or check | Result |
|---|---|
| `openspec status --change document-profiles-and-social-relationships --json` | Planning complete; proposal, design, delta and tasks present. Child apply checklist remains 0/7. |
| `openspec validate document-profiles-and-social-relationships --type change --strict --no-interactive --json` | Pass, no issues. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only. |
| `openspec validate social-and-notifications --type spec --strict --no-interactive --json` | Main spec passes and remains unchanged in this checkpoint. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Coverage counts | Accepted 40/122 and social 4/12; proposed integrated 42/145 and social 6/35. |
| Link/access checks | 634 local file/heading links across 21 baseline/umbrella/domain Markdown files resolve; all 58 access-matrix rows remain present. |
| Preservation | No application source/configuration or main spec was changed for Group 3. The unrelated working-tree files listed below remain excluded. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the checkpoint commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for document-profiles-and-social-relationships.
This resumes complete-partyhub-specification group 3 only, to finish 3.3.

Read docs/openspec-baseline/handoff.md and runbook.md, then the child
proposal, design, delta and tasks, plus profiles-and-social.md,
access-matrix.md, coverage.md, decisions.md and gaps.md.

Execute the child documentation-only checklist. Integrate the accepted
delta using openspec-sync-specs. Preserve SOC-02, SOC-03 and AUTH-01-AUTH-12.
Update exact counts, anchors and baseline records. Keep G024 and G026-G028
as implementation gaps and preserve the Step 7, 8 and 11 boundaries.

Validate the child, umbrella, social main spec and all main specs. Mark
umbrella 3.3 complete only after integration. Preserve unrelated working-tree
changes. Stop before group 4. Do not implement application fixes or archive
the umbrella.
```
