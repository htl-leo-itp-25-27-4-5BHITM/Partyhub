/*
    addParty.js
    - Initialisiert Flatpickr für Datum/Uhrzeitfelder
    - Rendert eine Test-Userliste (Dummy) für die Sichtbarkeitsauswahl
    - Führt sinnvolle Validierungen vor dem Abschicken durch
    - Gut kommentiert (Deutsch), damit es übersichtlich bleibt
*/

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------
  // Back button functionality
  // ------------------------------
  const backArrow = document.querySelector(".back-arrow");
  if (backArrow) {
    backArrow.addEventListener("click", function () {
      window.history.back();
    });
  }

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
  // Load users from backend API
  // ------------------------------
  const userList = document.getElementById("userList");
  let visibleUsersToCheck = null; // Store visible users for edit mode
  
  async function loadUsers() {
    try {
      const response = await fetch("/api/users/all");
      if (!response.ok) {
        console.error("Failed to fetch users:", response.status);
        return;
      }
      const users = await response.json();
      renderUsers(users);
      
      // If we have stored visible_users (from edit mode), check them now
      if (visibleUsersToCheck && Array.isArray(visibleUsersToCheck)) {
        checkVisibleUsers(visibleUsersToCheck);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  function renderUsers(users) {
    if (!userList) return;
    userList.innerHTML = ""; // Clear existing content
    
    users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";
      
      // Generate avatar from first letter of displayName or distinctName
      const avatarLetter = (user.displayName || user.distinctName || "?").charAt(0).toUpperCase();
      const username = user.distinctName || user.id.toString();
      
      card.innerHTML = `
                <div class="user-left">
                    <div class="user-avatar">${avatarLetter}</div>
                    <span class="user-name">@${username}</span>
                </div>
                <label class="user-select">
                    <input type="checkbox" name="visible_users" value="${username}">
                    <span class="checkmark"></span>
                </label>
            `;
      userList.appendChild(card);
    });
  }

  function checkVisibleUsers(visibleUsers) {
    const form = document.querySelector(".party-form");
    if (!form) return;
    
    Array.from(form.querySelectorAll('input[name="visible_users"]')).forEach(inp => {
      if (visibleUsers.includes(inp.value)) inp.checked = true;
      else inp.checked = false;
    });
  }

  // Load users when page loads
  loadUsers();

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
  // createParty helper (uses the example you provided)
  // Accepts a partyPayload object and sends it to /api/party/add
  // ------------------------------
  async function createParty(partyPayload) {
    try {
      const response = await fetch("/api/party/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(partyPayload),
      });

      const location = response.headers.get("Location");
      let data = null;
      try {
        data = await response.json();
      } catch (_) {
        // no json body
      }

      if (response.ok || response.status === 201) {
        console.log("Party created successfully!", { status: response.status, data, location });
        return { ok: true, status: response.status, data, location };
      }

      // Try to read text for more informative error
      let text = null;
      try {
        text = await response.text();
      } catch (_) {}
      console.error("Error creating party:", response.status, text || data);
      return { ok: false, status: response.status, text, data };
    } catch (error) {
      console.error("Network error:", error);
      return { ok: false, error };
    }
  }

  // updateParty helper for edit mode
  async function updateParty(partyId, partyPayload) {
    try {
      // prefer backend helper if available
      if (window.backend && typeof window.backend.updateParty === "function") {
        const data = await window.backend.updateParty(partyId, partyPayload);
        return { ok: !!data, data };
      }
      const response = await fetch(`/api/party/${partyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(partyPayload),
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (response.ok) return { ok: true, status: response.status, data };
      return { ok: false, status: response.status, data };
    } catch (error) {
      console.error("Network error (update):", error);
      return { ok: false, error };
    }
  }

  // ------------------------------
  // Form element MUST be available before trying to load edit-mode data
  // ------------------------------
  const form = document.querySelector(".party-form");
  if (!form) return; // Form nicht gefunden -> nichts tun

  // ------------------------------
  // Edit mode: if ?id=.. present, load party and prefill form
  // ------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const editPartyId = urlParams.get("id");
  let isEditMode = false;
  (async function tryLoadEdit() {
    if (!editPartyId) return;
    isEditMode = true;
    const submitBtn = form.querySelector(".submit-btn");
    if (submitBtn) submitBtn.textContent = "Update";

    // helper to parse backend date format dd.MM.yyyy HH:mm
    const parseFromBackend = (s) => {
      if (!s || typeof s !== "string") return null;
      const [datePart, timePart] = s.split(" ");
      if (!datePart || !timePart) return null;
      const [d, m, y] = datePart.split(".").map(Number);
      const [h, min] = timePart.split(":").map(Number);
      if ([d, m, y, h, min].some((v) => Number.isNaN(v))) return null;
      return new Date(y, m - 1, d, h, min);
    };

    // fetch party via backend helper or direct fetch
    let party = null;
    try {
      if (window.backend && typeof window.backend.getPartyById === "function") {
        party = await window.backend.getPartyById(editPartyId);
      } else {
        const res = await fetch(`/api/party/${editPartyId}`);
        if (res.ok) party = await res.json();
      }
    } catch (err) {
      console.error("Error loading party for edit:", err);
    }
    if (!party) {
      alert("Konnte Party nicht laden.");
      return;
    }

    // populate form fields (guard checks)
    form.title.value = party.title || form.title.value || "";
    form.description.value = party.description || form.description.value || "";
    // Handle location name - can be object with name property or string
    if (party.location) {
      if (typeof party.location === 'object' && party.location.name) {
        if (form.location_name) form.location_name.value = party.location.name;
      } else if (typeof party.location === 'string') {
        if (form.location_name) form.location_name.value = party.location;
      }
    }
    if (party.website) form.website.value = party.website;
    if (party.fee !== undefined) form.entry_costs.value = party.fee;
    if (party.min_age !== undefined) form.min_age.value = party.min_age;
    if (party.max_age !== undefined) form.max_age.value = party.max_age;
    if (party.theme !== undefined && form.theme) form.theme.value = party.theme;
    if (party.max_people !== undefined && form.max_people) form.max_people.value = party.max_people;

    // times into flatpickr
    const sd = parseFromBackend(party.time_start || party.timeStart || party.start_time);
    const ed = parseFromBackend(party.time_end || party.timeEnd || party.end_time);
    if (sd) startPicker.setDate(sd, true);
    if (ed) endPicker.setDate(ed, true);

    // visible users: store for checking after users are loaded
    if (Array.isArray(party.visible_users) && party.visible_users.length > 0) {
      visibleUsersToCheck = party.visible_users;
      // Try to check immediately (if users already loaded), otherwise they'll be checked when users load
      checkVisibleUsers(party.visible_users);
      // open panel to show selections
      const panelEl = document.getElementById("visibilityPanel");
      const toggle = document.getElementById("visibilityToggle");
      if (panelEl && toggle) {
        panelEl.classList.add("open");
        toggle.classList.add("open");
      }
    }
  })();

  // ------------------------------
  // Form Submit mit Validierungen
  // ------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Werte aus dem Formular
    const title = form.title.value && form.title.value.trim();
    const description = form.description.value && form.description.value.trim();
    const locationName = form.location_name && form.location_name.value ? form.location_name.value.trim() : '';
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
    if (!locationName) {
      showError("Bitte gib einen Ortsnamen ein.");
      if (form.location_name) form.location_name.focus();
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
    // Payload zusammenstellen (Backend erwartet dd.MM.yyyy HH:mm)
    // ------------------------------
    const formatToBackend = (d) => {
      if (!d || !(d instanceof Date)) return null;
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
        d.getHours()
      )}:${pad(d.getMinutes())}`;
    };

    const payload = {
      title,
      description,
      location_name: locationName || null, // Location name
      time_start: formatToBackend(startDate) || null,
      time_end: formatToBackend(endDate) || null,
      longitude: form.longitude?.value ? Number(form.longitude.value) : 16.3738,
      latitude: form.latitude?.value ? Number(form.latitude.value) : 48.2082,
      category_id: form.category_id?.value ? Number(form.category_id.value) : 2,
      website: website || null,
      visible_users: visibleUsers,
      theme: form.theme?.value ? String(form.theme.value).trim() : null,
    };

    // optionales max_people falls vorhanden im Form
    if (form.max_people?.value) {
      const mp = Number(form.max_people.value);
      if (!Number.isNaN(mp) && isFinite(mp) && mp > 0) payload.max_people = mp;
    }

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
    const submitBtn = form.querySelector(".submit-btn");
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
      }

      let result;
      if (isEditMode && editPartyId) {
        // Update flow
        result = await updateParty(editPartyId, payload);
        if (result.ok) {
          alert("Party erfolgreich aktualisiert.");
          // Try redirect to the updated party page if id known
          const id = editPartyId;
          window.location.href = `/party/${id}`;
          return;
        } else {
          const msg = result.text || (result.data && JSON.stringify(result.data)) || "Aktualisierung fehlgeschlagen.";
          showError(msg);
        }
      } else {
        // Create flow
        result = await createParty(payload);
        if (result.ok) {
          alert("Party erfolgreich erstellt.");
          if (result.location) {
            window.location.href = result.location;
            return;
          }
          if (result.data && (result.data.id || result.data.partyId)) {
            const id = result.data.id || result.data.partyId;
            window.location.href = `/party/${id}`;
            return;
          }
          window.location.href = "/listPartys/listPartys.html";
        } else {
          const msg =
            (result.text && result.text.slice(0, 100)) ||
            (result.data && JSON.stringify(result.data).slice(0, 200)) ||
            "Senden der Party fehlgeschlagen. Bitte versuche es später erneut.";
          showError(msg);
        }
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
});
// end of file
