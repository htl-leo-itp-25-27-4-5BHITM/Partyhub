# Keycloak Integration Setup Guide - PartyHub

## Overview

PartyHub now uses **Keycloak 26.0.0** for enterprise-grade identity and access management (IAM). This replaces the previous commented-out JWT setup with full OAuth2/OIDC authentication.

## Quick Start

### 1. Start Services

```bash
# Start Keycloak (port 8180) + PostgreSQL (port 5432)
docker-compose up -d

# Wait for Keycloak to start (~30 seconds)
# Check: http://localhost:8180 -> Admin Console
```

### 2. Build & Run PartyHub

```bash
# Build the project
mvn clean install

# Run in dev mode (port 8080)
mvn quarkus:dev

# Access API: http://localhost:8080
# Swagger UI: http://localhost:8080/q/swagger-ui/
```

### 3. Test Authentication

```bash
# Get a token
curl -X POST http://localhost:8180/realms/party-realm/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=party-client" \
  -d "client_secret=secret123" \
  -d "username=alice" \
  -d "password=alicepwd"

# Response: Access token (JWT)
```

## Architecture

### Components

1. **Keycloak Server**: Identity provider at `http://localhost:8080`
2. **PartyHub Backend**: Resource server with OIDC client integration
3. **PostgreSQL**: Database for both Keycloak and PartyHub

### User Model

The `User` entity now includes Keycloak integration:

```java
@Entity
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = true)
    private String keycloakId;        // UUID from Keycloak

    @Column(unique = true, nullable = true)
    private String username;           // Keycloak username (alice, bob, carol)

    private String displayName;        // Display name (Alice Smith)
    private String distinctName;       // Unique handle (@alice)
    private String email;              // Email
    private String biography;          // User bio

    @OneToOne(cascade = CascadeType.ALL, mappedBy = "user")
    private ProfilePicture profilePicture;

    @ManyToMany(mappedBy = "users")
    private Set<Party> party;
}
```

## Configuration

### Environment Variables

#### `src/main/resources/application.properties`

```properties
# Keycloak OIDC Configuration
quarkus.oidc.auth-server-url=http://keycloak:8080/realms/party-realm
quarkus.oidc.client-id=party-client
quarkus.oidc.credentials.client-secret.value=secret123
quarkus.oidc.token.authorization-scheme=Bearer
quarkus.oidc.token.verify-aud=false

# Secured endpoints - require authentication
quarkus.http.auth.permission.authenticated.paths=/api/parties,/api/users,/follow
quarkus.http.auth.permission.authenticated.policy=authenticated

# Public endpoints - accessible without authentication
quarkus.http.auth.permission.public.paths=/api/users/*/profile-picture*,/q/swagger-ui*,/q/openapi*
quarkus.http.auth.permission.public.policy=permit
```

### Docker Compose

Updated to include Keycloak service on port 8180:

```yaml
keycloak:
  container_name: keycloak
  image: quay.io/keycloak/keycloak:26.0.0
  command: start-dev --import-realm
  environment:
    KEYCLOAK_ADMIN: admin
    KEYCLOAK_ADMIN_PASSWORD: admin
    KC_DB: postgres
    KC_DB_URL: jdbc:postgresql://postgres:5432/demo
    KC_DB_USERNAME: demo
    KC_DB_PASSWORD: demo
    KC_HOSTNAME_STRICT_HTTPS: 'false'
    KC_HOSTNAME: localhost
  ports:
    - "8180:8080"  # External: 8180, Internal: 8080
  volumes:
    - ./keycloak/realm-export.json:/opt/keycloak/data/import/realm-export.json:ro
```

## Test Users

Pre-configured in `keycloak/realm-export.json`:

| Username | Password | Email | Display Name |
|----------|----------|-------|--------------|
| alice | alicepwd | alice@example.com | Alice Smith |
| bob | bobpwd | bob@example.com | Bob Johnson |
| carol | carolpwd | carol@example.com | Carol Williams |

## REST API Endpoints

### Authentication

**Get Token (Login)**
```
POST /realms/party-realm/protocol/openid-connect/token
Content-Type: application/x-www-form-urlencoded

grant_type=password
client_id=party-client
client_secret=secret123
username=alice
password=alicepwd
```

Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cC...",
  "token_type": "Bearer",
  "expires_in": 300,
  "refresh_expires_in": 1800,
  "refresh_token": "..."
}
```

### User Endpoints

**Get Current User (Authenticated)**
```
GET /api/users/me
Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": 1,
  "keycloakId": "keycloak-uuid",
  "username": "alice",
  "displayName": "Alice Smith",
  "distinctName": "alice",
  "email": "alice@example.com",
  "biography": "Party enthusiast and event organizer",
  "profilePicture": { ... }
}
```

**Get User by ID**
```
GET /api/users/{id}
```

**Get User by Username**
```
GET /api/users/username/{username}
```

**Update User Profile (Authenticated)**
```
PUT /api/users/{id}
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "displayName": "Alice Smith Updated",
  "distinctName": "alice_smith",
  "email": "alice.new@example.com",
  "biography": "Updated bio"
}
```

**Upload Profile Picture (Public)**
```
POST /api/users/{id}/upload-profile-picture
Content-Type: multipart/form-data

file: <image_file>
```

**Get Profile Picture**
```
GET /api/users/{id}/profile-picture
```

## Key Features

### 1. Token-based Authentication

All protected endpoints require a valid JWT access token from Keycloak:

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjAwMC...
```

### 2. User Synchronization

When a user with a valid token accesses `/api/users/me`:

1. **Find existing user** by `keycloakId` (UUID from token)
2. **Fallback to username** lookup
3. **Auto-create user** from token if not found
4. **Sync all claims** from token (username, email, displayName, biography)

### 3. Custom User Attributes

Token claims available through `KeycloakContextService`:

```java
@Inject
KeycloakContextService keycloakContext;

public void someMethod() {
    String username = keycloakContext.getUsername();
    String email = keycloakContext.getEmail();
    String displayName = keycloakContext.getDisplayName();
    String biography = keycloakContext.getBiography();
    boolean authenticated = keycloakContext.isAuthenticated();
}
```

### 4. Role-based Access Control (RBAC)

Define roles in Keycloak and use in PartyHub:

```java
@Authenticated
@RolesAllowed("user")
public Response protectedEndpoint() { }
```

## Database Migrations

### New Columns Added to `users` Table

```sql
ALTER TABLE users ADD COLUMN keycloak_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN username VARCHAR(255) UNIQUE;
```

These are created automatically via Hibernate on first startup (dev mode).

For production, add to schema manually:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS keycloak_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255) UNIQUE;
```

## Integration Examples

### Example 1: Login Flow (Frontend)

```javascript
// 1. Get token from Keycloak
const token = await getKeycloakToken('alice', 'alicepwd');

// 2. Store token (localStorage, sessionStorage, etc.)
localStorage.setItem('access_token', token);

// 3. Use token in API calls
const response = await fetch('http://localhost:8080/api/users/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const user = await response.json();
console.log(user);
```

### Example 2: Protected Service

```java
@ApplicationScoped
public class PartyService {
    @Inject
    KeycloakContextService keycloakContext;

    @Authenticated
    public Party hostParty(PartyDto dto) {
        String userId = keycloakContext.getKeycloakUserId();
        String username = keycloakContext.getUsername();
        
        Party party = new Party();
        party.setTitle(dto.title());
        party.setCreatedAt(LocalDateTime.now());
        
        return party;
    }
}
```

### Example 3: Public vs Protected

```java
@ApplicationScoped
@Path("/api/events")
public class EventResource {
    
    // Public - anyone can list
    @GET
    @Path("/all")
    public Response listEvents() { }
    
    // Protected - requires authentication
    @POST
    @Authenticated
    public Response createEvent(EventDto dto) { }
    
    // Public - specific endpoint
    @GET
    @Path("/{id}/details")
    public Response getEventDetails(@PathParam("id") long id) { }
}
```

## Troubleshooting

### Token Validation Fails

```
Error: Token not valid
```

**Causes:**
1. Token expired (check `expires_in`)
2. Wrong client ID/secret
3. Realm URL mismatch

**Solutions:**
```properties
# Verify in application.properties
quarkus.oidc.auth-server-url=http://keycloak:8080/realms/party-realm
quarkus.oidc.client-id=party-client

# Refresh token to get new one
curl -X POST http://localhost:8180/realms/party-realm/protocol/openid-connect/token \
  -d "grant_type=refresh_token" \
  -d "refresh_token=<refresh_token>" \
  -d "client_id=party-client" \
  -d "client_secret=secret123"
```

### Keycloak Not Starting

```bash
# Check logs
docker-compose logs keycloak

# Ensure ports are free
lsof -i :8180  # Keycloak
lsof -i :5432  # PostgreSQL
lsof -i :8080  # PartyHub

# Restart
docker-compose down
docker-compose up -d
```

### User Auto-sync Issues

Check `KeycloakUserService.getOrCreateCurrentUser()`:

```java
// Debugger breakpoint here
Optional<User> user = keycloakUserService.getOrCreateCurrentUser();
```

## Production Deployment

### Security Checklist

- [ ] Use HTTPS for Keycloak (set `KC_HOSTNAME_STRICT_HTTPS=true`)
- [ ] Use strong secrets (change `secret123`)
- [ ] Enable brute force protection in Keycloak
- [ ] Configure password policies
- [ ] Enable HTTPS for all endpoints
- [ ] Use environment variables (not hardcoded secrets)
- [ ] Set up admin MFA
- [ ] Configure CORS properly
- [ ] Monitor token expiration and refresh

### Environment Variables for Prod

```bash
export KEYCLOAK_ADMIN=admin
export KEYCLOAK_ADMIN_PASSWORD=<strong_password>
export KC_DB_PASSWORD=<strong_db_password>
export KC_HOSTNAME=keycloak.example.com
export KC_HOSTNAME_STRICT_HTTPS=true
export QUARKUS_OIDC_CREDENTIALS_CLIENT_SECRET_VALUE=<strong_client_secret>
```

## Advanced Features

### MFA (Multi-Factor Authentication)

1. Keycloak Admin Console
2. Authentication → Flows
3. Add TOTP or WebAuthn
4. Bind to realm

### Social Login

1. Keycloak Admin Console
2. Identity Providers
3. Add Google/GitHub/Facebook
4. Configure OAuth credentials

### User Federation (LDAP/AD)

1. Keycloak Admin Console
2. User Federation
3. Add LDAP Provider
4. Configure connection details
5. Map LDAP attributes to Keycloak user fields

### Custom Mappers

Pre-configured in `realm-export.json`:

- `username` → `username` claim
- `email` → `email` claim
- `firstName` → `given_name` claim
- `lastName` → `family_name` claim
- `displayName` → `display_name` claim
- `biography` → `biography` claim

## API Changes Summary

| Feature | Before | After |
|---------|--------|-------|
| Auth | None (commented out) | Full OIDC with JWT |
| User ID | Long (DB auto-increment) | Long + keycloakId (UUID) |
| Username | distinctName only | username + distinctName |
| Token validation | N/A | Automatic via Quarkus |
| Profile data | Limited | Full sync from Keycloak |
| User creation | Manual | Auto from token (on first login) |

## File Locations

- **Keycloak Realm Config**: `keycloak/realm-export.json`
- **Quarkus Config**: `src/main/resources/application.properties`
- **User Entity**: `src/main/java/at/htl/user/User.java`
- **User Repository**: `src/main/java/at/htl/user/UserRepository.java`
- **Keycloak Context**: `src/main/java/at/htl/keycloak/KeycloakContextService.java`
- **User Service**: `src/main/java/at/htl/user/KeycloakUserService.java`
- **User Resource**: `src/main/java/at/htl/user/UserResource.java`

## Next Steps

1. **Test authentication flow** with curl/Postman
2. **Update frontend** to use new token-based auth
3. **Add role-based endpoints** using `@RolesAllowed`
4. **Configure production Keycloak** with real domain
5. **Set up user registration** endpoint
6. **Implement password reset** flow
7. **Add MFA** for sensitive operations

## Support & Resources

- Keycloak Docs: https://www.keycloak.org/documentation
- Quarkus OIDC: https://quarkus.io/guides/oidc
- OAuth 2.0: https://tools.ietf.org/html/rfc6749
- OpenID Connect: https://openid.net/connect/
