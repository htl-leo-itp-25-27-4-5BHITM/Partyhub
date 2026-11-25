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

## Input and Access Security

- Protect writes with authentication and validate required bodies with `@NotNull @Valid`.
- Derive the acting user from `CurrentUserResolver`; never authorize from a user ID supplied in a URL/body/header. Check ownership, membership or recipient authority before changes and notifications.
- Party edits and invitations require the stored host. Private invitations also require mutual accepted follows. Profile and notification-setting edits require the profile owner.
- Keycloak owns identity provisioning through `/api/users/me`. `POST /api/users` cannot create arbitrary accounts; use authenticated `PUT /api/users/{ownId}` for profile changes.
- `X-User-Id` is strictly for explicitly enabled dev/test environments; NORMAL launch mode never accepts it. Numeric bearer subjects are not local database IDs. Unsupported custom QR login is disabled by default.

### Validation and output

`@TextInput` rejects control characters (`multiline=true` permits normal line breaks/tabs). `@Website` permits absolute HTTP(S) URLs without credentials. `@NoHtml` is a product rule, not a security boundary. Do not use the legacy `@SafeText` SQL-keyword blacklist for human text: apostrophes and SQL words can be legitimate data.

Party creation selects `OnCreate`, which extends the default validation group, so ordinary field constraints still execute. Constraints only run when the endpoint selects their group; `@Valid` alone does not activate arbitrary create/update groups.

Store ordinary text and serialize ordinary JSON through Jackson. Render browser text with `textContent`/`.value`, validate URL schemes, and keep template autoescaping enabled. Use context-specific HTML encoding only at HTML sinks. Bring-along JSON retains its existing encoded-text contract; decode it only for safe text rendering.

### Queries and files

- Bind all SQL/JPQL values as parameters; only server-owned fragments may choose identifiers/order clauses. No raw SQL without security review in the pull request.
- The CI regression tests cover SQL-looking input and cross-user access. There is no separate `java-sql-inspector` step.
- Validate actual raster contents and dimensions, not client filenames/MIME types. Use generated paths and storage containment. Each upload is limited to 5 MiB; aggregate multipart is 8 MiB. JSON input is limited to 256 KiB with nesting depth 32.
- Invalid requests must not produce partial state or notifications. Return safe JSON errors without rejected values or internal exception details.

Run `mvn clean test`, the Node tests, and the local Playwright security checks described in `docs/security-hardening.md` before merging security changes.
