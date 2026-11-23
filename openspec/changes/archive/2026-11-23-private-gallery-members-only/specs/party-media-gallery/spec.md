# Spec Delta

## ADDED Requirements

### Requirement: Browser asks non-members of a private party to join before showing the gallery
The browser SHALL NOT show gallery content, a photo count, or an upload control of a private party to an authenticated user who is neither its host nor a joined attendee. It SHALL instead show that the gallery is available after joining the party.

#### Scenario: Pending invitee opens a private party
- **WHEN** a user with a pending invitation opens the detail page or the gallery page of a private party they have not joined
- **THEN** the browser SHALL show "Join the party to see the gallery" instead of photos, photo count, or upload control

#### Scenario: Invitee joins the party
- **WHEN** that user joins the party and opens the gallery again
- **THEN** the browser SHALL show the shared gallery and the upload control

## MODIFIED Requirements

### Requirement: Party galleries support media viewing in the current brownfield system
The system SHALL expose a party's server-backed media list and individual media content only through the same party Viewer boundary used for party details. Anonymous callers MAY view public-party media; private-party media SHALL require an authenticated host or joined attendee, like the bring-along list. A pending invitee who can view a private party's details but has not joined SHALL be refused the gallery as forbidden. Media and user-media projections SHALL NOT reveal items from a party the caller cannot view.

#### Scenario: User opens a party gallery
- **WHEN** a caller who can view a party opens that party's gallery
- **THEN** the system SHALL return the party's available server-backed media items and the client SHALL display them from the returned media identities

#### Scenario: Anonymous caller opens a public-party gallery
- **WHEN** an anonymous caller lists or serves media belonging to a public party
- **THEN** the system SHALL allow the request without granting upload or other authenticated mutation authority

#### Scenario: Authenticated viewer opens a private-party gallery
- **WHEN** an authenticated host or joined attendee lists or serves media belonging to a private party
- **THEN** the system SHALL return only media belonging to that party

#### Scenario: Pending invitee requests a private-party gallery
- **WHEN** an authenticated user with a pending invitation who has not joined a private party requests its media list
- **THEN** the system SHALL refuse the request as forbidden without disclosing the media list, item content, uploader, or storage reference

#### Scenario: Caller without private-party access requests media
- **WHEN** an anonymous or authenticated caller who is neither host nor joined attendee requests a private party's media list or an individual item from that party
- **THEN** the system SHALL deny the request without disclosing the media list, item content, uploader, or storage reference

#### Scenario: Party has no media
- **WHEN** a caller opens an accessible party gallery with no stored media
- **THEN** the system SHALL return an empty media collection and the client SHALL show an empty-gallery state

#### Scenario: Viewer requests an individual media item
- **WHEN** a caller with access to the owning party requests an existing media item whose backing image is available
- **THEN** the system SHALL return the image using its validated image media type without exposing a filesystem path

#### Scenario: Media or backing image is unavailable
- **WHEN** the party, media record, or backing image needed for a gallery request is unavailable
- **THEN** the system SHALL report an unavailable media result and the client SHALL show an item or gallery error state rather than broken content as a successful image

#### Scenario: User media projection is requested
- **WHEN** a caller requests media attributed to a user
- **THEN** the system SHALL include only items whose parties are visible to that caller and SHALL apply the same item-serving boundary to each result

### Requirement: Party gallery uploads are available to party viewers
The system SHALL allow an authenticated user to upload valid gallery images at any time to a public party they can view, and to a private party they host or have joined. Each uploaded item SHALL be non-empty JPEG, PNG, GIF, or WebP content no larger than 5 MiB. The server SHALL assign a safe opaque storage reference and SHALL NOT expose a usable media record when the corresponding image was not stored successfully.

#### Scenario: Party viewer uploads a photo
- **WHEN** an authenticated party Viewer uploads a valid image to that party's gallery
- **THEN** the system SHALL accept the upload without requiring the party end time to have passed and SHALL make the stored item available through the authorized gallery

#### Scenario: Anonymous public-party viewer uploads a photo
- **WHEN** an anonymous caller who may view a public party attempts to upload gallery media
- **THEN** the system SHALL require authentication and SHALL NOT create a media record or stored gallery file

#### Scenario: Pending invitee uploads to a private party
- **WHEN** an authenticated user with a pending invitation who has not joined a private party attempts to upload a photo to its gallery
- **THEN** the system SHALL reject the upload as forbidden without creating media or storage state

#### Scenario: User without party access uploads a photo
- **WHEN** an authenticated user who cannot view a party attempts to upload a photo to that party's gallery
- **THEN** the system SHALL reject the upload without creating media or storage state

#### Scenario: Upload contains no image
- **WHEN** an upload contains no file or an empty image item
- **THEN** the system SHALL reject it without creating media or storage state

#### Scenario: Upload uses an unsupported image type
- **WHEN** an upload is not JPEG, PNG, GIF, or WebP image content
- **THEN** the system SHALL reject it without trusting only the client-supplied filename extension

#### Scenario: Upload exceeds the file-size boundary
- **WHEN** an uploaded image is larger than 5 MiB
- **THEN** the system SHALL reject it without creating media or storage state

#### Scenario: Valid upload uses an unsafe client filename
- **WHEN** a valid image has a client filename containing path or unsupported filename characters
- **THEN** the system SHALL store it under a server-owned safe reference and SHALL NOT allow the client filename to select an arbitrary storage path

#### Scenario: Gallery image storage fails
- **WHEN** the system cannot persist the accepted image and its media metadata consistently
- **THEN** it SHALL report failure and SHALL NOT expose a gallery item whose backing image is unavailable because of that failed upload

### Requirement: Gallery items can be deleted by their uploader or the party host
The system SHALL allow an authenticated user to delete a gallery item when that user uploaded the item or hosts the item's party. A successful deletion SHALL remove the media record and its stored image so the item is no longer listed or served. Every other caller SHALL be refused without changing media or storage state, and a refusal for an item whose gallery the caller may not view SHALL NOT reveal whether the item exists. The uploader's right to delete SHALL NOT depend on still having gallery access.

#### Scenario: Uploader deletes their own photo
- **WHEN** the authenticated user who uploaded a gallery item deletes it
- **THEN** the system SHALL remove the item and its stored image, and the item SHALL no longer appear in the party media list, the user media projection, or be served individually

#### Scenario: Former attendee deletes their own photo
- **WHEN** a user who uploaded a photo to a private party and has since left it deletes that photo
- **THEN** the system SHALL remove the item and its stored image

#### Scenario: Party host deletes another user's photo
- **WHEN** the authenticated host of a party deletes a gallery item another user uploaded to that party
- **THEN** the system SHALL remove the item and its stored image

#### Scenario: Other viewer tries to delete a photo
- **WHEN** an authenticated user who can view the party, but neither uploaded the item nor hosts the party, tries to delete it
- **THEN** the system SHALL refuse the request as forbidden and SHALL keep the item and its stored image

#### Scenario: Anonymous caller tries to delete a photo
- **WHEN** an anonymous caller tries to delete a gallery item
- **THEN** the system SHALL require authentication and SHALL keep the item and its stored image

#### Scenario: Caller without party access tries to delete a photo
- **WHEN** an authenticated user who neither uploaded the item, hosts its party, nor may view its gallery tries to delete it, or the item does not exist
- **THEN** the system SHALL respond as not found without disclosing whether the item exists

#### Scenario: Backing image is already missing
- **WHEN** an authorized user deletes an item whose stored image is already missing
- **THEN** the system SHALL still remove the media record and report success
