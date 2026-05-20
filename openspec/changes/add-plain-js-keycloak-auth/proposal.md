## Why

PartyHub currently treats a browser-stored numeric user ID as the active user identity, which lets frontend code and backend endpoints impersonate users by sending `X-User-Id` or `user` query parameters. The project already has a local Keycloak realm and Quarkus JWT dependencies, so this change moves PartyHub to Keycloak-backed authentication while keeping the existing plain JavaScript frontend style and avoiding the `keycloak-js` adapter package.

## What Changes

- Add a plain JavaScript OpenID Connect browser flow that behaves like the Keycloak JavaScript adapter for PartyHub's needs, using Authorization Code Flow with PKCE.
- Add a Keycloak callback page served by PartyHub to complete the code exchange and initialize the browser session.
- Update frontend auth helpers so protected API calls send `Authorization: Bearer <access_token>` instead of using a client-controlled acting-user ID.
- Configure Quarkus SmallRye JWT to validate Keycloak-issued access tokens with the PartyHub realm issuer and JWKS endpoint.
- Add backend acting-user resolution from the authenticated JWT subject to the PartyHub `users` table.
- **BREAKING**: Protected business actions SHALL no longer trust `X-User-Id` or `user` query parameters as the source of acting-user identity.
- Update the local Keycloak frontend client redirect URI and web origins to match the PartyHub frontend origin on `http://localhost:8080`.
- Provision local-development Keycloak user accounts that can be linked to seeded PartyHub users for end-to-end testing.

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `user-auth-and-identity`: Replace the planned-only Keycloak direction with implemented plain-JavaScript Keycloak authentication, bearer-token API calls, and backend JWT-derived acting-user identity.
- `local-keycloak-environment`: Tighten the frontend client configuration so local redirects and web origins match the PartyHub application origin required by the plain JavaScript OIDC flow.

## Impact

- Frontend static resources under `src/main/resources/META-INF/resources/`, especially `auth-service.js`, `route-guard.js`, login/start pages, and shared API helpers.
- Backend user and protected business resources under `src/main/java/at/htl/`, especially user identity lookup and endpoints currently accepting `X-User-Id` or `user`.
- `src/main/resources/application.properties` JWT verification settings.
- `keycloak/realm-export.json` frontend client redirect URI and web origin settings.
- Local Keycloak realm seed data for browser-login test users.
- Tests that currently exercise protected actions with explicit user IDs in headers or query parameters.
