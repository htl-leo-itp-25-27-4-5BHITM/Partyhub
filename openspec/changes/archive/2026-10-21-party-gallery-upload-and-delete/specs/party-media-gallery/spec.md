# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
