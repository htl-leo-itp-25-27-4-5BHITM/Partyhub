# Tasks

## 1. Datenbank

- [x] 1.1 `V9__host_dashboard.sql` anlegen: Tabellen `follow_event` und `attendance_event` (FKs mit `ON DELETE CASCADE`, Indizes auf `(followed_id, occurred_at)` bzw. `(party_id, occurred_at)`), Spalten `users.gender varchar(32)` und `users.birth_date date`. Prüfen: `./mvnw quarkus:dev` startet und Flyway meldet Version 9.
- [x] 1.2 Seed-Daten in `src/main/resources/db/dev-seed/afterMigrate.sql`: Gender/Geburtsdatum für die Demo-User, Follow- und Attendance-Events verteilt über die letzten 6 Monate (relativ zu `now()`), idempotent. Prüfen: Dev-Start zweimal hintereinander ohne Fehler, Zeilen per SQL sichtbar.

## 2. Entities und Profil

- [x] 2.1 Enums `Gender` und `FollowEventType`/`AttendanceEventType`, Entities `FollowEvent` und `AttendanceEvent` mit Repositories. Prüfen: `./mvnw clean test` grün (H2-Schema wird generiert).
- [x] 2.2 `User` um `gender` und `birthDate` erweitern; Profil-Update-DTO um `Gender gender` und `@Past(message = …) LocalDate birthDate`; nur die Self-Projektion in `ProfileDto` gibt beide zurück. Prüfen: Test „eigenes Profil enthält gender/birthDate, fremdes Profil nicht“ und Test „Geburtsdatum in der Zukunft → 400“.

## 3. Historie schreiben

- [x] 3.1 `FollowRepository.acceptFollowRequest` schreibt FOLLOWED, `removeFollow` schreibt UNFOLLOWED nur bei Status accepted. Prüfen: Tests für Accept, Unfollow, Follower entfernen und Pending ablehnen (kein Event).
- [x] 3.2 Alle Stellen, an denen `party.getUsers()` hinzugefügt oder entfernt wird (`InvitationRepository` und weitere per `grep`), schreiben JOINED/LEFT nur bei echter Änderung. Prüfen: Tests für Join, Accept-by-Join, Leave und abgelehnten Join (voll/Alter → kein Event).

## 4. Dashboard-Backend

- [x] 4.1 `DashboardRange`-Enum mit Parser (`7d|30d|3m|6m`, Default 30d, sonst 400) und Response-Records gemäß design.md. Prüfen: Unit-Test für Parser und Zeitraumgrenzen.
- [x] 4.2 `DashboardService`: Partys erstellt, Follower gewonnen/verloren, Joins, Privat/Public, Einladungen, Auslastung, Top-Party (Tiebreak Favoriten, dann neuer). Nur JPQL mit gebundenen Parametern. Prüfen: Service-Tests mit festen Testdaten inkl. „leerer Zeitraum → Nullen, keine Top-Party“.
- [x] 4.3 Timeline mit Tages-Buckets (7d/30d) bzw. Wochen-Buckets ab Montag (3m/6m), Lücken mit 0. Prüfen: Test „7 Tage → genau 7 Punkte“.
- [x] 4.4 Geschlechter- und Altersverteilung über distinct Gäste, Schwelle 5, sonst `withheld=true`. Prüfen: Tests für 8 Gäste (50/37,5/12,5) und 3 Gäste (withheld).
- [x] 4.5 `DashboardResource` `GET /api/dashboard`, `@Authenticated`, User aus dem Token, Titel via `Encode.forHtml`. Prüfen: Resource-Tests 401 ohne Token, 400 bei ungültigem Range, 200 nur mit eigenen Daten; neue Datei `api/dashboard.http`.

## 5. Web-Frontend

- [x] 5.1 `editProfile`: Geschlecht-Dropdown (inkl. „keine Angabe“) und Geburtsdatum, beides optional. Prüfen: im Browser speichern, neu laden, Werte bleiben.
- [x] 5.2 Seite `dashboard/` (HTML/CSS/JS) mit Route-Guard, Zeitraum-Umschalter, KPI-Kacheln und Hinweis „erfasst seit …“; Link als „Dashboard“-Button im eigenen Profil. Prüfen: Seite lädt nach Keycloak-Login, Kacheln zeigen Seed-Werte, ohne Login → Login-Seite.
- [x] 5.3 Kennzahl-Dropdown mit SVG-Diagrammen (Timeline als Linie, Privat/Public, Einladungen, Auslastung, Geschlecht, Alter als Balken), Antwort pro Zeitraum gecacht, `withheld` → Hinweistext statt Diagramm. Prüfen: jede Option einmal im Browser durchklicken, keine Konsolenfehler.

## 6. Abschluss

- [x] 6.1 `./mvnw clean test` und `./run-http-tests.sh` grün; Dashboard mit echtem Keycloak-Login (Demo-User) geprüft, nicht mit `X-User-Id`.
- [x] 6.2 `docs/openspec-baseline/api-contract-matrix.md` um `GET /api/dashboard` und die neuen Profilfelder ergänzen; `openspec validate host-dashboard --strict` grün.
