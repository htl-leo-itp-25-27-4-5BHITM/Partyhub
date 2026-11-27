# CI/CD bei PartyHub

## 1. Was ist CI/CD?

**CI/CD** steht für drei Begriffe, die aufeinander aufbauen:

| Begriff | Bedeutung | Kurz gesagt |
|---|---|---|
| **CI – Continuous Integration** | Jede Codeänderung wird automatisch gebaut und getestet, sobald sie ins gemeinsame Repository kommt. | „Funktioniert mein Code noch zusammen mit dem der anderen?“ |
| **CD – Continuous Delivery** | Nach erfolgreichen Tests wird automatisch ein auslieferbares Paket erstellt (bei uns: Docker-Images). Das Ausrollen kann noch manuell angestoßen werden. | „Wir *könnten* jederzeit ausliefern.“ |
| **CD – Continuous Deployment** | Das fertige Paket wird ohne manuellen Schritt direkt in die Produktionsumgebung ausgerollt. | „Jede erfolgreiche Änderung ist sofort live.“ |

Ziel des Ganzen:

- **Fehler früh finden** – kaputter Code fällt im Pull Request auf, nicht erst auf dem Server.
- **Keine manuellen Handgriffe** – niemand muss lokal bauen, Images hochladen oder `kubectl` per Hand aufrufen.
- **Nachvollziehbarkeit** – jedes Image ist mit dem Commit (Short-SHA) getaggt, aus dem es gebaut wurde.
- **Kleine, häufige Releases** statt seltener großer „Big-Bang“-Releases.

Eine **Pipeline** ist die Abfolge dieser automatischen Schritte. Bei uns läuft sie mit **GitHub Actions**; die Workflows liegen in `.github/workflows/`.

---

## 2. Zusammenhang mit PartyHub

PartyHub besteht aus mehreren Teilen, die alle von der Pipeline abgedeckt werden:

| Teil | Wie ihn die Pipeline behandelt |
|---|---|
| Quarkus-Backend (`src/`, `pom.xml`) | Unit-/Integrationstests mit `mvn clean test`, danach Build zum Docker-Image `partyhub-backend` |
| REST-API (`api/*.http`) | API-Tests mit HTTPYac gegen einen echten laufenden Quarkus-Server |
| Frontend-JavaScript (`src/test/js`, `scripts/tests`) | Browser-Regressionstests mit `node --test` |
| Keycloak + Login-Theme (`keycloak/`, `Dockerfile.keycloak`) | Eigenes Docker-Image `partyhub-keycloak` |
| Datenbank-Schema (Flyway-Migrationen) | Werden beim Start von Quarkus automatisch ausgeführt – in den Tests und in Produktion |
| Kubernetes-Manifeste (`k8s/`) | Werden beim Deploy mit `kubectl apply` auf die School-Cloud angewendet |
| Container-Registry | GitHub Container Registry `ghcr.io/htl-leo-itp-25-27-4-5bhitm/…` |
| Produktion | Kubernetes in der HTL-Leonding-School-Cloud, erreichbar über `https://it220274.cloud.htl-leonding.ac.at` |

Zusätzlich läuft **CodeQL** (GitHub Code Scanning, Default-Setup) bei jedem Push auf `main` und sucht nach Sicherheitslücken im Code.

---

## 3. Ist das bei uns schon automatisiert?

**Ja – vollständig, inklusive Continuous Deployment.**

| Stufe | Automatisiert? | Workflow |
|---|---|---|
| Continuous Integration | ✅ bei jedem Pull Request auf `main` und jedem Push auf `main` | `test.yml` („Test“) |
| Continuous Delivery | ✅ Docker-Images werden nach erfolgreichem Test automatisch gebaut und nach `ghcr.io` gepusht | `push.yaml` („Build and Push“) |
| Continuous Deployment | ✅ Images werden direkt danach auf die School-Cloud ausgerollt | `deploy.yml` („Deploy“), aufgerufen von `push.yaml` |
| Code-Scanning | ✅ CodeQL bei Push auf `main` | GitHub Default-Setup (keine eigene Datei) |

Ein Merge auf `main` geht also **ohne manuellen Schritt live**, sobald Test und Build grün sind.

### Was (noch) nicht automatisiert bzw. abgesichert ist

- **Kein Branch-Schutz auf `main`.** GitHub meldet „Branch not protected“. Direkte Pushes auf `main` sind technisch möglich und würden sofort deployen. Die Regel „nur über Pull Request“ ist bei uns eine Team-Vereinbarung, kein erzwungener Check.
- **Test läuft bei Push auf `main` nur bei bestimmten Pfaden** (`src/`, `keycloak/`, `api/`, `k8s/`, `pom.xml`, Workflows, Skripte …). Ändert ein Commit nur Doku (z. B. `docs/`, `openspec/`), läuft kein Test – und damit auch **kein Build und kein Deploy**. Das ist gewollt.
- **Kein automatischer Rollback.** Schlägt ein Rollout fehl, bricht der Deploy-Job ab, aber die alte Version wird nicht automatisch zurückgeholt. Ein Rollback geht manuell über „Run workflow“ beim Deploy-Workflow mit einem älteren Image-Tag.
- **Keine Staging-Umgebung.** Es gibt nur lokal (Docker Compose) und Produktion.
- **Keycloak-Realm-Änderungen in Produktion** passieren nicht über die Pipeline, sondern in der Keycloak-Admin-Console (Keycloak importiert nur Realms, die noch nicht existieren).
- **Datenbank-Backups** werden von der Pipeline nicht erstellt.

---

## 4. Der Ablauf bei PartyHub

### Überblick

```
 Feature-Branch            Pull Request             main                    School-Cloud
 ──────────────            ────────────             ────                    ────────────
 git push  ───────────►  Test (test.yml)
                         ✔ grün / ✘ rot
                         Review im Team
                              │ Merge
                              ▼
                                               Test (test.yml)
                                                     │ success
                                                     ▼
                                               Build and Push (push.yaml)
                                               • mvn package
                                               • Image partyhub-backend
                                               • Image partyhub-keycloak
                                               • Push nach ghcr.io
                                                     │
                                                     ▼
                                               Deploy (deploy.yml) ──────►  kubectl apply
                                                                            kubectl set image
                                                                            rollout status ✔
```

### Schritt für Schritt

**1. Entwicklung auf einem Branch**
Gearbeitet wird nie direkt auf `main`, sondern auf einem eigenen Branch (z. B. `carla/settings`). Lokal testet man mit `./mvnw clean test` und `./run-http-tests.sh`. Commits folgen Conventional Commits (`feat:`, `fix:`, `docs:` …).

**2. Pull Request → Workflow „Test“ (`test.yml`)**
Beim Öffnen bzw. Aktualisieren eines PRs auf `main` läuft auf einem GitHub-Runner (Ubuntu):

1. Code auschecken, Java 21 (Temurin) einrichten
2. **Browser-Regressionstests:** `node --test scripts/tests/*.test.cjs src/test/js/*.test.cjs`
3. **Infrastruktur prüfen und starten:** `docker compose config`, Syntax-Check der Shell-Skripte (`bash -n`), dann `docker compose up -d --wait` (Postgres + Keycloak)
4. **Backend-Tests:** `mvn clean test`
5. **Quarkus im Dev-Modus starten** und warten, bis `/q/openapi` antwortet
6. **API-Tests:** alle `api/*.http`-Dateien mit HTTPYac
7. Testergebnisse als Artefakt `api-test-results` hochladen (7 Tage aufbewahrt)

Ist ein Schritt rot, sieht man das direkt im PR. Danach Review im Team und Merge.

**3. Merge auf `main` → Workflow „Test“ läuft erneut**
Derselbe Test-Workflow läuft noch einmal auf dem Merge-Commit (sofern relevante Dateien geändert wurden).

**4. Workflow „Build and Push“ (`push.yaml`)**
Wird über `workflow_run` gestartet, sobald „Test“ fertig ist. Er läuft **nur**, wenn

- Test erfolgreich war,
- Test durch einen **Push** ausgelöst wurde (nicht durch einen PR) und
- der Branch `main` ist.

Bei PR-Testläufen wird er deshalb als „skipped“ angezeigt – das ist korrekt.

Ablauf:

1. Genau den getesteten Commit auschecken (`head_sha`)
2. Image-Tag = 7-stelliger Commit-SHA (z. B. `6a12926`)
3. `mvn -B package -DskipTests` (Tests liefen ja schon)
4. Login in `ghcr.io` mit dem automatischen `GITHUB_TOKEN`
5. Backend-Image aus `Dockerfile` bauen und pushen (Tags: `latest` + SHA)
6. Keycloak-Image aus `Dockerfile.keycloak` bauen und pushen (Tags: `latest` + SHA)

**5. Workflow „Deploy“ (`deploy.yml`)**
Wird als letzter Job von „Build and Push“ aufgerufen und bekommt den Image-Tag übergeben:

1. `kubectl` einrichten, Kubeconfig aus dem Secret `KUBE_CONFIG_DATA` schreiben
2. **Sicherheitscheck:** Das Secret `keycloak-database-secret` muss `migration-complete=true` enthalten. Sonst bricht der Deploy ab, damit Keycloak nicht mit leerer Datenbank startet und bestehende Benutzerkonten verliert (siehe `docs/keycloak-database-migration.md`).
3. `kubectl apply` für alle Manifeste in `k8s/` (Postgres, Keycloak-DB, Keycloak, Quarkus, Ingress)
4. `kubectl set image` setzt Keycloak und Quarkus auf den neuen SHA-Tag
5. `kubectl rollout status` wartet, bis alle Deployments laufen (Timeouts 3–10 Minuten)

Der Deploy ist **inkrementell**: Daten in Postgres, Keycloak-DB und die hochgeladenen Bilder (PersistentVolumeClaims) bleiben erhalten. Flyway führt neue Migrationen beim Start des neuen Quarkus-Pods automatisch aus.

Über `concurrency: partyhub-school-cloud-deploy` laufen nie zwei Deploys gleichzeitig; ein zweiter wartet, bis der erste fertig ist.

**6. Live**
Nach etwa 8–10 Minuten (Test ≈ 3–4 min, Build + Deploy ≈ 4–5 min) ist die Änderung unter `https://it220274.cloud.htl-leonding.ac.at` erreichbar.

### Manuelle Eingriffe

- **Workflows manuell starten:** Alle drei Workflows haben `workflow_dispatch`, können also im GitHub-Tab *Actions* per „Run workflow“ gestartet werden.
- **Rollback:** Deploy-Workflow manuell starten und als `image-tag` den Short-SHA einer früheren, funktionierenden Version eingeben.
- **Status ansehen:** `gh run list` oder der *Actions*-Tab auf GitHub.

---

## 5. Wichtige Regeln für das Team

- **Push auf `main` = Deployment in Produktion.** Immer über Branch + Pull Request arbeiten.
- Bestehende Flyway-Migrationen nie ändern – sie laufen in Produktion automatisch und sind dort bereits angewendet.
- `./sync-import.sh` nur mit `--local-only` ausführen; die anderen Varianten setzen die Produktionsdatenbank zurück, und es gibt kein Backup.
- Ein grüner CI-Lauf ersetzt keinen echten Login-Test mit Keycloak – die HTTPYac-Tests laufen mit `partyhub.auth.bypass-enabled=true`.

## Dateien im Überblick

| Datei | Zweck |
|---|---|
| `.github/workflows/test.yml` | CI: Tests bei PR und Push auf `main` |
| `.github/workflows/push.yaml` | CD: Docker-Images bauen und nach `ghcr.io` pushen, danach Deploy aufrufen |
| `.github/workflows/deploy.yml` | CD: Rollout auf die School-Cloud (Kubernetes) |
| `Dockerfile` | Backend-Image (Java 21 JRE, Quarkus-App) |
| `Dockerfile.keycloak` | Keycloak-Image mit PartyHub-Theme |
| `k8s/*.yaml` | Kubernetes-Manifeste für Produktion |
| `docker-compose.yaml` | Lokale Umgebung und Test-Infrastruktur in der CI |
