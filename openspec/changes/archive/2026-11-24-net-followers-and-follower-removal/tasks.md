# Tasks

## 1. Backend

- [x] 1.1 Unfollow-Endpoint: Follower oder Gefolgter, sonst 403. Prüfen: `FollowEndpointsTest` (ablehnen, entfernen, entfolgen, Dritter).
- [x] 1.2 `/follow-requests` nur für sich selbst, neuer `/follow-status`. Prüfen: `FollowEndpointsTest`, `UserResourceTest`.
- [x] 1.3 Dashboard Netto-Zählung. Prüfen: `DistinctCountTest`, `DashboardServiceTest`.

## 2. Frontend

- [x] 2.1 Profil nutzt `/follow-status`; „Remove“ in der eigenen Follower-Liste; Ablehnen in Benachrichtigungen funktioniert. Prüfen: Browser-Render und API-Aufrufe.

## 3. Abschluss

- [x] 3.1 `./mvnw clean test`, `api/*.http` grün.
