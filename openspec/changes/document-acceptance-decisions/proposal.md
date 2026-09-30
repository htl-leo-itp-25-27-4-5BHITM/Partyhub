# Proposal

## Why

Group 12 final acceptance needs answers to the open questions left by Groups 5-11. On 2026-09-30 the product owner answered them. Two answers add behaviour that no accepted requirement states yet. First, first-login linking must always end in exactly one linked PartyHub user, including when several unlinked records match, while seeded test records stay unlinked data. Second, the school-cloud deployment is a persistent environment: every push deploys the new version without resetting data. The other answers confirm existing requirements or explicitly defer topics, so they are recorded as decisions only.

## What Changes

- Modify `user-auth-and-identity` "PartyHub users link to Keycloak identities": when several unlinked PartyHub users match a first login, none is linked by guessing; a new minimal user is created and linked to the subject. Seeded test records are stored without Keycloak IDs and gain a link only through the accepted unique-match login path.
- Add a new `deployment-environment` capability for the school-cloud deployment: application data, Keycloak data and uploaded files persist across deployments; a successful push to `main` deploys the new version by applying changes incrementally, with no schema drop or seed replay.
- Decisions only (no delta): age/capacity metadata is shown and filtered but does not gate attendance (Q004). `POST /api/users` stays available for testing and test data without ever establishing identity (Q011). iOS logout stays at the accepted local minimum (Q013). Retention, accessibility and operational targets are explicitly deferred (Q016-Q018).

## Capabilities

### New Capabilities

- `deployment-environment`: Durability and update behaviour of the deployed PartyHub school-cloud environment.

### Modified Capabilities

- `user-auth-and-identity`: The PartyHub-user linking requirement gains ambiguous-match and seed-data scenarios.

## Impact

- Main specifications: `openspec/specs/user-auth-and-identity/spec.md` and a new `openspec/specs/deployment-environment/spec.md` after sync.
- Records: `docs/openspec-baseline/decisions.md` (D026-D032), `gaps.md` (G057/G059/G061/G020 dispositions), coverage, runbook and handoff.
- Implementation surfaces for later bounded changes: `CurrentUserResolver.linkOrCreateUser`, `UserRepository`, `.github/workflows/deploy.yml`, `k8s/keycloak.yaml`, `k8s/quarkus.yaml`, `MediaRepository` upload storage, and Hibernate schema management.
- No application code, configuration, manifest, workflow or data is changed.
