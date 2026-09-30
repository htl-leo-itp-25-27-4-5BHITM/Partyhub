# Proposal

## Why

The accepted `local-keycloak-environment` specification describes the Compose Keycloak service, its database and the browser client, but it does not say which realm file is authoritative locally, how the backend and public configuration bind to that realm, which native client the realm must provide, or how the development identity bypass relates to real authentication. The repository currently ships two realm files for the same realm into the local import path, a development profile that enables the numeric-header bypass, and test suites that only authenticate through that bypass. Without an explicit contract, local setup, CI evidence and deployment declarations are easy to mistake for accepted identity or durability policy.

## What Changes

- Add a local runtime binding requirement: the backend's default issuer, the public configuration response and the local application origin agree with the Compose Keycloak realm and the `frontend` client.
- Add a single-source-of-truth requirement for the local realm import: Compose imports `partyhub` only from `keycloak/realm-dev.json`; deployment-oriented realm files are not competing local imports, and realm-file changes to an existing Keycloak database need documented recreation.
- Add the native iOS public client (`partyhub-ios`, `partyhub.auth://callback`, S256 PKCE, no direct grants) to the local realm contract already assumed by AUTH-10.
- Add a requirement that the `X-User-Id` development bypass is an explicit, non-default, non-authoritative convenience: bypass-only checks never count as bearer-authentication evidence, and local real-token verification is possible with the bypass disabled.
- Record deployed Kubernetes, CI, persistence, upload-storage, API compatibility and quality observations in the umbrella evidence package and gap register rather than as accepted product requirements. No accepted retention period, availability, accessibility or performance target is introduced.

## Capabilities

### New Capabilities

None. Deployed-environment and quality observations have no accepted product authority beyond existing requirements; they stay in the evidence and gap records with explicit questions.

### Modified Capabilities

- `local-keycloak-environment`: Add four requirements covering local runtime binding, realm-import source of truth, the native iOS client and the non-authoritative development bypass.

## Impact

- Main specification: `openspec/specs/local-keycloak-environment/spec.md` after apply and sync.
- Evidence and planning records: Group 11 files under `docs/openspec-baseline/` (runtime environments, data lifecycle, API contract matrix, quality evidence) plus coverage, decisions, gaps, inventory, runbook and handoff.
- Observed surfaces for later bounded remediation: `docker-compose.yaml`, `Dockerfile.keycloak`, `Dockerfile`, `k8s/*.yaml`, `.github/workflows/*`, `src/main/resources/application.properties`, `src/test/resources/application.properties`, `deploy-local.sh`, `sync-import.sh`, `import.sql`, `openapi.yaml`, `AGENTS.md`, `MediaRepository`, `UserResource` and client API call sites.
- No application code, configuration, realm file, manifest, workflow, database or deployment is changed by this documentation change.
