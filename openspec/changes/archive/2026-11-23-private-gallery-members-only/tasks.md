# Tasks

## 1. Backend

- [x] 1.1 `MediaRepository`: gallery predicate without pending invitees, `galleryAccess` helper; upload returns 403 for visible private parties without membership. Prüfen: Tests für Host, Attendee, Invitee (403), Fremder (404), öffentliche Party unverändert.
- [x] 1.2 `PartyResource.getPartyMedia`: 403 für Invitees/Nicht-Mitglieder einer privaten Party. `/api/media/{id}` und `/api/users/{id}/media` liefern einem Invitee keine Items. Prüfen: Resource-Tests.
- [x] 1.3 `MediaRepository.delete`: Uploader und Host dürfen immer löschen, sonst 403/404 wie im Design. Prüfen: Test „ehemaliger Gast löscht eigenes Foto“.

## 2. Frontend

- [x] 2.1 `advancedPartyInfos.js` und `gallery.js`: bei 403 Hinweis „Join the party to see the gallery“ statt Fotos, Anzahl und Upload. Prüfen: Seiten mit einem Invitee-Login rendern.

## 3. Abschluss

- [x] 3.1 `./mvnw clean test` und `api/media.http` grün; Prüfung mit echtem Keycloak-Login (Invitee vs. Gast); `api-contract-matrix.md` aktualisiert.
