# Tasks

## 1. Confirm the leak

- [x] 1.1 Start dev mode and record anonymous responses of `GET /api/parties/{id}/locations` (private party 4) and `GET /api/users/location/{id}`. **Done:** both return 200 with coordinates, name and biography. Email, phone number and Keycloak ID are hidden by `@JsonIgnore`.

## 2. Backend

- [x] 2.1 Remove `GET /api/parties/{id}/locations`, `GET /api/users/location/{id}`, `PUT /api/users/location` and `UserLocationUpdateDto`. Verify that `./mvnw compile` succeeds.
- [x] 2.2 Replace the location tests with tests showing that the routes are gone for anonymous and authenticated callers (404; PUT 404/405). Verify with `./mvnw test -Dtest=PartyResourceTest,UserResourceTest`.
- [x] 2.3 Update `api/00-setup.http` (it used to seed a location), `api/user.http` and `api/party.http` to expect 404. Verify that `cd api && npm test` passes on a fresh dev start.

## 3. Clients

- [x] 3.1 Web: remove the party selector card, the attendee layer, `loadUserLocationsForParty`, `loadPartiesForDropdown`, `loadCurrentUserLocationFromApi`, `USE_FAKE_LOCATION` and the unused selector CSS. Keep the local geolocation marker. Verify that `node --check index.js` passes and that grep finds no references to `/locations` or `users/location` in the web app. Visual check skipped (Claude in Chrome not connected).
- [x] 3.2 iOS: remove the coordinate upload, make `fetchLocations` a local no-op, and remove `participantsSection` from `PartyDetailView`. Verify with `swiftc -parse` on the three files. Not built (no Xcode); the PR says so.

## 4. Integration and docs

- [x] 4.1 Run `./mvnw clean test` (254 tests, 0 failures) and the HTTP tests (193/193). Real PKCE login as `viki_vej`: all three location routes → 404, `GET /api/parties/4` → 200.
- [x] 4.2 Update `docs/cleanup-audit.md` 1.5 and the location rows in `docs/openspec-baseline/api-contract-matrix.md`.
