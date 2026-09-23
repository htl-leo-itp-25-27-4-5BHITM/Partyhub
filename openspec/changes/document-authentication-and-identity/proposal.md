# Proposal

## Why

PartyHub's durable authentication specification covers browser/JWT behavior but leaves the existing iOS login and session lifecycle implicit, while two headings and the Purpose still describe obsolete identity models. Step 2 of `complete-partyhub-specification` needs a reviewed authentication contract that preserves accepted bearer identity and distinguishes implementation gaps from policy.

## What Changes

- Add explicit iOS authorization-code/PKCE, callback binding, backend user resolution, Keychain storage, refresh/restoration and local logout requirements to the existing identity capability.
- Specify public issuer bootstrap for both clients without treating configured fallbacks as successful authentication.
- Rename the obsolete explicit-user-context/future-Keycloak headings and clarify shared protected-action scenarios for browser and iOS. Preserve browser-only token storage/provider logout rules and the existing backend link-or-create/onboarding alternatives.
- Integrate the accepted delta in a **later documentation-only execution**, then refresh coverage and the umbrella handoff. Correct the identity Purpose editorially to describe the integrated scope.
- Carry forward the source-reviewed [flow contract](../../../docs/openspec-baseline/authentication.md), [58-route access matrix](../../../docs/openspec-baseline/access-matrix.md) and [environment evidence](../../../docs/openspec-baseline/auth-environments.md). Keep numeric bypass, subject-binding, callback and access defects in the gap register.

## Capabilities

### New Capabilities

None. Native authentication belongs to the existing shared identity capability.

### Modified Capabilities

- `user-auth-and-identity`: Explicit native and public-bootstrap requirements; current identity wording and platform-neutral protected-action scenarios. Existing browser and JWT/linking behavior remains in force.

## Impact

Execution changes only OpenSpec and supporting Markdown documentation. Browser `auth-service.js`, Swift `KeycloakAuthService`/`Keychain`/`APIClient`, backend resolver/resources and realm/environment files are evidence and later remediation targets; this change does not edit or deploy them. No dependency, API route or database migration is introduced.

This is the bounded domain proposal for umbrella task 2.4, not completion of that task. Proposal creation stops before apply/sync. Profile/social policy, direct-invitation authority, QR retention, location scope and runtime configuration fixes remain in their assigned stages. Q011–Q013 record unresolved local-create/linking-edge/provider-logout questions; this proposal preserves existing linking alternatives and promises only local native logout, without silently deciding those additional policies.
