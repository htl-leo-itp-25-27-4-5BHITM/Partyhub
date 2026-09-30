# Tasks

## 1. Runtime environment and data lifecycle evidence

- [ ] 1.1 Record local Compose, CI and Kubernetes declarations for ports, profiles, issuer, realm import inputs, bypass, databases and dependencies in `runtime-environments.md`; verify every declaration cites its file and is labelled as a declaration, not a live check.
- [ ] 1.2 Record schema management, seed/reset, party-media, profile-picture and notification cleanup lifecycles per environment in `data-lifecycle.md`; verify unknown retention/migration behaviour is recorded as a gap or question, not an inferred guarantee.

## 2. API compatibility and quality evidence

- [ ] 2.1 Build the method/path/status/schema/validation matrix for all 58 endpoints plus every browser/iOS call site, README route claim and static OpenAPI path; verify each is matched to an endpoint row or given a compatibility gap.
- [ ] 2.2 Record accepted quality authority, the JUnit/HTTPYac/CI evidence map and test-configuration identity; verify test existence is separate from execution and missing quality decisions have concrete questions without invented targets.

## 3. Specification and completion records

- [ ] 3.1 Sync ENV-08-ENV-11 into `local-keycloak-environment` while preserving ENV-01-ENV-07; verify strict child and main-spec validation and updated totals.
- [ ] 3.2 Update coverage, decisions (D023-D025, Q006/Q014 dispositions, Q015-Q018), gaps, inventory, access matrix, runbook, umbrella checklist and handoff; verify references to Groups 2-10 stay consistent and Group 12 is not started.
