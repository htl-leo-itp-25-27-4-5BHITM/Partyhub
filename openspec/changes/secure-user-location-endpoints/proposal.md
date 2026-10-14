# Proposal

## Why

The two endpoints that read stored user locations have no authentication and no visibility check. Anyone, even without logging in, can read the coordinates, name, handle and biography of any user, including the attendees of **private** parties (checked locally: `GET /api/parties/4/locations` returns 200 for an anonymous caller). Email, phone number, username and Keycloak subject are hidden by `@JsonIgnore` on `User`. The responses still serialize the entity, though, so one missing annotation on a new field would leak it. The map's own-location fetch (audit item 1.5) also calls a route that doesn't exist, and the single-user lookup searches by the location's primary key instead of `user_id`, so even a correct route returns the wrong row.

## What Changes

- **BREAKING** `GET /api/parties/{id}/locations` requires authentication and only answers callers who can view the party. Other callers get the same response as for a party that doesn't exist.
- **BREAKING** `GET /api/users/location/{id}` requires authentication and only returns the caller's own location. A request for another user's ID is rejected.
- Both endpoints return a bounded location projection: latitude, longitude and `user { id, displayName, distinctName }`. The `User` entity is no longer serialized, which also drops `biography`. The fields the clients read stay the same.
- The single-user read and `PUT /api/users/location` look up the stored location by user, not by the location's primary key. Today the PUT can overwrite another user's row or create duplicate rows for the same user.
- Web map: `index.js` calls `/api/users/location/{id}` through the authenticated API helper. Both location fetches send the access token.
- iOS: `UserLocationViewModel.fetchLocations` sends the bearer token.

## Capabilities

### New Capabilities

### Modified Capabilities
- `party-discovery-and-management`: adds a requirement that stored user locations are only readable by authenticated users who are allowed to see them, through a bounded projection.

## Impact

- Code: `UserResource` (location GET/PUT), `PartyResource.getPartyLocations`, `UserLocationRepository`, a new location DTO in `user_location/`.
- Clients: `META-INF/resources/index.js`, `PartyHubiOS/.../Map/UserLocationViewModel.swift`. An older iOS build without the token stops showing attendee locations.
- Tests: `UserResourceTest`, `PartyResourceTest`, `api/user.http`, `api/party.http`.
- No schema change.
