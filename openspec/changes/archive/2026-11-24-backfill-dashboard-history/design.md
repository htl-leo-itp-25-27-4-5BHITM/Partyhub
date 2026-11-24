# Design

## Context
`notification` stores `created_at`, `sender_id`, `recipient_id`, `party_id` and an English (older: German) message; there is no type column. The relevant messages are built in `FollowRepository.notifyFollowAccepted` and `PartyRepository.notifyHost`; git history shows the German variants.

## Decisions
1. **Flyway data migration instead of a Java job.** Runs exactly once per database on deploy, inside the migration transaction, without an admin endpoint. Dev databases are cleaned on start, so it only matters for persistent databases (school cloud).
2. **Matching on the fixed message templates**, restricted by the structured columns: follow → `party_id IS NULL`, sender = follower, recipient = followed; join/leave → `party_id` set and recipient = the party's host. The message only decides the kind of event.
3. **No duplicates:** skip a notification if an event of the same kind for the same users/party exists within 60 seconds of its `created_at` (live recording writes the event and the notification in the same transaction).
4. **No estimates:** current follows or attendances without a matching notification stay without history; the UI note explains it.

## Risks / Trade-offs
- [A display name that itself ends in a template phrase] → Structured column checks limit false matches; worst case one extra entry.
- [Deleted notifications] → History stays incomplete; documented in the note.
