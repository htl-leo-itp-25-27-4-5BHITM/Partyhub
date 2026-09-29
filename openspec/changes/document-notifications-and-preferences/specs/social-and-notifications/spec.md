# Spec Delta

## MODIFIED Requirements

### Requirement: Notification center is the primary action surface for invites and follow requests
The system SHALL use the authenticated recipient's notification center as the primary place to review and act on current private-party invitations and follow requests, and to review follow-acceptance, invitation/attendance outcome, party-update, and party-cancellation information. Each committed state-changing domain transition SHALL supply at most one typed event for each intended recipient; failed, denied, or repeated no-op actions SHALL NOT create an event. Action availability SHALL be derived from current invitation or follow state rather than message text, and notification delivery failure SHALL NOT invalidate the committed domain transition.

#### Scenario: User receives a party invitation
- **WHEN** the stored host commits a new or renewed pending private-party invitation
- **THEN** the invited recipient SHALL receive one actionable invitation item in their notification center

#### Scenario: Pending invitation is withdrawn
- **WHEN** the stored host commits withdrawal of a pending invitation
- **THEN** the former recipient SHALL receive one invitation-withdrawn event
- **AND** the obsolete invitation action SHALL no longer be available

#### Scenario: Host receives invitation or attendance outcome
- **WHEN** an invited user accepts or joins, declines, or a joined non-host leaves a party
- **THEN** the stored host SHALL receive one event describing the committed transition
- **AND** the acting user SHALL NOT receive a duplicate self-notification for that action

#### Scenario: User receives a follow request
- **WHEN** authenticated requester A commits a new pending follow request to target B
- **THEN** target B SHALL receive one actionable follow-request item in their notification center

#### Scenario: Requester receives follow acceptance
- **WHEN** target B accepts A's pending follow request
- **THEN** requester A SHALL receive one follow-accepted event
- **AND** accepting target B SHALL NOT receive a duplicate self-notification for that acceptance

#### Scenario: User receives party change notification
- **WHEN** the stored host commits a material party update
- **THEN** each current joined non-host attendee and each current pending invitee other than the actor SHALL receive at most one party-update event
- **AND** a recipient whose only new relevance is an invitation issued by that same transaction SHALL receive the invitation action without a duplicate party-update event

#### Scenario: User receives party cancellation notification
- **WHEN** the stored host commits party cancellation
- **THEN** each current joined non-host attendee and each current pending invitee other than the actor SHALL receive at most one cancellation event
- **AND** that event SHALL retain a bounded party snapshot after the party is removed

#### Scenario: Domain action has no committed state change
- **WHEN** a follow, invitation, attendance, update, or cancellation action is denied, fails validation, targets missing state, or repeats an already-current state
- **THEN** the system SHALL NOT create a notification event or duplicate an existing action item

#### Scenario: User acts on stale notification content
- **WHEN** a user opens an invitation or follow action whose authoritative domain state is no longer pending
- **THEN** the system SHALL show the current non-actionable state and SHALL NOT replay or reverse the completed transition

#### Scenario: User manages notification state
- **WHEN** a user marks their informational notification as read or deletes it
- **THEN** the system SHALL persist the requested notification state change without changing the underlying follow, invitation, attendance, or party state

## ADDED Requirements

### Requirement: Notification-center state is recipient-scoped and explicitly typed
PartyHub SHALL expose notification-center state only to its authenticated recipient. Each informational notification SHALL carry an explicit event type, recipient, actor when applicable, creation time, read state, bounded display content, and an optional party reference or cancellation snapshot. Type and action behavior SHALL NOT be inferred from localized message text. Lists SHALL be ordered newest first with deterministic tie handling.

#### Scenario: Recipient lists their notifications
- **WHEN** an authenticated user requests their notification list
- **THEN** the system SHALL return only that recipient's notification items ordered newest first with deterministic tie handling

#### Scenario: Anonymous caller requests notifications
- **WHEN** a caller without an authenticated PartyHub session requests notification state
- **THEN** the system SHALL reject the request without returning notification data

#### Scenario: Recipient filters by event type
- **WHEN** an authenticated recipient supplies a supported notification event-type filter
- **THEN** the system SHALL match the explicit stored event type rather than words in the display message

#### Scenario: Recipient filters by party
- **WHEN** an authenticated recipient supplies a party filter
- **THEN** the system SHALL return only their events associated with that party
- **AND** cancellation snapshots SHALL remain queryable without requiring the deleted party row

#### Scenario: Recipient searches display content
- **WHEN** an authenticated recipient supplies a supported text search
- **THEN** the system SHALL search only that recipient's bounded display content without widening the recipient scope

#### Scenario: Recipient requests unread notifications
- **WHEN** an authenticated user requests unread notification state
- **THEN** the system SHALL return only that recipient's items whose persisted read state is unread

#### Scenario: Recipient marks a notification as read
- **WHEN** the recipient marks their unread notification as read
- **THEN** the system SHALL persist read state and a repeated mark-read action SHALL leave it read without another domain event

#### Scenario: Recipient deletes an informational notification
- **WHEN** the recipient deletes one of their dismissible informational notifications
- **THEN** the system SHALL remove that item regardless of its event type
- **AND** deletion SHALL NOT reject, withdraw, or otherwise change authoritative domain state

#### Scenario: Caller targets unavailable or another recipient's item
- **WHEN** an authenticated user attempts to read, mark, or delete a missing notification or one addressed to another recipient
- **THEN** the system SHALL deny or report the unavailable item without changing notification or domain state

### Requirement: Notification preferences are same-user and independently effective
PartyHub SHALL maintain one effective notification-settings state per user. Supported in-app and email channels and the `partyInvites`, `partyUpdates`, and `followEvents` categories SHALL default enabled; push and SMS SHALL default disabled while those channels are unsupported. Only the authenticated user SHALL read or replace their settings. Channel and category gates SHALL be evaluated independently, and a missing legacy settings row SHALL resolve to these defaults rather than disabling delivery or exposing another user's state.

#### Scenario: New profile receives notification defaults
- **WHEN** PartyHub creates a new user profile
- **THEN** it SHALL establish enabled in-app, email, invitation, party-update, and follow-event preferences
- **AND** it SHALL keep unsupported push and SMS preferences disabled

#### Scenario: Legacy profile has no settings row
- **WHEN** an authenticated user without stored settings reads or updates notification preferences
- **THEN** the system SHALL use the documented effective defaults and materialize one same-user settings state when persistence is required

#### Scenario: User reads their settings
- **WHEN** an authenticated user requests their own notification settings
- **THEN** the system SHALL return the complete effective channel and category state

#### Scenario: User targets another user's settings
- **WHEN** an authenticated user attempts to read or update another user's notification settings
- **THEN** the system SHALL reject the action without disclosing or changing those settings

#### Scenario: User replaces settings
- **WHEN** an authenticated user submits a complete valid settings state for themselves
- **THEN** the system SHALL replace all channel and category values atomically or preserve the prior state on failure

#### Scenario: User disables in-app informational delivery
- **WHEN** a qualifying event occurs for a user whose in-app channel is disabled
- **THEN** the system SHALL suppress that event's informational in-app item without suppressing independently eligible email delivery

#### Scenario: User disables email delivery
- **WHEN** a qualifying event occurs for a user whose email channel is disabled
- **THEN** the system SHALL suppress email delivery without suppressing independently eligible in-app state

#### Scenario: User disables an event category
- **WHEN** an event belongs to a disabled invitation, party-update, or follow category
- **THEN** the system SHALL suppress informational delivery for that category across enabled channels
- **AND** it SHALL leave unrelated categories unchanged

#### Scenario: Actionable request remains available when informational delivery is disabled
- **WHEN** a pending invitation or follow request exists while its recipient has disabled a channel or event category
- **THEN** the notification center SHALL still expose the authoritative pending action until it is accepted, declined, rejected, cancelled, or withdrawn

### Requirement: Notification delivery is channel-honest and failure-tolerant
PartyHub SHALL process committed notification events independently per recipient and supported channel. In-app and email are the supported notification channels in this contract. Push and SMS settings SHALL NOT imply available delivery until a configured adapter and client contract are accepted. Delivery attempts SHALL use the event identity to prevent duplicate in-app items, and an out-of-app failure SHALL NOT roll back domain state or a successfully persisted in-app item.

#### Scenario: Domain transition commits before channel delivery
- **WHEN** a qualifying domain transition and its event input commit successfully
- **THEN** the transition SHALL remain valid even if one or every delivery channel later fails

#### Scenario: In-app processing is retried
- **WHEN** processing of a committed event is retried for the same recipient
- **THEN** the system SHALL retain at most one informational in-app item for that event-recipient pair

#### Scenario: Email event is eligible
- **WHEN** email delivery is available, the recipient has a usable email address, and both the email channel and event category are enabled
- **THEN** the system SHALL attempt one email delivery for that event and recipient

#### Scenario: Email event is ineligible
- **WHEN** email delivery is unavailable, the recipient has no usable email address, or the email channel or event category is disabled
- **THEN** the system SHALL skip email without suppressing another eligible channel or changing domain state

#### Scenario: Email delivery fails
- **WHEN** the email adapter rejects or fails a notification attempt
- **THEN** the system SHALL retain the committed domain and in-app state, record the failed attempt for diagnosis, and SHALL NOT report that email as delivered

#### Scenario: Failed out-of-app delivery is retried
- **WHEN** an operator-approved or configured retry repeats a failed out-of-app attempt
- **THEN** it SHALL reuse the event-recipient-channel identity and SHALL NOT create a duplicate in-app item
- **AND** this contract SHALL NOT promise a delivery deadline or automatic retry schedule

#### Scenario: User enables an unsupported channel
- **WHEN** push or SMS has no accepted configured delivery adapter
- **THEN** the system SHALL keep that channel effectively disabled or report it unsupported and SHALL NOT claim successful delivery

#### Scenario: Authenticated user registers a device token for supported push
- **WHEN** push is supported and an authenticated user registers or replaces a device token
- **THEN** the system SHALL associate the token only with the caller-derived user and SHALL NOT accept a path or payload user identifier as authority

#### Scenario: Device permission or token is unavailable
- **WHEN** an iOS user denies notification permission or has no usable registered token
- **THEN** the system SHALL skip push delivery without disabling independently eligible in-app or email behavior

### Requirement: Welcome and digest emails have bounded behavior
PartyHub SHALL treat the welcome message as a one-time best-effort onboarding email for a newly created PartyHub profile with a usable address, outside the event-category preferences. The weekly party digest SHALL be an email-only summary governed by enabled email and party-update preferences and SHALL contain only parties that the recipient may view under the shared visibility contract. Neither email flow SHALL create an in-app notification or control identity/domain success.

#### Scenario: New profile receives a welcome email
- **WHEN** PartyHub creates a new profile with a usable email address and welcome-email delivery is available
- **THEN** the system SHALL attempt one welcome email after the profile is durably available
- **AND** it SHALL NOT create an informational notification-center item

#### Scenario: Welcome email cannot be sent
- **WHEN** the new profile has no usable address or welcome-email delivery fails
- **THEN** profile creation and authenticated identity linkage SHALL remain valid
- **AND** the system SHALL NOT report the email as delivered

#### Scenario: Recipient is eligible for a weekly digest
- **WHEN** the digest schedule runs for a user with enabled email and party-update preferences
- **THEN** the system SHALL build at most one email summary for that recipient from currently qualifying upcoming parties

#### Scenario: Digest applies recipient visibility
- **WHEN** a digest is built for an authenticated PartyHub user
- **THEN** it SHALL include public parties plus only private parties for which that recipient is a current Viewer
- **AND** it SHALL NOT reveal another user's private-party title, location, or schedule

#### Scenario: Recipient disables digest eligibility
- **WHEN** a user disables email or party-update preferences
- **THEN** the next scheduled digest SHALL skip that user without changing in-app notification behavior

#### Scenario: One digest delivery fails
- **WHEN** one recipient's digest rendering or email delivery fails
- **THEN** the system SHALL record the failure without creating an in-app item or preventing eligible digests for other recipients
