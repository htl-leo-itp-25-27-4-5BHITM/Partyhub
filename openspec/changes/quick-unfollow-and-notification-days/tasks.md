# Tasks

## 1. Backend

- [x] 1.1 Dashboard ignoriert Follow/Entfolgen innerhalb von 24 h. Prüfen: `QuickUnfollowTest`, neue Fälle in `DashboardServiceTest`.
- [x] 1.2 `follow.requested_at` (V11), gesetzt bei neuen Anfragen, im Follow-Request-Endpoint. Prüfen: `FollowRepositoryTest`.

## 2. Frontend

- [x] 2.1 Benachrichtigungen: Sortierung inkl. Follow-Anfragen, Abschnitte pro Tag, ganze Seite scrollt, Buttons gesperrt mit Ladeanzeige. Prüfen: Seite im Headless-Browser rendern, Doppelklick sendet nur eine Anfrage.

## 3. Abschluss

- [x] 3.1 `./mvnw clean test`, `api/*.http` grün.
