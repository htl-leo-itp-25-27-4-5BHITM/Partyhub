## Why

PartyHub has source-confirmed stored XSS and missing object-ownership checks: a signed-in user can edit another host's party or manufacture a private invitation. The user narrowed this change to practical exploit prevention, particularly injection and permissions, rather than broad form-format rules.

## What Changes

- Render untrusted names as text and restrict external links to HTTP(S), including historical stored values.
- Require party ownership for edits/invitations, enforce mutual private-invite eligibility, and verify other cross-user read/write boundaries.
- Keep bound SQL/JPQL parameters and accept ordinary apostrophes/SQL words as text; cover injection attempts with API tests.
- Disable header identity bypass outside development/tests, distinguish test numeric IDs from bearer subjects, and disable unsupported QR login routes by default.
- **BREAKING**: close arbitrary `POST /api/users` provisioning. Anonymous requests receive 401, authenticated callers receive 403; Keycloak `/me` provisions identities and authenticated users edit their own profile with PUT.
- Bound requests/uploads and check actual image contents; serialize outbound JSON and keep user data out of executable HTML and mail headers.
- Add focused JUnit/Node/real-login Playwright regressions and update the security guidance.

## Capabilities

### New Capabilities

- `user-input-safety`: Practical injection prevention, object authorization, identity boundaries, safe output and resource limits.

### Modified Capabilities

None. Existing ownership, mutual-contact and visibility requirements are enforced consistently rather than redefined.

## Impact

Backend resources/repositories, browser rendering, Keycloak templates, tests, CI and security documentation. A forward-only migration aligns advertised text limits with database storage; no data is rewritten. Existing bring-along encoded responses remain compatible. iOS source and unrelated local planning implementation are excluded. Generic format preferences and a blocking CSP rollout are outside the narrowed scope.
