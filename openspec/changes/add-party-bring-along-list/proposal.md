# Proposal

## Why

Hosts currently have no way to coordinate what guests should bring to a party (drinks, snacks, cups, …). Coordination happens outside the app, so items get forgotten or brought five times. A shared bring-along list per party, where the host states what is needed and attendees pledge how much of each item they bring, solves this inside PartyHub.

## What Changes

- New persistent entities for a per-party bring-along list:
  - **Bring-along item**: created by the host, with a name, a required quantity (positive integer) and an optional free-text unit (e.g. `Stk.`, `Packung`, `Liter`).
  - **Pledge**: an attendee's commitment to bring a quantity of one item. One pledge per user per item; it can be changed or withdrawn.
- New REST endpoints under `/api/parties/{id}/bring-along`:
  - Host + attendees read the list, including per item: required quantity, pledged total, remaining quantity, a `fulfilled` flag (pledged ≥ required, the basis for the green check mark in clients) and the list of pledges (which user brings how much).
  - Host creates, edits and deletes items.
  - Host and attendees create, change and withdraw their own pledge on an item. A pledge cannot push the pledged total above the required quantity.
- Leaving a party removes the leaving user's pledges for that party, so the freed quantity is open again for other attendees.
- Lowering or withdrawing a pledge frees the difference immediately (e.g. 4 needed, a user goes from 4 to 3 → another user can pledge 1).
- Quantities are whole numbers only; decimals are rejected.
- Web UI on the party detail page (`advancedPartyInfos`): the list with a green check mark per fulfilled item, who brings how much, pledge controls for members, item management for the host, and visible feedback when a pledge is rejected because the item is already covered.
- **Live updates**: every member's open detail page updates automatically within seconds when anyone adds, edits or deletes an item, pledges, changes or withdraws a pledge, or leaves the party – no manual reload. The server pushes a change signal over a Server-Sent Events stream; clients fall back to polling if the stream is unavailable.
- New Flyway migration `V5__party_bring_along_list.sql`.

Out of scope: iOS UI (it can use the same `fulfilled` flag later), notifications about list changes, attendee-suggested items.

## Capabilities

### New Capabilities
- `party-bring-along-list`: Host-managed list of items needed for a party with required quantities, attendee pledges, fulfilment status, access rules and the web UI on the party detail page.

### Modified Capabilities
<!-- None: party lifecycle and attendance requirements stay unchanged; pledge clean-up on leave is specified in the new capability. -->

## Impact

- **Code**: new package `at.htl.bringalong` (entities, request DTOs, resource); small hook in `PartyRepository.leaveParty` to delete the user's pledges.
- **Web frontend**: new section in `src/main/resources/META-INF/resources/advancedPartyInfos/` (HTML, CSS, JS).
- **Database**: new tables `bring_along_item` and `bring_along_pledge` with `ON DELETE CASCADE` to `party`, `users` and the item. No changes to existing tables.
- **API**: new endpoints only, including the SSE stream `GET /api/parties/{id}/bring-along/events`; no breaking changes. `docs/openspec-baseline/api-contract-matrix.md` and an `api/*.http` file get the new endpoints.
- **Runtime**: in-memory per-party event broadcaster; fine for the current single Quarkus replica (`k8s/quarkus.yaml`), see design.md for scaling.
- **Security**: all endpoints `@Authenticated`; free-text fields validated with `@SafeText`/`@NoHtml`; writes are `@Transactional`.
