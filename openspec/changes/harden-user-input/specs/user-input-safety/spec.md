## ADDED Requirements

### Requirement: Domain input is validated before effects
Non-iOS server components SHALL apply field-specific type, requiredness, length, range and collection rules before persistence, filesystem writes or notification dispatch. Create/update rules SHALL run at their intended endpoints. HTTP validation failures SHALL return safe structured 400 responses without rejected values or internal exception details. Oversized bodies SHALL return 413. Existing authentication and authorization statuses SHALL remain distinct.

#### Scenario: Missing body
- **WHEN** a write endpoint requiring an object receives null or an empty body
- **THEN** it SHALL return 400 without dereferencing the body or changing domain state

#### Scenario: Create-specific constraint
- **WHEN** a party creation request omits its required start time
- **THEN** it SHALL return 400 before creating the party or invitations

#### Scenario: Invalid cross-field values
- **WHEN** a party request contains unpaired coordinates or non-finite/out-of-range coordinates
- **THEN** it SHALL return 400 without partial effects

#### Scenario: Invalid collection element
- **WHEN** a bounded input list exceeds its maximum or contains an invalid element
- **THEN** the entire write SHALL fail without partial effects

#### Scenario: Invalid numeric shape
- **WHEN** an integer quantity receives a fractional value, numeric string or overflowing integer
- **THEN** the server SHALL return 400 rather than round, coerce or persist the value

### Requirement: Valid human text remains usable
The system SHALL accept legitimate Unicode text and punctuation within each field's domain policy and SHALL NOT reject free text solely for SQL keywords or apostrophes. Explicit no-markup product rules SHALL remain separate from injection prevention. Identity subjects and passwords SHALL NOT be rewritten by generic text normalization.

#### Scenario: Legitimate item name
- **WHEN** a host submits a bring-along name such as `Family reunion snacks` or `Jack's crisps`
- **THEN** the request SHALL pass text validation if the other field rules hold

#### Scenario: International display name
- **WHEN** an allowed-length display name contains accented characters or non-Latin letters
- **THEN** it SHALL remain intact through storage and rendering

### Requirement: User-controlled values render as data
Browser renderers SHALL use safe text sinks or context-correct encoding for user-controlled values from APIs, identity claims, local storage, URL parameters and third-party responses. Stored historical text SHALL receive the same protections. Untrusted values SHALL NOT enter executable HTML, event-handler or script contexts. HTML templates SHALL preserve automatic escaping except for explicitly reviewed sanitized/trusted content.

#### Scenario: Stored profile payload
- **WHEN** a returned profile name contains `<img src=x onerror=alert(1)>`
- **THEN** profile search and username lists SHALL render it as inert text without creating an image or executing a handler

#### Scenario: Imported identity name
- **WHEN** a Keycloak-provisioned profile contains markup-like display text
- **THEN** all browser views SHALL render it inertly regardless of its authenticated origin

#### Scenario: Template interpolation
- **WHEN** a welcome email or Keycloak page interpolates a user name containing angle brackets and quotes
- **THEN** the resulting document SHALL preserve the value as text without injecting elements or attributes

### Requirement: URLs are validated for their purpose
External party websites SHALL be absent or parsed absolute HTTP(S) URLs with a host and without credentials or control characters. Writes with unsafe nonblank URLs SHALL fail with 400. Browser rendering SHALL suppress unsafe historical links. Application return destinations SHALL stay on the application's origin.

#### Scenario: Disallowed website protocol
- **WHEN** a party website uses a javascript, data, file or protocol-relative URL
- **THEN** the write SHALL fail and existing unsafe values SHALL NOT become clickable links

#### Scenario: Valid website
- **WHEN** a party website is a valid HTTPS URL containing a query and fragment
- **THEN** it SHALL remain usable and render without attribute injection

#### Scenario: External return destination
- **WHEN** a stored or URL-derived login return destination points to another origin
- **THEN** the browser SHALL use a safe internal fallback

### Requirement: Alternate provisioning applies shared policies
Keycloak-driven profile provisioning SHALL enforce shared field bounds and accepted claim types before storing or mailing profile data. Invalid optional claims SHALL use documented safe fallback/omission behavior without altering the authenticated subject or weakening existing identity-linking rules.

#### Scenario: Malformed optional claim
- **WHEN** provisioning receives an oversized display name or structurally invalid email claim
- **THEN** it SHALL follow the documented fallback policy without storing an out-of-policy value, sending mail to the invalid address or returning an internal error

### Requirement: Queries and searches treat values as data
Database operations SHALL bind user-controlled values as parameters and select dynamic identifiers/order fragments only from server-owned choices. Search, paging, token and cursor inputs SHALL have explicit size/range rules and bounded result sizes. SQL-looking text SHALL NOT modify query structure.

#### Scenario: SQL-looking search text
- **WHEN** an allowed-length search contains quotes or SQL keywords
- **THEN** it SHALL be processed as a bound value without changing query structure

#### Scenario: Excessive pagination
- **WHEN** a caller requests a page limit above 100 or an invalid offset
- **THEN** the server SHALL return 400 without issuing an unbounded query

### Requirement: Uploads enforce bounded safe file handling
Profile and gallery upload handlers SHALL enforce 5 MiB per-file limits, a documented aggregate request limit, supported raster formats, bounded structural validation, generated filenames and storage containment. Gallery requests SHALL contain 1–20 files. The entire batch SHALL be validated before persistent side effects. Client filename/extensions/content types SHALL NOT determine acceptance. User-supplied SVG/HTML SHALL be rejected.

#### Scenario: Spoofed image
- **WHEN** an uploaded file has an image extension or signature prefix but fails structural validation
- **THEN** it SHALL be rejected without storing a file or media record

#### Scenario: Oversized upload
- **WHEN** a file exceeds 5 MiB or a multipart body exceeds the configured aggregate limit
- **THEN** it SHALL be rejected before persistent side effects with a documented 400/413 response appropriate to the limit

#### Scenario: Traversal filename
- **WHEN** a valid raster image uses a filename containing parent-directory segments
- **THEN** storage SHALL use a generated filename inside the configured upload directory

### Requirement: Outbound and API payloads use correct serialization
JSON SHALL be produced by structured serialization, including notification payloads and error responses. Header values and device-token URI segments SHALL follow explicit validation rules. Plain-text mail bodies SHALL remain plain text. Logs SHALL NOT expose credentials/device tokens or permit request-derived control characters to forge log entries.

#### Scenario: Quoted push message
- **WHEN** a notification contains quotes, backslashes or line breaks
- **THEN** the outbound JSON SHALL parse and preserve the original message as one string

#### Scenario: Unsafe mail header
- **WHEN** a recipient or subject contains CR/LF header delimiters
- **THEN** dispatch SHALL reject the unsafe header without creating additional headers

### Requirement: Shared response contracts remain compatible
This change SHALL preserve existing response field names/types and the bring-along API's HTML-encoded text contract. Browser consumers SHALL render decoded bring-along text only through safe text sinks. Generic JSON output SHALL NOT gain global HTML encoding. Any later encoding-contract change SHALL be separately versioned or explicitly coordinated with all consumers.

#### Scenario: Existing bring-along consumer
- **WHEN** an item with ampersands or apostrophes is returned after hardening
- **THEN** its encoded response contract SHALL remain unchanged and the browser SHALL display the original text safely

### Requirement: Regression coverage verifies input boundaries
CI SHALL exercise malicious and legitimate input through affected HTTP and rendering flows, template rendering and outbound serialization. Tests SHALL verify rejection before side effects and preserve ownership/visibility behavior. Configuration tests SHALL cover request limits at the backend independently of ingress. Conditional planning/live endpoints SHALL receive equivalent coverage if retained.

#### Scenario: Historical stored payload
- **WHEN** browser tests load a pre-existing malicious profile or unsafe website
- **THEN** the tests SHALL verify safe rendering even without a new write passing validation

#### Scenario: Rejected write has no effects
- **WHEN** API tests submit a malformed or invalid request
- **THEN** they SHALL verify unchanged domain records and no file or notification side effects

### Requirement: Object actions require the authenticated actor's authority
The backend SHALL require party-host ownership for edits and invitation creation, mutual accepted follow relationships for private invitations, profile/settings ownership for updates, and the affected recipient's authority for invitation/notification actions. A user-supplied ID SHALL NOT substitute for authenticated identity. Private read endpoints SHALL NOT disclose hidden party data.

#### Scenario: Attacker edits another host's party
- **WHEN** an authenticated non-owner sends an edit or deletion request for another host's party
- **THEN** the operation SHALL fail without changing the party, its host or notifications

#### Scenario: Attacker manufactures access to a private party
- **WHEN** a non-host tries to create a private-party invitation for themselves
- **THEN** the backend SHALL reject the request without creating an invitation or membership

#### Scenario: Intended recipient accepts an invitation
- **WHEN** the authenticated intended recipient accepts a valid invitation
- **THEN** the backend SHALL permit the action while denying another caller using the same invitation ID

### Requirement: Deployed identity boundaries cannot be bypassed
NORMAL launch mode SHALL ignore X-User-Id authentication, even when a bypass setting is enabled. Numeric bearer subjects SHALL be resolved as identity-provider subjects rather than local user IDs. Arbitrary POST profile provisioning SHALL be denied; Keycloak SHALL own identity provisioning. Unsupported QR login routes SHALL be disabled by default.

#### Scenario: Anonymous profile creation
- **WHEN** an anonymous request tries to manufacture a profile through POST /api/users
- **THEN** it SHALL receive 401 without creating a profile

#### Scenario: Authenticated arbitrary profile creation
- **WHEN** a signed-in caller submits a new identity through POST /api/users
- **THEN** it SHALL receive 403 without creating an unlinked identity record

#### Scenario: Numeric bearer subject
- **WHEN** a validated bearer token has a numeric subject equal to another user's local database ID
- **THEN** the backend SHALL NOT select that local user merely because the subject is numeric

#### Scenario: Deployed header bypass attempt
- **WHEN** a deployed server receives X-User-Id without a valid bearer token
- **THEN** it SHALL NOT authenticate the caller from that header
