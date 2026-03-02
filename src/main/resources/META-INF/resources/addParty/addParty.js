document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     DOM ELEMENTE
  ========================== */
  const steps = document.querySelectorAll(".step");
  const title = document.getElementById("stepTitle");
  const btn = document.getElementById("continueBtn");
  const backArrow = document.querySelector(".back-arrow");

  const addressInput = document.getElementById("location_address");
  const suggestionsBox = document.getElementById("addressSuggestions");

  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  /* ==========================
     STATE
  ========================== */
  let currentStep = 0;

  const state = {
    id: null, // ADDED: editing id if present
    title: "",
    description: "",
    time_start: "",
    time_end: "",
    location_address: "",
    latitude: null,
    longitude: null,
    visibility: "private",
    selectedUsers: [],
    entry_costs: null,
    theme: "",
    min_age: 18,
    max_age: null,
    website: "",
  };

  const stepTitles = [
    "Add new Party",
    "Who can attend the party?",
    "Other Infos",
    "Map Preview",
  ];

  /* ==========================
     FLATPICKR
  ========================== */
  const fpStart = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
  });

  const fpEnd = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
  });

  /* ==========================
     STEP NAVIGATION
  ========================== */
  function showStep(index) {
    steps.forEach((s) => s.classList.remove("active"));
    steps[index].classList.add("active");

    title.textContent = stepTitles[index];
    btn.textContent = index === steps.length - 1 ? "Submit" : "Continue";
  }

  /* ==========================
     VALIDATION
  ========================== */
  function validateStep() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll("input");
    let valid = true;

    inputs.forEach((input) => {
      const value = input.value.trim();
      let error = false;

      // Pflichtfelder
      if (
          ["title", "time_start", "location_address"].includes(input.name) &&
          value === ""
      ) {
        error = true;
      }

      // Adresse nur gültig wenn ausgewählt
      if (
          input.name === "location_address" &&
          (!state.latitude || !state.longitude)
      ) {
        error = true;
      }

      // Startdatum darf nicht Vergangenheit sein
      if (input.name === "time_start" && fpStart.selectedDates[0]) {
        if (fpStart.selectedDates[0] < new Date()) error = true;
      }

      // Enddatum nach Start
      if (
          input.name === "time_end" &&
          fpStart.selectedDates[0] &&
          fpEnd.selectedDates[0] &&
          fpEnd.selectedDates[0] <= fpStart.selectedDates[0]
      ) {
        error = true;
      }

      input.classList.toggle("input-error", error);
      if (error) valid = false;
    });

    return valid;
  }

  /* ==========================
     BUTTON EVENTS
  ========================== */
  btn.addEventListener("click", async () => {
    // Before validating, ensure flatpickr parsed date strings and geocode address if needed.
    try {
      // If time inputs contain a string but flatpickr hasn't parsed it yet, force parse
      const timeStartInput = document.getElementById("time_start");
      const timeEndInput = document.getElementById("time_end");
      if (timeStartInput && timeStartInput.value && !fpStart.selectedDates[0]) {
        try { fpStart.setDate(timeStartInput.value, true); } catch {}
      }
      if (timeEndInput && timeEndInput.value && !fpEnd.selectedDates[0]) {
        try { fpEnd.setDate(timeEndInput.value, true); } catch {}
      }

      // synchronize state time fields from flatpickr (important for validation/submit)
      if (fpStart.selectedDates[0]) state.time_start = fpStart.selectedDates[0].toISOString();
      if (fpEnd.selectedDates[0]) state.time_end = fpEnd.selectedDates[0].toISOString();

      // If an address is present but coordinates are missing, attempt geocoding before validation
      if (currentStep === 0 && addressInput && addressInput.value && (!state.latitude || !state.longitude)) {
        await geocodeAddress(addressInput.value);
        try { updateMapMarker(); } catch {}
      }
    } catch (e) {
      // ignore geocode/parse errors and continue to validation -> will show validation errors
    }

    if (!validateStep()) return;

    const inputs = steps[currentStep].querySelectorAll("input");

    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        if (input.checked && !state.selectedUsers.includes(input.value)) {
          state.selectedUsers.push(input.value);
        }
        if (!input.checked) {
          state.selectedUsers = state.selectedUsers.filter(
              (u) => u !== input.value,
          );
        }
      } else {
        state[input.name] = input.value;
      }
    });

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      // ensure final state times are ISO before submit
      if (fpStart.selectedDates[0]) state.time_start = fpStart.selectedDates[0].toISOString();
      if (fpEnd.selectedDates[0]) state.time_end = fpEnd.selectedDates[0].toISOString();

      // also ensure latitude/longitude come from state (address geocode may have filled them)
      if (!state.latitude && !state.longitude && addressInput && addressInput.value) {
        await geocodeAddress(addressInput.value).catch(()=>{});
      }

      // Submit the party
      submitPartyToBackend(state);
    }
  });

  backArrow.addEventListener("click", () => {
    if (currentStep > 0) {
      currentStep--;
      showStep(currentStep);
    } else {
      history.back();
    }
  });

  /* ==========================
     VISIBILITY STEP
  ========================== */
  document.querySelectorAll(".vis-card").forEach((card) => {
    card.addEventListener("click", () => {
      document
          .querySelectorAll(".vis-card")
          .forEach((c) => c.classList.remove("active"));

      card.classList.add("active");
      state.visibility = card.dataset.mode;

      const isPublic = state.visibility === "public";
      userList.style.display = isPublic ? "none" : "flex";
      everyoneHint.style.display = isPublic ? "block" : "none";
    });
  });

  /* ==========================
     ADRESS AUTOCOMPLETE (NOMINATIM)
  ========================== */
  let debounceTimer;

  addressInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    // Wenn User wieder tippt → Koordinaten reset
    state.latitude = null;
    state.longitude = null;

    const query = addressInput.value.trim();
    if (query.length < 3) {
      suggestionsBox.innerHTML = "";
      return;
    }

    debounceTimer = setTimeout(() => {
      searchAddress(query);
    }, 400);
  });

  async function searchAddress(query) {
    try {
      const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
          { headers: { "Accept-Language": "de" } },
      );

      const results = await res.json();
      suggestionsBox.innerHTML = "";

      results.forEach((place) => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = place.display_name;

        div.addEventListener("click", () => {
          addressInput.value = place.display_name;

          state.location_address = place.display_name;
          state.latitude = Number(place.lat);
          state.longitude = Number(place.lon);

          suggestionsBox.innerHTML = "";

          // UPDATE: wenn Karte bereits initialisiert, aktualisiere Marker sofort
          try { updateMapMarker(); } catch {}
        });

        suggestionsBox.appendChild(div);
      });
    } catch (e) {
      // Address search failed silently
    }
  }

  // Geocode eine Adresse (limit=1) und setze state.latitude/longitude falls gefunden
  async function geocodeAddress(address) {
    if (!address) return null;
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { "Accept-Language": "de" } }
      );
      if (!r.ok) return null;
      const arr = await r.json().catch(() => null);
      if (Array.isArray(arr) && arr.length > 0) {
        const p = arr[0];
        state.latitude = Number(p.lat);
        state.longitude = Number(p.lon);
        return { lat: state.latitude, lon: state.longitude };
      }
    } catch (e) {}
    return null;
  }

  // Aktualisiert Marker und View; erstellt Karte falls noch nicht vorhanden
  function updateMapMarker() {
    const mapDiv = document.getElementById("addPartyMap");
    if (!mapDiv) return;

    // ensure map exists
    if (!addPartyMap) {
      addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(addPartyMap);
    }

    // remove existing marker and add new if coords exist
    if (state.latitude && state.longitude) {
      const latlng = [state.latitude, state.longitude];
      if (addPartyMarker) {
        addPartyMarker.setLatLng(latlng);
      } else {
        addPartyMarker = L.marker(latlng)
          .bindPopup(`<strong>${state.title || ""}</strong><br>${state.location_address || ""}`)
          .addTo(addPartyMap);
      }
      addPartyMap.setView(latlng, 15);
    } else {
      // no coords -> center default
      addPartyMap.setView([48.2082, 16.3738], 13);
    }
  }

  /* ==========================
     USERS LADEN
  ========================== */
  async function loadUsers() {
    try {
      const res = await fetch("/api/users/all");
      if (!res.ok) return [];
      const users = await res.json();
      userList.innerHTML = "";

      users.forEach((u) => {
        const el = document.createElement("div");
        el.className = "user-card";
        el.innerHTML = `
          <span>@${u.distinctName}</span>
          <input type="checkbox" value="${u.distinctName}">
        `;
        userList.appendChild(el);
      });
      return users;
    } catch {
      return [];
    }
  }

  /* ==========================
     INIT
  ========================== */
  // load users and then try to load editing party (if any)
  (async function init() {
    const users = await loadUsers();
    showStep(0);
    // try to load editing party if id present in URL
    tryLoadEditingParty();
  })();

  /* ==========================
     LOAD PARTY FOR EDIT MODE
  ========================== */
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  async function tryLoadEditingParty() {
    const idParam = getQueryParam("id");
    if (!idParam) return;

    const id = idParam;
    let party = null;

    // Try backend first
    try {
      const res = await fetch(`/api/party/${encodeURIComponent(id)}`);
      if (res.ok) {
        party = await res.json().catch(() => null);
      }
    } catch (e) {
      // ignore
    }

    // Fallback to localStorage editingParty or parties
    if (!party) {
      try {
        const local = localStorage.getItem("editingParty");
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed && String(parsed.id) === String(id)) {
            party = parsed;
          }
        }
      } catch {}
    }

    if (!party) {
      try {
        const list = JSON.parse(localStorage.getItem("parties") || "[]");
        const found = list.find((x) => String(x.id) === String(id));
        if (found) party = found;
      } catch {}
    }

    if (!party) return;

    // Populate form with party data
    populateFormWithParty(party);
  }

  function populateFormWithParty(p) {
    state.id = p.id ?? null;
    state.title = p.title ?? "";
    state.description = p.description ?? "";

    // --- REPLACED: prefer plain string address fields from backend and set input directly ---
    // Try a list of common keys first (prefer plain strings)
    const addrKeys = [
      "location_address",
      "locationAddress",
      "address",
      "address_string",
      "location_label",
      "place",
      "venue",
      "addressLine",
      "locationText",
      "formatted_address",
      "location_text"
    ];

    let plainAddr = "";
    for (const k of addrKeys) {
      if (typeof p?.[k] === "string" && p[k].trim()) {
        plainAddr = p[k].trim();
        break;
      }
    }

    // if still empty, accept p.location if it's a string
    if (!plainAddr && typeof p?.location === "string" && p.location.trim()) {
      plainAddr = p.location.trim();
    }

    // if still empty, check nested location.display_name or location.formatted (common from geocoders)
    if (!plainAddr && p?.location && typeof p.location === "object") {
      if (typeof p.location.display_name === "string" && p.location.display_name.trim()) {
        plainAddr = p.location.display_name.trim();
      } else if (typeof p.location.formatted_address === "string" && p.location.formatted_address.trim()) {
        plainAddr = p.location.formatted_address.trim();
      }
    }

    // Last resort: scan top-level keys for any non-empty string that looks like an address (contains digits or comma)
    if (!plainAddr) {
      for (const k of Object.keys(p || {})) {
        const lower = String(k).toLowerCase();
        // ignore obvious non-address keys (times, dates, ids, numeric/metadata)
        if (/(time|date|start|end|id|lat|lon|latitude|longitude|created|updated|fee|entry|min_age|max_age|theme|website|title|description)/.test(lower)) continue;
        const v = p[k];
        if (typeof v === "string" && v.trim() && /[0-9]|,/.test(v)) {
          plainAddr = v.trim();
          break;
        }
      }
    }

    // assign to state and visible input (user asked: "schreib einfach die adresse ... in das feld")
    state.location_address = plainAddr || "";
    try { addressInput.value = state.location_address; } catch {}

    state.latitude = p.latitude != null ? Number(p.latitude) : null;
    state.longitude = p.longitude != null ? Number(p.longitude) : null;
    state.visibility = p.visibility || "private";
    state.entry_costs = p.entry_costs ?? p.fee ?? null;
    state.theme = p.theme ?? "";
    state.min_age = p.min_age ?? 18;
    state.max_age = p.max_age ?? null;
    state.website = p.website ?? "";
    state.selectedUsers = p.selectedUsers || p.selected_users || [];

    // set basic inputs (ensure visible DOM values are written)
    try { document.querySelector('input[name="title"]').value = state.title; } catch {}
    try { document.querySelector('input[name="description"]').value = state.description; } catch {}
    try { document.querySelector('input[name="entry_costs"]').value = state.entry_costs ?? ""; } catch {}
    try { document.querySelector('input[name="theme"]').value = state.theme; } catch {}
    try { document.querySelector('input[name="min_age"]').value = state.min_age; } catch {}
    try { document.querySelector('input[name="max_age"]').value = state.max_age ?? ""; } catch {}
    try { document.querySelector('input[name="website"]').value = state.website ?? ""; } catch {}

    // parse times and set flatpickr + ensure visible input values and state are consistent
    try {
      const timeStartInput = document.getElementById("time_start");
      const timeEndInput = document.getElementById("time_end");

      if (p.time_start) {
        const d1 = new Date(p.time_start);
        if (!isNaN(d1)) {
          fpStart.setDate(d1, true);
          if (typeof fpStart.formatDate === "function" && timeStartInput) {
            timeStartInput.value = fpStart.formatDate(d1, "d.m.Y H:i");
          }
        } else {
          fpStart.setDate(p.time_start, true);
          if (timeStartInput) timeStartInput.value = p.time_start;
        }
        if (fpStart.selectedDates[0]) {
          state.time_start = fpStart.selectedDates[0].toISOString();
        } else {
          state.time_start = p.time_start ?? "";
        }
      }

      if (p.time_end) {
        const d2 = new Date(p.time_end);
        if (!isNaN(d2)) {
          fpEnd.setDate(d2, true);
          if (typeof fpEnd.formatDate === "function" && timeEndInput) {
            timeEndInput.value = fpEnd.formatDate(d2, "d.m.Y H:i");
          }
        } else {
          fpEnd.setDate(p.time_end, true);
          if (timeEndInput) timeEndInput.value = p.time_end;
        }
        if (fpEnd.selectedDates[0]) {
          state.time_end = fpEnd.selectedDates[0].toISOString();
        } else {
          state.time_end = p.time_end ?? "";
        }
      }
    } catch {}

    // visibility UI
    document.querySelectorAll(".vis-card").forEach((c) => c.classList.remove("active"));
    const visCard = document.querySelector(`.vis-card[data-mode="${state.visibility}"]`);
    if (visCard) visCard.classList.add("active");
    const isPublic = state.visibility === "public";
    userList.style.display = isPublic ? "none" : "flex";
    everyoneHint.style.display = isPublic ? "block" : "none";

    // mark user checkboxes
    try {
      const checkboxes = userList.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((cb) => {
        cb.checked = state.selectedUsers.includes(cb.value);
      });
    } catch {}

    // Wenn keine Koordinaten vorhanden sind, versuche Geocoding (Nominatim)
    if ((!state.latitude || !state.longitude) && state.location_address) {
      geocodeAddress(state.location_address).then((res) => {
        try { updateMapMarker(); } catch {}
      });
    } else {
      try { updateMapMarker(); } catch {}
    }

    // show map preview when on map step later; map init uses state.latitude/state.longitude
    // ensure step button shows "Update" on final step
  }

  /* ==========================
     LEAFLET MAP (Step 4)
     (existing map init code unchanged)
  ========================== */
  let addPartyMap = null;
  let addPartyMarker = null;

  function initAddPartyMap() {
    const mapDiv = document.getElementById("addPartyMap");
    if (!mapDiv) return;
    if (addPartyMap) return; // already initialized

    // create map (center will be updated by updateMapMarker)
    addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13); // Vienna center
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(addPartyMap);

    // if coordinates are present, add marker
    updateMapMarker();
  }

  // Hook into step navigation to initialize map on step 4
  const originalShowStep = showStep;
  showStep = function (index) {
    originalShowStep(index);
    // change button text to "Update" when editing existing party on last step
    const last = steps.length - 1;
    if (index === last) {
      btn.textContent = state.id ? "Update" : "Submit";
    }
    if (index === 3) {
      const mapDiv = document.getElementById("addPartyMap");
      const msgDiv = document.getElementById("mapMessage");
      mapDiv.style.display = "block";
      msgDiv.style.display = "none";

      // If we don't have coords but have an address, try geocoding first.
      (async () => {
        if ((!state.latitude || !state.longitude) && state.location_address) {
          await geocodeAddress(state.location_address);
        }
        setTimeout(() => {
          initAddPartyMap();
        }, 100);
      })();
    }
  };

  /* ==========================
     SEND PARTY TO BACKEND (create or update)
  ========================== */
  async function submitPartyToBackend(partyData) {
    // Save to localStorage for instant map display (create or update)
    const parties = JSON.parse(localStorage.getItem("parties") || "[]");
    if (partyData.id) {
      // update existing in localStorage if present
      const idx = parties.findIndex((x) => String(x.id) === String(partyData.id));
      if (idx >= 0) {
        parties[idx] = Object.assign({}, parties[idx], {
          id: partyData.id,
          title: partyData.title,
          latitude: partyData.latitude,
          longitude: partyData.longitude,
          location_address: partyData.location_address,
          description: partyData.description,
          time_start: partyData.time_start,
          time_end: partyData.time_end,
          visibility: partyData.visibility,
          entry_costs: partyData.entry_costs,
          theme: partyData.theme,
          min_age: partyData.min_age,
          max_age: partyData.max_age,
          website: partyData.website,
        });
      } else {
        parties.push({
          id: partyData.id,
          title: partyData.title,
          latitude: partyData.latitude,
          longitude: partyData.longitude,
          location_address: partyData.location_address,
          description: partyData.description,
          time_start: partyData.time_start,
          time_end: partyData.time_end,
          visibility: partyData.visibility,
          entry_costs: partyData.entry_costs,
          theme: partyData.theme,
          min_age: partyData.min_age,
          max_age: partyData.max_age,
          website: partyData.website,
        });
      }
    } else {
      parties.push({
        id: Date.now(),
        title: partyData.title,
        latitude: partyData.latitude,
        longitude: partyData.longitude,
        location_address: partyData.location_address,
        description: partyData.description,
        time_start: partyData.time_start,
        time_end: partyData.time_end,
        visibility: partyData.visibility,
        entry_costs: partyData.entry_costs,
        theme: partyData.theme,
        min_age: partyData.min_age,
        max_age: partyData.max_age,
        website: partyData.website,
      });
    }
    localStorage.setItem("parties", JSON.stringify(parties));

    // Try to send to backend (create or update)
    try {
      // Konvertiere Datum zu ISO-Format
      const timeStart = fpStart.selectedDates[0]
          ? fpStart.selectedDates[0].toISOString()
          : partyData.time_start;

      const timeEnd = fpEnd.selectedDates[0]
          ? fpEnd.selectedDates[0].toISOString()
          : partyData.time_end || null;

      const backendPayload = {
        title: partyData.title,
        description: partyData.description || null,
        fee: partyData.entry_costs ? parseFloat(partyData.entry_costs) : null,
        time_start: timeStart,
        time_end: timeEnd,
        latitude: partyData.latitude != null ? parseFloat(partyData.latitude) : null,
        longitude: partyData.longitude != null ? parseFloat(partyData.longitude) : null,
        location_address: partyData.location_address,
        min_age: parseInt(partyData.min_age) || 18,
        max_age: partyData.max_age ? parseInt(partyData.max_age) : null,
        website: partyData.website || null,
        theme: partyData.theme || null,
        visibility: partyData.visibility,
        selectedUsers: partyData.selectedUsers || [],
      };

      let response;
      if (partyData.id) {
        // Update existing
        response = await fetch(`/api/party/${encodeURIComponent(partyData.id)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload),
        });
      } else {
        // Create new
        response = await fetch("/api/party/add", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload),
        });
      }

      if (!response.ok) {
        console.error("Backend error:", response.statusText);
        const errorText = await response.text();
        console.error("Backend response:", errorText);
      }
    } catch (err) {
      console.error("Backend not available:", err);
      // Backend not available, but party is saved/updated in localStorage
    }

    // cleanup temporary editing key
    try { localStorage.removeItem("editingParty"); } catch {}

    alert(partyData.id ? "Party aktualisiert! 🎉" : "Party hinzugefügt! 🎉");

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 500);
  }

  // ...existing code...
  // Note: continueBtn handler earlier collects inputs into state and calls submitPartyToBackend(state)
  // Ensure state.id is preserved if editing; populateFormWithParty sets state.id

});