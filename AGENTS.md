# PartyHub Keycloak Theme Documentation

## Theme Location
`keycloak/themes/partyhub/`

## Theme Structure
- `login/` - Main login theme directory
  - `css/styles.css` - Custom base styles (gradient backgrounds, card styling)
  - `css/login.css` - PatternFly component overrides (login form, buttons, alerts)
  - `footer.ftl` - Custom footer with PartyHub links
  - `messages/messages_en.properties` - English i18n strings
  - `theme.properties` - Theme configuration (parent=base, imports)

## CSS Framework
Based on PatternFly (Keycloak's default):
- `.pf-c-login__main` - Main login container
- `.pf-c-login__header-title` - Header title
- `.pf-c-form-field__input` - Input fields
- `.pf-c-button--primary` - Primary buttons
- `.pf-c-alert` - Error/info alerts
- `.pf-c-login__links` - Link buttons

## Theme Configuration
```
parent=base
import=common/keycloak
styles=css/styles.css css/login.css css/login.css
```
Note: `login.css` listed twice for proper cascade in some Keycloak versions.

## Design System
- **Primary color**: Deep purple (`--ph-primary: #1a1040`)
- **Accent pink**: `--ph-accent-pink: #ff2e63`
- **Accent green**: `--ph-accent-green: #56f27c`
- **Font**: Montserrat (Google Fonts)
- **Border**: Subtle white/transparent (`--ph-border`)

## Development
- Test with: `mvn quarkus:dev`
- Keycloak UI: `http://localhost:8080/q/dev-ui/`
- Swagger docs: `http://localhost:8080/q/swagger-ui/`

## Customization
To modify the theme:
1. Edit `css/styles.css` for global styles (gradients, backgrounds)
2. Edit `css/login.css` for PatternFly component overrides
3. Update `footer.ftl` for custom footer links
4. Add translations in `messages/messages_en.properties`

## Keycloak Integration
- In-memory H2 for tests (`jdbc:h2:mem:testdb`)
- PostgreSQL for dev/prod
- JWT authentication via SmallRye JWT
- Theme applied via realm settings in Admin Console

## Server-Side Validation

All REST endpoints use Hibernate Validator with `@Valid` annotation for automatic request validation.

### Usage

```java
@POST
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public Response createParty(@Valid PartyCreateDto dto) {
    // If validation fails, returns HTTP 400 automatically
}
```

### Custom Constraints

Custom constraints are in `src/main/java/at/htl/validation/`:

| Constraint | Description |
|------------|-------------|
| `@SafeText` | Rejects SQL injection patterns in string inputs |
| `@ValidPartyName` | Validates party names (2-100 chars, valid characters) |
| `@NoHtml` | Rejects HTML tags in inputs |

### Validation Groups

Use groups for create vs update:

```java
public record PartyCreateDto(
    @NotBlank(groups = {OnCreate.class, OnUpdate.class})
    String title
) {}
```

- `OnCreate.class` - Required on creation
- `OnUpdate.class` - Required on update

### Output Encoding

When echoing user input in responses, use OWASP Java Encoder:

```java
import org.owasp.encoder.Encode;

String safeOutput = Encode.forHtml(userInput);
```

### SQL Security

- All queries use parameterized statements via Hibernate ORM
- No raw SQL without security review in pull request
- CI runs java-sql-inspector to detect hardcoded SQL literals