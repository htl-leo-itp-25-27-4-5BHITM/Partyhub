## ADDED Requirements
### Requirement: Visible parties expose creator identity
The browser SHALL display host name and profile image in selected map previews, with an image fallback.
#### Scenario: Host has no profile photo
- **WHEN** a visible party's host has no available profile photo
- **THEN** the browser shows fallback artwork and the host's display name or handle
### Requirement: Friend attendance is viewer-specific
The server SHALL count only joined users with accepted follow relationships in both directions with the authenticated viewer. It SHALL enrich only server-authorized visible parties and SHALL expose no viewer-specific friends to anonymous callers.
#### Scenario: Follow is one-way or pending
- **WHEN** an attendee has only one accepted follow direction or a pending relationship
- **THEN** that attendee does not appear in the viewer's friend summary
#### Scenario: Private party is hidden
- **WHEN** the viewer lacks permission to see a party
- **THEN** no social summary for that party is returned
### Requirement: Friends are discoverable without selecting a marker
The browser SHALL show joined-friend avatar/count indicators on party pins and clusters when positive, and names and profile links in selected previews. List summaries SHALL be batched with no per-party network requests and personalized responses SHALL prevent shared caching.
#### Scenario: Friends have joined
- **WHEN** a visible party has joined mutual contacts
- **THEN** its pin identifies that friends are going and its map preview names the friends

