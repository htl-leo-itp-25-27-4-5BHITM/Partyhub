# Tasks

## 1. Backend: public read access

- [x] 1.1 In `BringAlongItemDto`, allow `pledges` to be omitted (null, not serialised) via a `forPublic` factory that still computes `pledged`, `remaining` and `fulfilled` from the real pledges; verify with new cases in `BringAlongItemDtoTest` (totals correct, `pledges` absent in JSON)
- [x] 1.2 In `BringAlongResource`, move `@Authenticated` from the class to every write endpoint and to `events`; add `resolveReader` (404 if not visible, full list for members, anonymised list for non-members of PUBLIC parties, 403 for non-members of private parties) and use it in `list`; verify with new `BringAlongResourceTest` cases: anonymous and logged-in non-member get 200 without `pledges` on a public party, invited non-member gets 403 on a private party, anonymous gets 404 on a private party, members still get pledges
- [x] 1.3 Add `BringAlongResourceTest` cases that every write endpoint and `/events` still return 401 anonymously and 403 for a logged-in non-member of a public party, with no change notification recorded
- [x] 1.4 Update rows 59 and 60 in `docs/openspec-baseline/api-contract-matrix.md` (row 59: public read for non-members, `pledges` omitted, 401/403 only for private parties) and add anonymous read requests to `api/bring-along.http`; verify by running `api/bring-along.http` against `./mvnw quarkus:dev`

## 2. Frontend: read-only list for visitors

- [ ] 2.1 In `advancedPartyInfos/bringAlong.js`, load the list for anonymous visitors and non-members of public parties and render a read-only variant (name, unit, "pledged / required", green check mark; no names, no pledge/withdraw controls, no add form) with the hint "Log in and join the party to pledge" or "Join the party to pledge"; verify in the browser on a public seed party logged out and as a non-member
- [ ] 2.2 Keep the existing "Join the party to see the bring-along list" hint for private parties and do not open the SSE stream for non-members; reload the list on `visibilitychange`; verify in the browser network tab (no `/events` request as non-member, list refetched on tab focus) and that members still get live updates

## 3. Integration

- [x] 3.1 Run `./mvnw clean test` and `./run-http-tests.sh`; both pass
- [ ] 3.2 Verify with a real Keycloak login (demo user, password = username): member sees names and controls, non-member of a public party sees the read-only list, logged-out visitor sees the read-only list, private party stays hidden
