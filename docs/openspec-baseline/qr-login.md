# QR login scope and evidence review

Group 9 reviewed the QR surfaces on 2026-09-29 from repository commit `6217f5009530777a920d03db88900f1259f5b9d5`. Application source remains the foundation snapshot from `9487ccb90bb438e24b3cfab547a5dc900b11aecb`. No application source, configuration, database or deployed service was changed or exercised.

Read this with the accepted [identity specification](../../openspec/specs/user-auth-and-identity/spec.md), [authentication evidence](authentication.md), [access matrix](access-matrix.md), [coverage](coverage.md), [decisions](decisions.md), [gaps](gaps.md) and the Group 9 checklist in the [umbrella tasks](../../openspec/changes/complete-partyhub-specification/tasks.md).

## Evidence index

| ID | Inspected evidence |
|---|---|
| Q1 | [QrResource.java](../../src/main/java/at/htl/qr/QrResource.java): six generation, status, image, exchange and mobile-identity endpoints. |
| Q2 | [QrService.java](../../src/main/java/at/htl/qr/QrService.java), [QrLoginRepository.java](../../src/main/java/at/htl/qr/QrLoginRepository.java) and [QrLogin.java](../../src/main/java/at/htl/qr/QrLogin.java): stored handoff token, expiry/use state and custom mobile-token creation. |
| Q3 | Browser [qr-login.html](../../src/main/resources/META-INF/resources/register_login/qr-login.html) and [profile.js](../../src/main/resources/META-INF/resources/profile/profile.js): generator/poller page and inactive profile helper. |
| Q4 | iOS [ProfileView.swift](../../PartyHubiOS/PartyHubiOS/ProfileView.swift) and [PartyHubiOSApp.swift](../../PartyHubiOS/PartyHubiOS/PartyHubiOSApp.swift): unreachable scanner state, discarded scan result and numeric-user deep-link notification. |
| Q5 | [welcome.html](../../src/main/resources/templates/emails/welcome.html) and [welcome.txt](../../src/main/resources/templates/emails/welcome.txt): numeric-user login deep links sent by the welcome path. |
| Q6 | [QrServiceTest.java](../../src/test/java/at/htl/qr/QrServiceTest.java), [QrLoginRepositoryTest.java](../../src/test/java/at/htl/repository/QrLoginRepositoryTest.java) and [QrResourceTest.java](../../src/test/java/at/htl/resource/QrResourceTest.java): static unit/repository/resource evidence. |
| Q7 | [api/qr.http](../../api/qr.http): nine basic request examples, several using the numeric bypass header. |
| Q8 | [openapi.yaml](../../openapi.yaml), [import.sql](../../src/main/resources/import.sql) and the historical [functional narrative](../functional-spec-codex.md): exposed API/schema/sample-data and older QR-login description. |

## Observed endpoint and state-flow comparison

| Surface | Access and input | Observed output/state | Identity and lifecycle result |
|---|---|---|---|
| `GET /api/qr/generate` | Authenticated; actor comes from `CurrentUserResolver`; the documented/query `userId` is ignored. | Returns caller ID/name, `partyhub://login?userId=<id>` and `/api/qr/image/user/<id>`. | Does **not** call `generateForUser`, create a `QrLogin`, return a handoff token or establish expiry. It produces a numeric identifier, not a credential. |
| `GET /api/qr/image/user/{userId}` | Public path with an arbitrary existing numeric user ID. | PNG encodes `partyhub://login?userId=<id>`. | Discloses a stable user identifier and carries no proof of authentication, expiry or intended scanner. |
| `GET /api/qr/status/{token}` | Public bearer-like path token. | Returns stored `used` and `expiresAt` values as strings. | Uses raw lookup, so expired and used records remain observable; it does not bind the poller to the generating caller. |
| `GET /api/qr/image/{token}` | Public bearer-like path token. | Looks up any stored row, then encodes its numeric user-ID deep link. | Does not require the token to be unused/unexpired and does not encode the exchange token itself. Scanning cannot supply `/exchange` with that token. |
| `POST /api/qr/exchange` | Public JSON `{token}`. | Accepts one currently unused/unexpired stored token, creates a custom 30-minute HS256 JWT and marks the row used. | The production generator never creates or returns this token. Validity check and use update are separate operations, with no reviewed concurrency lock or replay transaction around both. |
| `POST /api/qr/mobile/me` | Public JSON `{mobile_token}`. | Verifies a hardcoded HS256 value and `exp`, then attempts to return the numeric `sub`. | This is separate from Keycloak/JWT bearer authentication, has no issuer/audience/provider trust, does not check the stored JTI or mobile-token expiry/revocation state, and encodes `sub` as a JSON string while casting it to `Integer`. It cannot establish the accepted PartyHub session contract. |

`QrService.generateForUser` creates a random 32-byte URL-safe token, a five-minute expiry and `used=false`, but no production caller invokes it. `issueMobileToken` stores only the random JTI and a 30-minute expiry while returning the signed JWT. `findByMobileToken` is covered by repository tests but unused by the production verifier. The entity stores a scalar user ID with no JPA user relationship; no cleanup, revocation or account-deletion behavior was found. Seed data contains historical QR rows, including used/expired examples, but is not runtime evidence.

## Client and consumer comparison

| Consumer | Observed behavior | Completion evidence |
|---|---|---|
| Browser QR page | Calls authenticated `/generate`, expects a `token` field that is absent, displays the numeric-ID image and polls `/status/undefined`. The page is present as a direct static route; no inspected navigation link establishes it as a supported journey. | Generation and stored-token polling are incompatible (G046/G049). |
| Browser profile helper | Looks for `showQrBtn`, `qrPreview` and image elements that are absent from the inspected profile HTML. The logged-out action renders a disabled “Sign in with QR” button. A query `userId` is sent to `/generate`, but backend identity remains caller-derived. | No usable generation/login journey was found (G049). |
| iOS scanner | `showCamera` is initialized false with no inspected assignment that opens it. If scanning occurs, the code discards the value and prints that the legacy QR should be replaced by Keycloak sign-in. | No exchange, mobile identity or credential storage occurs (G049). |
| iOS deep link | `partyhub://login?userId=` posts `.legacyQRLogin`; no observer was found. Native session establishment remains Keycloak/PKCE under AUTH-11/AUTH-12. | Numeric deep link cannot log in and cannot override the accepted actor (D001/D014/D021). |
| Welcome email | Links to the same numeric-user deep link. | The link may open the app but is not authentication proof; presentation/removal belongs to later implementation/document reconciliation (G049). |

No browser or iOS source calls `/api/qr/exchange` or `/api/qr/mobile/me`. No client stores the custom mobile token or presents it as a normal backend bearer token.

## Test evidence and limits

- `QrServiceTest` covers random stored-token creation, persistence failure, valid/missing/used/expired lookup and custom-token issuance. The production `/generate` path bypasses the tested generator.
- `QrLoginRepositoryTest` covers token/JTI lookup and persistence. It does not establish foreign-key ownership, cleanup, expiry enforcement or transaction-safe single use.
- `QrResourceTest` covers anonymous rejection of `/generate`, one synthetic authenticated generation response and missing/invalid inputs. It has no successful stored-token generation/status/image/exchange/mobile-identity path, no concurrent/repeated exchange, and no proof that a returned identity can authenticate a protected API.
- `api/qr.http` checks basic generation/image/status/error statuses; it does not exercise successful exchange or mobile identity and uses the test bypass for generation.
- No JUnit, HTTPYac, browser, iOS, Keycloak, database or deployment test was run for Group 9.

## Accepted scope decision

D021 explicitly defers QR login from the accepted PartyHub baseline. The supported browser and iOS sign-in/session contract remains Keycloak authorization code with PKCE and validated bearer identity under D001/D002/D014 and AUTH-01-AUTH-12. A numeric user ID, QR payload, stored handoff token, custom mobile token, deep link, path/query value or client cache does not authenticate a PartyHub user or authorize a protected API.

No OpenSpec product delta is needed for this exclusion: the accepted identity requirements already define the supported mechanism, and Group 9 adds no retained QR behavior. The six backend endpoints, browser page/helper, iOS scanner/deep link, welcome link, entity and tests remain inventoried as unsupported legacy/prototype surfaces. G046-G050 bound their implementation, exposure, credential, client and lifecycle concerns. Retaining QR login later requires a separate proposal with an explicit relying-party journey, actors, proof-of-possession, expiry/reuse/revocation rules, transaction-safe exchange and integration with the accepted identity provider/session boundary. This review does not choose that future design or authorize application changes.
