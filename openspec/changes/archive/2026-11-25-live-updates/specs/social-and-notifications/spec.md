# Spec Delta

## ADDED Requirements

### Requirement: Notifications and follow state update live in the browser
PartyHub SHALL offer an authenticated live stream that tells the logged-in user, after a change was committed, that their notifications, follow relationships or party attendance changed, naming only the kind of change. The stream SHALL deliver only changes concerning the logged-in user and SHALL NOT contain notification content or other users' data; the browser SHALL reload the affected data through the regular endpoints. While a page is open, the notifications list, the inbox badge and the follower counts and follow button on the own profile SHALL reflect such a change within a few seconds without user action. If the stream is unavailable, the browser SHALL reconnect automatically and keep polling.

#### Scenario: Follow request arrives while the notifications page is open
- **WHEN** user A sends user B a follow request while B has the notifications page open
- **THEN** the request SHALL appear in B's list without B reloading the page

#### Scenario: Notification arrives on another page
- **WHEN** user B receives a new notification while B is on any page with the bottom navigation
- **THEN** the inbox badge SHALL update without B reloading the page

#### Scenario: Stream without login
- **WHEN** a caller without login opens the live stream
- **THEN** the system SHALL reject the request as unauthenticated
