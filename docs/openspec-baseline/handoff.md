# QR login completion handoff

## Current work and stopping point

- Umbrella: `complete-partyhub-specification`, schema `spec-driven`, documentation-only (`skip_specs: true`). Groups 1-9 are complete at **32/46 checklist items, 14 remaining**. Group 10 was not started.
- Application-source snapshot: `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. Group 9 started from completion commit `6217f5009530777a920d03db88900f1259f5b9d5` on 2026-09-29. No application source, configuration, database, deployment or uploaded data was changed.
- Group 9 result: [qr-login.md](qr-login.md) records generation, image/status, exchange, mobile identity, storage, browser/iOS/email consumers and static test evidence. D021 resolves Q001 by explicitly deferring QR login and preserving Keycloak as the only accepted browser/iOS authentication contract.
- No child proposal or main-spec delta is required because Group 9 retains no QR product behavior. The six main specs remain at **52 requirements/274 scenarios**. The six exposed QR endpoints, `QrLogin` storage, browser page/helper, iOS scanner/deep link, welcome link and tests remain inventoried as unsupported legacy/prototype surfaces.
- G007/G008/G046-G050 preserve the observed flow split, public status/identifier exposure, custom credential defects, inactive/incompatible clients and incomplete lifecycle/test evidence. Exact endpoint containment/retirement behavior and stored-row lifecycle remain Q014/Q006 for Step 11.

## Accepted Group 9 decision

D021 establishes these boundaries:

- Supported login/session behavior remains AUTH-01-AUTH-12: Keycloak authorization code with PKCE, validated bearer identity, backend subject linkage and token-backed native sessions.
- A numeric user ID, QR/deep-link payload, stored handoff token, custom mobile token, path/query value or client cache does not authenticate a PartyHub user and cannot authorize a protected API.
- The current numeric-ID generator/image path and stored-token/custom-HMAC exchange path are both unsupported. Their presence in source, OpenAPI, seed data, tests or UI does not make either one an accepted compatibility requirement.
- A later retained QR flow requires its own proposal with explicit actors, relying-party journey, proof-of-possession, expiry/reuse/revocation, transaction-safe exchange and identity-provider/session integration. This review does not choose that design.

## Validation and evidence record

| Check | Result |
|---|---|
| Umbrella progress | Tasks 9.1-9.3 complete; 32/46 overall and Group 10 untouched. |
| Umbrella strict validation | `openspec validate complete-partyhub-specification --type change --strict --no-interactive` passes. |
| Main specs | No product delta; non-strict validation passes all six at 52 requirements/274 scenarios. Strict aggregate validation retains only the pre-existing `map-radius-control` Purpose issue G012 for Step 12. |
| Evidence/access | QR evidence and durable links resolve; access rows 30-35 contain D021 dispositions and the matrix still has exactly 58 endpoint rows. |
| Runtime evidence | No application, JUnit, HTTPYac, browser, iOS, Keycloak, database or deployment test was executed. |
| Preservation | Application source/configuration and the two unrelated working-tree files remain unstaged and unchanged. |

## Working-tree preservation

Do not include or overwrite these unrelated user edits:

- `prompts/prompts.md`, preserved SHA-1 `b8f3d75470d5feb06536ae984d79bea562038050`
- `PartyHubiOS/PartyHubiOS.xcodeproj/project.xcworkspace/xcuserdata/viktoriavejmelek.xcuserdatad/UserInterfaceState.xcuserstate`, preserved SHA-1 `e83caa5f25ccf98036fa3b8307bfc6044cfdd5e7`

Do not archive the umbrella or active child changes while later groups remain. The next bounded work package is Group 10 only.

## Exact next prompt

```text
Continue complete-partyhub-specification with Group 10: extended client
features only.

Read docs/openspec-baseline/handoff.md and runbook.md first, then umbrella
design/tasks, accepted auth/party/discovery specs, user-location endpoints,
iOS attendee-location, GeoTimeTracking and CalendarService sources, tests,
coverage, decisions, gaps, inventory and access matrix. Execute only tasks
10.1-10.3.

Classify live/current location, attendee locations, visit/time tracking and
calendar integration as retained, optional or excluded. For retained behavior,
define permission/consent, visibility, lifecycle and failure boundaries. If a
separate domain proposal is required, follow the OpenSpec workflow boundary,
validate and commit the proposal checkpoint, then stop without marking Group 10
complete. Otherwise complete the exclusion records and Group 10 handoff.

Do not implement application fixes, do not start Group 11, and do not archive
the umbrella or active child changes. Preserve unrelated dirty files.
```
