# Tasks

## 1. Schema and entities

- [x] 1.1 Add `src/main/resources/db/migration/V5__party_bring_along_list.sql` creating `bring_along_item` and `bring_along_pledge` (FKs with `ON DELETE CASCADE`, `CHECK` constraints, `UNIQUE (item_id, user_id)`, indexes) as in design.md; verify `./mvnw quarkus:dev` starts and Flyway reports V5 applied
- [x] 1.2 Add entities `at.htl.bringalong.BringAlongItem` and `BringAlongPledge` (`@OnDelete(CASCADE)` on all FKs, unique constraint mirrored in `@Table`), no new field on `Party`; verify `./mvnw clean test` still passes

## 2. DTOs and validation

- [x] 2.1 Add `StrictIntDeserializer` that rejects non-integral numbers (e.g. `1.5`) and non-numeric strings; verify with a unit test that `1.5`, `2.7` and `"2"` fail and `2` passes
- [x] 2.2 Add request records `BringAlongItemRequest` (name `@NotBlank @Size(max=100) @SafeText @NoHtml`, unit `@Size(max=30) @SafeText @NoHtml`, quantity `@NotNull @Min(1) @Max(10000)`) and `BringAlongPledgeRequest` (quantity `@NotNull @Min(1) @Max(10000)`), quantities using the strict deserializer, every constraint with a `message`; verify with a validator unit test in `src/test/java/at/htl/validation` covering blank name, HTML in name/unit, quantity 0 and 10001
- [x] 2.3 Add response records `BringAlongItemDto` (id, name, unit, quantity, pledged, remaining, fulfilled, pledges) and `PledgeDto` (userId, displayName, quantity) with a static mapper that computes totals and applies `Encode.forHtml` to name, unit and displayName; verify with a unit test for 0/partial/exact/over-pledged items (remaining clamped to 0, `fulfilled` true when pledged ≥ quantity)

## 3. REST resource

- [x] 3.1 Add `BringAlongResource` at `/api/parties/{partyId}/bring-along` (`@Authenticated`) with the access helper (404 not visible / 403 not host or attendee / 404 item of other party) and `GET` list in creation order; verify with `BringAlongResourceTest` in `src/test/java/at/htl/resource`: host and attendee get 200, visible non-member 403, invisible private party 404, anonymous 401
- [x] 3.2 Add host-only `POST /items`, `PUT /items/{itemId}`, `DELETE /items/{itemId}` with `@Valid` bodies and `@Transactional`; verify tests: host create 201, edit recomputes totals, lowering quantity below pledged keeps pledges and reports `fulfilled`, delete removes pledges, attendee gets 403, invalid body 400, foreign item 404
- [x] 3.3 Add `PUT /items/{itemId}/pledge` (upsert own pledge, item locked `PESSIMISTIC_WRITE`, 409 with `remaining` and current `item` when over limit, own previous pledge excluded from the limit) and idempotent `DELETE /items/{itemId}/pledge`, both `@Transactional`; verify tests: partial pledge, completing pledge sets `fulfilled`, changing own pledge keeps one row, 4th pack on a 3/3 item → 409 with `remaining: 0` and nothing changed, lowering own pledge 4 → 3 lets another user pledge 1, withdraw recomputes, quantity 0 and 1.5 → 400, non-member 403

## 4. Membership clean-up

- [x] 4.1 In `PartyRepository.leaveParty`, delete the leaving user's pledges on that party's items (bound parameters, subquery on item ids) before removing the attendee; verify with a test: item needs 3, A pledges 2, B pledges 1, A leaves → remaining 2, `fulfilled` false, and C can now pledge 2
- [x] 4.2 Verify party deletion cascades: test that `DELETE /api/parties/{id}` on a party with items and pledges returns 204 and leaves no `BringAlongItem`/`BringAlongPledge` rows

## 5. Live updates (backend)

- [x] 5.1 Add CDI event `BringAlongChanged(partyId)` and fire it from every item/pledge write in `BringAlongResource`, from `leaveParty` when pledges were removed, and from `removeParty`; verify with a test observer that each write fires exactly once and 400/409 requests fire none
- [x] 5.2 Add `BringAlongEvents` broadcaster (per-party sinks, `@Observes(during = AFTER_SUCCESS)`, 25 s heartbeat, cleanup on close) and `GET /api/parties/{partyId}/bring-along/events` (`text/event-stream`, same access check, initial `changed` event, `X-Accel-Buffering: no`); verify with a test that a member's stream receives `changed` after another user's pledge, a non-member gets 403, and a rolled-back write sends nothing

## 6. Web UI on the party detail page

- [x] 6.1 Add the bring-along section markup to `advancedPartyInfos.html` and styles to `advancedPartyInfos.css` (item row, progress bar, green check with `--ph-accent-green`, inline error state, invalid-input state); verify the section renders on a party page in the browser in light layout and at phone width
- [x] 6.2 In `advancedPartyInfos.js`, load the list via `authService.apiCall`, render items with `textContent` (pledged/required, unit, who brings how much, green check when `fulfilled`), and show the join hint on 403; verify in the browser as host, attendee and non-member
- [x] 6.3 Add member pledge controls (whole-number input limited to own pledge + remaining, set/change/withdraw) with client-side validation messages; verify in the browser that 0, 1.5 and values above the open amount are blocked without a request
- [x] 6.4 Handle 409 with an inline error at the item ("Nur noch n benötigt" / "Bereits vollständig") and reload the list; verify with two browser sessions: both see 2/3, user A pledges 1, user B then tries 1 → B sees the error and the green check
- [x] 6.5 Add host controls (add, edit, delete item); verify in the browser that the host can manage items and attendees do not see these controls
- [x] 6.6 Add live updates to `advancedPartyInfos.js`: fetch-based SSE reader with bearer token, debounced refetch on `changed`, 4 s visible-only polling fallback, reconnect with backoff and fresh token, immediate refetch on `visibilitychange`, preserve focus/value of an input being edited; verify with two browser sessions that pledges, item edits and a leave show up in the other session within 5 s without reload, and that after stopping/restarting the server the page recovers on its own

## 7. API docs and manual tests

- [x] 7.1 Add `api/bring-along.http` covering list, item CRUD, pledge set/change/withdraw, the events stream and the 403/409 cases; verify with `./run-http-tests.sh` against a local dev server
- [x] 7.2 Add the seven endpoints to `docs/openspec-baseline/api-contract-matrix.md`; verify they appear in `/q/openapi` with the same paths and status codes
- [x] 7.3 (Optional) Add demo items and pledges for one seeded party to `src/main/resources/db/dev-seed/afterMigrate.sql`; verify they show up via `GET` after a dev restart

## 8. Integration check

- [x] 8.1 Run `./mvnw clean test` (all green) and do one real Keycloak login flow (demo users, password = username): host creates "Chips" ×3 "Packung", user A pledges 1, user B pledges 2 → user A's open page shows B's pledge and the green check without reloading; user C trying 1 more sees the error; user B leaves → item shows 1 / 3 with 2 open and no check
