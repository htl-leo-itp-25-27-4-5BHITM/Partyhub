# Design

## Context

Group 11 of [complete-partyhub-specification](../2026-09-30-complete-partyhub-specification/design.md) reconciles runtime, persistence, API compatibility and quality evidence after the domain contracts of Groups 2-10. Source was inspected at `3a3f6ed` on 2026-09-30; application source, configuration, manifests and workflows are unchanged since the foundation snapshot `9487ccb`. Evidence is recorded in:

- [runtime-environments.md](../../../../docs/openspec-baseline/runtime-environments.md) — local Compose, CI and Kubernetes declarations, realm inputs, bypass and ports.
- [data-lifecycle.md](../../../../docs/openspec-baseline/data-lifecycle.md) — schema management, seeding/reset, uploads, profile pictures and notification cleanup.
- [api-contract-matrix.md](../../../../docs/openspec-baseline/api-contract-matrix.md) — all 58 endpoints, client calls, README/OpenAPI claims, statuses and validation.
- [quality-evidence.md](../../../../docs/openspec-baseline/quality-evidence.md) — accepted quality authority, JUnit/HTTPYac/CI map and open quality decisions.

## Goals / Non-Goals

**Goals:**

- Make the local environment contract deterministic enough to verify accepted AUTH requirements with real tokens.
- Keep deployed and CI declarations as evidence with gap IDs, not as accepted policy.
- Answer Q006/Q014 only where accepted semantics already decide them, and split the remainder into concrete questions.

**Non-Goals:**

- Introducing a deployment, persistence, availability, accessibility or performance capability without accepted product authority.
- Choosing wire-level status codes or error envelopes for accepted requirements that are intentionally wire-agnostic.
- Changing any code, configuration, realm file, manifest, workflow, seed script or data.

## Decisions

### D023: Environment roles and the local realm source of truth

Local Compose is the only environment with an accepted contract (`local-keycloak-environment`, D013). `keycloak/realm-dev.json` is its realm source because Compose mounts it explicitly and the accepted demo-user and redirect scenarios match it. `keycloak/realm-staging.json` serves the image-based deployment build (`Dockerfile.keycloak`, `k8s/keycloak.yaml`). Having both files in the local import directory for the same realm is recorded as G018, not as accepted behaviour. The development bypass stays a convenience under D001/AUTH-02. The requirements say when it may be enabled and that bypass-only evidence does not count; they do not require local development to enable it.

Alternative considered: a new `runtime-environments` capability covering Kubernetes and CI. Rejected because the repository only declares those environments; no accepted decision covers their durability, availability or security posture beyond D001, so any requirement would be invented.

### D024: Partial Q014 answer from accepted semantics

D016 and PARTY-03/PARTY-05 already make the plural `/api/parties` CRUD routes canonical. The backend exposes no singular `/api/party/...` route and no `/api/media/{id}`, `/api/users/{id}/device-token`, `/api/users/{id}/location` or `/api/party/{id}/attendees` route. Those client calls are compatibility gaps to fix in the clients. They do not imply routes or redirects the server must add. Accepted requirements deliberately describe rejection, denial and absence without fixing status codes. The observed statuses in the API matrix are evidence, and choosing a single error envelope and PUT replacement/partial semantics remains the narrowed Q014. Neither blocks an accepted requirement.

### D025: Q006 mapping

Accepted quality authority is limited to existing requirements: access/privacy predicates (AUTH, SOC-01/SOC-04-SOC-11, PARTY-03-PARTY-07/PARTY-14/PARTY-17, MEDIA-01-MEDIA-03), validation boundaries (PARTY-12/PARTY-13, MEDIA-03, SOC-07) and failure isolation (SOC-10, PARTY-19). There is no accepted retention period, deletion policy, backup, availability, accessibility or performance target. The JaCoCo 50% instruction-coverage check in `pom.xml` is a build declaration, not a product requirement. Q006 is closed as a mapping exercise and replaced by the concrete questions Q015-Q018.

## Risks / Trade-offs

- [Local import ambiguity remains in the source] → ENV-09 makes the target explicit; G018 carries the bounded Compose/Dockerfile remediation.
- [Deployment wipes data] → G057 and Q015 keep the finding visible; no durability requirement is accepted without a decision.
- [Tests appear green without testing JWT] → ENV-11 and G061 prevent bypass-based results from being cited as AUTH evidence.

## Migration Plan

Documentation only. Apply marks the child tasks, syncs the four added requirements into the main spec, and updates the umbrella records. Revert by removing the added requirements and restoring the Group 10 records; no runtime rollback exists.
