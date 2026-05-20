## 1. Keycloak Realm Setup

- [ ] 1.1 Update `keycloak/realm-export.json` so the `frontend` client allows `http://localhost:8080/*` redirect URIs and `http://localhost:8080` web origins.
- [ ] 1.2 Disable direct access grants for the `frontend` public browser client and keep standard authorization code flow enabled.
- [ ] 1.3 Add at least one enabled non-admin local demo user whose username or email matches a seeded PartyHub user.
- [ ] 1.4 Document the local demo user credentials and any required Postgres volume reset or realm re-import step.

## 2. Backend JWT Configuration

- [ ] 2.1 Configure Quarkus SmallRye JWT with the local PartyHub realm JWKS endpoint and issuer.
- [ ] 2.2 Configure realm role mapping from `realm_access.roles` for future role-based authorization.
- [ ] 2.3 Keep test profile JWT behavior isolated so existing unit and repository tests can run without a live Keycloak instance.

## 3. PartyHub User Identity Mapping

- [ ] 3.1 Add a nullable unique `keycloak_id` field to the `User` entity.
- [ ] 3.2 Fix or complete `UserRepository.findByKeycloakId(...)` so it works against the mapped entity field.
- [ ] 3.3 Add repository helpers for linking an existing user by username or email to a Keycloak subject.
- [ ] 3.4 Add a backend current-user resolver that reads `JsonWebToken.sub`, resolves the linked PartyHub user, links a matching unlinked user, or handles onboarding-required user creation.
- [ ] 3.5 Add backend tests for linked-user lookup, first-login linking, and unmatched authenticated users.

## 4. Protected Backend Resource Migration

- [ ] 4.1 Identify endpoints that currently use `X-User-Id`, `user`, or `userId` as acting-user identity.
- [ ] 4.2 Update party create/update/join/leave/status/invite/media/can-edit actions to use the current-user resolver.
- [ ] 4.3 Update invitation and notification actions to use the current-user resolver.
- [ ] 4.4 Update user profile, location, device-token, and upload actions that mutate caller-owned data to use the current-user resolver.
- [ ] 4.5 Preserve target user IDs only where they identify a target resource rather than the authenticated caller.
- [ ] 4.6 Add or update resource tests so protected actions reject missing/invalid JWTs and ignore legacy acting-user headers or query parameters.

## 5. Plain JavaScript OIDC Frontend

- [ ] 5.1 Replace local numeric-ID login behavior in `auth-service.js` with plain JavaScript OIDC configuration for the local `partyhub` realm and `frontend` client.
- [ ] 5.2 Implement PKCE helpers using Web Crypto for `code_verifier`, `code_challenge`, `state`, and `nonce`.
- [ ] 5.3 Implement `authService.login()` to redirect to the Keycloak authorization endpoint.
- [ ] 5.4 Add a callback page that validates `state`, exchanges the authorization code, stores browser-session token data, and redirects back to the intended PartyHub page.
- [ ] 5.5 Implement `authService.init()`, `isLoggedIn()`, `getCurrentUser()`, `updateToken()`, `logout()`, and `apiCall()` around the Keycloak token session.
- [ ] 5.6 Store token session data in memory or `sessionStorage` only, and remove Keycloak token persistence from `localStorage`.
- [ ] 5.7 Ensure `apiCall()` sends `Authorization: Bearer <access_token>` and refreshes the token before protected requests when needed.

## 6. Frontend Page Integration

- [ ] 6.1 Update route guards so protected pages start the Keycloak login flow instead of redirecting to the legacy local login page.
- [ ] 6.2 Update shared API helpers to stop appending acting-user query parameters for protected actions.
- [ ] 6.3 Update pages that depend on `window.getCurrentUserId()` to obtain the current PartyHub user from authenticated backend identity.
- [ ] 6.4 Update login/start/logout UI flows to use Keycloak login/logout while keeping the plain JavaScript page architecture.
- [ ] 6.5 Verify public guest flows still work where they are intentionally unauthenticated.

## 7. Verification

- [ ] 7.1 Run backend tests for validation, repositories, and protected resources.
- [ ] 7.2 Start local Postgres and Keycloak, verify the `partyhub` realm imports successfully, and confirm the demo user can authenticate.
- [ ] 7.3 Run Quarkus dev mode and complete browser login through the plain JavaScript OIDC flow.
- [ ] 7.4 Verify protected frontend actions send bearer tokens and no longer rely on `X-User-Id` or `user` as caller identity.
- [ ] 7.5 Verify logout clears browser-session token data and ends the Keycloak session.
- [ ] 7.6 Update HTTP examples or test docs to describe the new bearer-token requirement for protected actions.
