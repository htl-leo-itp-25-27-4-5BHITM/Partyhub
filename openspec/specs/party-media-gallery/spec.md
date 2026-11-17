# party-media-gallery Specification

## Purpose
Defines PartyHub's party gallery behavior, including viewing stored media, empty-gallery states, the rule that any user who can view a party may upload photos at any time, and deletion of a photo by its uploader or the party host.

## Requirements

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
A client that presents PartyHub party-gallery content SHALL distinguish the shared server-backed gallery from device-local photos. The browser SHALL provide a UI flow that lets an authenticated party Viewer select one or more gallery images, upload them, and refresh the server-backed result. Other clients MAY offer the flow later, and their controls need not match the browser's.

#### Scenario: Gallery upload capability is described for future work
- **WHEN** a supported client exposes the accepted gallery-upload target
- **THEN** it SHALL submit the selected image through the authenticated server gallery contract and refresh the shared gallery after success

#### Scenario: Logged-in viewer uploads from the browser gallery
- **WHEN** an authenticated party Viewer selects one or more images in the browser gallery and confirms the upload
- **THEN** the browser SHALL submit them through the authenticated upload contract, show how many of the selected images have been processed while uploading, and afterwards show the refreshed shared gallery including the new items

#### Scenario: Browser rejects an upload before sending it
- **WHEN** a selection contains a file that is not JPEG, PNG, GIF, or WebP, is larger than 5 MiB, or the selection has more than 20 files
- **THEN** the browser SHALL show which file and constraint failed and SHALL NOT send the selection, while the server boundary remains authoritative

#### Scenario: Server rejects some images of a browser upload
- **WHEN** the server rejects or fails one or more images of a browser gallery upload
- **THEN** the browser SHALL name each image that was not uploaded with its error, SHALL show only the images the server stored as uploaded, and SHALL refresh the shared gallery from the server

#### Scenario: Anonymous visitor opens the browser gallery
- **WHEN** an anonymous visitor opens a public party's browser gallery
- **THEN** the browser SHALL show the gallery without an upload control and SHALL offer a way to log in in order to add photos

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

### Requirement: Gallery items can be deleted by their uploader or the party host
The system SHALL allow an authenticated user to delete a gallery item when that user uploaded the item or hosts the item's party. A successful deletion SHALL remove the media record and its stored image so the item is no longer listed or served. Every other caller SHALL be refused without changing media or storage state, and a refusal for an item on a party the caller cannot view SHALL NOT reveal whether the item exists.

#### Scenario: Uploader deletes their own photo
- **WHEN** the authenticated user who uploaded a gallery item deletes it
- **THEN** the system SHALL remove the item and its stored image, and the item SHALL no longer appear in the party media list, the user media projection, or be served individually

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
- **WHEN** an authenticated user who cannot view the item's party tries to delete it, or the item does not exist
- **THEN** the system SHALL respond as not found without disclosing whether the item exists

#### Scenario: Backing image is already missing
- **WHEN** an authorized user deletes an item whose stored image is already missing
- **THEN** the system SHALL still remove the media record and report success

### Requirement: Media listings report the caller's delete permission
Each item in the party media list and the user media projection SHALL state whether the caller may delete it, following the deletion rule. Anonymous callers SHALL see every item as not deletable.

#### Scenario: Uploader lists a party gallery
- **WHEN** an authenticated user lists a party gallery that contains items they uploaded and items others uploaded
- **THEN** their own items SHALL be marked deletable and the others SHALL NOT, unless the user hosts the party

#### Scenario: Host lists their party gallery
- **WHEN** the host of a party lists its gallery
- **THEN** every item SHALL be marked deletable

#### Scenario: Anonymous visitor lists a public gallery
- **WHEN** an anonymous visitor lists a public party gallery
- **THEN** no item SHALL be marked deletable

### Requirement: Browser offers deletion only to permitted users
The browser gallery SHALL show a delete control only on items the server marks deletable, SHALL ask for confirmation before deleting, and SHALL refresh the shared gallery after the server confirms. A failed deletion SHALL show an error and keep the item visible.

#### Scenario: Permitted user deletes from the browser
- **WHEN** a user confirms deleting a gallery item they may delete, from the grid or the photo viewer
- **THEN** the browser SHALL send the delete request and, after success, show the refreshed gallery without that item

#### Scenario: User cancels the confirmation
- **WHEN** a user starts deleting an item and then cancels the confirmation
- **THEN** the browser SHALL NOT send a delete request

#### Scenario: Item is not deletable for the user
- **WHEN** the browser renders an item the server marks as not deletable
- **THEN** it SHALL NOT show a delete control for that item
