# Spec Delta

## ADDED Requirements

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
