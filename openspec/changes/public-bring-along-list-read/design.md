# Design

## Context

`BringAlongResource` is annotated `@Authenticated` at class level, and every endpoint (including `GET /api/parties/{id}/bring-along`) calls `requireMember`, which resolves the current user, checks visibility via `PartyRepository.getPartyByIdIfVisible` and throws 403 for non-members. `getPartyByIdIfVisible` already returns public parties for a `null` user, and `CurrentUserResolver.currentUserIdIfAuthenticated()` exists for optional login. The party detail endpoint is already readable anonymously. `BringAlongItemDto` always includes `pledges` with user ids and display names.

On the detail page, `bringAlong.js` shows a hint instead of the list for anonymous users and for 403 responses, and opens the SSE stream for members.

## Goals / Non-Goals

**Goals:**
- Anonymous and non-member reads of public-party lists with no user data in the response.
- Keep every write and the SSE stream member-only with unchanged status codes.

**Non-Goals:**
- Live updates for non-members (they refresh on load and on tab focus).
- Any change for private parties, item rules, pledge rules or notifications.

## Decisions

1. **Move `@Authenticated` from the class to each write method and to `events`.** `list` becomes unauthenticated at the framework level and does its own check. Alternative: a separate public endpoint (`/bring-along/public`) – rejected because it duplicates the query and gives clients two URLs for the same list.

2. **New `resolveReader(partyId)` in the resource** returning `(party, userId|null, member: boolean)`:
   - party not visible to `userId` (or `null`) → 404
   - member (host or attendee) → full list
   - non-member, party `PUBLIC` → anonymised list
   - non-member, party not public → 403 (existing behaviour for invited non-members)
   `requireMember` stays for writes and `events`, unchanged.

3. **Anonymised DTO = same record with `pledges = null`**, serialised without the field (`@JsonInclude(NON_NULL)` on `pledges`). Totals (`pledged`, `remaining`, `fulfilled`) are still computed from the real pledges. Alternative: empty `pledges` list – rejected because clients could not tell "no pledges" from "hidden pledges". Alternative: separate record – rejected as unnecessary duplication; the shape stays one schema with an optional field.

4. **Frontend:** `bringAlong.js` fetches the list for everyone on public parties. If the response items have no `pledges` field (or the viewer is not a member), it renders a read-only variant: no pledge/withdraw controls, no add form, no names, plus the hint "Log in and join the party to pledge" / "Join the party to pledge". It does not open the SSE stream for non-members; it reloads on `visibilitychange`. Private parties keep the existing hint on 403/401.

## Risks / Trade-offs

- [Totals reveal activity: a visitor can see that someone pledged, though not who] → Accepted by product decision (quantities only, no names).
- [Forgetting `@Authenticated` on a write method when moving it off the class] → Tests cover 401 for every write endpoint and the SSE stream as an anonymous caller.
- [Anonymous list endpoint enables scraping of public lists] → Same exposure as public party details; no user data included.

## Migration Plan

No data migration. Deploy normally; rollback by reverting the commit. Existing clients that treat 401/403 as "hidden" keep working because members still receive the same response.
