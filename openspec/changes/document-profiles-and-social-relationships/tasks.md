# Tasks

This child executes documentation/specification integration only. Application fixes, route migrations, profile-picture lifecycle, notification delivery and client feature work remain separate. Do not begin umbrella group 4 or archive the umbrella.

## 1. Confirm the bounded integration

- [x] 1.1 Read the saved group 3 handoff, proposal/design/delta, `profiles-and-social.md`, current full social spec and linked baseline records; verify the application-source snapshot and preserve unrelated working-tree edits.
- [x] 1.2 Verify the delta preserves SOC-02 and SOC-03 unchanged, includes full replacement blocks for SOC-01 and SOC-04, adds exactly two profile requirements, keeps AUTH-01-AUTH-12 unchanged, and leaves Step 7/8/11 concerns outside this integration.

## 2. Integrate specification and traceability

- [x] 2.1 Run strict validation and integrate the accepted delta using `openspec-sync-specs`; verify only `social-and-notifications` changes under main specs and all original scenario identities remain represented in the modified requirements.
- [x] 2.2 Update coverage with stable SOC-01-SOC-04 mappings and exact new requirement/scenario anchors; verify resulting social counts 6/35 and whole-baseline counts 42/145, keeping source/test status separate from acceptance.
- [x] 2.3 Reconcile `profiles-and-social.md`, access rows 36-54/57, inventory, decisions and gaps after integration; verify profile audiences/fields, client scope and every follow transition have an accepted rule or named later-stage API/media/notification concern, with G024 and G026-G028 retained as implementation gaps.

## 3. Verify and hand off

- [x] 3.1 Validate this child, the umbrella, the social main spec and all main specs with strict non-interactive checks; audit local links, scenario preservation, scoped whitespace and application/configuration preservation, recording the known radius Purpose failure and unrun runtime tests separately.
- [x] 3.2 Record integration and validation in runbook, coverage and handoff; mark umbrella 3.3 complete only when its domain protocol passes. Verify the handoff supplies the next permitted group 4 prompt and leaves group 4 untouched in this execution.
