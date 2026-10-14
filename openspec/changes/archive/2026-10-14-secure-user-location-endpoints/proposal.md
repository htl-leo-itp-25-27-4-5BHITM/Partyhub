# Proposal

## Why

The accepted requirement "Current device location remains private client context" in `party-discovery-and-management` says PartyHub SHALL NOT upload, persist or expose a user's current coordinates or an attendee-location roster, and that this surface SHALL NOT disclose a private party's existence or membership.

The code on `main` does all three:
- `PUT /api/users/location` stores coordinates.
- `GET /api/parties/{id}/locations` returns an attendee-location roster.
- `GET /api/users/location/{id}` returns any user's coordinates.

Neither read needs a login or checks visibility. Checked locally: an anonymous `GET /api/parties/4/locations` (party 4 is private) returns 200 with the attendees' coordinates, names and biographies. Email, phone number and Keycloak ID are hidden by `@JsonIgnore` on `User`. Audit item 1.5 (the web map's own-location fetch used a wrong route) is part of the same feature.

## What Changes

- **BREAKING** Remove `GET /api/parties/{id}/locations`, `GET /api/users/location/{id}` and `PUT /api/users/location`. All three return 404 for every caller, so nothing about private parties is disclosed.
- Remove `UserLocationUpdateDto`.
- Web home map: remove the "select a party to see attendees" control, the attendee markers and the own-location API fetch. The browser's own geolocation marker stays; it never leaves the client.
- iOS: remove the coordinate upload and the attendee-location fetch, and remove the "Participants" links (attendee map and list) from the party detail screen.

## Capabilities

### New Capabilities

### Modified Capabilities

None. This change makes the code follow the existing requirement "Current device location remains private client context". `.openspec.yaml` sets `skip_specs: true`.

## Impact

- Code: `PartyResource`, `UserResource`, `user_location/UserLocationUpdateDto` (deleted).
- Clients: `index.html`, `index.js`, `index.css`, and iOS `UserLocationViewModel`, `PartyAttendeeMapView`, `PartyDetailView`. Older iOS builds get 404s and show empty attendee views.
- Tests: `PartyResourceTest`, `UserResourceTest`, `api/00-setup.http`, `api/user.http`, `api/party.http`.
- Data: the `user_location` table, the `UserLocation` entity/repository and existing rows (dev seed and any production rows) stay for now. Removing them deletes data, so it's a separate follow-up that needs explicit approval.
