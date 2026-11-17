# Home map follow-up audit

Scope: current local browser map in `src/main/resources/META-INF/resources/index.*`, checked against the earlier `issue-drafts.md` and the party-discovery specification. Runtime checks used the sample API on localhost:8765, not production or a real authenticated backend. No new remote issues created and no application code changed during this audit.

## Findings

### P2: Zoom discards selected event and keyboard focus

`index.js:305` closes the preview and removes every marker on each render; `index.js:392` invokes that render on every zoom end. Select a time pin, then zoom. The selection disappears despite the same party remaining in the filtered results. Programmatic DOM-event reproduction confirmed the preview changed from visible with focus on `closeMapSelection` to hidden with focus falling back to the document. This also affects zooming through the location and fit-results controls. Preserve selection by party ID when regrouping; restore meaningful focus if the originating marker becomes a cluster.

### P2: Location startup depends on party API completion

`index.js:493–495` awaits `loadAllPartiesToMap()` before calling `startGeolocation()`. A pending party request prevents requesting or displaying device location, even though location is independent client context. This is established by source control flow; network-hang behavior was not independently reproduced in the browser. Start location independently of the request, preserving the existing rule against overriding a view the user has already chosen.

### P2: Map errors and result messages overwrite each other

`index.js:43–44` writes a tile failure to the shared status but successful tile loads only reset the counter. Thus a failure message can remain after successful recovery. Conversely, `index.js:385` clears the same status whenever matching parties exist, including on zoom, regardless of whether tiles recovered. Failed party loads use this status too, so changing a filter can replace a load error with a misleading no-matches message. Source-confirmed state-management defect; simulated tile-network failures were not run. Track tile health, party-load state, and result emptiness separately and render the relevant current message.

## Earlier reports and checks

- Earlier issue #1 (fixed school-coordinate override): absent from current `index.js`; real `navigator.geolocation.watchPosition` is used. User confirmed location works in Chromium. Embedded-preview network location failure is environment-specific; no production deployment fix is claimed.
- Earlier relative-date issue belongs to the party list. The revamped map displays explicit weekday/time pins and calendar dates instead of a tomorrow label.
- Earlier checks covered text search, date filtering, no-match state, details link, Escape dismissal, mobile width, and cluster grouping. These are not substitutes for authenticated backend visibility tests.
- Current coordinates remain client-side in map state. No coordinate upload or fabricated fallback was found in the map source.

## Remaining validation limits

Real private/public party visibility, permission revocation, a stalled party API, tile failure/recovery, daylight-saving transitions, and larger datasets need dedicated integration scenarios. Sample-server records do not demonstrate server authorization. Findings above distinguish reproduced behavior from source-confirmed control flow.
