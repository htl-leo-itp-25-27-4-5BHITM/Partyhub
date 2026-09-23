# Authentication and identity delta

## RENAMED Requirements

- FROM: `### Requirement: Backend business actions use explicit user context in the brownfield system`
- TO: `### Requirement: Backend business actions use validated Keycloak user context`
- FROM: `### Requirement: Keycloak is the planned future authentication direction`
- TO: `### Requirement: Keycloak provides browser login and protected backend authentication`

## MODIFIED Requirements

### Requirement: Protected APIs use authenticated acting-user identity
Protected PartyHub APIs SHALL derive the caller's acting-user identity from the validated Keycloak token for browser, iOS and other API callers. Authentication SHALL NOT replace the ownership, recipient or visibility checks required by the affected capability.

#### Scenario: Create party uses authenticated user
- **WHEN** an authenticated browser or iOS user creates a party
- **THEN** the backend SHALL assign the party host from the authenticated PartyHub user resolved from the token

#### Scenario: Join party uses authenticated user
- **WHEN** an authenticated browser or iOS user joins or leaves a party
- **THEN** the backend SHALL update attendance for the authenticated PartyHub user resolved from the token

#### Scenario: Notification access uses authenticated user
- **WHEN** an authenticated browser or iOS user requests notifications
- **THEN** the backend SHALL return notifications for the authenticated PartyHub user resolved from the token

#### Scenario: Authenticated identity does not grant object authority
- **WHEN** a caller presents a valid token but lacks the ownership, recipient or visibility permission required for the requested operation by its capability
- **THEN** the backend SHALL reject the operation without treating authentication alone as that permission

## ADDED Requirements

### Requirement: Clients obtain authentication configuration before sign-in
PartyHub SHALL provide its Keycloak issuer through a public authentication-bootstrap endpoint for browser and iOS clients without requiring an authenticated PartyHub session. The endpoint SHALL expose public authentication configuration rather than tokens, credentials or private user data. Clients SHALL use their platform's configured public client identity and callback URI with the issuer.

#### Scenario: Signed-out client obtains the issuer
- **WHEN** a signed-out browser or iOS client requests `/api/config/public`
- **THEN** the backend SHALL return the configured Keycloak issuer without requiring caller identity
- **AND** obtaining that configuration SHALL NOT authenticate the client or create an acting-user context

#### Scenario: Authentication configuration cannot be loaded
- **WHEN** a client cannot obtain usable public authentication configuration
- **THEN** it SHALL either use its configured fallback issuer or present a recoverable sign-in configuration error
- **AND** it SHALL NOT treat configuration failure or fallback selection as successful authentication

### Requirement: iOS login uses Keycloak authorization code with PKCE
The iOS client SHALL authenticate through Keycloak's web authorization flow using its native public client, Authorization Code Flow with S256 PKCE, a fresh state and nonce, and the registered native callback URI. PartyHub SHALL NOT collect the user's Keycloak password or use the password grant. A new native PartyHub session SHALL require a callback bound to the initiating transaction and a successful bearer-authenticated PartyHub user lookup under the existing subject-linking requirement.

#### Scenario: Native login starts
- **WHEN** a signed-out iOS user starts sign-in
- **THEN** the client SHALL open Keycloak web authorization using client `partyhub-ios`, callback `partyhub.auth://callback`, fresh state and nonce, and a challenge derived from the transaction's code verifier

#### Scenario: Native callback completes its transaction
- **WHEN** Keycloak returns an authorization code with state matching the active native login transaction
- **THEN** the client SHALL exchange the code using that transaction's code verifier and native callback URI
- **AND** it SHALL validate the returned ID token's binding to the transaction nonce before establishing the new session

#### Scenario: Native callback state or code is invalid
- **WHEN** the callback has missing or mismatched state, no active transaction, or no authorization code
- **THEN** the client SHALL reject that callback without exchanging the authorization code or establishing a new session

#### Scenario: Native callback nonce is invalid
- **WHEN** the returned ID token has no nonce or a nonce different from the initiating transaction
- **THEN** the client SHALL reject the login response without persisting it as a new authenticated session

#### Scenario: Native login is cancelled or fails
- **WHEN** the user cancels web authentication, the provider returns an error, or code exchange fails
- **THEN** the client SHALL remain without a newly authenticated session and allow the user to start sign-in again

#### Scenario: Native login resolves the PartyHub user
- **WHEN** native token exchange succeeds with a response bound to the login transaction
- **THEN** the client SHALL resolve the PartyHub user through bearer-authenticated `/api/users/me` before establishing its new session
- **AND** it SHALL use the backend-resolved PartyHub ID rather than a numeric deep-link value or locally decoded subject as the local user ID

#### Scenario: Native user resolution cannot complete
- **WHEN** the authenticated PartyHub user lookup fails or returns an explicit onboarding-required outcome instead of a resolved user
- **THEN** the client SHALL NOT establish a completed PartyHub session from the token or a cached numeric ID alone
- **AND** it SHALL expose a recoverable sign-in or onboarding outcome appropriate to the response

### Requirement: iOS manages a token-backed local session
The iOS client SHALL retain native authentication credentials in Keychain, restore only a usable token-backed PartyHub session, refresh access tokens before protected calls when needed, and clear local credentials and acting-user context when the session becomes invalid or the user logs out. The browser sessionStorage restriction SHALL remain browser-specific. This requirement defines local native logout and does not promise provider-session termination or token revocation.

#### Scenario: Native credentials persist across launches
- **WHEN** iOS retains authentication credentials after successful PartyHub user resolution
- **THEN** it SHALL store the tokens in Keychain and retain the associated backend-resolved PartyHub identity
- **AND** a cached numeric ID without usable token credentials SHALL NOT establish authentication

#### Scenario: Native session is restored
- **WHEN** the app starts with stored credentials and associated PartyHub identity
- **THEN** it SHALL establish the authenticated application state only when it has a usable access token or has successfully refreshed the credentials

#### Scenario: Native access token needs refresh
- **WHEN** a protected API call needs a new access token and a refresh token is available
- **THEN** iOS SHALL attempt the refresh before sending the protected request and retain replacement credentials in Keychain after success

#### Scenario: Native session cannot be refreshed
- **WHEN** the access token is no longer usable and a refresh token is absent or the session refresh is rejected as invalid
- **THEN** iOS SHALL clear its local authentication credentials and acting-user context and require sign-in again
- **AND** it SHALL NOT send the protected action with numeric identity as an authentication fallback

#### Scenario: Native protected API request is sent
- **WHEN** an authenticated iOS user invokes a protected PartyHub API
- **THEN** the client SHALL attach a usable bearer access token and the backend SHALL apply the shared authenticated acting-user contract

#### Scenario: Native user logs out locally
- **WHEN** the user completes local iOS logout
- **THEN** the client SHALL remove persisted authentication credentials and its in-memory acting-user context and return to signed-out application state
- **AND** restoring a cached numeric ID SHALL NOT restore protected access
