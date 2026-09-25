# Profiles and social completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Completed scope: Group 3, items 3.1-3.3. Group 4 was not started.
- Umbrella progress: **12/46 complete, 34 remaining**.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, completed from the Group 3 proposal checkpoint `8b6edd108fc5c01c7c0230f8515da3d071291153` on 2026-09-25. Application source and configuration remain unchanged.
- Child change: [document-profiles-and-social-relationships](../../openspec/changes/document-profiles-and-social-relationships/proposal.md), applied and synced with **7/7 tasks complete**. It remains active and unarchived.
- The [main social spec](../../openspec/specs/social-and-notifications/spec.md) is the only main spec changed in this apply checkpoint.
- Checkpoint commit: this handoff is included in the scoped `docs: complete profiles and social specification` commit; use `git log -1` for its immutable SHA.

## Delivered Group 3 result

| Item | Delivered result |
|---|---|
| 3.1 | [profiles-and-social.md](profiles-and-social.md) records profile fields, self/cross-user projections, editing, identifiers, search, profile-party visibility and explicit browser/iOS scope. [Access rows 36-54 and 57](access-matrix.md#access-matrix) distinguish accepted access from observed source behavior and later Step 7/11 concerns. |
| 3.2 | The evidence record contains the complete directed follow table for creation, self rejection, duplicates, recipient-only acceptance, cancellation, rejection, unfollow, follower removal and reverse-direction preservation. One-way acceptance and two-way mutual contact are preserved. |
| 3.3 | The child delta is merged into `social-and-notifications`: SOC-01 and SOC-04 are fully updated, SOC-02 and SOC-03 remain byte-for-byte unchanged, and SOC-05/SOC-06 add bounded projections and self profile editing. |

The accepted browser scope covers search, another-user profiles, follow actions and profile party context. The accepted iOS minimum covers the authenticated self profile and accepted follower/following counts; it does not require browser social controls on iOS. Profile-picture lifecycle, notification delivery and exact route/schema/status work remain with Steps 7, 8 and 11.

## Accepted coverage, decisions and gaps

- The main baseline now has **6 capabilities, 42 requirements and 145 scenarios**. Authentication remains **12/43** and social is now **6/35**.
- D001-D015 are accepted. D015 records authenticated profile/social reads, audience-specific projections, recipient-private pending requests, caller-relative status, self-only editing, directed follow actors and explicit client scope.
- Q009 is resolved by D015 and SOC-01/SOC-04-SOC-06. Exact REST compatibility and picture serving remain later implementation concerns rather than unresolved Group 3 product policy.
- G024 remains the follow mutation parameter mismatch. G026 remains raw/open user serialization and missing handle integrity. G027 remains public arbitrary-user pending/status access and incorrect removal direction. G028 remains the browser/iOS implementation difference and inert iOS controls.
- No application fix, client feature, database migration, runtime configuration change or archive was performed.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-profiles-and-social-relationships --type change --strict --no-interactive --json` | Pass, no issues. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only. |
| `openspec validate social-and-notifications --type spec --strict --no-interactive --json` | Pass; one informational long-requirement suggestion, no failure. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Coverage and preservation | Social 6/35 and total 42/145; SOC-02/SOC-03 are unchanged, all original SOC-01/SOC-04 scenarios remain, AUTH-01-AUTH-12 remain 12/43, and no delta operation headers entered the main spec. |
| Link/access checks | 682 local file/heading links across 21 baseline/umbrella/domain Markdown files resolve; all 58 access-matrix rows remain present. |
| Scope and whitespace | Scoped whitespace passes. Only `social-and-notifications` changed under main specs; application/configuration paths are unchanged. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated this work and remain outside the checkpoint commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Exact next-task prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 4: Party lifecycle (4.1-4.4).

Read docs/openspec-baseline/handoff.md and all documents it links first.
Complete documentation/specification work only; do not implement application
fixes. Preserve AUTH-01-AUTH-12, SOC-01-SOC-06, D001-D015, and the
recorded gaps and platform boundaries. Use the party access/ownership evidence
and follow the domain workflow boundary if a separate proposal is needed.

Update the checklist, coverage, decisions, gaps, runbook and handoff before
stopping. Preserve unrelated working-tree changes. Do not start group 5.
```
