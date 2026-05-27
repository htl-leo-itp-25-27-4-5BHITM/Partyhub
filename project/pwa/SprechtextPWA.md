## Folie 1 – Einleitung

„Heute geht es um Progressive Web Apps, kurz PWAs.
PWAs verbinden die Vorteile von klassischen Webseiten mit denen nativer Apps.
Das Ziel ist es, Anwendungen zu entwickeln, die plattformübergreifend funktionieren, offline nutzbar sind und sich wie echte Apps anfühlen.
Dadurch verschwimmen die Grenzen zwischen Web und nativen Anwendungen immer mehr.“

---

## Folie 2 – Der Paradigmenwechsel

„Früher gab es einen klaren Unterschied zwischen Webseiten und nativen Apps.
Webseiten liefen nur im Browser, während Apps installiert werden mussten.

PWAs ändern das grundlegend.

Nutzer können eine Webanwendung direkt auf dem Homescreen installieren – ohne App Store.

Ein großer Vorteil ist außerdem:

Ein einziger Codebase reicht für viele Plattformen wie Windows, Android oder iOS.
Dadurch spart man Entwicklungszeit und Kosten.

Zusätzlich ermöglichen moderne Browser-APIs inzwischen sogar Hardwarezugriffe und Push-Benachrichtigungen direkt aus dem Web.“

---

## Folie 3 – Was ist eine PWA?

„Eine Progressive Web App ist keine einzelne Technologie, sondern eine Kombination moderner Webstandards.

PWAs sind responsive und passen sich an unterschiedliche Bildschirmgrößen an.
Außerdem sind sie über normale URLs erreichbar und leicht teilbar.

Ein wichtiges Merkmal ist die Offline-Fähigkeit. Durch intelligentes Caching funktionieren viele Inhalte auch ohne Internetverbindung.

Zusätzlich bieten PWAs ein app-ähnliches Nutzererlebnis mit Vollbildmodus, Icons und Splash Screens.“

---

## Folie 4 – Das Herzstück: Service Worker

„Das Herzstück jeder PWA ist der sogenannte Service Worker.
Er läuft im Hintergrund unabhängig von der eigentlichen Anwendung.

Seine wichtigste Aufgabe ist das Caching.
Dabei entscheidet er, welche Daten lokal gespeichert werden, damit die Anwendung schneller lädt.

Außerdem ermöglicht der Service Worker die Offline-Nutzung.
Wenn keine Internetverbindung vorhanden ist, liefert er Inhalte direkt aus dem Cache.

Zusätzlich kann er Daten im Hintergrund synchronisieren, ohne dass die Benutzeroberfläche unterbrochen wird.“

---

## Folie 5 – Offline-First Architektur

„Bei einer Offline-First-Architektur geht die Anwendung zuerst davon aus, dass keine Verbindung vorhanden ist.

Die Daten werden lokal gespeichert und später mit dem Server synchronisiert.

Das ist besonders wichtig für mobile Nutzer, die oft instabile Netzwerke haben – zum Beispiel in der U-Bahn oder im Flugzeug.

Dadurch bleibt die Anwendung jederzeit schnell und reaktionsfähig.

Technisch werden dafür lokale Datenbanken wie IndexedDB verwendet.
Der Service Worker übernimmt anschließend die Synchronisation im Hintergrund.“

---

## Folie 6 – Project Fugu

„Project Fugu ist eine Initiative von Google, Microsoft und Intel.
Das Ziel ist es, Webanwendungen mehr Möglichkeiten zu geben, die früher nur nativen Apps vorbehalten waren.

Heute können PWAs bereits auf Hardware wie USB-Geräte, Bluetooth oder NFC zugreifen.

Auch der Zugriff auf das lokale Dateisystem ist möglich.
Dadurch können Webanwendungen Dateien öffnen, bearbeiten und speichern wie klassische Desktop-Programme.

So erreichen PWAs zunehmend echtes Desktop-Niveau.“

---

## Folie 7 – Von der Website zur App

„Der Weg von einer normalen Website zur PWA ist relativ einfach.

Dafür braucht man drei wichtige Komponenten:
erstens das Web App Manifest,
zweitens den Service Worker
und drittens die Installationsfunktion.

Das Manifest definiert Dinge wie Name, Icon und Theme-Farbe der App.

Der Service Worker sorgt für Offline-Fähigkeit und Caching.

Zusätzlich können Push-Benachrichtigungen eingebunden werden, um Nutzer aktiv zu informieren.“

---

## Folie 8 – Ein Codebase für alle Geräte

„Ein großer Vorteil von PWAs ist, dass derselbe Code auf unterschiedlichen Geräten funktioniert.

Dadurch müssen Unternehmen keine separaten Apps für Android, iOS oder Desktop entwickeln.

Das spart laut Studien einen großen Teil der Entwicklungs- und Wartungskosten.

Außerdem erreichen optimierte PWAs sehr schnelle Ladezeiten – oft unter drei Sekunden.“

---

## Folie 9 – Tools und Ökosystem

„Für die Entwicklung von PWAs gibt es inzwischen ein sehr gutes Ökosystem.

Besonders Angular bietet starke Unterstützung.
Mit einem einzigen Befehl können Manifest, Service Worker und Icons automatisch eingerichtet werden.

Als Backend wird oft .NET Core verwendet.
Zusammen ermöglichen diese Technologien leistungsfähige und moderne Webanwendungen.

Ein wichtiges Tool ist außerdem Lighthouse in den Chrome DevTools.
Damit kann man testen, wie gut eine Anwendung die PWA-Standards erfüllt.“

---

## Folie 10 – Fazit

„Zusammenfassend kann man sagen:
Progressive Web Apps sind bereits heute eine wichtige Technologie.

Sie kombinieren die Reichweite des Webs mit vielen Vorteilen nativer Apps.

Dank moderner Standards unterstützen alle großen Browser PWAs.
Durch Entwicklungen wie Project Fugu werden die Möglichkeiten des Webs ständig erweitert.

PWAs bieten damit eine plattformübergreifende, zukunftssichere Lösung für moderne Anwendungen.“
