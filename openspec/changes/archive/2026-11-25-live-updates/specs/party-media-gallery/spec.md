# Spec Delta

## ADDED Requirements

### Requirement: Open browser gallery shows new photos without reload
While a gallery page is visible, the browser SHALL re-check the party's media at least every 10 seconds and SHALL redraw the gallery only when the set of photos changed. It SHALL NOT redraw while a photo is open in the viewer or an upload is running.

#### Scenario: Another guest uploads a photo
- **WHEN** another guest uploads a photo while a user has the gallery open
- **THEN** the photo SHALL appear in the user's gallery within about 10 seconds without a reload
