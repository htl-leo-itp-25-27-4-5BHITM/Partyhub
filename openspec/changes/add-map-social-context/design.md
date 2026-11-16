## Context
The browser uses Leaflet and server-authorized Party entities. Mutual friendship is accepted directed follows in both directions; users join parties independently of invitations.
## Goals / Non-Goals
Goals: Host identity, joined-friend summaries before selection, named friends in details. Non-goals: live location sharing, changing visibility or attendance semantics.
## Decisions
Add a transient discoverySocial DTO enriched only after visibility filtering. One query across the authorized party IDs selects joined mutual contacts. Lists return at most three friend identities with full counts; details return all matching friends. Anonymous responses have host identity and zero friends. Use private/no-store response headers for personalized data. No per-pin API calls. Reuse user profile-picture routes and fall back to existing default artwork. Keep pin times with small outlined friend avatars; descriptive social rows appear in selected map preview. Clusters sum friend-party attendance counts (not unique people) and label that meaning accurately.
## Risks / Trade-offs
Viewer-specific entity state → overwrite DTO every enrichment and never persist it. Small avatars → outlined shapes and accessible labels; missing images fall back locally. Existing follows/invitations → count joined mutual contacts only.
## Migration Plan
No database change. Checkpoint 2b459b2 restores the previous browser map. Revert the feature's additive backend/frontend changes together for rollback.

## Scope update and validation
Party detail UI and endpoint are owned by another thread and are excluded. Only list summaries and selected map previews change. Three backend tests passed in an isolated copy with a compatibility fix for the unrelated planning NoHtml TYPE_USE compilation failure; the shared checkout test run remains blocked by that pre-existing error. Three browser-rendering tests passed; sample preview verified identity/image fallback on mobile.

## Selected map card layout
User clarified the layout request concerns the single-party map preview, not a side results panel. Retain full-width map and selected overlay. Order the card as title, date/time and location, host identity, compact friend context, and price/action. No changes to full party detail UI.
