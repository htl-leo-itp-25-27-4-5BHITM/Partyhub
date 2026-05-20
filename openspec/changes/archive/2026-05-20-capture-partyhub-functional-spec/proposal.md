## Why

PartyHub currently has a substantial brownfield implementation, but the intended product behavior is described separately in `docs/intent.md`. Codex needs a spec-driven package that distinguishes verified current behavior from target behavior so future work can be planned and implemented without guessing.

## What Changes

- Add an OpenSpec change package that documents the current PartyHub functional surface and the target direction described in `docs/intent.md`.
- Define capability specs for authentication and identity, party discovery and management, social and notification flows, and party media gallery behavior.
- Record the most important brownfield-versus-target gaps, especially around login, home-map scope, invitation acceptance semantics, and gallery upload behavior.
- Turn the clarified business rules into normative requirements that Codex can use as a planning and implementation baseline.

## Capabilities

### New Capabilities
- `user-auth-and-identity`: Defines current browser-based identity handling and the planned transition target for authenticated user context.
- `party-discovery-and-management`: Defines visible-party discovery, party detail access, party creation, editing, deletion, privacy, invitations, and attendance semantics.
- `social-and-notifications`: Defines follow-request workflows, profile-based discovery, notification-center actions, and private invite recipient rules.
- `party-media-gallery`: Defines party gallery viewing and the planned UI upload target.

### Modified Capabilities

None.

## Impact

- Adds a new OpenSpec change package under `openspec/changes/capture-partyhub-functional-spec/`
- Codifies the behavior already summarized in [functional-spec-codex.md](/Users/carla/Documents/Partyhub/docs/functional-spec-codex.md)
- Establishes a requirements baseline for future changes across Quarkus backend resources and browser frontend flows
