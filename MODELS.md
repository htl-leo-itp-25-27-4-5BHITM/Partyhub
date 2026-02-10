# PartyHub Domain Models

## Overview
A social event platform with users, parties, invitations, media sharing, and follow relationships.

---

## Entities

### User (`at.htl.user.User`)
Platform users who host or attend parties.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | |
| `displayName` | String | | Public display name |
| `distinctName` | String | | Unique username |
| `email` | String | | Contact email |
| `biography` | String | nullable | User bio |
| `profileImage` | String | nullable | URL to profile picture |

**Relationships:**
- `@ManyToMany(mappedBy="users") Set<Party> party` - Parties user attends
- Used as `host_user` in Party (host)
- Used in Invitation (sender/recipient)
- Used in Media (uploader)

---

### Party (`at.htl.party.Party`)
Events that users can create and attend.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | |
| `host_user` | User | FK | Party creator |
| `category` | Category | FK, not null | Party type |
| `title` | String | | Event title |
| `time_start` | LocalDateTime | | Start datetime |
| `time_end` | LocalDateTime | | End datetime |
| `max_people` | int | | Capacity limit |
| `min_age` | int | | Minimum age |
| `max_age` | int | | Maximum age |
| `website` | String | | External link |
| `description` | String | | Event details |
| `fee` | Double | | Entry fee |
| `created_at` | LocalDateTime | auto | Creation timestamp |
| `location` | Location | FK, not null | Event location |

**Relationships:**
- `@OneToMany List<Media> media` - Event photos/videos
- `@ManyToMany Set<User> users` - Attendees
- `@OneToMany Set<Invitation> invitations` - Sent invites

---

### Location (`at.htl.location.Location`)
Geographic locations for parties.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | Hidden from JSON |
| `longitude` | double | | GPS longitude |
| `latitude` | double | | GPS latitude |
| `name` | String | | Location name |

---

### Category (`at.htl.category.Category`)
Party classification types.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | |
| `name` | String | | Category name |

---

### Invitation (`at.htl.invitation.Invitation`)
Party invitations between users.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | |
| `sender` | User | FK | Inviter |
| `recipient` | User | FK | Invitee (hidden in JSON) |
| `party` | Party | FK | Target event |

---

### Media (`at.htl.media.Media`)
Photos/videos shared at parties.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | Long | PK, auto-generated | |
| `party` | Party | FK | Associated event |
| `user` | User | FK | Uploader |
| `url` | String | | Media URL |

---

### Follow (`at.htl.follow.Follow`)
User following relationships.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `user1_id` | Long | PK, FK | Follower |
| `user2_id` | Long | PK, FK | Following |
| `status` | FollowStatus | FK, not null | Relationship state |

**Note:** Composite PK (user1_id, user2_id)

---

### FollowStatus (`at.htl.follow.FollowStatus`)
Follow relationship states.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `status_id` | Long | PK | Status identifier |
| `name` | String | | Status label |

---

## DTOs (Data Transfer Objects)

### PartyCreateDto
Request body for creating parties.

```
String title
String description
Double fee
String time_start (ISO datetime)
String time_end (ISO datetime)
Integer max_people
Integer min_age
Integer max_age
String website
Double latitude
Double longitude
String location_address
Long category_id
String theme
String visibility
List<String> selectedUsers (invitees)
```

### UserCreateDto
Request body for user registration.

```
String displayName
String distinctName
String email
String biography
String profilePicture
```

### InvitationDto
Request body for sending invitations.

```
Long recipient (user ID)
Long partyId
```

### MediaDto
Media response format.

```
Long id
Long partyId
String url
```

### FilterDto
Search/filter parameters.

```
String value (search term)
String start (date range start)
String end (date range end)
```

---

## Entity Relationships Diagram

```
User ||--o{ Party : hosts
User ||--o{ Party : attends
User ||--o{ Media : uploads
User ||--o{ Invitation : sends
User ||--o{ Invitation : receives
User ||--o{ Follow : follows (user1)
User ||--o{ Follow : followed_by (user2)

Party ||--o{ Media : has
Party ||--o{ Invitation : has
Party }o--|| Location : at
Party }o--|| Category : categorized_as
Party }o--|| User : hosted_by

Follow }o--|| FollowStatus : status
```

---

## Dynamic User Context API

The application supports runtime user switching without authentication, useful for testing and demo purposes.

### UserContext (`at.htl.user.UserContext`)

Stores and manages the currently active user in an `@ApplicationScoped` bean.

**Default User:** ID `1` (loaded on startup)

**Methods:**
- `getCurrentUserId()` → Returns the current user ID
- `getCurrentUser()` → Returns the current User entity
- `setCurrentUserId(Long)` → Validates and switches to user
- `resetToDefault()` → Resets to user ID 1

---

### UserContextResource Endpoints

Base path: `/api/user-context`

#### Get Current User
```
GET /api/user-context/current
```
**Response:** Full User object or 404

#### Get Current User ID
```
GET /api/user-context/current/id
```
**Response:** `{"userId": 1}`

#### Switch User by ID
```
POST /api/user-context/switch/{userId}
```
**Example:** `POST /api/user-context/switch/3`

**Response:**
```json
{
  "message": "User switched successfully",
  "userId": 3,
  "displayName": "Katrin Bauer",
  "distinctName": "katrin_b"
}
```

#### Switch User by Username
```
POST /api/user-context/switch-by-name/{distinctName}
```
**Example:** `POST /api/user-context/switch-by-name/michi_w`

#### Reset to Default
```
POST /api/user-context/reset
```
Resets current user to ID 1.

---

### Usage Examples

**cURL:**
```bash
# Switch to user ID 3
 curl -X POST http://localhost:8080/api/user-context/switch/3

# Check current user
curl http://localhost:8080/api/user-context/current

# Reset to default
curl -X POST http://localhost:8080/api/user-context/reset
```

**JavaScript:**
```javascript
// Switch user
await fetch('/api/user-context/switch/3', { method: 'POST' });

// Get current user
const response = await fetch('/api/user-context/current');
const user = await response.json();

// The UserSwitcher component provides convenience methods:
await UserSwitcher.switchUser(3);
const user = await UserSwitcher.getCurrentUser();
```

---

### Affected Operations

When you switch users, these operations use the new user context:
- **Party Creation** → New user becomes the host
- **Party Update** → Updated party host is set to current user
- **Party Delete** → Only current user's parties can be deleted
- **Attend Party** → Current user attends the party
- **Leave Party** → Current user leaves the party
- **Attendance Status** → Checks if current user is attending
- **Send Invitation** → Current user becomes the sender
- **View Received Invites** → Shows invites for current user
- **View Sent Invites** → Shows invites sent by current user

---

## Key Business Rules

1. **Party Hosting**: User creates party → becomes host_user
2. **Party Attendance**: Many-to-many User↔Party via party_user table
3. **Invitations**: Separate from attendance; invitation flow for private parties
4. **Media**: Linked to both Party and User (who uploaded)
5. **Follows**: Composite key prevents duplicate follow relationships
6. **Location**: Stored separately, reused across parties

---
