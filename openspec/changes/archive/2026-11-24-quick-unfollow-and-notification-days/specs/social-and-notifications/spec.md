# Spec Delta

## ADDED Requirements

### Requirement: Follow requests record when they were sent
PartyHub SHALL store the time a follow request was sent and SHALL include it in the recipient's pending-request read, so the request can be ordered with other notifications. Requests sent before the time was stored SHALL remain valid without a time.

#### Scenario: New follow request
- **WHEN** user A sends user B a follow request
- **THEN** B's pending-request read SHALL return the request with the time it was sent

### Requirement: Browser notification list is ordered by time, grouped by day and guards actions
The browser notification page SHALL list notifications, pending invitations and pending follow requests together, newest first, in one section per calendar day labelled "Today", "Yesterday" or the date. Pending requests without a known time SHALL appear first in an "Open requests" section; other items without a time SHALL appear last. The whole page SHALL scroll, without an inner scroll area. While an accept, decline or delete request for an item is running, all action buttons of that item SHALL be disabled and the pressed button SHALL show a loading indicator until the server answered and the list was refreshed, so repeated clicks cannot send the request again.

#### Scenario: New follow request arrives
- **WHEN** a user receives a follow request after older notifications
- **THEN** the request SHALL appear at the top in the "Today" section

#### Scenario: User presses accept twice
- **WHEN** a user presses the accept button of a follow request and presses it again before the request finished
- **THEN** the browser SHALL send only one accept request and SHALL show the button as loading until the request is gone from the list
