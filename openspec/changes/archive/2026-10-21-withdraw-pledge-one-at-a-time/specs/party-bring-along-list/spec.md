# Spec Delta

## MODIFIED Requirements

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
