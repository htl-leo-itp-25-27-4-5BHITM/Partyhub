# Tasks

- [x] 1.1 Party-Stream, Entity-Listener für Einladungen, Beitritte/Austritte. Prüfen: `PartyLiveEventsTest` (Beitritt, neue und abgelehnte Einladung, Stream 401/404, Signal kommt an).
- [x] 1.2 Detailseite lädt Gästeliste live, Fallback 15 s. Prüfen: Headless-Browser (öffentliche Party: neuer Gast nach 360 ms; private Party: Status Pending → Accepted nach 360 ms), Browser-Regressionstests.
- [x] 1.3 `./mvnw clean test`, `api/*.http` grün.
