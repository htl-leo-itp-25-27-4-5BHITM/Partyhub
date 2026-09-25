# Spec Delta

## MODIFIED Requirements

### Requirement: Private party invitees are enforced as mutual contacts
The system SHALL allow only a party's stored host to create, renew, or withdraw invitations for that party. A private-party invitation SHALL be issued or renewed only when the recipient is a mutual contact of the host at that transition. The host SHALL NOT invite themselves, and the system SHALL maintain at most one logical invitation for each party and recipient.

#### Scenario: Host invites mutual contact to private party
- **WHEN** a host creates or updates a private party and selects an invitee who has a mutual contact relationship with the host
- **THEN** the system SHALL allow the invitation to be created or retained

#### Scenario: Host invites non-mutual user to private party
- **WHEN** a host creates or updates a private party and includes an invitee who is not a mutual contact
- **THEN** the backend SHALL reject that private-party invitation

#### Scenario: Non-host attempts to manage an invitation
- **WHEN** an authenticated user other than the stored host attempts to create, renew, or withdraw an invitation for the party
- **THEN** the system SHALL deny the action and preserve invitation, membership, visibility, and event state

#### Scenario: Host attempts to invite themselves
- **WHEN** the stored host selects themselves as an invitation recipient
- **THEN** the system SHALL reject the invitation without creating a self-invitation

#### Scenario: Invitation target is missing
- **WHEN** an invitation action names a party or recipient that does not exist
- **THEN** the system SHALL reject the action without creating replacement invitation or attendance state

#### Scenario: Host repeats a current invitation
- **WHEN** the stored host invites a recipient whose logical invitation is already pending or is accepted while the recipient remains joined
- **THEN** the system SHALL preserve the current invitation and membership without creating a duplicate invitation or invitation-issued event

#### Scenario: Host renews a declined invitation
- **WHEN** the stored host reinvites an eligible recipient whose logical invitation is declined
- **THEN** the system SHALL change that invitation to pending, restore invitation-based private visibility, and SHALL NOT create a second logical invitation

#### Scenario: Host withdraws a pending invitation
- **WHEN** the stored host withdraws a pending invitation
- **THEN** the recipient SHALL no longer have a qualifying current invitation or invitation-based private visibility, while any access from another accepted role remains unchanged

### Requirement: Invitation acceptance happens through party attendance
The system SHALL model invitation acceptance through party attendance. An authenticated non-host MAY join a public party, while a private-party non-host SHALL have a pending invitation before joining. Joining, accepting, declining, and leaving SHALL update invitation status, attendance membership, private visibility, projections, and their domain event as one logical transition. Age and capacity metadata alone SHALL NOT be interpreted by this requirement as an admission decision.

#### Scenario: Invited user joins a party
- **WHEN** a user with a pending invitation joins the invited party
- **THEN** the system SHALL mark that invitation as accepted
- **AND** add the user to attendance exactly once

#### Scenario: Invited user leaves a previously accepted party
- **WHEN** a user leaves a party for which their invitation had been accepted
- **THEN** the system SHALL update the invitation state to declined
- **AND** remove the user from attendance

#### Scenario: Authenticated user joins a public party
- **WHEN** an authenticated non-host who is not attending joins a public party
- **THEN** the system SHALL add that user to attendance exactly once without requiring an invitation

#### Scenario: User without a pending invitation joins a private party
- **WHEN** an authenticated non-host without a pending invitation attempts to join a private party
- **THEN** the system SHALL deny the action and preserve invitation, membership, visibility, projection, and event state

#### Scenario: Recipient declines a pending invitation
- **WHEN** the authenticated recipient declines a pending invitation
- **THEN** the system SHALL mark the invitation declined, ensure the recipient is not an attendee, and remove invitation-based private visibility

#### Scenario: Recipient accepts through an invitation action
- **WHEN** the authenticated recipient accepts a pending invitation through a supported invitation action
- **THEN** the system SHALL perform the same accepted-invitation and attendance transition as joining the party

#### Scenario: User repeats an accepted join
- **WHEN** a user who is already attending repeats a join or acceptance action
- **THEN** the system SHALL preserve one membership and the current invitation state without emitting a duplicate transition event

#### Scenario: User repeats an absent leave or decline
- **WHEN** a user who is not attending repeats a leave action or repeats decline on an already declined invitation
- **THEN** the system SHALL preserve the current state without emitting a duplicate transition event

#### Scenario: Attendance transition targets a missing party
- **WHEN** an authenticated user attempts an attendance transition for a party that does not exist
- **THEN** the system SHALL report that the party is unavailable and SHALL NOT create invitation, membership, projection, or event state

## ADDED Requirements

### Requirement: Invitation and attendance projections are actor-scoped
The system SHALL expose invitation and attendance projections only to their intended authenticated actors. Pending invitations SHALL qualify their recipient for private-party visibility; declined or withdrawn invitations SHALL NOT. Joined attendees SHALL retain private-party visibility through membership. Invitation metadata and statistics SHALL remain host-only, while authenticated party viewers SHALL be allowed to read bounded joined-member and own-attendance projections.

#### Scenario: Pending recipient requests a private party
- **WHEN** the authenticated recipient of a pending invitation requests its private party
- **THEN** the system SHALL allow access through the current invitation

#### Scenario: Declined or withdrawn recipient requests a private party
- **WHEN** a user whose invitation is declined or withdrawn and who has no other viewer role requests the private party
- **THEN** the system SHALL deny access without disclosing party, invitation, roster, or statistics data

#### Scenario: Accepted attendee requests a private party
- **WHEN** a user with an accepted invitation remains joined to the private party
- **THEN** the system SHALL allow access through attendance membership

#### Scenario: User lists invitations
- **WHEN** an authenticated user lists received or sent invitations
- **THEN** the system SHALL return only invitations where that user is respectively the recipient or stored host/sender

#### Scenario: User requests invitation details
- **WHEN** an authenticated user requests invitation details
- **THEN** the system SHALL return a bounded party and invitation projection only when the user is that invitation's stored host/sender or recipient

#### Scenario: Host requests invitation roster or statistics
- **WHEN** the stored host requests invited-member identities, invitation statuses, or invitation statistics for their party
- **THEN** the system SHALL return the corresponding bounded projection

#### Scenario: Party viewer requests joined-member or own-attendance projection
- **WHEN** an authenticated party viewer requests the joined-member roster or their own attendance status and viewer-safe count
- **THEN** the system SHALL return a bounded projection without exposing host-only invitation metadata

#### Scenario: Non-host requests host-only invitation projection
- **WHEN** an authenticated non-host requests invited-member identities, invitation statuses, or invitation statistics
- **THEN** the system SHALL deny the request and SHALL NOT disclose that projection

#### Scenario: Host opens invitation statistics
- **WHEN** the stored host opens invitation statistics
- **THEN** accepted, declined, pending, and total counts SHALL be derived from actual logical invitations and SHALL NOT classify the host as an accepted invitation

### Requirement: Invitation and attendance transitions publish consistent domain events
The system SHALL produce at most one domain event for each committed invitation or attendance transition, with the party, acting user, transition type, and intended domain recipient needed by notification processing. A failed, denied, or repeated no-op action SHALL NOT produce a transition event. Notification channels, user preferences, delivery, retry, and cleanup remain governed by the notification contract.

#### Scenario: Host issues or renews an invitation
- **WHEN** the stored host commits a new or renewed pending invitation
- **THEN** the system SHALL produce one invitation-issued event intended for the recipient

#### Scenario: Host withdraws a pending invitation
- **WHEN** the stored host commits withdrawal of a pending invitation
- **THEN** the system SHALL produce one invitation-withdrawn event intended for the recipient

#### Scenario: Recipient accepts or joins
- **WHEN** the recipient commits acceptance of a pending invitation by joining the party
- **THEN** the system SHALL produce one acceptance-and-join event intended for the host

#### Scenario: Recipient declines an invitation
- **WHEN** the recipient commits decline of a pending invitation
- **THEN** the system SHALL produce one invitation-declined event intended for the host

#### Scenario: Attendee leaves a party
- **WHEN** a joined non-host commits leaving the party
- **THEN** the system SHALL produce one attendance-left event intended for the host and include the declined invitation transition when one applies

#### Scenario: Transition is denied or has no state change
- **WHEN** an invitation or attendance action is denied, fails validation, targets missing state, or repeats an already-current state
- **THEN** the system SHALL preserve all projections and SHALL NOT produce a duplicate transition event
