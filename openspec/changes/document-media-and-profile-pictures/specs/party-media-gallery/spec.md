# Spec Delta

## MODIFIED Requirements

### Requirement: Party galleries support media viewing in the current brownfield system
The system SHALL expose a party's server-backed media list and individual media content only through the same party Viewer boundary used for party details. Anonymous callers MAY view public-party media; private-party media SHALL require an authenticated host, pending invitee, or joined attendee. Media and user-media projections SHALL NOT reveal items from a party the caller cannot view.

#### Scenario: User opens a party gallery
- **WHEN** a caller who can view a party opens that party's gallery
- **THEN** the system SHALL return the party's available server-backed media items and the client SHALL display them from the returned media identities

#### Scenario: Anonymous caller opens a public-party gallery
- **WHEN** an anonymous caller lists or serves media belonging to a public party
- **THEN** the system SHALL allow the request without granting upload or other authenticated mutation authority

#### Scenario: Authenticated viewer opens a private-party gallery
- **WHEN** an authenticated host, pending invitee, or joined attendee lists or serves media belonging to a private party they can view
- **THEN** the system SHALL return only media belonging to that party

#### Scenario: Caller without private-party access requests media
- **WHEN** an anonymous or authenticated caller without a qualifying Viewer role requests a private party's media list or an individual item from that party
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

### Requirement: Party gallery upload is target behavior for the user interface
A client that presents PartyHub party-gallery content SHALL distinguish the shared server-backed gallery from device-local photos. The accepted target SHALL include a UI flow that lets an authenticated party Viewer select and upload gallery images and refresh the server-backed result, without requiring browser and iOS controls to be identical.

#### Scenario: Gallery upload capability is described for future work
- **WHEN** a supported client exposes the accepted gallery-upload target
- **THEN** it SHALL submit the selected image through the authenticated server gallery contract and refresh the shared gallery after success

#### Scenario: Browser opens the shared gallery
- **WHEN** the browser opens a party gallery
- **THEN** it SHALL render the server-returned media collection, modal viewing, empty state, and load errors without presenting a local-only collection as shared media

#### Scenario: Client gallery load fails
- **WHEN** a gallery client cannot load the party, media list, or an individual image
- **THEN** it SHALL present an error or unavailable state and SHALL NOT report the missing content as a successful empty upload

#### Scenario: iOS stores photos only on the device
- **WHEN** an iOS photo surface adds, shares, or removes a file only from local device storage
- **THEN** it SHALL treat that file as local content and SHALL NOT represent it as uploaded PartyHub gallery media

### Requirement: Party gallery uploads are available to party viewers
The system SHALL allow an authenticated user who can view a party to upload valid gallery images at any time. Each uploaded item SHALL be non-empty JPEG, PNG, GIF, or WebP content no larger than 5 MiB. The server SHALL assign a safe opaque storage reference and SHALL NOT expose a usable media record when the corresponding image was not stored successfully.

#### Scenario: Party viewer uploads a photo
- **WHEN** an authenticated party Viewer uploads a valid image to that party's gallery
- **THEN** the system SHALL accept the upload without requiring the party end time to have passed and SHALL make the stored item available through the authorized gallery

#### Scenario: Anonymous public-party viewer uploads a photo
- **WHEN** an anonymous caller who may view a public party attempts to upload gallery media
- **THEN** the system SHALL require authentication and SHALL NOT create a media record or stored gallery file

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
