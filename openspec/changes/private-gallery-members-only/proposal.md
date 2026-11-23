## Why
In a private party, pending invitees can already browse and upload to the gallery before they have joined. The bring-along list of a private party is only open to the host and joined attendees; the gallery should follow the same rule so photos of a private party stay among the people who actually attend.

## What Changes
- Private-party gallery (media list, single items, user media projection, upload) is available only to the host and joined attendees. Pending invitees can still see the party details but get "forbidden" for the gallery until they join.
- Public-party galleries are unchanged (anyone may view, authenticated viewers may upload).
- An uploader may still delete their own photo after leaving a private party.
- The browser shows pending invitees a "Join the party to see the gallery" hint instead of the gallery, on the party detail page and on the gallery page.

## Capabilities
### New Capabilities
None.

### Modified Capabilities
- `party-media-gallery`: Private-party gallery access narrows from "host, pending invitee or joined attendee" to "host or joined attendee"; deletion by the uploader no longer depends on gallery access; browser behaviour for non-members of a private party.

## Impact
- Backend: `MediaRepository` access predicate and upload check, `PartyResource.getPartyMedia`, `MediaRepository.delete`.
- Frontend: `gallery/gallery.js`, `advancedPartyInfos/advancedPartyInfos.js`.
- No database change. iOS does not use the gallery endpoints for private parties differently; it receives 403 like the browser.
