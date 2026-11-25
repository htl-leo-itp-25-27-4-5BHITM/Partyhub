# Spec Delta

## ADDED Requirements

### Requirement: Party guest list updates live on the detail page
While a logged-in user who may see a party has its detail page open, the browser SHALL update the guest list (joined guests, or for private parties the invited guests with their status) and the attendee count without a reload after another user joins or leaves the party or an invitation to it is created, answered or withdrawn. The live notice SHALL only be delivered to users who may see the party and SHALL NOT contain guest data; the browser SHALL reload the list through the regular endpoints. Without a live connection the page SHALL re-check at least every 15 seconds while visible.

#### Scenario: Guest joins while the host views the party
- **WHEN** a guest joins a public party while its host has the detail page open
- **THEN** the guest SHALL appear in the host's guest list without a reload

#### Scenario: Invitee accepts while the host views a private party
- **WHEN** an invited user accepts the invitation while the host has the private party's detail page open
- **THEN** the guest's status in the host's list SHALL change from pending to accepted without a reload

#### Scenario: User without access opens the live notice
- **WHEN** a logged-in user who may not see a private party opens its live stream
- **THEN** the system SHALL respond as not found
