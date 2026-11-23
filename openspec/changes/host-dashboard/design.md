# Design

## Context
- Follows live in `follow` (`user1_id` follows `user2_id`, `status_id` 1 pending / 2 accepted / 3 blocked) without timestamps. `FollowRepository.removeFollow` deletes the row; it is used both for unfollowing and for rejecting/cancelling pending requests.
- Attendance is the `@ManyToMany` join table `party_user` on `Party.users`, used in ~45 places. Joins and leaves happen in `InvitationRepository` (`party.getUsers().add/removeIf`).
- `users` has no gender or birth date. `party.created_at` (LocalDateTime set in Java), `party.visibility`, `party.max_people`, `invitation.status` and `favorite` already exist.
- Tests run on H2 with Hibernate schema generation and Flyway disabled, so every new column or table must also exist as a mapped entity field.
- The web frontend is plain HTML/JS under `META-INF/resources/`, uses `authService` for authenticated calls and `nav.js` for navigation.

## Goals / Non-Goals
**Goals:** one cheap endpoint call per range change; all aggregation on the server; no individual guest data leaves the server.

**Non-Goals:** dashboard in iOS; backfilling history for follows/joins that happened before deployment; custom date ranges; export; statistics as a guest (only as host).

## Decisions
1. **Event tables instead of timestamp columns.** `follow_event(id, follower_id, followed_id, type FOLLOWED|UNFOLLOWED, occurred_at)` and `attendance_event(id, party_id, user_id, type JOINED|LEFT, occurred_at)`, each a Panache entity.
   - *Why:* losses need history because `removeFollow` deletes the row. A `joined_at` column on `party_user` would need the `@ManyToMany` replaced by an entity (45 usages) or a native update that H2 schema generation would not know about.
   - *Alternative:* `follow.created_at` + soft delete. Rejected, because every follow query would need a filter.
   - FKs use `ON DELETE CASCADE` so deleting a user or party cleans up its history.
2. **Where events are written.** `acceptFollowRequest` → FOLLOWED. `removeFollow` → UNFOLLOWED only if the deleted row had status accepted (2). Join/accept-by-join in `InvitationRepository` → JOINED only if the user was actually added. Leave → LEFT only if `removeIf` returned true. Always inside the same `@Transactional` method as the state change, so a rollback also drops the event.
3. **Endpoint.** `GET /api/dashboard?range=` in `at.htl.dashboard.DashboardResource`, `@Authenticated`, acting user from the token (same helper as other resources). `range` is an enum `DashboardRange { D7("7d"), D30("30d"), M3("3m"), M6("6m") }` with an unknown value → 400. Read-only, so no `@Transactional` is needed. One response DTO (records):
   ```
   DashboardDto(range, from, to,
     partiesCreated, followersGained, followersLost, joins,
     visibility { private: {parties, joins}, public: {parties, joins} },
     invitations { accepted, declined, pending },
     capacity { averagePercent, parties: [{partyId, title, guests, maxPeople, percent}] },
     topParty { partyId, title, guests, favorites } | null,
     gender { withheld, sampleSize, percentages {MALE, FEMALE, DIVERSE, NOT_SPECIFIED} },
     age { withheld, sampleSize, percentages {"<18","18-20","21-24","25-29","30+"} },
     timeline { bucket: DAY|WEEK, points: [{start, followersGained, followersLost, joins}] })
   ```
   Party titles in the response go through `Encode.forHtml`.
4. **Queries.** `DashboardService` uses JPQL/Panache aggregate queries with bound parameters (`:hostId`, `:from`, `:to`), e.g. `count`/`group by type` on `FollowEvent`, `group by visibility` on `AttendanceEvent` join `Party`. Bucketing of the timeline happens in Java over the (small) event lists of one host, so it works identically on H2 and PostgreSQL without dialect-specific `date_trunc`. Weeks start on Monday.
5. **Demographics.** Distinct users with a JOINED event to the host's parties in the range (the host themself excluded) → load their `gender`/`birthDate` → count in Java. Threshold constant `MIN_SAMPLE = 5`; below it `withheld=true` and no percentages. Age is computed from birth date at the request date.
6. **Profile fields.** `User.gender` (`@Enumerated(STRING)`, nullable) and `User.birthDate` (`LocalDate`, nullable). The profile update DTO gets `Gender gender` and `@Past(message=…) LocalDate birthDate`. Only the self projection in `ProfileDto` exposes them; cross-user projections, search and follow lists stay unchanged.
7. **Frontend.** `dashboard/dashboard.html|js|css` with the shared `design-system.css`/`global.css` and route guard. Range as a segmented control, KPI tiles, one `<select>` for the chart metric (timeline, joins by visibility, invitations, capacity, gender, age). Charts are hand-drawn SVG (line/bar) at the real container width, no CDN dependency; every chart has a hover tooltip and a "Show as table" view. The response is cached per range in memory, so switching the metric does not trigger a request. Entry point is a "Dashboard" button on the own profile page (next to "Edit Account"); the four-item bottom nav stays unchanged and the page links back to the profile. `editProfile` gets a gender `<select>` and a date input.
8. **Migration** `V9__host_dashboard.sql` (V6/V7 were never used, and Flyway requires a number above the highest applied one, 8). Only `CREATE TABLE`, `CREATE INDEX` and `ALTER TABLE … ADD COLUMN`, no `DROP`, no data changes. Indexes: `follow_event(followed_id, occurred_at)`, `attendance_event(party_id, occurred_at)`.

## Risks / Trade-offs
- [History starts at deployment, so the dashboard looks empty at first] → The UI shows a note "Statistiken werden seit <Datum> erfasst"; dev seed fills history so it can be demoed.
- [Gender/age are sensitive personal data] → Optional fields, self-only projection, aggregates only, 5-guest threshold. "Not specified" counts as provided, but users who leave it empty are excluded.
- [Small hosts with exactly 5 guests could still infer individual values] → Accepted for a school project; the threshold is a single constant if it needs raising.
- [Missing an event write path, e.g. a second join path] → Tasks list every `getUsers().add/remove` and follow mutation; tests per path.
- [LocalDateTime without time zone] → Same convention as `party.created_at`; ranges are computed with `LocalDateTime.now()` on the server.

## Migration Plan
Deploy the migration with the code; it is additive. Rollback = deploy the previous image; the new tables/columns are ignored by older code. Seed data only in `dev-seed/afterMigrate.sql`.
