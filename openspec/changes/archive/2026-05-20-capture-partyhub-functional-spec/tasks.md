## 1. OpenSpec Baseline

- [x] 1.1 Review `docs/functional-spec-codex.md` and `docs/intent.md` together to confirm the capability split still matches team expectations.
- [x] 1.2 Validate the change package with `openspec validate --type change capture-partyhub-functional-spec`.

## 2. Capability Alignment

- [x] 2.1 Use `user-auth-and-identity` as the baseline for any authentication or Keycloak-related change proposals.
- [x] 2.2 Use `party-discovery-and-management` as the baseline for party map, details, invitations, attendance, and host-management changes.
- [x] 2.3 Use `social-and-notifications` as the baseline for follow, mutual-contact, profile, and notification-center changes.
- [x] 2.4 Use `party-media-gallery` as the baseline for gallery viewing and any future upload work.

## 3. Future Refinement

- [x] 3.1 Resolve the open questions recorded in `design.md` before implementing behavior that depends on them.
- [x] 3.2 Archive this change into long-lived `openspec/specs/` once the team accepts the package as the authoritative functional baseline.
