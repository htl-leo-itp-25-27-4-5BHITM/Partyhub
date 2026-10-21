# Proposal

## Why

Hosts can manage the bring-along list only on the party detail page, after the party exists. When creating or editing a party they already know what guests should bring, so the list belongs in the same wizard instead of a second trip to the detail page.

## What Changes

- The add/edit party wizard gets a new optional step **"Bring-along"** between "Details" and "Map". The wizard becomes: Basics → Guests → Details → Bring-along → Map.
- In the step the host adds, edits and removes items (name, whole-number quantity, optional unit) with the same rules as on the detail page. The step can be left empty.
- Create mode: items are kept in the page and created right after the party was saved.
- Edit mode: the step shows the party's current items including pledged totals; additions, edits and removals are applied when the host saves. Removing an item with pledges asks for confirmation, because the pledges are removed too.
- If the party is saved but some items fail, the host sees which items failed and is sent to the party detail page to fix them there, instead of to the party list.
- Related fixes in the same wizard's Map step (bug fixes, no spec change): edit mode now reads the stored coordinates, so the map shows again; typing a new address clears the old coordinates, so the marker and the saved location match the new address.

Out of scope: iOS wizard, backend changes (existing bring-along endpoints are reused), letting attendees use the wizard step.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `party-bring-along-list`: adds a requirement for managing the list as a step of the web add/edit party wizard.

## Impact

- **Web frontend**: `src/main/resources/META-INF/resources/addParty/` (HTML, CSS, JS). Shared item form logic may move into a small helper used by the wizard.
- **Backend / API / database**: no changes. Uses `POST /api/parties` (`Location` header carries the new id), `GET/POST/PUT/DELETE /api/parties/{id}/bring-along/items…`.
- **Live updates**: item writes from the wizard fire the existing change events, so open detail pages update live.
