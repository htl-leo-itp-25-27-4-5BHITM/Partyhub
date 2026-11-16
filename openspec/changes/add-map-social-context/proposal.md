## Why
Map discovery currently gives no creator identity or indication that friends are going. Users need this context before opening every party.
## What Changes
- Show host photo/name in event map previews.
- Show mutual contacts who joined on map pins, clusters.
- Compute personalized summaries in a batched backend query, preserving party visibility.
## Capabilities
### New Capabilities
- `party-social-context`: Host identity and viewer-specific mutual-contact attendance summaries.
### Modified Capabilities
None.
## Impact
Party list/detail responses gain discoverySocial. Home map share social-context rendering. No schema migration or new dependency.
