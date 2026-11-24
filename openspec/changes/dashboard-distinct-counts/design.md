# Design

## Decisions
1. **Deduplicate after filtering.** Follow rows: quick-unfollow pairs removed → range filter → per follower keep the earliest FOLLOWED and the latest UNFOLLOWED. Join rows: per (party, guest) keep the earliest JOINED in the range.
2. **Timeline consistent with tiles:** buckets are filled from the same deduplicated rows, so the sum of the timeline equals the tiles.
3. **No data cleanup:** duplicate history entries stay stored (they are true events or harmless backfill artefacts); counting per person makes them irrelevant and keeps the change reversible.
