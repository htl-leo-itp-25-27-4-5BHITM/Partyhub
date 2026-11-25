# Spec Delta

## MODIFIED Requirements

### Requirement: Social relationships use a follow-request model
The system SHALL model each follow as an independent directed relationship from an authenticated requester/follower to a different target/recipient. A follow of a public account SHALL be accepted immediately. A follow of a private account SHALL begin as pending, only its recipient SHALL accept or reject it, and acceptance SHALL create one accepted one-way relationship without creating the reverse relationship. Mutual contact SHALL require accepted relationships in both directions. Follows between users where one blocks the other SHALL be rejected.

#### Scenario: User initiates a follow
- **WHEN** authenticated user A requests to follow different private user B and no A-to-B relationship exists
- **THEN** the system SHALL create one pending A-to-B follow request instead of an accepted or reverse relationship

#### Scenario: User follows a public account
- **WHEN** authenticated user A follows different public user B and no A-to-B relationship exists
- **THEN** the system SHALL create one accepted A-to-B relationship without creating B-to-A
- **AND** it SHALL record that A started following B
- **AND** B SHALL receive one new-follower notification

#### Scenario: Recipient accepts a follow request
- **WHEN** target user B accepts A's pending A-to-B follow request
- **THEN** the system SHALL change that request to one accepted A-to-B relationship
- **AND** it SHALL NOT create or accept B-to-A automatically

#### Scenario: Mutual contact is evaluated
- **WHEN** the system determines whether users A and B are mutual contacts
- **THEN** it SHALL require accepted A-to-B and B-to-A relationships
- **AND** a pending or missing direction SHALL make mutual contact false

#### Scenario: User attempts to follow themselves
- **WHEN** authenticated user A requests an A-to-A follow
- **THEN** the system SHALL reject the request without creating a relationship

#### Scenario: User attempts to follow across a block
- **WHEN** A requests to follow B while A blocks B or B blocks A
- **THEN** the system SHALL reject the request without creating a relationship or notification

#### Scenario: Pending request is repeated
- **WHEN** A requests B while one pending A-to-B request already exists
- **THEN** the system SHALL keep the single pending relationship without creating a duplicate

#### Scenario: Accepted request is repeated
- **WHEN** A requests B while an accepted A-to-B relationship already exists
- **THEN** the system SHALL keep that accepted relationship without creating a duplicate or changing it to pending

#### Scenario: Non-recipient attempts acceptance
- **WHEN** a user other than B attempts to accept A's pending request to B
- **THEN** the system SHALL reject the action and leave the relationship pending

#### Scenario: Requester cancels a pending request
- **WHEN** requester A cancels the pending A-to-B request
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Recipient rejects a pending request
- **WHEN** recipient B rejects the pending A-to-B request
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Follower stops following
- **WHEN** follower A removes their accepted A-to-B relationship
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: Recipient removes a follower
- **WHEN** recipient B removes accepted follower A
- **THEN** the system SHALL remove A-to-B and leave B-to-A unchanged

#### Scenario: One direction is removed from a mutual contact
- **WHEN** A-to-B and B-to-A are accepted and either directed relationship is removed
- **THEN** the users SHALL no longer be mutual contacts
- **AND** the other accepted direction SHALL remain unchanged

### Requirement: Profiles support social discovery and party context
PartyHub SHALL provide authenticated profile discovery and party context through shared backend contracts with explicit client scope. The browser SHALL support profile search, another-user profile navigation, social actions and profile party context, subject to account privacy and blocks. The iOS minimum SHALL support the authenticated user's own profile and accepted follower/following counts; browser-only social controls SHALL NOT imply iOS parity.

#### Scenario: User searches for another user
- **WHEN** an authenticated user searches by a supported profile identifier
- **THEN** the system SHALL search the distinct profile handle case-insensitively and return matching bounded profile summaries, leaving out users who block or are blocked by the searcher
- **AND** it SHALL allow navigation to the selected profile

#### Scenario: User views another profile
- **WHEN** an authenticated user opens another user's profile
- **THEN** the system SHALL show the bounded cross-user profile projection and the relationship context that the privacy and blocking rules allow that viewer

#### Scenario: Profile-created parties are listed
- **WHEN** an authenticated user who may see the profile content views parties created by another user from that user's profile
- **THEN** the system SHALL show public parties and private parties to which the viewing user was invited
- **AND** opening the profile SHALL NOT grant additional private-party access

#### Scenario: Profile parties of a private account are requested by a non-follower
- **WHEN** a user who is not an accepted follower requests the profile party list of a private account
- **THEN** the system SHALL reject the request as forbidden

#### Scenario: User views their own created parties
- **WHEN** an authenticated user views the party context on their own profile
- **THEN** the system SHALL show the parties they host that are available under the party visibility contract

#### Scenario: Anonymous caller requests profile discovery
- **WHEN** a caller without an authenticated PartyHub session searches for users or requests profile/social data
- **THEN** the system SHALL reject the profile/social request without returning user or relationship data

#### Scenario: iOS user opens their own profile
- **WHEN** an authenticated iOS user opens the profile surface
- **THEN** the client SHALL show the backend-resolved self profile and accepted follower/following counts
- **AND** the absence of cross-user search or follow controls SHALL NOT be treated as a failure of this iOS minimum

### Requirement: Profile and social reads use audience-specific projections
PartyHub SHALL return explicit audience-specific profile projections rather than serializing internal user records. A cross-user profile SHALL include only the numeric profile reference, display name, distinct handle, biography, profile-picture reference or placeholder, accepted follower/following counts, and whether the account is private. An authenticated self projection MAY additionally include provider username, email, phone number, gender, birth date and pending e-mail change state. Keycloak subject links, device tokens and other internal fields SHALL NOT be returned by profile search, profile reads, relationship status, follow lists or pending-request reads. Gender and birth date SHALL NOT appear in any projection other than the self projection.

#### Scenario: Search returns a bounded profile summary
- **WHEN** an authenticated user searches for profiles
- **THEN** each result SHALL contain only the profile reference, display name, distinct handle and profile-picture reference or placeholder needed for selection

#### Scenario: Cross-user profile is returned
- **WHEN** an authenticated user reads another user's profile
- **THEN** the response SHALL use the bounded cross-user projection including the private flag
- **AND** it SHALL exclude email, phone number, gender, birth date, provider username, Keycloak subject and device token

#### Scenario: Self profile is returned
- **WHEN** an authenticated user reads their own profile
- **THEN** the response MAY include that user's provider username, email, phone number, gender, birth date and pending e-mail change state in addition to the cross-user fields
- **AND** it SHALL exclude Keycloak subject and device token

#### Scenario: Accepted follow list is returned
- **WHEN** an authenticated profile viewer who may see the profile content requests accepted followers or following users
- **THEN** the system SHALL return only accepted relationships and a bounded cross-user profile projection for each listed user, leaving out users who block or are blocked by the viewer

#### Scenario: Pending follow requests are read
- **WHEN** an authenticated user requests their pending incoming follow requests
- **THEN** the system SHALL return only requests addressed to that user using bounded requester summaries
- **AND** another user SHALL NOT read that pending inbox by changing a path identifier

#### Scenario: Relationship status is read
- **WHEN** an authenticated user requests follow status with a target user
- **THEN** the system SHALL report only the caller's directed relationship to that target
- **AND** path or query identifiers SHALL NOT authorize inspection as another actor

### Requirement: Authenticated users manage only their own editable profile
PartyHub SHALL allow an authenticated user to update only their own display name, distinct handle, phone number, biography, gender and birth date from the edit-profile settings sub-page. The e-mail address SHALL change only through the e-mail change flow; a profile update SHALL NOT change it. Gender and birth date SHALL be optional; gender SHALL be one of male, female, diverse or not specified, and a birth date SHALL lie in the past. Database ID, provider username, Keycloak subject, device token and other internal fields SHALL remain outside profile editing. The distinct handle SHALL identify at most one profile, SHALL be 3 to 30 characters and SHALL contain only letters, digits, dots and underscores when it is changed; an unchanged older handle SHALL stay valid. The browser SHALL show validation errors at the field, enable saving only when a value changed, show progress and the result of saving, and ask before leaving the page with unsaved changes.

#### Scenario: User updates their editable profile fields
- **WHEN** an authenticated user submits valid editable values for their own profile
- **THEN** the system SHALL persist those values and return the updated self profile projection

#### Scenario: Profile update contains an e-mail address
- **WHEN** a profile update includes a different e-mail address
- **THEN** the system SHALL ignore that field and keep the stored e-mail unchanged

#### Scenario: User leaves gender and birth date empty
- **WHEN** an authenticated user saves their profile without gender or birth date
- **THEN** the system SHALL accept the update and store no value for the empty fields

#### Scenario: User submits a birth date in the future
- **WHEN** an authenticated user submits a birth date that is not in the past
- **THEN** the system SHALL reject the update without partially changing the stored profile

#### Scenario: User attempts to update another profile
- **WHEN** an authenticated user targets another user's profile for an update
- **THEN** the system SHALL reject the update without changing that profile

#### Scenario: Update includes an internal or immutable field
- **WHEN** a profile update attempts to change the database ID, provider username, Keycloak subject, device token or another non-editable field
- **THEN** the system SHALL reject or ignore that field without changing the protected value

#### Scenario: Distinct handle conflicts with another profile
- **WHEN** a user selects a distinct handle already assigned to another profile
- **THEN** the system SHALL reject the conflicting update, preserve the user's previous handle and the browser SHALL show the error at the handle field

#### Scenario: Profile update fails validation
- **WHEN** any submitted editable value fails the accepted profile validation contract
- **THEN** the system SHALL reject the update without partially changing the stored profile

#### Scenario: Nothing was changed
- **WHEN** a user opens the edit-profile sub-page and changes no value
- **THEN** the save button SHALL be disabled

#### Scenario: User leaves with unsaved changes
- **WHEN** a user changed a field and navigates away without saving
- **THEN** the browser SHALL ask whether to discard the changes and stay on the page if the user declines

### Requirement: Notification preferences are same-user and independently effective
PartyHub SHALL maintain one effective notification-settings state per user. It SHALL contain a master switch, the in-app and email channels, and the categories `partyInvites` (invitations and their withdrawal), `invitationResponses` (accepts, declines and leaves reported to the host), `partyUpdates` (party changes and the weekly digest), `partyCancellations`, `followEvents` (follow requests, accepted requests and new followers) and `unfollows`. The master switch, channels and categories SHALL default enabled; for profiles that existed before `invitationResponses`, `partyCancellations` and `unfollows` were introduced, those SHALL start with the value of `partyInvites`, `partyUpdates` and `followEvents` respectively. Push and SMS SHALL default disabled while those channels are unsupported. Only the authenticated user SHALL read or replace their settings. When the master switch is off, no informational in-app item or email SHALL be delivered; the stored channel and category values SHALL be kept and SHALL apply again when the master switch is turned on. Channel and category gates SHALL otherwise be evaluated independently, and a missing legacy settings row SHALL resolve to these defaults rather than disabling delivery or exposing another user's state. Security e-mails SHALL NOT be governed by these settings. The browser SHALL show these settings on the notifications settings sub-page and SHALL show the individual switches disabled but with their values while the master switch is off.

#### Scenario: New profile receives notification defaults
- **WHEN** PartyHub creates a new user profile
- **THEN** it SHALL establish enabled master, in-app, email and all category preferences
- **AND** it SHALL keep unsupported push and SMS preferences disabled

#### Scenario: Legacy profile has no settings row
- **WHEN** an authenticated user without stored settings reads or updates notification preferences
- **THEN** the system SHALL use the documented effective defaults and materialize one same-user settings state when persistence is required

#### Scenario: User reads their settings
- **WHEN** an authenticated user requests their own notification settings
- **THEN** the system SHALL return the complete effective master, channel and category state

#### Scenario: User targets another user's settings
- **WHEN** an authenticated user attempts to read or update another user's notification settings
- **THEN** the system SHALL reject the action without disclosing or changing those settings

#### Scenario: User replaces settings
- **WHEN** an authenticated user submits a complete valid settings state for themselves
- **THEN** the system SHALL replace all master, channel and category values atomically or preserve the prior state on failure

#### Scenario: User turns the master switch off
- **WHEN** a qualifying event occurs for a user whose master switch is off
- **THEN** the system SHALL deliver no informational in-app item and no email for it

#### Scenario: User turns the master switch on again
- **WHEN** a user with `partyUpdates` off and all other categories on turns the master switch off and on again
- **THEN** `partyUpdates` SHALL still be off and the other categories SHALL still be on

#### Scenario: User disables in-app informational delivery
- **WHEN** a qualifying event occurs for a user whose in-app channel is disabled
- **THEN** the system SHALL suppress that event's informational in-app item without suppressing independently eligible email delivery

#### Scenario: User disables email delivery
- **WHEN** a qualifying event occurs for a user whose email channel is disabled
- **THEN** the system SHALL suppress email delivery without suppressing independently eligible in-app state

#### Scenario: User disables an event category
- **WHEN** an event belongs to a disabled category
- **THEN** the system SHALL suppress informational delivery for that category across enabled channels
- **AND** it SHALL leave unrelated categories unchanged

#### Scenario: Actionable request remains available when informational delivery is disabled
- **WHEN** a pending invitation or follow request exists while its recipient has disabled the master switch, a channel or an event category
- **THEN** the notification center SHALL still expose the authoritative pending action until it is accepted, declined, rejected, cancelled, or withdrawn

#### Scenario: Security e-mail with all notifications off
- **WHEN** a user with the master switch off requests an e-mail change
- **THEN** the confirmation and notice e-mails SHALL still be sent

## ADDED Requirements

### Requirement: Followed users are told when someone stops following
When an accepted follower A stops following B by their own action, B SHALL receive one unfollow notification in the `unfollows` category. Removing a follower, declining or cancelling a request, and follows ended by a block SHALL NOT create an unfollow notification.

#### Scenario: Follower unfollows
- **WHEN** accepted follower A unfollows B
- **THEN** B SHALL receive one unfollow notification naming A

#### Scenario: Follow ends through a block
- **WHEN** B blocks A and A's follow of B is removed
- **THEN** neither A nor B SHALL receive an unfollow notification

#### Scenario: Unfollows are switched off
- **WHEN** B has `unfollows` disabled and A unfollows B
- **THEN** B SHALL receive no unfollow notification

### Requirement: Profile owners can remove their profile picture
An authenticated user SHALL be able to remove their own custom profile picture from the edit-profile sub-page after a confirmation. Afterwards the profile SHALL show the stable placeholder. Another user SHALL NOT remove it.

#### Scenario: User removes their picture
- **WHEN** a user with a custom picture confirms removing it
- **THEN** their profile SHALL show the placeholder picture

#### Scenario: User removes another user's picture
- **WHEN** an authenticated user attempts to remove another user's profile picture
- **THEN** the system SHALL reject the action and keep that picture
