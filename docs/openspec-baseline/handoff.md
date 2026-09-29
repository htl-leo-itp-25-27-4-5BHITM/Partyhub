# Notifications and preferences completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-8 are complete at **29/46 checklist items, 17 remaining**. Group 9 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 8 was applied from proposal commit `b9a44a69c5659f2c5c066c507882bd11b9ff98eb` on 2026-09-29. No application source, configuration, database, deployment or uploaded data was changed.
- Child change: [document-notifications-and-preferences](../../openspec/changes/document-notifications-and-preferences/proposal.md), with its [design](../../openspec/changes/document-notifications-and-preferences/design.md), [social delta](../../openspec/changes/document-notifications-and-preferences/specs/social-and-notifications/spec.md) and [tasks](../../openspec/changes/document-notifications-and-preferences/tasks.md). All **8/8 child tasks** are complete. The child is applied, synced, strict-valid, active and unarchived.
- The main [social-and-notifications spec](../../openspec/specs/social-and-notifications/spec.md) now contains SOC-01-SOC-11 at **11 requirements/82 scenarios**. Accepted overall coverage is **6 capabilities, 52 requirements and 274 scenarios**.
- Durable Group 8 evidence is in [notifications-and-preferences.md](notifications-and-preferences.md), including the event-recipient-channel matrix, center/settings behavior, supported-channel classifications, cleanup/failure rules, client evidence and unrun-test boundary.

## Accepted Group 8 result

D020 resolves Q007 at the specification layer:

- SOC-03 defines deterministic recipients for follow request/acceptance, invitation issue/withdrawal/outcomes, attendance leave, party update and cancellation. Each committed change yields at most one typed event per recipient; failed, denied and repeated no-op actions yield none.
- SOC-08 defines authenticated recipient-only typed center state, deterministic order, filters, read state, informational deletion, stale actions and cancellation snapshots without message-text policy.
- SOC-09 defines same-user effective defaults, atomic complete replacement and independent channel/category gates. In-app/email and event categories default enabled; unsupported push/SMS default disabled. Pending follow/invitation actions remain available from authoritative state.
- SOC-10 supports in-app and email with failure isolation and stable event-recipient/channel identity. Delivery failure never rolls back domain state. Push and SMS remain unsupported until an adapter/client contract is integrated; any later token registration derives ownership from the caller.
- SOC-11 treats welcome as one-time best-effort onboarding email and digest as an email-only, preference-aware, per-recipient Viewer-filtered summary. Neither creates center state or controls identity/domain success.

G040-G045 retain the observed implementation differences: missing typed event identity/snapshot/tie-break, contradictory producer recipients/no-op behavior, all-true/coupled preference gates, visibility-unsafe digest and incomplete welcome boundaries, unintegrated push/device-token routes, and browser/iOS center/settings divergence. Q006 retains physical retention, receipts, retry timing and reliability policy; Q014 retains exact API method/path/status/schema choices.

## Validation and evidence record

| Check | Result |
|---|---|
| Child status | 8/8 documentation/specification tasks complete; active and unarchived. |
| Child strict validation | `openspec validate document-notifications-and-preferences --strict --no-interactive` passes. |
| Main social validation | `openspec validate social-and-notifications --type spec --strict --no-interactive` passes at 11 requirements/82 scenarios. |
| Umbrella strict validation | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` passes with Groups 1-8 checked and 9-12 open. |
| All main specs | Non-strict validation passes all six. Strict aggregate validation retains only the pre-existing `map-radius-control` Purpose issue G012 for Step 12. |
| Evidence links | Group 8 baseline/change/spec links resolve; the access matrix still contains exactly 58 endpoint rows. |
| Runtime evidence | No application, JUnit, HTTPYac, browser, iOS, Keycloak, database, SMTP, APNs or deployment test was executed. |
| Preservation | Application source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Do not archive the umbrella or any active child while later groups remain. The next bounded work package is Group 9 only.

## Exact next prompt

```text
Continue complete-partyhub-specification with Group 9: QR login only.

Read docs/openspec-baseline/handoff.md and runbook.md first, then umbrella
design/tasks, accepted authentication spec, QR source/tests/clients, coverage,
decisions, gaps, inventory and access matrix. Execute only tasks 9.1-9.3.

Compare generation, image/status, exchange and mobile identity paths. Establish
the retained QR contract or an explicit retirement/defer record. If a separate
domain proposal is required, follow the OpenSpec workflow boundary and stop at
that boundary. Update durable evidence, checklist and handoff before stopping.

Do not implement application fixes, do not start Group 10, and do not archive
the umbrella or active child changes. Preserve unrelated dirty files.
```
