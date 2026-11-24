# Tasks

## 1. Backfill

- [x] 1.1 `V10__backfill_dashboard_history.sql` mit INSERT … SELECT für Follows, Beitritte und Verlassen aus `notification`, ohne Duplikate. Prüfen: in einer Wegwerf-Postgres mit V1–V9 und Beispiel-Benachrichtigungen (alt, deutsch, englisch, bereits live erfasst) liefert V10 genau die erwarteten Einträge.
- [x] 1.2 Dashboard-Hinweistext anpassen (HTML wird seit #208 nicht gecacht, keine Asset-Version nötig). Prüfen: Seite zeigt den neuen Text.

## 2. Abschluss

- [x] 2.1 `./mvnw clean test` grün, `quarkus:dev` startet mit V10, `api/dashboard.http` grün.
