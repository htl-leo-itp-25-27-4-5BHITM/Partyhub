## Context

PartyHub is a Quarkus application that serves a plain static HTML/CSS/JavaScript frontend from `src/main/resources/META-INF/resources/`. The current browser auth service stores a numeric PartyHub user ID in browser storage and frontend calls pass that value through `X-User-Id` headers or `user` query parameters. This is convenient for development but does not authenticate the caller.

The repository already includes a local Docker Compose Keycloak service, a `partyhub` realm, a public `frontend` client, and the Quarkus `quarkus-smallrye-jwt` dependency. The user wants Keycloak protection without adding the `keycloak-js` adapter package, so the frontend will implement the required OpenID Connect browser protocol directly in plain JavaScript.

## Goals / Non-Goals

**Goals:**
- Authenticate browser users through Keycloak using Authorization Code Flow with PKCE.
- Keep the frontend architecture plain JavaScript attached to `window.authService`.
- Send bearer access tokens to protected backend endpoints.
- Validate Keycloak JWTs in Quarkus with the PartyHub realm issuer and JWKS endpoint.
- Resolve the PartyHub acting user on the backend from the JWT subject, not from client-supplied user IDs.
- Keep local development testable with the existing Docker Compose Keycloak environment.

**Non-Goals:**
- Do not use the `keycloak-js` NPM package or migrate the frontend to a bundled SPA framework.
- Do not implement Resource Owner Password Credentials or collect Keycloak passwords directly in PartyHub JavaScript.
- Do not introduce a production-grade backend-for-frontend session cookie architecture in this change.
- Do not redesign PartyHub authorization rules beyond replacing the acting-user source.
- Do not migrate the iOS QR login flow unless a later change explicitly includes mobile auth modernization.

## Decisions

### Use plain JavaScript Authorization Code Flow with PKCE

The frontend will generate `state`, `nonce`, `code_verifier`, and `code_challenge` with browser Web Crypto APIs, redirect the browser to Keycloak's authorization endpoint, and exchange the returned authorization code at Keycloak's token endpoint. This matches the browser-safe flow used by modern OIDC clients without requiring `keycloak-js`.

Alternatives considered:
- `keycloak-js`: rejected because the user wants to keep the current plain JavaScript approach and avoid the adapter.
- Direct username/password token requests: rejected because public browser clients must not handle user passwords or rely on direct access grants.
- Implicit flow: rejected because tokens in URLs are less safe and not needed.

### Keep the `window.authService` facade

The existing frontend code already expects global helpers such as `authService`, `getCurrentUserId`, route guards, and shared API helpers. The implementation should evolve `auth-service.js` into a plain-JS OIDC adapter while preserving the ergonomic global API where possible: `init`, `login`, `logout`, `isLoggedIn`, `getCurrentUser`, `updateToken`, and `apiCall`.

Page scripts should call or await auth initialization before protected behavior runs. Protected pages should redirect to Keycloak login through `authService.login()` rather than the old local start page.

### Store token session data only for the browser tab session

Because the frontend is a multi-page static app, a pure in-memory token cache would be lost on every page navigation. The first implementation will store tokens and PKCE transaction state in `sessionStorage`, clear them on logout, and avoid `localStorage`.

This is a pragmatic compromise for the current architecture. It is less strong than memory-only storage but prevents long-lived token persistence and keeps navigation usable. A future backend-for-frontend cookie session can replace this if the project needs stronger browser token isolation.

### Validate bearer tokens with SmallRye JWT

Quarkus will continue using `quarkus-smallrye-jwt`. Runtime config will point `mp.jwt.verify.publickey.location` to the PartyHub realm JWKS endpoint and `mp.jwt.verify.issuer` to the realm issuer. Realm roles should be mapped from `realm_access/roles` so standard Jakarta annotations can protect admin-only behavior if needed later.

Protected resource methods should use `JsonWebToken` or a small injected current-user resolver instead of accepting user identity from headers or query parameters.

### Link Keycloak identities to PartyHub users by subject

The PartyHub `users` table will gain a nullable unique `keycloak_id` column. The backend acting-user resolver will use the JWT `sub` claim as the stable identity key.

For first login and local seed compatibility, the resolver may link an unlinked PartyHub user when token claims such as `preferred_username` or `email` match an existing PartyHub user. If no match exists, it should create a minimal PartyHub user from token claims so authenticated users can still enter the application.

### Treat explicit user context as legacy and untrusted

Protected business actions will no longer use `X-User-Id`, `user`, or `userId` as the source of acting-user identity. The frontend may still display or pass target user IDs where the API semantics require a target resource, but the acting caller comes from the JWT.

Tests and HTTP examples that currently send only explicit user context must be updated to authenticate with a JWT or use test helpers that create valid JWTs.

### Tighten local Keycloak client configuration

The local `frontend` client should be a public client with standard flow enabled, direct access grants disabled, redirect URIs for `http://localhost:8080/*`, and web origins for `http://localhost:8080`. The realm import should provide at least one non-admin demo user matching seeded PartyHub user data so the browser flow can be tested end to end.

## Risks / Trade-offs

- Token exposure through XSS -> Mitigate by using `sessionStorage` instead of `localStorage`, clearing tokens on logout, preserving existing validation/encoding practices, and avoiding token logging.
- Multi-page initialization race -> Mitigate by making `authService.init()` idempotent and requiring protected page scripts to wait for auth readiness before making API calls.
- Existing tests fail after removing `X-User-Id` trust -> Mitigate by adding test JWT helpers and migrating protected endpoint tests in the same change.
- Existing seeded users lack Keycloak subjects -> Mitigate with first-login linking by username/email and local realm demo users that match seed records.
- JWKS/issuer mismatch between host and container URLs -> Mitigate by using the externally visible issuer `http://localhost:8000/realms/partyhub` for local Quarkus dev mode and documenting any container-network override if Quarkus later runs inside Docker.
- Session refresh failure after Keycloak session expires -> Mitigate by redirecting to login when token refresh fails before a protected API call.

## Migration Plan

1. Update the local realm export with correct frontend redirects, web origins, disabled direct access grants, and at least one matching demo PartyHub user.
2. Add backend JWT config and a current-user resolver based on `JsonWebToken.sub`.
3. Add `users.keycloak_id` and linking behavior for existing users.
4. Replace frontend local user-id auth with the plain-JS PKCE login, callback handling, token refresh, and bearer-token API calls.
5. Update protected backend resources to use the current-user resolver.
6. Update tests and HTTP examples to use bearer tokens for protected actions.

Rollback is possible by reverting the change and restoring legacy `X-User-Id` handling, but data created with `keycloak_id` values can remain harmlessly nullable.

## Open Questions

- Should the first implementation auto-create PartyHub users for unmatched Keycloak accounts, or should unmatched accounts receive a clear onboarding/profile-completion error?
- Which seeded PartyHub users should be included in the local realm export for team demos?
- Should guest access to public party discovery remain completely unauthenticated, or should all frontend routes require login once Keycloak is introduced?
