# Authentication and identity handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`).
- Completed scope: group 2 only, items 2.1-2.4. Group 3 was not started.
- Umbrella progress: **9/46 complete, 37 remaining**. Foundation 1.1-1.5 and authentication 2.1-2.4 are checked.
- Application-source revision inspected: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, 2026-09-23. This checkpoint changes documentation, OpenSpec planning artifacts and the main identity spec only; it does not change application source, configuration or data.
- Child change: [document-authentication-and-identity](../../openspec/changes/document-authentication-and-identity/proposal.md), applied and synced with **8/8 tasks complete**. It remains active and unarchived.
- Checkpoint commit: this handoff is included in the scoped `docs: complete authentication specification checkpoint` commit; use `git log -1` for its immutable SHA.

## Delivered group 2 result

| Item | Delivered result |
|---|---|
| 2.1 | [authentication.md](authentication.md) records browser and iOS login, callback, storage, refresh/bootstrap, API, logout and linking/onboarding flows with source evidence and success/failure cases. |
| 2.2 | [access-matrix.md](access-matrix.md) retains all 58 inventoried endpoints in ID order, each with an observed gate/object check and an accepted rule or named unresolved question. |
| 2.3 | [auth-environments.md](auth-environments.md) separates normal JWT identity from dev/staging/test/Kubernetes bypass declarations and live-environment uncertainty. |
| 2.4 | The child [delta](../../openspec/changes/document-authentication-and-identity/specs/user-auth-and-identity/spec.md) is merged into the [main identity spec](../../openspec/specs/user-auth-and-identity/spec.md), its Purpose is current, traceability documents are reconciled and the completion checks pass subject only to the known radius Purpose issue. |

The integration preserves AUTH-01-AUTH-09 identifiers and all 27 original scenarios. It renames AUTH-02 and AUTH-03 without changing their bodies/scenarios, adds an object-authority denial scenario to AUTH-09, and adds AUTH-10 public bootstrap, AUTH-11 native PKCE login and AUTH-12 native token-backed session behavior.

The accepted baseline now has **6 capabilities, 40 requirements and 122 scenarios**. Authentication has **12 requirements and 43 scenarios**. Acceptance records normative coverage; it is not evidence that the clients, backend or environment conform at runtime.

## Decisions, gaps and policy limits

- D001-D014 are accepted. D014 records the bounded public-bootstrap and iOS minimum, including local logout without a provider-logout/revocation promise.
- G001 now distinguishes the corrected identity main spec from older `docs/functional-spec-codex.md` narrative drift, which remains Step 12 work.
- G002 and G019-G023 remain implementation/configuration mismatches or evidence limits. The specification stage did not repair them.
- Q011 local-user creation is owned by Steps 3/11 with final acceptance in Step 12.
- Q012 ambiguous/trusted account matching is owned by Steps 3/11 with final acceptance in Step 12.
- Q013 provider logout/revocation and Keychain deletion retry policy is owned by Step 11 with final acceptance in Step 12.
- Those questions do not block the accepted group 2 minimum because AUTH-10-AUTH-12 explicitly avoid making the unresolved guarantees.
- G024 is a group 3 input about follow mutation parameter meanings. Q009 is the corresponding profile/social access-policy input.

## Validation record

| Command or check | Result |
|---|---|
| `openspec validate document-authentication-and-identity --type change --strict --no-interactive --json` | Pass, no issues. |
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive --json` | Pass; `skip_specs` informational note only. |
| `openspec validate user-auth-and-identity --type spec --strict --no-interactive --json` | Pass, no issues. |
| `openspec validate --specs --strict --no-interactive --json` | 5/6 pass. The only failure is the pre-existing `map-radius-control` Purpose placeholder recorded as G012 and reserved for Step 12. |
| Main-spec counts | Identity 12/43; all six specs 40/122. |
| Link/access checks | 592 local file/heading links checked with no errors; all 58 access-matrix rows retained. |
| Preservation/whitespace | Scoped diff check passes. Only the identity main spec changed under `openspec/specs`; application/configuration files were not edited. |
| Runtime tests | Not run. No browser, iOS, Keycloak, Quarkus, JUnit, HTTPYac, Compose, database, deployment or live-cluster flow was executed. |

Validation establishes artifact consistency, not implementation conformance.

## Preserved unrelated working-tree changes

These predated the baseline work and remain outside the checkpoint commit:

- `prompts/prompts.md`: SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`.
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`: SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`.

## Foundation record retained

Foundation 1.1-1.5 completed on 2026-09-21 at revision `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. It assigned 58 endpoints, 60 Java sources, 28 Java test/support files, 18 HTML pages, 20 JavaScript modules, 49 actual Swift sources, 9 HTTPYac files and infrastructure/documentation surfaces to owner stages. Its original 37-requirement/106-scenario snapshot remains historical evidence; the current accepted counts are 40/122 after group 2 integration.

## Exact next-task prompt

```text
Use openspec-apply-change for complete-partyhub-specification.
Execute only task group 3: Profiles and social relationships (3.1-3.3).

Read docs/openspec-baseline/handoff.md and all documents it links first.
Complete documentation/specification work only; do not implement
application fixes. Preserve AUTH-01-AUTH-12 and the group 2 decisions,
gaps and policy limits. Use Q009 and G024 as inputs, and follow the
domain workflow boundary if a separate proposal is needed.

Update the checklist and handoff before stopping. Do not start group 4.
```
