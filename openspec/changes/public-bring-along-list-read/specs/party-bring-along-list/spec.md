# Spec Delta

## MODIFIED Requirements

### Requirement: Bring-along list access is limited to party members
The system SHALL expose the full bring-along list (including pledges) only to authenticated party members: the host and joined attendees. For a **public** party, the system SHALL additionally expose a read-only, anonymised list to every caller who can view the party, including anonymous callers and authenticated users who have not joined. The anonymised list SHALL contain the same items with identifier, name, unit, required quantity, pledged total, remaining quantity and `fulfilled` flag, but SHALL NOT contain pledges or any user identifier or name. For a **private** party, a caller who cannot view the party SHALL receive "not found", and an authenticated caller who can view it but is neither host nor joined attendee SHALL be denied with "forbidden". Changing the list (items or pledges) SHALL always require an authenticated member; anonymous callers SHALL be rejected as unauthenticated.

#### Scenario: Attendee reads the list
- **WHEN** a joined attendee requests the bring-along list of their party
- **THEN** the system SHALL return all items of that party with their pledges

#### Scenario: Host reads the list
- **WHEN** the host requests the bring-along list of their party
- **THEN** the system SHALL return all items of that party with their pledges

#### Scenario: Non-member reads the list of a visible party
- **WHEN** an authenticated user who has not joined a public party and is not its host requests its bring-along list
- **THEN** the system SHALL respond with 200 and return all items with quantities and `fulfilled` flag, without pledges or user data

#### Scenario: Anonymous caller reads the list of a public party
- **WHEN** an unauthenticated caller requests the bring-along list of a public party
- **THEN** the system SHALL respond with 200 and return all items with quantities and `fulfilled` flag, without pledges or user data

#### Scenario: Non-member reads the list of a private party they can view
- **WHEN** an authenticated user who can view a private party (for example because they are invited) but has not joined it requests its bring-along list
- **THEN** the system SHALL respond with 403 and SHALL NOT return items

#### Scenario: Caller cannot view the party
- **WHEN** a caller requests the bring-along list of a private party they cannot view, or of a party that does not exist
- **THEN** the system SHALL respond with 404

#### Scenario: Anonymous caller
- **WHEN** an unauthenticated caller tries to add, edit or delete an item, or to set or withdraw a pledge
- **THEN** the system SHALL respond with 401 and leave the list unchanged

#### Scenario: Non-member tries to pledge on a public party
- **WHEN** an authenticated user who has not joined a public party tries to set a pledge
- **THEN** the system SHALL respond with 403 and leave the list unchanged

### Requirement: Party detail page shows the bring-along list
The web party detail page SHALL show the bring-along list to the host and joined attendees. Each item SHALL show its name, unit, pledged and required quantity (e.g. "2 / 3 Packung"), the members who pledged with their quantities, and a green check mark when the item is fulfilled. Members SHALL be able to set, change and withdraw their own pledge; the withdraw control SHALL lower the member's own pledge by exactly one per use and SHALL remove the pledge only when it was 1; the quantity input SHALL accept only whole numbers from 1 up to what is still open for that member. The host SHALL additionally be able to add, edit and delete items. For a public party, visitors who are not members (logged in or not) SHALL see a read-only list with each item's name, unit, pledged and required quantity and the green check mark, but without pledging users, pledge controls or item controls. For a private party, non-members SHALL NOT see the list content.

#### Scenario: Fulfilled item is marked
- **WHEN** a member opens the detail page and an item's pledges cover its required quantity
- **THEN** the item SHALL be shown with a green check mark and its pledge control SHALL indicate that nothing more is needed

#### Scenario: Member sees who brings what
- **WHEN** a member opens the detail page and an item has pledges
- **THEN** the item SHALL list each pledging user's display name with their quantity

#### Scenario: Pledge is rejected because the item is already covered
- **WHEN** a member submits a pledge and the server responds with 409 (for example because another user pledged in the meantime)
- **THEN** the page SHALL show a visible error at that item stating that only the returned remaining quantity is still needed
- **AND** the page SHALL reload the list so the displayed totals match the server

#### Scenario: Pledge input exceeds what is open
- **WHEN** a member enters more than is still open for them, a decimal, or a value below 1
- **THEN** the page SHALL mark the input as invalid, show a short message and not send the request

#### Scenario: Freed quantity becomes available
- **WHEN** a pledge is lowered or withdrawn, or a pledging attendee leaves, while other members have the detail page open
- **THEN** their pages SHALL show the increased open quantity, remove the green check mark if the item is no longer covered, and allow pledging again, without a manual reload

#### Scenario: Visitor opens the detail page of a public party
- **WHEN** a user who has not joined a public party and is not its host, or a visitor who is not logged in, opens its detail page
- **THEN** the page SHALL show the items with pledged and required quantity and the green check mark for fulfilled items
- **AND** the page SHALL NOT show who pledged, pledge controls or item controls
- **AND** the page SHALL show a hint that logging in (if not logged in) and joining the party is required to pledge

#### Scenario: Non-member opens the detail page
- **WHEN** a user who has not joined a private party and is not the host opens its detail page
- **THEN** the page SHALL NOT show the list content and SHALL show a hint that joining the party is required to see it

#### Scenario: Member withdraws one unit
- **WHEN** a member who pledged 3 of an item presses "Withdraw"
- **THEN** their pledge SHALL become 2, the item SHALL show one more open unit, and the member SHALL still be listed with quantity 2

#### Scenario: Member withdraws the last unit
- **WHEN** a member whose pledge is 1 presses "Withdraw"
- **THEN** their pledge SHALL be removed and they SHALL no longer be listed for that item

### Requirement: Bring-along list stays current without reloading
The system SHALL keep every member's open view of a bring-along list up to date automatically. After any committed change to a party's list – item added, edited or deleted, pledge set, changed or withdrawn, pledges removed because an attendee left, or the party deleted – the system SHALL notify all connected members of that party, and the web detail page SHALL show the new state within 5 seconds without any user action. Change notifications SHALL only be delivered to authenticated members (host and joined attendees), even when the list itself is publicly readable, and SHALL NOT contain item names, quantities or user data; clients SHALL fetch the current list after a notification. Notifications SHALL only be sent after the change is committed; a rejected or rolled-back request SHALL NOT produce one. If the live connection is lost or unavailable, the page SHALL keep refreshing the list at least every 5 seconds while the page is visible and reconnect automatically. Non-members viewing the read-only list of a public party SHALL NOT open a live connection; their page SHALL fetch the current list when it becomes visible again.

#### Scenario: Another member pledges
- **WHEN** user A and user B have the detail page open and user B pledges 1 for an item
- **THEN** user A's page SHALL show the new pledged total, user B's name with quantity 1, and the green check mark if the item is now covered, within 5 seconds and without reloading

#### Scenario: Host changes items
- **WHEN** the host adds, edits or deletes an item while attendees have the detail page open
- **THEN** the attendees' pages SHALL show the added, changed or removed item within 5 seconds

#### Scenario: Attendee leaves
- **WHEN** an attendee with pledges leaves the party while other members have the page open
- **THEN** the other members' pages SHALL show the freed quantity within 5 seconds

#### Scenario: Live connection is denied to non-members
- **WHEN** a caller who is neither host nor joined attendee opens the live change stream of a party, including a public party whose list they can read
- **THEN** the system SHALL respond with 401 if they are not logged in, otherwise with 403 (or 404 if they cannot view the party), and SHALL NOT deliver notifications

#### Scenario: Rejected change sends no notification
- **WHEN** a pledge is rejected with 409 or 400
- **THEN** the system SHALL NOT send a change notification

#### Scenario: Live connection drops
- **WHEN** the live connection of an open detail page breaks (network loss, server restart, expired token)
- **THEN** the page SHALL keep showing the current list by refreshing at least every 5 seconds while visible and SHALL try to reconnect with a fresh token

#### Scenario: Page becomes visible again
- **WHEN** a member or a visitor of a public party returns to a detail page that was in a background tab
- **THEN** the page SHALL fetch the current list immediately
