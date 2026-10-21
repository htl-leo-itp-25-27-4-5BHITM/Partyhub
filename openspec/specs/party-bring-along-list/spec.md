# party-bring-along-list Specification

## Purpose
Lets a party host publish a list of items with required quantities that guests should bring, and lets attendees pledge how much of each item they bring so everyone can see what is still missing and when an item is covered.

## Requirements

### Requirement: Bring-along list access is limited to party members
The system SHALL expose a party's bring-along list only to authenticated party members: the host and joined attendees. A caller who cannot view the party SHALL receive "not found". An authenticated caller who can view the party but is neither host nor joined attendee SHALL be denied with "forbidden". Anonymous callers SHALL be rejected as unauthenticated.

#### Scenario: Attendee reads the list
- **WHEN** a joined attendee requests the bring-along list of their party
- **THEN** the system SHALL return all items of that party with their pledges

#### Scenario: Host reads the list
- **WHEN** the host requests the bring-along list of their party
- **THEN** the system SHALL return all items of that party with their pledges

#### Scenario: Non-member reads the list of a visible party
- **WHEN** an authenticated user who can view a public party but has not joined it requests its bring-along list
- **THEN** the system SHALL respond with 403 and SHALL NOT return items

#### Scenario: Caller cannot view the party
- **WHEN** an authenticated user requests the bring-along list of a private party they are not invited to, or of a party that does not exist
- **THEN** the system SHALL respond with 404

#### Scenario: Anonymous caller
- **WHEN** an unauthenticated caller requests or changes a bring-along list
- **THEN** the system SHALL respond with 401

### Requirement: List entries show quantities, pledges and fulfilment
Each bring-along item returned by the system SHALL include its identifier, name, optional unit, required quantity, pledged total (sum of all pledges), remaining quantity (required minus pledged, never below zero), a `fulfilled` flag that is true exactly when the pledged total is greater than or equal to the required quantity, and the list of pledges. Each pledge SHALL include the pledging user's identifier, display name and pledged quantity. Items SHALL be returned in creation order.

#### Scenario: Partially covered item
- **WHEN** an item requires 3 and one attendee pledged 1
- **THEN** the item SHALL show pledged total 1, remaining 2, `fulfilled` false, and one pledge naming that attendee with quantity 1

#### Scenario: Fully covered item
- **WHEN** an item requires 3 and pledges sum to 3
- **THEN** the item SHALL show remaining 0 and `fulfilled` true

#### Scenario: Item without pledges
- **WHEN** an item has no pledges
- **THEN** the item SHALL show pledged total 0, remaining equal to the required quantity, `fulfilled` false and an empty pledge list

### Requirement: Host manages bring-along items
The host SHALL be able to add, edit and delete items on their party's bring-along list. An item SHALL have a name (1–100 characters, plain text), a required quantity (whole number 1–10000; decimal values SHALL be rejected, not rounded) and an optional unit (up to 30 characters, plain text). Non-host members SHALL NOT be able to add, edit or delete items. Deleting an item SHALL also delete all its pledges. Invalid input SHALL be rejected with 400 and SHALL NOT change stored data.

#### Scenario: Host adds an item
- **WHEN** the host adds an item named "Chips" with quantity 3 and unit "Packung"
- **THEN** the system SHALL store the item and return it with pledged total 0 and `fulfilled` false

#### Scenario: Attendee tries to add an item
- **WHEN** a joined attendee who is not the host tries to add, edit or delete an item
- **THEN** the system SHALL respond with 403 and leave the list unchanged

#### Scenario: Host edits an item
- **WHEN** the host changes the name, unit or required quantity of an item
- **THEN** the system SHALL store the new values and recompute remaining quantity and `fulfilled` from the existing pledges

#### Scenario: Host lowers quantity below pledged total
- **WHEN** the host sets the required quantity of an item below its current pledged total
- **THEN** the system SHALL accept the change, keep all existing pledges, report remaining 0 and `fulfilled` true

#### Scenario: Host deletes an item
- **WHEN** the host deletes an item that has pledges
- **THEN** the system SHALL remove the item and all of its pledges

#### Scenario: Invalid item input
- **WHEN** an item is submitted with a blank name, HTML or unsafe text in name or unit, a decimal quantity such as 1.5, or a quantity outside 1–10000
- **THEN** the system SHALL respond with 400 and not change the list

#### Scenario: Item belongs to another party
- **WHEN** a request addresses an item identifier that does not belong to the party in the path
- **THEN** the system SHALL respond with 404

### Requirement: Members pledge what they bring
The host and joined attendees SHALL be able to set, change and withdraw their own pledge for an item. Each user SHALL have at most one pledge per item; setting a pledge again SHALL replace the previous quantity. A pledge quantity SHALL be a whole number of at least 1; decimal values SHALL be rejected, not rounded. A pledge SHALL be rejected with 409 when it would raise the item's pledged total above its required quantity; the user's own previous pledge on that item SHALL NOT count against this limit. A user SHALL NOT be able to change or withdraw another user's pledge.

#### Scenario: Attendee pledges part of an item
- **WHEN** an item requires 3, nothing is pledged, and an attendee pledges 1
- **THEN** the system SHALL store the pledge and return the item with pledged total 1 and remaining 2

#### Scenario: Second attendee completes an item
- **WHEN** an item requires 3, 1 is pledged by another user, and an attendee pledges 2
- **THEN** the system SHALL store the pledge and return the item with `fulfilled` true

#### Scenario: Attendee changes their pledge
- **WHEN** an attendee who pledged 1 sets their pledge on the same item to 2 and the remaining quantity allows it
- **THEN** the system SHALL replace the quantity with 2 and keep a single pledge for that user

#### Scenario: Pledge exceeds remaining quantity
- **WHEN** an item requires 3, 3 are already pledged by other users, and an attendee pledges 1
- **THEN** the system SHALL respond with 409, include the current remaining quantity (0) in the response, and not change any pledge

#### Scenario: Attendee lowers their pledge
- **WHEN** an item requires 4, one attendee pledged 4, and that attendee changes their pledge to 3
- **THEN** the item SHALL show remaining 1 and `fulfilled` false
- **AND** another member SHALL be able to pledge 1 for that item

#### Scenario: Attendee withdraws their pledge
- **WHEN** an attendee withdraws their pledge on an item
- **THEN** the system SHALL remove that pledge and recompute the item's totals

#### Scenario: Invalid pledge quantity
- **WHEN** a pledge is submitted with a quantity below 1, a decimal quantity such as 1.5, or no quantity
- **THEN** the system SHALL respond with 400 and not change any pledge

#### Scenario: Non-member tries to pledge
- **WHEN** an authenticated user who has not joined the party and is not its host tries to pledge
- **THEN** the system SHALL respond with 403 (or 404 if they cannot view the party)

### Requirement: Pledges follow party membership and lifecycle
Pledges SHALL only exist for current party members. When an attendee leaves a party, the system SHALL remove all of that user's pledges on the party's bring-along list in the same transaction. When a party, an item or a user is deleted, the related items and pledges SHALL be deleted with it.

#### Scenario: Attendee leaves the party
- **WHEN** an item requires 3, attendee A pledged 2, attendee B pledged 1, and attendee A leaves the party
- **THEN** the system SHALL remove A's pledges, the item SHALL show remaining 2 and `fulfilled` false
- **AND** another member SHALL be able to pledge up to 2 for that item

#### Scenario: Party is deleted
- **WHEN** the host deletes a party that has a bring-along list
- **THEN** the system SHALL delete all items and pledges of that party

### Requirement: Party detail page shows the bring-along list
The web party detail page SHALL show the bring-along list to the host and joined attendees. Each item SHALL show its name, unit, pledged and required quantity (e.g. "2 / 3 Packung"), the members who pledged with their quantities, and a green check mark when the item is fulfilled. Members SHALL be able to set, change and withdraw their own pledge; the withdraw control SHALL lower the member's own pledge by exactly one per use and SHALL remove the pledge only when it was 1; the quantity input SHALL accept only whole numbers from 1 up to what is still open for that member. The host SHALL additionally be able to add, edit and delete items. Non-members SHALL NOT see the list content.

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

#### Scenario: Non-member opens the detail page
- **WHEN** a user who has not joined the party and is not the host opens the detail page
- **THEN** the page SHALL NOT show the list content and SHALL show a hint that joining the party is required to see it

#### Scenario: Member withdraws one unit
- **WHEN** a member who pledged 3 of an item presses "Withdraw"
- **THEN** their pledge SHALL become 2, the item SHALL show one more open unit, and the member SHALL still be listed with quantity 2

#### Scenario: Member withdraws the last unit
- **WHEN** a member whose pledge is 1 presses "Withdraw"
- **THEN** their pledge SHALL be removed and they SHALL no longer be listed for that item

### Requirement: Bring-along list stays current without reloading
The system SHALL keep every member's open view of a bring-along list up to date automatically. After any committed change to a party's list – item added, edited or deleted, pledge set, changed or withdrawn, pledges removed because an attendee left, or the party deleted – the system SHALL notify all connected members of that party, and the web detail page SHALL show the new state within 5 seconds without any user action. Change notifications SHALL only be delivered to callers who pass the same access check as reading the list, and SHALL NOT contain item names, quantities or user data; clients SHALL fetch the current list after a notification. Notifications SHALL only be sent after the change is committed; a rejected or rolled-back request SHALL NOT produce one. If the live connection is lost or unavailable, the page SHALL keep refreshing the list at least every 5 seconds while the page is visible and reconnect automatically.

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
- **WHEN** an authenticated user who is neither host nor joined attendee opens the live change stream of a party
- **THEN** the system SHALL respond with 403 (or 404 if they cannot view the party) and SHALL NOT deliver notifications

#### Scenario: Rejected change sends no notification
- **WHEN** a pledge is rejected with 409 or 400
- **THEN** the system SHALL NOT send a change notification

#### Scenario: Live connection drops
- **WHEN** the live connection of an open detail page breaks (network loss, server restart, expired token)
- **THEN** the page SHALL keep showing the current list by refreshing at least every 5 seconds while visible and SHALL try to reconnect with a fresh token

#### Scenario: Page becomes visible again
- **WHEN** a member returns to a detail page that was in a background tab
- **THEN** the page SHALL fetch the current list immediately

### Requirement: Party wizard includes a bring-along step
The web add-party and edit-party wizard SHALL contain an optional "Bring-along" step after the "Details" step and before the final "Map" step. In this step the host SHALL be able to add, edit and remove bring-along items using the same item rules as elsewhere (name 1–100 characters plain text, whole-number quantity 1–10000, optional unit up to 30 characters). Invalid item input SHALL be marked at the field and SHALL NOT be added to the list. The host SHALL be able to continue with an empty list. Item changes made in the wizard SHALL only be stored when the host saves the party; leaving the wizard without saving SHALL NOT change the stored list.

#### Scenario: Host creates a party with items
- **WHEN** the host adds "Chips" ×3 "Packung" and "Cola" ×4 in the Bring-along step and creates the party
- **THEN** the system SHALL create the party and both items, and the party's bring-along list SHALL show them with nothing pledged

#### Scenario: Host skips the step
- **WHEN** the host continues past the Bring-along step without adding items and creates the party
- **THEN** the system SHALL create the party with an empty bring-along list

#### Scenario: Invalid item in the wizard
- **WHEN** the host tries to add an item with an empty name, a decimal quantity such as 1.5, or a quantity outside 1–10000
- **THEN** the wizard SHALL show a message at the item form and SHALL NOT add the item

#### Scenario: Host edits a party's items
- **WHEN** the host opens the edit wizard of an existing party
- **THEN** the Bring-along step SHALL show the current items with their pledged and required quantity
- **AND** added, changed and removed items SHALL be stored when the host saves the party

#### Scenario: Host removes an item that has pledges
- **WHEN** the host removes an item with pledges in the edit wizard
- **THEN** the wizard SHALL ask for confirmation stating that the pledges are removed too, and only remove the item after confirmation

#### Scenario: Host leaves without saving
- **WHEN** the host changes items in the Bring-along step and leaves the wizard without saving
- **THEN** the stored bring-along list SHALL stay unchanged

#### Scenario: Some items cannot be stored
- **WHEN** the party is saved but storing one or more items fails
- **THEN** the wizard SHALL tell the host which items were not saved and SHALL open the party detail page, where the host can add them
