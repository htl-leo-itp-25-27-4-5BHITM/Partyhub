# Spec Delta

## ADDED Requirements

### Requirement: Earlier activity is reconstructed from notifications
PartyHub SHALL once add follow and attendance history for activity before history was recorded, using only notifications that identify the acting user, the affected user or party, the kind of event and its time: an accepted follow notification counts as the follower starting to follow the recipient; a host notification that a guest accepted an invitation counts as that guest joining the party; a host notification that a guest left counts as that guest leaving the party. A reconstructed entry SHALL use the notification's creation time and SHALL NOT duplicate an entry already recorded for the same users, party, kind and time. Activity without such a notification SHALL stay unrecorded rather than be estimated.

#### Scenario: Old accepted follow
- **WHEN** a notification from before history recording says user A follows user B now
- **THEN** the dashboard of B SHALL count A as a gained follower at that notification's time

#### Scenario: Old accepted invitation
- **WHEN** a host has a notification from before history recording that guest G accepted the invitation to party P
- **THEN** the host's dashboard SHALL count a join of G to P at that notification's time

#### Scenario: Activity already recorded live
- **WHEN** a follow or join was already recorded by the live history at the same time as its notification
- **THEN** the reconstruction SHALL NOT add a second entry for it

#### Scenario: Activity without a notification
- **WHEN** a guest joined a public party without an invitation, or a follower was removed, before history was recorded
- **THEN** that activity SHALL NOT appear in any time range
