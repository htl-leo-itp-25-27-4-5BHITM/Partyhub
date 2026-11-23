# Design

## Context
`MediaRepository.VISIBLE_PARTY_PREDICATE` mirrors `PartyRepository.getPartyByIdIfVisible` (public, host, pending invitee, joined attendee) and guards item serving, the user media projection and deletion. `PartyResource.getPartyMedia` and `MediaRepository.upload` use `getPartyByIdIfVisible` directly. The bring-along list already uses the target rule in `BringAlongResource.resolveReader`: visible party required (else 404), then public or member (else 403).

## Decisions
1. **One gallery rule, separate from party visibility.** Rename the predicate to `GALLERY_ACCESS_PREDICATE`: public OR host OR joined attendee (drop the pending-invitation clause). Add `MediaRepository.galleryAccess(party, callerId)` returning `ALLOWED` / `FORBIDDEN` for a party the caller can already view, used by the list endpoint and upload. Party details stay visible to invitees.
2. **Status codes like bring-along.** Party not visible → 404. Visible private party, caller not host/attendee → 403 `{"error": "Join the party to see the gallery"}`. Single items (`/api/media/{id}`) and the user projection simply filter with the predicate → 404 / omitted, so item ids are never confirmed to non-members.
3. **Delete.** Load the item by id; uploader or host → delete. Otherwise, if the caller may view the gallery → 403, else 404. Keeps non-disclosure and lets former attendees remove their own photos.
4. **Frontend.** `advancedPartyInfos.js`: a 403 from the media list hides the photo count/gallery link and shows the join hint. `gallery.js`: on 403 render the join hint and no upload control. Existing 404 handling stays.

## Risks / Trade-offs
- [Invitees lose upload rights they had before] → Intended; photos uploaded earlier by users who are still only invitees stay stored and visible to members.
- [iOS gets 403 where it got 200] → iOS already handles non-200 media responses as unavailable.
