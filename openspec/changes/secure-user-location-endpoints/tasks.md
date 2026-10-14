# Tasks

## 1. Confirm the leak

- [x] 1.1 Start dev mode (check `lsof -iTCP:8080 -sTCP:LISTEN` first) and record the anonymous responses of `GET /api/parties/1/locations` and `GET /api/users/location/{id}` for a seeded user. Verify that the body contains `email`/`phoneNumber`/`keycloakId`, or note that it doesn't. Paste the evidence in the PR description.

## 2. Backend

- [x] 2.1 Add `UserLocationDto` with nested `LocatedUser` (records) in `at.htl.user_location`, plus a mapper from `UserLocation`. Verify it compiles with `./mvnw compile`.
- [x] 2.2 `GET /api/parties/{id}/locations`: add `@Authenticated`, check access with `partyRepository.getPartyByIdIfVisible`, return 404 when not visible, and map to `UserLocationDto`. Add `PartyResourceTest` cases: anonymous → 401, non-viewer of a private party → 404, viewer → 200 with no `email` field. Verify with `./mvnw test -Dtest=PartyResourceTest`.
- [x] 2.3 `GET /api/users/location/{id}`: add `@Authenticated`, return 403 when `id` ≠ caller, look up with `findByUserId`, and return the DTO. Add `UserResourceTest` cases: anonymous → 401, other user → 403, self → 200 with no `email`, self without a location → 404. Verify with `./mvnw test -Dtest=UserResourceTest`.
- [x] 2.4 `PUT /api/users/location`: look up with `findByUserId` instead of `em.find`, and return the DTO. Add a test where B has a location and A PUTs twice; afterwards A has exactly one row with the latest value and B's row is unchanged. (A forced id collision was dropped because identity values make it fragile.) Verify with `./mvnw test -Dtest=UserResourceTest`.
- [x] 2.5 Update `api/user.http` and `api/party.http` so the location requests send the auth header and assert the new statuses. Verify with `cd api && npm test` (or `./run-http-tests.sh`).

## 3. Clients

- [x] 3.1 `index.js`: change the own-location fetch to `/api/users/location/${currentUserId}`, and change both location fetches to `window.authService.apiCall`. Verify in the browser with `USE_FAKE_LOCATION` temporarily set to `false`, logged in as a demo user with a seeded location: the green marker comes from the API and the network tab shows 200. Revert the flag afterwards. If Claude in Chrome isn't connected, say the visual check was skipped. **Done:** both fetches use `publicRequest` (sends the token when logged in, no forced login on the public map; 401/404 mean no markers). `node --check` passes. Visual check skipped because Claude in Chrome wasn't connected.
- [x] 3.2 `UserLocationViewModel.fetchLocations`: add the bearer token, following the pattern of `uploadUserLocation`. Verify with an `xcodebuild` build of the PartyHubiOS scheme. If Xcode is unavailable, record "Swift change not built" in the PR. **Done:** Xcode isn't installed, only the command-line tools. `swiftc -parse` passes (syntax only), so the Swift change is not built and the PR says so. 401/404 now clear the list instead of failing to decode.

## 4. Integration

- [x] 4.1 Run `./mvnw clean test` and record the count and failures. Then do a real Keycloak PKCE login as a demo user, call both location endpoints with the access token and record the responses.
- [ ] 4.2 Optional, only after asking the user: a read-only production `SELECT user_id, count(*) FROM user_location GROUP BY user_id HAVING count(*) > 1` to size the duplicate-row follow-up. Add the result to `docs/cleanup-audit.md` 1.5.
- [x] 4.3 Update `docs/cleanup-audit.md` item 1.5 (status and PR link) and `docs/openspec-baseline/api-contract-matrix.md` rows for the two GETs. Verify that the links resolve.
