# Spec Delta

## ADDED Requirements

### Requirement: Browser lets users remove their own followers
The browser SHALL let a user remove an accepted follower from the followers list of their own profile, after a confirmation, and SHALL let a recipient decline a pending follow request from the notifications page. Removing a follower SHALL delete only that follower's relationship to the user and SHALL be recorded like an unfollow; declining SHALL delete the pending request without recording history. Only the follower or the followed user SHALL be able to remove a relationship.

#### Scenario: User removes a follower
- **WHEN** user B opens the followers list on their own profile and confirms removing follower A
- **THEN** A SHALL no longer follow B and B's dashboard SHALL be able to count A as a lost follower

#### Scenario: User declines a follow request
- **WHEN** user B declines A's pending follow request on the notifications page
- **THEN** the request SHALL be deleted and A SHALL NOT follow B

#### Scenario: Third user tries to remove a relationship
- **WHEN** user C tries to remove the follow from A to B
- **THEN** the system SHALL reject the request as forbidden and keep the relationship

### Requirement: Own follow state is read without other users' requests
The browser SHALL determine whether the caller follows a profile, has a pending request to it, or neither, through a read that only reports the caller's own relationship, and SHALL NOT read another user's pending-request inbox for that purpose. The pending-request inbox SHALL be readable only by its recipient.

#### Scenario: Viewer sees their pending request on a profile
- **WHEN** user A has sent B a follow request and opens B's profile
- **THEN** the profile SHALL show the request as pending without A reading B's pending requests

#### Scenario: Another user reads a pending inbox
- **WHEN** user C requests B's pending follow requests
- **THEN** the system SHALL reject the request as forbidden
