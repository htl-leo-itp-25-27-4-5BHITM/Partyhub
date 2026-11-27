# CI / CD / CD bei PartyHub: Sprechertext

Begleittext zu den Folien in [`ci-cd-slides.html`](ci-cd-slides.html). Die Folien zeigen nur Stichworte, Grafiken und Code. **Alle Erklärungen stehen hier.**

Dauer: ca. 15 Minuten, 14 Folien.

## Bedienung der Folien

- `docs/ci-cd-slides.html` im Browser öffnen. Für reveal.js und die Schriften braucht man Internet.
- **Pfeiltasten** blättern. Viele Folien bauen sich Schritt für Schritt auf. Bei Code mit Markierung springt die Markierung mit jedem Klick weiter.
- **F** = Vollbild, **Esc** = Übersicht aller Folien.
- PDF: Adresse mit `?print-pdf` am Ende öffnen, dann im Browser als PDF drucken.

## Zeitplan

| Folie | Titel | Dauer |
|---|---|---|
| 1 | CI / CD / CD bei PartyHub | 0:30 |
| 2 | So sähe jedes Release ohne CI/CD aus | 1:30 |
| 3 | Drei Begriffe | 1:30 |
| 4 | Die Pipeline (Deployment, Produktion) | 1:30 |
| 5 | Wozu der Kreis? | 1:00 |
| 6 | Warum sich das lohnt (Commit-SHA) | 1:00 |
| 7 | Architektur (ghcr.io, Workflows) | 1:30 |
| 8 | Ist das bei uns automatisiert? (Pull Request) | 1:00 |
| 9 | Wie hängen die Workflows zusammen? | 1:30 |
| 10 | Unser Ablauf im Team | 1:00 |
| 11 | Ein minimaler CI-Workflow | 1:00 |
| 12 | Was wir noch tun müssen | 0:45 |
| 13 | Branch-Schutz | 1:00 |
| 14 | Danke | 0:15 |

---

## Folie 1: CI / CD / CD bei PartyHub

**Sagen:**
> Unser Thema ist CI/CD. Eigentlich sind es drei Begriffe: **C**ontinuous **I**ntegration, **C**ontinuous **D**elivery und **C**ontinuous **D**eployment. Zusammen beschreiben sie, wie eine Codeänderung automatisch getestet, verpackt und auf den Server gebracht wird. Wir zeigen das an unserem eigenen Projekt PartyHub.

---

## Folie 2: So sähe jedes Release ohne CI/CD aus

**Auf der Folie:** Alle Befehle, die man ohne Automatisierung bei **jeder** Änderung per Hand ausführen müsste. Die Befehle sind echt und entsprechen dem, was unsere Pipeline macht.

**Sagen:**
> Stellt euch vor, wir haben eine kleine Änderung gemacht und wollen sie auf unsere Website bringen. Ohne CI/CD müsste jemand von uns diese Befehle ausführen:
>
> 1. **Testen und bauen:** Mit Maven die Tests laufen lassen und die Quarkus-Anwendung bauen.
> 2. **Docker-Images bauen und hochladen:** Wir brauchen zwei Images, eins für unser Backend und eins für Keycloak, also unseren Login. Die werden gebaut und in eine Registry hochgeladen, dazu gleich mehr. Der Tag `$TAG` ist der Commit-SHA, auch dazu gleich mehr.
> 3. **Auf Kubernetes ausrollen:** Unsere Website läuft auf der School-Cloud in Kubernetes. Mit `kubectl` sagen wir dem Cluster: „Nimm das neue Image.“ Dann warten wir, bis die neue Version läuft.
>
> Das sind über zehn Befehle, bei jeder Änderung. Man braucht die Zugangsdaten zum Cluster auf dem eigenen Laptop, und wenn man einen Schritt vergisst, zum Beispiel die Tests, geht kaputter Code live.
>
> *(Klick)* Mit CI/CD ist es ein Klick: „Merge“ im Pull Request. Alles andere macht GitHub Actions automatisch, jedes Mal gleich und jedes Mal mit Tests.

**Begriffe:**
- **Docker-Image:** ein fertiges Paket aus unserer Anwendung und allem, was sie zum Laufen braucht (z. B. Java).
- **Kubernetes:** ein System, das Container auf Servern startet, überwacht und bei Updates austauscht.
- **`kubectl`:** das Kommandozeilen-Tool, mit dem man Kubernetes steuert.

---

## Folie 3: Drei Begriffe, die aufeinander aufbauen

**Sagen** (Karten kommen einzeln per Klick):
> **Continuous Integration:** „Integration“ heißt Zusammenführen. Wir sind mehrere Leute, die gleichzeitig am selben Code arbeiten. Bei jeder Änderung wird automatisch gebaut und getestet, ob alles noch zusammenpasst.
>
> **Continuous Delivery:** Wenn die Tests grün sind, wird automatisch ein auslieferbares Paket gebaut, bei uns die Docker-Images. Die Software *könnte* jederzeit ausgeliefert werden. Das Ausrollen selbst passiert aber noch per Klick von einem Menschen.
>
> **Continuous Deployment:** Hier ist auch dieser letzte Klick automatisiert. Jede Änderung, die alle Tests besteht, geht sofort live.
>
> Die beiden „CD“ unterscheiden sich also nur im letzten Schritt: Bei Delivery entscheidet ein Mensch, bei Deployment die Pipeline.

---

## Folie 4: Die Pipeline

**Auf der Folie:** Ablauf von der Code-Änderung bis zur Produktion, darunter die drei Stufen. Per Klick erscheinen die Begriffe „Deployment“ und „Produktion“.

**Sagen:**
> Eine **Pipeline** ist die Abfolge von Schritten, die jede Änderung automatisch durchläuft, wie ein Fließband. Build und Tests gehören zur Integration. Paket und Freigabe gehören zur Delivery. Der letzte Schritt, das Ausrollen in die Produktion, ist das Deployment.
>
> *(Klick)* **Deployment** heißt: eine neue Version der Software auf den Server bringen. Bei uns ist das genau dieser `kubectl`-Befehl. Er sagt Kubernetes, dass Quarkus ab jetzt das Image mit einer bestimmten Version verwenden soll. Kubernetes startet dann den neuen Container und stoppt den alten.
>
> *(Klick)* **Produktion** ist die echte, laufende Anwendung, die alle Benutzer:innen verwenden. Bei uns ist das die Website `it220274.cloud.htl-leonding.ac.at`. Im Gegensatz dazu läuft die Anwendung beim Entwickeln **lokal** auf dem eigenen Laptop unter `localhost:8080`, und nur man selbst sieht sie. Was in Produktion kaputtgeht, merken alle. Deshalb soll nur getesteter Code dort landen.

**Falls gefragt wird, was „Freigabe“ ist:** Die Entscheidung, ob ausgerollt wird. Bei Continuous Delivery klickt ein Mensch, bei Continuous Deployment (wie bei uns) passiert es automatisch, sobald alles grün ist.

---

## Folie 5: Wozu der Kreis?

**Auf der Folie:** Der DevOps-Kreislauf als liegende Acht mit acht Phasen und rechts, was jede Phase bei uns bedeutet.

**Sagen:**
> Der Kreis zeigt, dass Software nie fertig ist. Jede Änderung, egal ob neues Feature oder Bugfix, läuft diese acht Phasen durch, und danach beginnt es wieder von vorn.
>
> Links ist die Entwicklung: Wir **planen** ein Feature, bei uns mit OpenSpec, **programmieren** es auf einem Branch, dann wird es **gebaut** und **getestet**. Rechts ist der Betrieb: Das Image wird **veröffentlicht** (Release), auf den Server **ausgerollt** (Deploy), die Website **läuft** für alle (Betrieb), und wir bekommen **Feedback**, also Bugs oder Wünsche. Daraus planen wir die nächste Änderung.
>
> Der Kreis zeigt auch, wo CI/CD sitzt: **CI** automatisiert Build und Test (grün), **CD** automatisiert Release und Deploy (pink). Das ist genau der Teil, den sonst jemand per Hand machen müsste, also die Befehle von Folie 2.

**Hintergrund:** „DevOps“ setzt sich aus *Development* (Entwicklung) und *Operations* (Betrieb) zusammen. Die Acht zeigt, dass beides zusammengehört und ineinander übergeht.

---

## Folie 6: Warum sich das lohnt

**Sagen:**
> Vier Vorteile:
> - **Fehler früh finden:** Kaputter Code fällt schon im Pull Request auf, nicht erst, wenn die Website kaputt ist.
> - **Keine Handarbeit:** Niemand muss die Befehle von vorhin kennen oder Zugangsdaten zum Cluster auf dem Laptop haben.
> - **Nachvollziehbar:** Jedes Image trägt den Commit-SHA.
> - **Häufige Releases:** Weil Ausliefern nichts kostet, gehen bei uns oft mehrere Änderungen pro Tag live. Kleine Änderungen sind leichter zu prüfen als eine große.
>
> *(Klick)* Was ist ein **Commit-SHA**? Jeder Commit in Git bekommt eine eindeutige ID, einen langen Hash aus Buchstaben und Zahlen. Meistens reichen die ersten 7 Zeichen, hier `6a3329c`. Unsere Pipeline verwendet genau diese ID als Namen für das Docker-Image. Wenn in Produktion das Image `partyhub-backend:6a3329c` läuft, wissen wir genau, welcher Code dort läuft, und können ihn mit `git show 6a3329c` anschauen.

**Falls gefragt wird, wofür „SHA“ steht:** *Secure Hash Algorithm*. Git berechnet aus dem Inhalt des Commits eine Prüfsumme. Ändert sich auch nur ein Zeichen, ist der Hash ein anderer.

---

## Folie 7: Architektur

**Auf der Folie:** Der Weg des Codes vom Branch bis zur School-Cloud. Per Klick: was ghcr.io ist und wo die Pipeline im Repo liegt.

**Sagen:**
> Von links nach rechts: Wir pushen unseren Branch auf **GitHub**. GitHub startet **GitHub Actions**, das ist der Dienst, der unsere Pipeline ausführt. Er läuft auf einem Rechner von GitHub, dem sogenannten Runner. Die Pipeline testet, baut die zwei Docker-Images und lädt sie nach **ghcr.io** hoch. Dann sagt sie der **School-Cloud**, dass die neuen Images verwendet werden sollen.
>
> In der School-Cloud läuft Kubernetes. Der **Ingress** nimmt die Anfragen an unsere Website-URL an und leitet sie weiter: normale Anfragen an **Quarkus**, unser Backend mit der **Postgres**-Datenbank, und Login-Anfragen an **Keycloak** mit eigener Datenbank.
>
> *(Klick)* **ghcr.io** ist die **GitHub Container Registry**. Das ist ein Online-Speicher für Docker-Images. GitHub speichert unseren Code, ghcr.io speichert die fertig gebauten Images. Die Pipeline lädt sie dort hoch, und Kubernetes lädt sie beim Deployment von dort herunter.
>
> *(Klick)* Die Pipeline selbst ist Code: Sie besteht aus drei YAML-Dateien im Ordner `.github/workflows/` in unserem Repository. Jede Datei ist ein **Workflow**, eine Abfolge von Schritten:
> - `test.yml` testet,
> - `push.yaml` baut die Images und lädt sie nach ghcr.io,
> - `deploy.yml` rollt sie auf der School-Cloud aus.
>
> GitHub erkennt diese Dateien automatisch und führt sie aus. Weil sie im Repo liegen, sind Änderungen an der Pipeline genauso nachvollziehbar wie Änderungen am Code.

**Falls gefragt wird, woher GitHub die Zugangsdaten zur School-Cloud hat:** Die Kubeconfig (die Zugangsdatei für Kubernetes) ist als **Secret** in den GitHub-Einstellungen gespeichert (`KUBE_CONFIG_DATA`). Sie liegt nicht im Repo, und niemand kann sie in den Logs sehen.

---

## Folie 8: Ist das bei uns automatisiert?

**Sagen:**
> Kurze Antwort: **Ja, komplett.** Vorher zwei Begriffe, die wir dafür brauchen:
>
> Ein **Pull Request**, kurz PR, ist eine Anfrage: „Bitte übernehmt die Änderungen aus meinem Branch in `main`.“ Im Pull Request sieht man alle Änderungen, das Team kann sie kommentieren, und die Tests laufen automatisch. Erst danach wird gemergt.
>
> **Push auf main** heißt, dass neuer Code im Hauptbranch `main` landet. Bei uns passiert das durch den **Merge**, also das Übernehmen eines Pull Requests.
>
> *(Klicks, Zeile für Zeile)*
> - **Continuous Integration** läuft bei jedem Pull Request und noch einmal bei jedem Push auf `main`. Das ist `test.yml`.
> - **Continuous Delivery**: Ist der Test auf `main` grün, werden die Images gebaut und hochgeladen. Das ist `push.yaml`.
> - **Continuous Deployment**: Direkt danach wird ausgerollt. Das ist `deploy.yml`.
>
> Ein Merge auf `main` geht also ohne einen einzigen manuellen Schritt live.

**Hintergrund:** Zusätzlich scannt **CodeQL** bei jedem Push auf `main` den Code auf Sicherheitslücken (GitHub-Standardeinstellung, keine eigene Datei).

---

## Folie 9: Wie hängen die Workflows zusammen?

**Auf der Folie:** Die drei Workflow-Dateien, gekürzt. Sie erscheinen nacheinander.

**Sagen:**
> Die letzte Folie hat gezeigt, **was** automatisiert ist. Hier sieht man, **wie** die drei Dateien ineinandergreifen. Entscheidend ist jeweils der Abschnitt `on:`, der festlegt, wann ein Workflow startet.
>
> *(Klick)* **`test.yml`** startet mit `on: pull_request` und `on: push` auf `main`, also bei jedem PR und jedem Merge. Dann laufen drei Arten von Tests: die Frontend-Tests mit Node, die Backend-Tests mit Maven und die API-Tests mit HTTPYac. Die API-Tests schicken echte HTTP-Anfragen an unser Backend.
>
> *(Klick)* **`push.yaml`** startet mit `on: workflow_run`, und zwar immer dann, wenn der Workflow „Test“ fertig ist. Er prüft zuerst, ob der Test grün war und auf `main` lief. Bei einem Pull Request wird er übersprungen, auf GitHub steht dann „skipped“. Dann baut er die Anwendung, baut die Docker-Images und lädt sie hoch. Am Ende ruft er mit `uses:` den nächsten Workflow auf.
>
> *(Klick)* **`deploy.yml`** startet mit `on: workflow_call`, also nur, wenn ein anderer Workflow ihn aufruft. Er bekommt den Image-Tag, also den Commit-SHA, übergeben und führt genau die `kubectl`-Befehle von Folie 2 aus.
>
> *(Klick)* Zusammengefasst: Test bei jedem PR und Merge → bei Grün auf `main` Build and Push → Deploy.

**Falls gefragt wird, warum es drei Dateien sind und nicht eine:**
- Tests laufen auch bei Pull Requests, Build und Deploy nur auf `main`.
- `deploy.yml` kann man auch allein per Hand starten, zum Beispiel für einen Rollback auf eine ältere Version.

**Falls gefragt wird, was zusätzlich im echten `deploy.yml` steht:**
- Ein Sicherheitscheck prüft vor dem Deploy, ob die Keycloak-Datenbank migriert ist. Sonst würde Keycloak mit einer leeren Datenbank starten, und alle Benutzerkonten wären weg.
- Mit `concurrency` laufen nie zwei Deploys gleichzeitig.
- Datenbanken und hochgeladene Bilder bleiben beim Deploy erhalten.

---

## Folie 10: Unser Ablauf im Team

**Auf der Folie:** Git-Grafik und die Befehle, die wir dafür verwenden. Die Markierung im Code springt mit jedem Klick weiter.

**Sagen:**
> So arbeiten wir im Team. Die pinke Linie ist `main`, die blaue ein Feature-Branch.
>
> *(Klick)* Zuerst legt man einen **eigenen Branch** an, eine Kopie von `main`, auf der man arbeiten kann, ohne die anderen zu stören.
>
> *(Klick)* Dann ändert man den Code, testet lokal und macht einen **Commit**, also einen gespeicherten Zwischenstand mit Beschreibung. Unsere Commit-Nachrichten beginnen mit `feat:`, `fix:` oder `docs:` (Conventional Commits).
>
> *(Klick)* Den Branch pushen und einen **Pull Request** auf `main` öffnen. Ab jetzt läuft die CI automatisch.
>
> *(Klick)* Ist der Test grün, schaut jemand aus dem Team den Code an (Review), und dann wird gemergt. Der Merge ist gleichzeitig das Deployment. Nach etwa 9 Minuten ist die Änderung live.
>
> Ist der Test rot, korrigiert man den Fehler im Branch und pusht noch einmal. Der Test läuft dann automatisch erneut.
>
> Deshalb gilt bei uns: **Nie direkt auf `main` arbeiten.** Ein Push auf `main` ist ein Deployment in Produktion.

---

## Folie 11: Ein minimaler CI-Workflow

**Auf der Folie:** Die kleinste sinnvolle Version eines Test-Workflows. Die Markierung springt mit jedem Klick zum nächsten Teil.

**Sagen:**
> So sieht ein CI-Workflow im Kern aus. Er hat drei Teile:
>
> *(Klick)* **`on`: Wann läuft er?** Bei jedem Pull Request auf `main` und bei jedem Push auf `main`.
>
> *(Klick)* **`runs-on`: Wo läuft er?** GitHub stellt für jeden Lauf einen frischen, leeren Ubuntu-Rechner bereit, den **Runner**. Weil er jedes Mal neu ist, kann es kein „bei mir funktioniert's“ geben. Was dort läuft, funktioniert überall.
>
> *(Klick)* **`steps`: Was passiert?** Mit `uses:` verwendet man **fertige Bausteine**, sogenannte Actions, die andere geschrieben haben: hier „Code auschecken“ und „Java 21 installieren“.
>
> *(Klick)* Mit `run:` führt man **eigene Befehle** aus, hier die Tests. Schlägt ein Befehl fehl, ist der ganze Lauf rot, und im Pull Request erscheint ein rotes ✗.
>
> Mehr braucht man für den Anfang nicht. Diese Datei ins Repo legen, und GitHub führt sie ab sofort bei jedem PR aus. Unsere echte `test.yml` ist länger, weil sie zusätzlich Datenbanken und Keycloak startet und die API-Tests ausführt. Das Prinzip ist aber dasselbe.

---

## Folie 12: Was wir noch tun müssen

**Sagen:**
> Unsere Pipeline funktioniert, aber es gibt Lücken:
> - **Muss: Branch-Schutz.** `main` ist bei uns nicht geschützt. Man kann einen PR mergen, obwohl der Test rot ist, oder direkt auf `main` pushen. Das kommt auf der nächsten Folie.
> - **Sollte: Rollback.** Wenn ein Deployment Probleme macht, gibt es keinen automatischen Weg zurück. Per Hand geht es heute schon: Den Deploy-Workflow auf GitHub manuell starten und den Commit-SHA einer älteren, funktionierenden Version eingeben. Das sollten wir dokumentieren und einmal üben.
> - **Sollte: Datenbank-Backup.** Für die Produktionsdatenbank gibt es kein Backup.
> - **Kann: Staging-Umgebung.** Eine zweite Kopie der Produktion zum Testen, bevor es wirklich live geht. Zurzeit gibt es nur lokal und Produktion.
> - **Kann: Benachrichtigungen,** damit wir sofort merken, wenn ein Lauf auf `main` rot ist.

---

## Folie 13: Branch-Schutz für main

**Sagen:**
> Branch-Schutz sind Regeln, die GitHub für einen Branch **erzwingt**. Zurzeit ist „nur über Pull Request und nur bei grünem Test“ bei uns nur eine Absprache. Mit Branch-Schutz macht GitHub es zur Pflicht.
>
> Man richtet ihn in den Repository-Einstellungen unter Settings → Branches ein, mit vier Häkchen:
> - **Pull Request verpflichtend:** Niemand kann direkt auf `main` pushen.
> - **Status-Check `test` muss grün sein:** Das ist der Job aus `test.yml`.
> - **Kein Force-Push:** Die Geschichte von `main` kann nicht überschrieben werden.
> - **Kein Löschen:** `main` kann nicht gelöscht werden.
>
> *(Klick)* Danach gilt: Test grün und Review gemacht → Merge → automatischer Deploy.
>
> *(Klick)* Sonst bleibt der Merge-Button gesperrt.
>
> *(Klick)* Dasselbe geht auch mit einem einzigen Befehl im Terminal über die GitHub-API. Dafür braucht man Admin-Rechte im Repository.

**Falls gefragt wird, ob das Doku-PRs blockiert:** Nein. `test.yml` läuft bei jedem Pull Request, auch wenn nur Doku geändert wurde. Der Check ist also immer vorhanden.

**Hintergrund, warum das wichtig ist (echtes Beispiel):** Am 25.11.2026 wurde PR #228 (Settings-Seite) gemergt, obwohl der Test rot war. Der Keycloak-Container ist beim Start abgestürzt. Auf `main` war der Test dann auch rot, deshalb liefen weder Build noch Deploy, und die Produktion blieb auf der alten Version. Erst PR #231 hat den Fehler behoben. Die Pipeline hat also die Produktion geschützt, aber nicht `main`. Branch-Schutz hätte den Merge verhindert.

---

## Folie 14: Danke für Ihre Aufmerksamkeit

**Sagen:**
> Danke fürs Zuhören! Habt ihr Fragen?

---

## Anhang A: Glossar für Fragen

| Begriff | Erklärung |
|---|---|
| **Branch** | Eigene Kopie des Codes, auf der man arbeitet, ohne `main` zu verändern |
| **Commit** | Gespeicherter Zwischenstand mit Beschreibung |
| **Commit-SHA** | Eindeutige ID eines Commits, z. B. `6a3329c` |
| **Pull Request (PR)** | Anfrage, einen Branch in `main` zu übernehmen. Dort laufen Tests und Review. |
| **Merge** | Übernehmen eines Branches in einen anderen |
| **`main`** | Hauptbranch. Bei uns gilt: was auf `main` ist, ist live. |
| **Pipeline** | Abfolge automatischer Schritte von der Änderung bis zur Produktion |
| **Workflow** | Eine YAML-Datei in `.github/workflows/`, die GitHub Actions ausführt |
| **GitHub Actions** | Der Dienst von GitHub, der Workflows ausführt |
| **Runner** | Frischer Rechner von GitHub, auf dem ein Workflow läuft |
| **Secret** | Geheimer Wert (z. B. Zugangsdaten), in GitHub gespeichert, nicht im Repo |
| **Docker-Image** | Fertiges Paket aus Anwendung und allem, was sie zum Laufen braucht |
| **Container** | Ein laufendes Docker-Image |
| **Registry / ghcr.io** | Online-Speicher für Docker-Images. ghcr.io ist der von GitHub. |
| **Kubernetes** | System, das Container auf Servern startet, überwacht und austauscht |
| **`kubectl`** | Kommandozeilen-Tool für Kubernetes |
| **Ingress** | Eingangstor im Cluster, leitet Anfragen an die URL zu den Diensten weiter |
| **Deployment** | Neue Version auf den Server ausrollen |
| **Produktion** | Die echte, laufende Anwendung für alle Benutzer:innen |
| **Rollback** | Zurück auf eine frühere, funktionierende Version |
| **Staging** | Kopie der Produktion zum Testen vor dem Release |

## Anhang B: Zahlen und Beispiele für Fragen

**Wie lange dauert es vom Merge bis live?** Ca. 9 Minuten. Beispiel PR #229 (Profilbild-Fix) am 25.11.2026:

| Schritt | Start | Ende | Dauer |
|---|---|---|---|
| Test im Pull Request | 12:34:38 | 12:37:47 | ca. 3 min |
| Merge | 12:41:28 | | |
| Test auf `main` | 12:41:32 | 12:45:12 | ca. 3:40 min |
| Build and Push | 12:45:21 | 12:46:35 | ca. 1:15 min |
| Deploy | 12:47:58 | 12:50:30 | ca. 2:30 min |

**Was wird getestet?**
- Frontend-JavaScript: `node --test` (`scripts/tests`, `src/test/js`)
- Backend: `mvn clean test` (Quarkus-Tests)
- REST-API: alle Dateien in `api/*.http` mit HTTPYac gegen einen laufenden Quarkus. Postgres und Keycloak laufen dafür mit Docker Compose.

**Warum läuft bei Doku-Änderungen auf `main` nichts?** `test.yml` startet bei einem Push auf `main` nur, wenn Code-relevante Pfade geändert wurden (`src/`, `keycloak/`, `api/`, `k8s/`, `pom.xml` …). Ohne Test gibt es kein Build und kein Deploy. Das ist gewollt.

**Wie macht man einen Rollback?** GitHub → Actions → Workflow „Deploy“ → „Run workflow“ → als `image-tag` den Commit-SHA einer früheren Version eingeben. Oder im Terminal: `gh workflow run Deploy -f image-tag=<sha>`.

**Wo sieht man die Läufe?** Im Tab „Actions“ auf GitHub, oder im Terminal mit `gh run list`.

## Anhang C: Dateien

| Datei | Zweck |
|---|---|
| `.github/workflows/test.yml` | CI: Tests bei jedem PR und Push auf `main` |
| `.github/workflows/push.yaml` | CD: Docker-Images bauen, nach ghcr.io pushen, Deploy aufrufen |
| `.github/workflows/deploy.yml` | CD: Rollout auf die School-Cloud |
| `Dockerfile` | Backend-Image (Java 21, Quarkus) |
| `Dockerfile.keycloak` | Keycloak-Image mit PartyHub-Login-Theme |
| `k8s/*.yaml` | Kubernetes-Beschreibung der Produktion |
| `docker-compose.yaml` | Lokale Umgebung, auch für die Tests in der CI |
