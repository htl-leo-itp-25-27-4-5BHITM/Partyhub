# Tasks

## 1. Map step fixes

- [x] 1.1 Read nested `party.location.latitude/longitude` in `fillFormWithParty`; verify in the browser that the edit wizard of a seeded party shows the map with tiles and marker
- [x] 1.2 Clear stale coordinates when the address is typed; verify in the browser that picking "Hauptplatz Linz", going back and typing "Stephansplatz Wien" puts the map marker in Vienna

## 2. Wizard step

- [x] 2.1 Add the "Bring-along" step markup (step 4) and progress dot, move the map to step 5, replace hard-coded step numbers with `LAST_STEP`; verify in the browser that all 5 steps navigate forwards/backwards and the map step still shows "Create party"/"Save changes"
- [x] 2.2 Implement the staged item list (add, inline edit, remove, client validation for name/whole-number quantity/unit) with styles matching the detail page; verify in the browser that 1.5, 0 and an empty name are rejected at the form and valid items appear in the list
- [x] 2.3 Load existing items with pledged totals in edit mode and confirm removal of items with pledges; verify in the browser on a seeded party with pledges

## 3. Saving

- [x] 3.1 After party create, read the id from `Location` and apply staged items; after party update apply removed/changed/new items; verify in the browser that a created party's detail page shows the wizard items and that edit changes are stored
- [x] 3.2 Leaving the wizard without saving changes nothing; verify by editing items in the edit wizard, navigating away, and checking `GET /api/parties/{id}/bring-along`
- [x] 3.3 Handle partial failure (report failed item names, redirect to the detail page); verify by forcing one item request to fail in the browser test

## 4. Integration check

- [x] 4.1 Run `./mvnw clean test` and a real Keycloak login browser run: create a party with two items in the wizard, edit it (change one, remove one with confirmation), and confirm an open detail page of an attendee updates live
