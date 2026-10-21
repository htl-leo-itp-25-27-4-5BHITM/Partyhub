# Design

## Context

See proposal.md – Why. Requirements are in `specs/party-bring-along-list/spec.md`.

Relevant existing state:
- `Party` has a `host_user` and a `@ManyToMany` `users` set (table `party_user`) for joined attendees. `PartyRepository.getPartyByIdIfVisible(partyId, userId)` is the existing visibility check.
- The recent favorites feature (`at.htl.favorite`, `V4__user_party_favorites.sql`) is the closest template: small package, `EntityManager` + JPQL with bound parameters, `@OnDelete(CASCADE)` on FKs, pessimistic lock to serialize concurrent writes.
- `PartyRepository.removeParty` deletes the party via `em.remove(party)`; `leaveParty` removes the user from `party.users`.
- Schema changes go through Flyway; the next free version is `V5`.

## Goals / Non-Goals

**Goals:**
- Two small entities and one resource class, following the favorites package style.
- Totals (`pledged`, `remaining`, `fulfilled`) computed server-side so every client shows the same green check.
- No over-pledging, even with concurrent requests; freed quantity (lowered/withdrawn pledge, attendee leaves) is open again immediately because totals are always computed from the current pledges, never stored.
- A web UI on the party detail page that gives members clear feedback.

**Non-Goals:**
- iOS UI.
- Multi-replica fan-out (Redis/Postgres `LISTEN/NOTIFY`) – not needed with one replica today.
- Fractional quantities (e.g. 1.5 Liter) – quantities are integers; the unit text carries the meaning.
- Changes to existing party/attendance endpoints beyond the pledge clean-up on leave.

## Decisions

### Data model: item + pledge tables
```
bring_along_item(id, party_id → party ON DELETE CASCADE, name varchar(100), unit varchar(30) null,
                 quantity int CHECK (quantity BETWEEN 1 AND 10000), created_at timestamp)
bring_along_pledge(id, item_id → bring_along_item ON DELETE CASCADE,
                   user_id → users ON DELETE CASCADE, quantity int CHECK (quantity >= 1),
                   UNIQUE (item_id, user_id))
```
Indexes on `bring_along_item(party_id)` and `bring_along_pledge(user_id)`.
- *Why a separate pledge table* instead of a single "brought by" column: one item is split across several users with individual amounts ("who brings how much").
- *No separate "list" entity*: a party has at most one list, so items hang directly off the party. A list table would only add an empty row and a lifecycle to manage. Alternative rejected.
- Entities use `@OnDelete(action = CASCADE)` like `Favorite`, so `em.remove(party)` and user deletion rely on the DB cascade; `Party` gets no new collection field (keeps its JSON and eager loading unchanged).

### API shape
Base path `/api/parties/{partyId}/bring-along`, class-level `@Authenticated`, `@Transactional` on write methods.

| Method | Path | Who | Body | Response |
|---|---|---|---|---|
| GET | `` | host, attendee | – | `200` list of `BringAlongItemDto` |
| POST | `/items` | host | `BringAlongItemRequest` | `201` item DTO |
| PUT | `/items/{itemId}` | host | `BringAlongItemRequest` | `200` item DTO |
| DELETE | `/items/{itemId}` | host | – | `204` |
| PUT | `/items/{itemId}/pledge` | host, attendee | `BringAlongPledgeRequest` | `200` item DTO |
| DELETE | `/items/{itemId}/pledge` | host, attendee | – | `204` (idempotent) |
| GET | `/events` | host, attendee | – | `text/event-stream` of `changed` events |

- `PUT .../pledge` is an upsert of *my* pledge – matches "one pledge per user per item" and keeps the client simple. The pledging user always comes from `CurrentUserResolver`, never from the body, so users cannot touch others' pledges.
- Whole numbers only: Jackson by default truncates `1.5` into an `Integer`. The quantity fields get a small strict deserializer (`@JsonDeserialize(using = StrictIntDeserializer.class)`) that rejects non-integral numbers and strings with 400. Rejected alternative: disabling `ACCEPT_FLOAT_AS_INT` globally, which could change behaviour of existing endpoints.
- Request DTOs are records: `BringAlongItemRequest(@NotBlank @Size(max=100) @SafeText @NoHtml name, @Size(max=30) @SafeText @NoHtml unit, @NotNull @Min(1) @Max(10000) Integer quantity)` and `BringAlongPledgeRequest(@NotNull @Min(1) @Max(10000) Integer quantity)`, every constraint with a `message`. Create and update use the same rules, so no `OnCreate`/`OnUpdate` groups.
- Response `BringAlongItemDto(id, name, unit, quantity, pledged, remaining, fulfilled, pledges[])` with `PledgeDto(userId, displayName, quantity)`. User-provided strings are returned through `Encode.forHtml(...)` per project rule.

### Access check
One private helper resolves the party and caller role:
1. `getPartyByIdIfVisible` → `null` ⇒ 404.
2. host ⇔ `party.host_user.id == userId`; attendee ⇔ `party.users` contains the user ⇒ otherwise 403.
3. Item endpoints additionally load the item with `where id = :itemId and party.id = :partyId` ⇒ 404 if missing (prevents cross-party ID tampering).

### Over-pledge protection
In `PUT .../pledge`, load the item with `LockModeType.PESSIMISTIC_WRITE`, then sum the other users' pledges and check `others + requested <= item.quantity`, else 409 with `{"error": "Item is already covered", "remaining": n, "item": <BringAlongItemDto>}` where `n` is what this user may still pledge. The frontend uses `remaining` for its message and `item` to refresh that row. The row lock serializes concurrent pledges on the same item (same technique as `FavoriteResource`). Alternative rejected: optimistic `@Version` on the item – needs client retry handling for a rare case.

### No stored totals
`pledged`, `remaining` and `fulfilled` are calculated on every read from the pledge rows. Lowering a pledge from 4 to 3, withdrawing it, or removing pledges on leave therefore frees the quantity without any extra bookkeeping, and there is no counter that could drift.

### Web UI (`advancedPartyInfos`)
- New `<section class="details-card" id="bring-along-section">` on the detail page, loaded after the existing join-status call. Only rendered for host/attendee; non-members get a "Join the party to see the bring-along list" hint (a 403 from the API maps to this hint).
- Per item row: name + unit, `pledged / quantity`, a progress bar, the pledgers ("Anna · 1, Ben · 2"), and a green check icon (`--ph-accent-green` from `design-system.css`) when `fulfilled`.
- Member control: number input `type="number" step="1" min="1" max="<own pledge + remaining>"`, "Mitnehmen"/"Ändern" button and "Zurückziehen". Client-side check (`Number.isInteger`, range) blocks invalid values with an inline message and red input border before any request.
- On 409: inline error at that item ("Nur noch {remaining} benötigt" / "Bereits vollständig") plus a short shake/red highlight, then reload the list. Other errors use the same inline error slot.
- Host controls: add-item form (name, quantity, unit), edit and delete per item.
- All values rendered via `textContent` (no `innerHTML` with user data); calls go through `window.authService.apiCall` like the rest of the page.

### Live updates: SSE "changed" signal + refetch
- **Server**: `BringAlongEvents` (`@ApplicationScoped`) keeps a `ConcurrentHashMap<Long partyId, Set<SseEventSink>>` (or one `Sse.newBroadcaster()` per party). `GET /events` runs the normal access check, registers the sink, sends an initial `changed` event, and removes the sink on close. A heartbeat comment every 25 s keeps proxies/ingress from closing idle streams and detects dead sinks.
- **After commit only**: write paths fire a CDI event `BringAlongChanged(partyId)`; the broadcaster observes it with `@Observes(during = TransactionPhase.AFTER_SUCCESS)`. Rolled-back or rejected (400/409) requests therefore never notify. `leaveParty` (pledges removed) and `removeParty` fire the same event.
- **Payload is only `{partyId, at}`**: clients refetch `GET /bring-along`, so access checks, encoding and totals stay in one place and no data leaks through the stream. Rejected alternative: pushing the full list – would need per-recipient filtering later and duplicates the DTO path.
- **Client auth**: browser `EventSource` cannot send the `Authorization: Bearer` header. The page instead opens the stream with `fetch` (through the same token logic as `authService.apiCall`) and reads `response.body` as a stream, parsing `data:` lines. Rejected alternatives: token in the query string (ends up in logs), cookie auth (not used by this app), WebSocket (`quarkus-websockets-next` would be a new dependency and is bidirectional for no reason).
- **Fallback & resilience**: if the stream fails or closes, the page polls `GET /bring-along` every 4 s (so updates stay within the 5 s target including request time) while `document.visibilityState === "visible"` (same pattern as `notifications.js`) and retries the stream with backoff (2 s → 30 s) and a freshly obtained token. On `visibilitychange` to visible it refetches immediately. Refetches are debounced (≈300 ms) so bursts of events cause one request.
- **UI during refresh**: re-render keeps focus and the unsent value of a pledge input the user is currently editing; an item that disappears or becomes covered while editing shows the inline message from the 409 handling.

Rejected alternative for the whole mechanism: polling only (simple, but up to 5 s lag for everyone and constant load from every open page). It stays as the fallback.

### Host lowers quantity
Allowed; pledges are kept and `remaining` is clamped to 0. Rejecting the edit or silently trimming other users' pledges would both be surprising; the host can see who over-delivers.

### Clean-up on leave
`PartyRepository.leaveParty` runs a bulk JPQL delete `delete from BringAlongPledge p where p.user.id = :userId and p.item.party.id = :partyId` (implemented via subquery on item ids since JPQL bulk deletes cannot join) inside its existing transaction, before removing the attendee.

## Risks / Trade-offs

- [Only the leave path cleans up pledges; a revoked invitation without "leave" would not] → attendance removal currently only happens through `leaveParty`; if another removal path is added later it must call the same clean-up.
- [Pessimistic lock on PostgreSQL vs. H2 in tests behaves slightly differently] → tests cover the sequential over-pledge case; the concurrent case is guarded by the DB lock and not unit-tested.
- [`Encode.forHtml` returns `&amp;` etc. for names like "Chips & Dips"] → consistent with the project rule; clients already render encoded text from other endpoints.
- [Integer quantities cannot express "1,5 L"] → host can write "1500" + "ml" or "2" + "Flaschen"; revisit only if users ask.

- [In-memory broadcaster only reaches clients on the same pod] → today `replicas: 1`; if scaled, switch the CDI observer to publish via Postgres `LISTEN/NOTIFY`, the client contract stays the same. Polling fallback still keeps clients within 5 s meanwhile.
- [Long-lived connections hold a worker/sink each] → sinks are non-blocking in Quarkus REST; heartbeat removes dead ones; school-scale user counts are small.
- [Ingress/proxy buffering or idle timeouts break SSE] → send `X-Accel-Buffering: no`, heartbeat every 25 s; fallback polling covers the rest.
- [Access token expires during an open stream] → server keeps the stream until closed; on reconnect the client uses a fresh token. A user who leaves the party keeps the stream until it reconnects, but only ever receives content-free `changed` signals and the following GET returns 403.

## Migration Plan

- Add `V5__party_bring_along_list.sql` (create-only, no `DROP`, no data changes). It runs automatically at startup in all environments.
- Rollback: the tables are additive; reverting the code leaves unused empty tables. A later `V<n>` migration can drop them if needed.
- Optional: add a few demo items/pledges to `db/dev-seed/afterMigrate.sql` for local testing only.
