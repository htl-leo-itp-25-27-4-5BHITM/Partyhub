# Spec Delta

## ADDED Requirements

### Requirement: Media listings report uploader and upload time
Each item in the party media list and the user media projection SHALL state its uploader's user id, handle, and display name, and the time it was uploaded. The system SHALL record the upload time when an item is uploaded. Items uploaded before upload times were recorded SHALL report no upload time, and items whose uploader no longer exists SHALL report no uploader. These fields SHALL only appear for items the caller is allowed to list.

#### Scenario: Viewer lists a gallery with a new upload
- **WHEN** a caller who can view a party lists its gallery after a user uploaded a photo to it
- **THEN** that item SHALL report the uploader's user id, handle, and display name, and an upload time no earlier than when the upload request was received

#### Scenario: Item predates recorded upload times
- **WHEN** a caller lists a gallery item that was stored before upload times were recorded
- **THEN** the item SHALL report its uploader and SHALL report no upload time

#### Scenario: Uploader no longer exists
- **WHEN** a caller lists a gallery item whose uploader account no longer exists
- **THEN** the item SHALL report no uploader and SHALL still be listed

#### Scenario: Anonymous visitor lists a public gallery
- **WHEN** an anonymous visitor lists a public party gallery
- **THEN** every item SHALL report its uploader and upload time in the same way as for an authenticated viewer

### Requirement: Browser photo viewer shows photo details and fits the screen
When the browser photo viewer shows a gallery item, it SHALL show the uploader's display name as a link to that user's profile and the upload date and time in the viewer's local time. It SHALL omit the upload time when the item reports none, and SHALL show "Unknown user" without a link when the item reports no uploader. The viewer SHALL scale the photo to fit inside the visible screen while keeping its aspect ratio, and the photo details and viewer controls SHALL stay visible.

#### Scenario: Viewer opens a photo with full details
- **WHEN** a user opens a gallery photo whose item reports an uploader and an upload time
- **THEN** the viewer SHALL show the uploader's display name linking to their profile and the upload date and time

#### Scenario: Viewer opens a photo without an upload time
- **WHEN** a user opens a gallery photo whose item reports no upload time
- **THEN** the viewer SHALL show the uploader and SHALL NOT show a date or a placeholder date

#### Scenario: Viewer opens a photo whose uploader no longer exists
- **WHEN** a user opens a gallery photo whose item reports no uploader
- **THEN** the viewer SHALL show "Unknown user" without a profile link

#### Scenario: User moves to another photo in the viewer
- **WHEN** a user moves to the previous or next photo in the viewer
- **THEN** the viewer SHALL show the uploader and upload time of the newly shown photo

#### Scenario: Viewer opens a photo taller than the screen
- **WHEN** a user opens a gallery photo whose natural size is larger than the visible screen, on a phone or a desktop
- **THEN** the viewer SHALL show the whole photo scaled down with its aspect ratio kept, and the close control and photo details SHALL remain visible
