# Design

## Context

- The requirement: `openspec/specs/party-discovery-and-management/spec.md`, "Current device location remains private client context" (scenario "Caller requests a shared user or attendee location"). See also "Core party discovery excludes live location features".
- The first version of this change secured the endpoints for party viewers, and its delta added a requirement allowing viewer access. That contradicted the existing requirement. The user chose to make the code follow the spec instead (2026-10-14).

## Goals / Non-Goals

**Goals:** no server route stores or returns user coordinates, and no client sends or displays them.

**Non-Goals:**
- Dropping the `user_location` table, the entity, the repository or existing rows. That's a destructive migration and needs separate approval and a PR note.
- iOS client-side location use (distance filter, radius circle, local visit history). The spec allows these.

## Decisions

- **Remove the routes instead of returning 403.** A 404 for every caller doesn't reveal whether a party is private or has members. It also removes code instead of adding authorization to a feature that shouldn't exist.
- **Web keeps `showUserLocation`/`startGeolocation`.** It's the browser's own position, drawn locally and never sent anywhere.
- **iOS: remove the entry points, keep the views.** Removing `participantsSection` from `PartyDetailView` makes the attendee map and list unreachable. `fetchLocations` becomes a local no-op, so any remaining caller compiles and shows an empty state. Deleting `PartyAttendeeMapView`/`UserLocationListView` and their helpers is a larger Swift change that can't be built here; it's a follow-up.

## Risks / Trade-offs

- [The Swift changes haven't been built (no Xcode here)] → `swiftc -parse` passes for the three files. The PR asks for an Xcode build before merging.
- [Users lose the attendee map] → intended by the spec. The feature was already listed as deferred/unsupported (D022).
- [Existing coordinates stay in the database] → nothing can read them through the API any more. The follow-up handles deletion.

## Migration Plan

Merge and deploy normally. To roll back, revert the PR. No schema change.
