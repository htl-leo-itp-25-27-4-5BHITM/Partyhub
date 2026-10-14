# Tasks

Each group is one PR (`refactor: ...`). Before each group, record the baseline from `./mvnw clean test` and the HTTP tests. After it, both must pass with the same counts plus any new tests.

## 1. Location and user

- [ ] 1.1 `LocationRepository` (3) and `UserRepository` (6): return `Optional`/entities, and map in the resources. Add `.http` cases for any uncovered status. Verify that `./mvnw clean test` and `cd api && npm test` pass.
- [ ] 1.2 Move the 14 `EntityManager` uses in `UserResource` into `UserRepository`/`UserLocationRepository`. Verify with `grep -c "em\." src/main/java/at/htl/user/UserResource.java` = 0, and that `./mvnw clean test` and the HTTP tests pass.

## 2. Follow

- [ ] 2.1 `FollowRepository` (11): sealed result for follow, accept and remove, mapped in `UserResource`. Change `FollowRepositoryTest` to assert on results. Verify that `./mvnw clean test` and the HTTP tests pass and that `grep Response src/main/java/at/htl/follow` finds nothing.

## 3. Notification

- [ ] 3.1 `NotificationRepository` (12): same pattern; update `NotificationRepositoryTest`. Verify that `./mvnw clean test` and the HTTP tests pass and that `grep Response src/main/java/at/htl/notification/*Repository.java` finds nothing.

## 4. Media

- [ ] 4.1 `MediaRepository` (remaining uses after `fix-party-media-upload-and-serving`): upload returns a result type, and the resource maps it. Verify that `./mvnw clean test` and the HTTP tests pass and that `grep Response src/main/java/at/htl/media/MediaRepository.java` finds nothing.

## 5. Invitation

- [ ] 5.1 `InvitationRepository` (31): sealed results for send, accept and decline, mapped in `InvitationResource`. Verify that `./mvnw clean test` and the HTTP tests pass and that `grep Response src/main/java/at/htl/invitation/InvitationRepository.java` finds nothing.

## 6. Party

- [ ] 6.1 Extract `PartyAttendanceRepository` and `PartyInvitationService` from `PartyRepository`, with no logic changes. Verify that `./mvnw clean test` and the HTTP tests pass and that `wc -l PartyRepository.java` is clearly lower.
- [ ] 6.2 Convert the remaining `Response` uses in the party classes to results, and move the 4 `EntityManager` uses out of `PartyResource`. Verify that `./mvnw clean test` and the HTTP tests pass and that `grep -rn "Response" src/main/java/at/htl/*/*Repository.java` finds nothing.

## 7. Package names

- [ ] 7.1 Rename `user_location` → `userlocation` and `profile_picture` → `profilepicture` in main and test. Verify that `grep -rn "user_location\|profile_picture" src/main/java src/test/java --include='*.java'` only finds table/column names in annotations, and that `./mvnw clean test` passes.

## 8. Wrap-up

- [ ] 8.1 Update `docs/cleanup-audit.md` section 3 with each PR link, and add any bugs found during the refactor as new section 1 items.
