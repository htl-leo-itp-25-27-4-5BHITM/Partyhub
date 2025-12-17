/*
    addParty.js
    - Initialisiert Flatpickr für Datum/Uhrzeitfelder
    - Rendert eine Test-Userliste (Dummy) für die Sichtbarkeitsauswahl
    - Führt sinnvolle Validierungen vor dem Abschicken durch
    - Gut kommentiert (Deutsch), damit es übersichtlich bleibt
*/

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------
  // Flatpickr initialisieren
  // ------------------------------
  // Wir speichern die Instanzen, damit wir später echte Date-Objekte
  // statt nur Strings für Validierung und Vergleich verwenden können.
  const startPicker = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });

  const endPicker = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });

  // ------------------------------
  // Wenn der Startzeitpunkt geändert wird, setzen wir ein Minimum
  // für das Enddatum, damit das Ende nicht vor dem Start liegen kann.
  // Dadurch nimmt das Formular später immer die aktuellste Auswahl.
  // ------------------------------
  startPicker.set("onChange", function (selectedDates) {
    if (selectedDates && selectedDates[0]) {
      endPicker.set("minDate", selectedDates[0]);
    }
  });

  // ------------------------------
  // Wenn das Enddatum geändert wird und es vor dem bisherigen
  // Startdatum liegt, synchronisieren wir den Start automatisch
  // auf das neue Ende. So wird die zuletzt vom Nutzer gewählte
  // Endzeit immer berücksichtigt.
  // ------------------------------
  endPicker.set("onChange", function (selectedDates) {
    if (!selectedDates || !selectedDates[0]) return;
    const newEnd = selectedDates[0];
    const curStart = startPicker.selectedDates[0];
    if (curStart && newEnd < curStart) {
      // Setze Start auf das neue Enddatum (ohne das onChange erneut auszulösen)
      startPicker.setDate(newEnd, true);
      console.log("Startdatum an neues Enddatum angepasst:", newEnd);
    }
  });

  // ------------------------------
  // Visibility dropdown
  // ------------------------------
  const toggleBtn = document.getElementById("visibilityToggle");
  const panel = document.getElementById("visibilityPanel");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    });
  }

  // ------------------------------
  // Dummy User Data (Platzhalter)
  // später vom Backend laden
  // ------------------------------
  const users = [
    { username: "partymausViki", avatar: "V", checked: true },
    { username: "max", avatar: "M", checked: false },
    { username: "evapartying", avatar: "E", checked: false },
    { username: "partywithviki", avatar: "V", checked: true },
    { username: "hannah._.", avatar: "H", checked: false },
  ];

  // Render user list into panel
  const userList = document.getElementById("userList");
  if (userList) {
    users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";
      card.innerHTML = `
                <div class="user-left">
                    <div class="user-avatar">${user.avatar}</div>
                    <span class="user-name">@${user.username}</span>
                </div>
                <label class="user-select">
                    <input type="checkbox" name="visible_users" value="${
                      user.username
                    }" ${user.checked ? "checked" : ""}>
                    <span class="checkmark"></span>
                </label>
            `;
      userList.appendChild(card);
    });
  }

  // ------------------------------
  // Hilfsfunktionen für Validierung
  // ------------------------------
  const showError = (msg) => {
    // Klein, aber effektiv: alert für jetzt. Später können wir Inline-Fehler anzeigen.
    alert(msg);
  };

  const isPositiveNumber = (v) => {
    if (v === null || v === undefined || v === "") return false;
    const n = Number(v);
    return !Number.isNaN(n) && isFinite(n) && n >= 0;
  };

  const isInteger = (v) => {
    if (v === null || v === undefined || v === "") return false;
    const n = Number(v);
    return Number.isInteger(n);
  };

  const safeParseUrl = (u) => {
    try {
      // Wenn URL relativ ist, new URL will throw; that's acceptable as invalid.
      return new URL(u);
    } catch (_) {
      return null;
    }
  };

  // ------------------------------
  // Form Submit mit Validierungen
  // ------------------------------
  const form = document.querySelector(".party-form");
  if (!form) return; // Form nicht gefunden -> nichts tun

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Werte aus dem Formular
    const title = form.title.value && form.title.value.trim();
    const description = form.description.value && form.description.value.trim();
    const location = form.location.value && form.location.value.trim();
    const entryCosts = form.entry_costs.value;
    const minAge = form.min_age.value;
    const maxAge = form.max_age.value;
    const website = form.website.value && form.website.value.trim();

    // Datum: wir ziehen die Date-Objekte direkt aus den Flatpickr-Instanzen
    const startDate = startPicker.selectedDates[0] || null;
    const endDate = endPicker.selectedDates[0] || null;

    // ------------------------------
    // Pflicht- und Sinnprüfungen
    // ------------------------------
    if (!title) {
      showError("Bitte gib einen Namen für die Party ein.");
      form.title.focus();
      return;
    }

    // Ort ist sinnvoll als Pflichtfeld
    if (!location) {
      showError("Bitte gib einen Ort ein.");
      form.location.focus();
      return;
    }

    // Zeitfelder prüfen
    if (!startDate) {
      showError("Bitte wähle ein Startdatum/-zeit aus.");
      return;
    }
    if (!endDate) {
      showError("Bitte wähle ein Enddatum/-zeit aus.");
      return;
    }
    if (startDate >= endDate) {
      showError("Das Enddatum muss nach dem Startdatum liegen.");
      return;
    }

    // Eintrittskosten: falls ausgefüllt, dürfen sie nicht negativ sein
    if (entryCosts && entryCosts !== "") {
      if (!isPositiveNumber(entryCosts)) {
        showError(
          "Die Eintrittskosten müssen eine positive Zahl (oder 0) sein."
        );
        form.entry_costs.focus();
        return;
      }
    }

    // Altersprüfung: wenn beide angegeben, muss min <= max
    if (minAge && minAge !== "") {
      if (!isInteger(minAge) || Number(minAge) < 0) {
        showError("Das Mindestalter muss eine ganze Zahl >= 0 sein.");
        form.min_age.focus();
        return;
      }
    }
    if (maxAge && maxAge !== "") {
      if (!isInteger(maxAge) || Number(maxAge) < 0) {
        showError("Das Maximalalter muss eine ganze Zahl >= 0 sein.");
        form.max_age.focus();
        return;
      }
    }
    if (minAge && maxAge && Number(minAge) > Number(maxAge)) {
      showError(
        "Das Mindestalter darf nicht größer als das Maximalalter sein."
      );
      form.min_age.focus();
      return;
    }

    // Website: falls ausgefüllt, sollte es eine gültige URL sein
    if (website) {
      const parsed = safeParseUrl(website);
      if (!parsed) {
        showError("Bitte gib eine gültige Website-URL an (inkl. https://).");
        form.website.focus();
        return;
      }
    }

    // Sichtbarkeit: wenn nur bestimmte Personen ausgewählt werden, prüfe,
    // ob mindestens eine ausgewählt ist (das macht Sinn).
    const visibilityOpen = document
      .getElementById("visibilityPanel")
      ?.classList.contains("open");
    let visibleUsers = [];
    if (visibilityOpen) {
      visibleUsers = Array.from(
        form.querySelectorAll('input[name="visible_users"]:checked')
      ).map((i) => i.value);
      if (visibleUsers.length === 0) {
        const ok = confirm(
          "Keine Benutzer ausgewählt — soll die Party trotzdem nur für ausgewählte Personen sichtbar sein? (OK = nein, Abbrechen = abbrechen)"
        );
        if (!ok) {
          // Benutzer gewählt abbrechen
          return;
        }
      }
    }

    // ------------------------------
    // Payload zusammenstellen
    // ------------------------------
    const payload = {
      title,
      description,
      time_start: startDate.toISOString(), // ISO an Backend
      time_end: endDate.toISOString(),
      longitude: 1.0, // Platzhalter — Backend/Geocoding getrennt behandeln
      latitude: 1.0,
      category_id: 1,
      website: website || null,
      visible_users: visibleUsers,
    };

    // Min/Max Alter sind optional: nur hinzufügen, wenn der Benutzer sie ausgefüllt hat.
    if (minAge !== null && minAge !== undefined && minAge !== "") {
      payload.min_age = Number(minAge);
    }
    if (maxAge !== null && maxAge !== undefined && maxAge !== "") {
      payload.max_age = Number(maxAge);
    }

    // Eintrittskosten sind optional: nur hinzufügen, wenn ausgefüllt.
    if (entryCosts !== null && entryCosts !== undefined && entryCosts !== "") {
      payload.fee = Number(entryCosts);
    }

    // ------------------------------
    // Abschicken: gleiche Logik wie vorher, aber mit Validierung
    // ------------------------------
    try {
      const response = await fetch("/api/party/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(`Status ${response.status}`);
      const result = await response.json();
      console.log("Server reply:", result);
      alert("Party erfolgreich erstellt.");
      // Optional: umleiten oder Formular zurücksetzen
      // window.location.href = '/';
    } catch (err) {
      console.error("Submit failed:", err);
      showError(
        "Senden der Party fehlgeschlagen. Bitte versuche es später erneut."
      );
    }
  });
});
