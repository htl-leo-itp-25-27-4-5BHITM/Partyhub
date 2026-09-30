# Complete the PartyHub specification baseline

## Why

PartyHub needs a complete, evidence-backed OpenSpec baseline before sustained agentic programming can proceed across separate tasks. Six existing specifications already capture part of the product, but outdated documentation, differences between browser and iOS behavior, and uncovered capabilities make it difficult to distinguish approved requirements from implementation gaps.

## What Changes

- Establish a documentation-only umbrella change with a twelve-step runbook, concrete outputs, dependencies, completion gates, and restart instructions in `design.md` and `tasks.md`.
- Build a repository-based handoff package under `docs/openspec-baseline/` during execution: runbook, capability inventory and glossary, coverage/evidence matrix, decisions, implementation gaps, and task handoff.
- Complete specification coverage in bounded domain changes for authentication, profiles and social relationships, party lifecycle, invitations and attendance, maps, media, notifications, QR login, retained client extensions, and runtime/API contracts.
- Reuse the existing capability names and approved business rules. Record source/spec/client/documentation conflicts explicitly; do not convert defects into requirements.
- Label browser, iOS, backend, and environment scope, and trace requirements and scenarios to source and test evidence.
- Finish with reconciled documentation, strict specification validation, complete journey coverage, and a prioritized backlog of separate implementation changes.

## Capabilities

### New Capabilities

None in this umbrella change. The runbook coordinates documentation work and does not introduce product behavior. Any newly identified product capability will be proposed in its bounded domain change after its scope and requirements are established.

### Modified Capabilities

None in this umbrella change. Later domain changes will supply the appropriate deltas for `user-auth-and-identity`, `social-and-notifications`, `party-discovery-and-management`, `map-radius-control`, `party-media-gallery`, and `local-keycloak-environment`.

This change declares `skip_specs: true`: its deliverables are the runbook and completion process, not invented product requirements. Completion of the umbrella work still requires the accepted domain specification updates to be integrated into the durable baseline.

## Impact

- Planning artifacts: `openspec/changes/complete-partyhub-specification/`.
- During later execution: supporting files under `docs/openspec-baseline/`, bounded OpenSpec domain changes and their accepted main-spec updates, and reconciliation of README and outdated narrative documentation.
- Evidence sources: Quarkus backend, static browser frontend, Swift iOS client, HTTPYac/JUnit tests, Keycloak configuration, Compose, and Kubernetes manifests.
- Application source, runtime configuration, database contents, deployed services, and dependencies are outside this documentation change's implementation scope.

## Non-goals

- Implementing features or repairing the observed authentication, authorization, QR, upload, or client-compatibility gaps.
- Replacing the existing specification set wholesale or silently overriding approved product decisions.
- Claiming source inspection or OpenSpec validation proves application correctness.
- Completing all twelve work packages in the proposal-writing task; they are intended for separate, resumable tasks.
