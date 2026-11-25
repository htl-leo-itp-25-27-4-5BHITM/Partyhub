# Spec Delta

## Purpose

Lets users decide who can follow them and see their profile content, block other users completely, and share a link to their own profile.

## ADDED Requirements

### Requirement: Accounts are private or public
Each account SHALL be either private or public, switchable on the privacy sub-page. Accounts that existed before this capability SHALL start private, so their behaviour does not change until the user switches. Accounts created after this capability SHALL start public. Only the account owner SHALL change this setting, and every cross-user profile read SHALL tell whether the account is private.

#### Scenario: Existing account after the update
- **WHEN** a user who registered before this capability opens the privacy sub-page
- **THEN** "Private account" SHALL be on

#### Scenario: New account after the update
- **WHEN** a user registers after this capability was introduced and opens the privacy sub-page
- **THEN** "Private account" SHALL be off and other users SHALL be able to follow them directly

#### Scenario: Another user tries to change the setting
- **WHEN** an authenticated user attempts to change another user's privacy setting
- **THEN** the system SHALL reject the request without changing it

### Requirement: Private profiles hide content from non-followers
For a private account, a viewer who is not the owner and not an accepted follower SHALL see only the profile picture, display name, handle, biography, follower and following counts and the follow control. The server SHALL refuse that viewer the follower list, following list, the profile's party list, favourites and media. Accepted followers and the owner SHALL see the full profile. Public parties hosted by the account SHALL stay visible in party discovery under the party visibility rules.

#### Scenario: Non-follower opens a private profile
- **WHEN** a user who does not follow private account B opens B's profile
- **THEN** the profile SHALL show B's picture, name, handle, biography and counts with a "This account is private" note
- **AND** requests for B's follower list, following list, parties, favourites or media SHALL be rejected as forbidden

#### Scenario: Accepted follower opens a private profile
- **WHEN** an accepted follower of private account B opens B's profile
- **THEN** the profile SHALL show B's parties, followers and following

#### Scenario: Anyone opens a public profile
- **WHEN** any logged-in user who is not blocked opens public account C's profile
- **THEN** the profile SHALL show C's full profile content

### Requirement: Switching privacy keeps followers and settles requests
Switching from public to private SHALL keep every accepted follower; only new follows SHALL become requests. Switching from private to public SHALL first show a confirmation dialog that explains that all open follow requests will be accepted; after confirmation the system SHALL accept every pending incoming request in the same change, record each as a started follow and notify each requester once.

#### Scenario: Public account switches to private
- **WHEN** public account B with followers A1 and A2 switches to private
- **THEN** A1 and A2 SHALL remain accepted followers

#### Scenario: Private account with open requests switches to public
- **WHEN** private account B with pending requests from A1 and A2 confirms switching to public
- **THEN** A1 and A2 SHALL become accepted followers of B and each SHALL receive one follow-accepted notification

#### Scenario: User cancels switching to public
- **WHEN** private account B dismisses the confirmation dialog
- **THEN** B SHALL stay private and the pending requests SHALL stay pending

### Requirement: Follow requests can be reviewed from the privacy settings
The privacy sub-page SHALL show the number of pending incoming follow requests and link to the notifications page, where they can be accepted or declined.

#### Scenario: Private account has pending requests
- **WHEN** private account B with three pending requests opens the privacy sub-page
- **THEN** it SHALL show "3 follow requests" linking to the notifications page

### Requirement: Users can block other users
A user SHALL be able to block another user from that user's profile through a "…" menu and a confirmation dialog. A user SHALL NOT block themselves. Blocking SHALL be silent: the blocked user SHALL receive no notification. A block SHALL stay until the blocker removes it.

#### Scenario: User blocks another user
- **WHEN** user A opens B's profile, chooses "Block" and confirms
- **THEN** the system SHALL store that A blocks B and B SHALL receive no notification

#### Scenario: User tries to block themselves
- **WHEN** a user attempts to block their own account
- **THEN** the system SHALL reject the request

#### Scenario: Block is repeated
- **WHEN** A blocks B while A already blocks B
- **THEN** the system SHALL keep the single block

### Requirement: Blocking separates both users
When A blocks B, the system SHALL remove the follow relationships and pending follow requests in both directions (recording ended accepted follows as history, without unfollow notifications), withdraw pending private-party invitations between them, and from then on in both directions: reject profile reads as not found, leave each other out of user search, follower and following lists and "friends attending" context, leave parties hosted by the other out of party discovery, and reject follow requests and private-party invitations.

#### Scenario: Blocked users followed each other
- **WHEN** A and B are mutual followers and A blocks B
- **THEN** neither SHALL follow the other afterwards

#### Scenario: Blocked user searches for the blocker
- **WHEN** B, blocked by A, searches for A's handle
- **THEN** A SHALL NOT appear in the results

#### Scenario: Blocker opens the blocked profile
- **WHEN** A opens B's profile URL
- **THEN** the system SHALL answer as if the profile did not exist

#### Scenario: Blocked user tries to follow
- **WHEN** B sends A a follow request
- **THEN** the system SHALL reject it without creating a request or notification

#### Scenario: Host invites a blocked user
- **WHEN** host A includes B in a private-party invitation while one blocks the other
- **THEN** the system SHALL reject that invitation

#### Scenario: Party discovery after a block
- **WHEN** B lists or maps parties after A blocked B
- **THEN** parties hosted by A SHALL NOT be returned to B, and parties hosted by B SHALL NOT be returned to A

### Requirement: Blocked accounts are listed and can be unblocked
The blocked-accounts sub-page SHALL list the user's own blocks with avatar, display name and handle, and an "Unblock" button with confirmation. With no blocks it SHALL show an empty state. Unblocking SHALL remove the block only; previous follows SHALL NOT be restored. Only the blocker SHALL read or remove their blocks.

#### Scenario: User unblocks someone
- **WHEN** A unblocks B after confirming
- **THEN** A and B SHALL see each other again but SHALL NOT follow each other

#### Scenario: No accounts are blocked
- **WHEN** a user without blocks opens the blocked-accounts sub-page
- **THEN** the page SHALL show "You haven't blocked anyone"

#### Scenario: User tries to read another user's blocks
- **WHEN** an authenticated user requests another user's block list
- **THEN** the system SHALL reject the request

### Requirement: Users can share their profile link
The share sub-page SHALL offer "Share profile", which SHALL open the browser's native share dialog with the own profile link when available and otherwise copy the link and show "Link copied". The link SHALL identify the profile by its handle. Opening the link SHALL show the profile under the privacy and blocking rules; a logged-out visitor SHALL be sent through login and then shown the profile.

#### Scenario: Browser supports native sharing
- **WHEN** a user presses "Share profile" in a browser with native sharing
- **THEN** the native share dialog SHALL open with the profile link

#### Scenario: Browser has no native sharing
- **WHEN** a user presses "Share profile" in a browser without native sharing
- **THEN** the link SHALL be copied and "Link copied" SHALL appear

#### Scenario: Logged-out visitor opens a shared link
- **WHEN** a visitor without login opens a shared profile link
- **THEN** the browser SHALL send them to login and afterwards show that profile

#### Scenario: Blocked user opens a shared link
- **WHEN** B, blocked by A, opens A's shared profile link
- **THEN** the browser SHALL show that the profile is not available
