# Design

## Context

See proposal.md – Why; requirements in `specs/party-bring-along-list/spec.md`.

- `addParty/addParty.js` is one DOMContentLoaded closure with a 4-step wizard (`currentStep`, `showStep`, `validateStep`, `stepTitles`); step 4 is the map and triggers `saveParty()`. Steps are `.step[data-step]` blocks plus `.wizard-step[data-step-indicator]` dots.
- `POST /api/parties` returns `201` with a `Location: /api/parties/{id}` header and no body; `PUT /api/parties/{id}` returns the party.
- Item endpoints and validation already exist (`add-party-bring-along-list`); host-only writes; every write fires a live change event.

## Goals / Non-Goals

**Goals:** add the step with minimal changes to the existing wizard; no backend change; nothing stored before the host saves.

**Non-Goals:** atomic party+items transaction; iOS; drag-and-drop ordering.

## Decisions

### Stage items in the page, apply after the party save
The step keeps a local array `bringAlong = [{ id?, name, quantity, unit, pledged, status: "existing" | "new" | "changed" | "removed" }]`. After the party save succeeds, the wizard applies it with the existing endpoints: `DELETE` removed, `PUT` changed, `POST` new – sequentially, collecting failures.
- *Why*: no backend change, same validation and live events as the detail page, "leave without saving changes nothing" holds automatically.
- *Rejected*: extending `PartyCreateDto` with an item list for one atomic request – touches the shared create/update DTO and the party contract for a small gain; partial failure is handled in the UI instead.
- *Rejected*: writing items immediately in edit mode – would break "leave without saving changes nothing" and differ between create and edit.

### Party id in create mode
Read the id from the `Location` header (`/api/parties/(\d+)$`). If it is missing, fall back to the existing redirect to the list and show "Party created, but the bring-along list could not be saved – add it on the party page."

### Partial failure
If any item request fails, show the failed item names in the existing `#partyFeedback` and redirect to `advancedPartyInfos.html?id={id}` (instead of the list) after a short delay, so the host fixes them where the list lives. 409/400 messages from the API are shown as returned.

### Step numbering
Insert the new step as `data-step="4"` and move the map to `5`. All hard-coded `4`s (`currentStep < 4`, `stepNumber === 4`, `setSavingState`) switch to a `LAST_STEP = 5` constant so the map step keeps triggering save.

### UI
Same look as the detail page list: rows with name, `quantity unit`, a pledged hint in edit mode ("2 pledged"), edit/remove buttons; an add row (name, quantity `type=number step=1 min=1 max=10000`, unit). Client validation mirrors the detail page (`/^\d+$/`). Text rendered with `textContent`; names from the API are HTML-decoded the same way as on the detail page. Removing an item with pledges uses `confirm()` with the pledge count.

### Map step fixes (bug fixes)
- `fillFormWithParty` also reads `party.location.latitude/longitude` (the API nests them).
- The address `input` handler clears `latitude/longitude`; picking a suggestion sets them again, otherwise the map step geocodes the typed text.

## Risks / Trade-offs

- [Party saved, items not] → explicit message + redirect to the detail page where the list can be completed; no silent loss.
- [Edit wizard opened while guests pledge] → pledged counts in the step can be stale; item writes still go through the server rules, and the host sees the live list on the detail page right after saving.
- [Host lowers quantity below pledged in the wizard] → allowed, same as the detail page.
