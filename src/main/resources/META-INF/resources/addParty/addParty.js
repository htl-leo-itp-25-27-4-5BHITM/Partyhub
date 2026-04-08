document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     DOM ELEMENTE
  ========================== */
  const steps = document.querySelectorAll(".step");
  const title = document.getElementById("stepTitle");
  const btn = document.getElementById("continueBtn");
  const backArrow = document.querySelector(".back-arrow");

  const addressInput =
    document.getElementById("location_address") ||
    document.querySelector('[name="location_address"]');

  const suggestionsBox = document.getElementById("addressSuggestions");
  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  /* ==========================
     STATE
  ========================== */
  let currentStep = 0;

  const state = {
    id: null,
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

  let stepTitles = [
    "Add new Party",
    "Who can attend the party?",
    "Other Infos",
    "Map Preview",
  ];

  /* ==========================
     HELPERS
  ========================== */
  function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return null;
  }

  function setInputValue(name, value) {
    const el = document.querySelector(`[name="${name}"]`);
    if (el) el.value = value ?? "";
  }

  function looksLikeIsoDatetime(s) {
    if (!s || typeof s !== "string") return false;
    return /^\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(:\d{2})?/.test(s.trim());
  }

  function formatDateForBackend(dateString) {
    if (!dateString) return null;
    return dateString.replace(".000Z", "");
  }

  function syncCurrentStepInputsToState() {
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

    if (fpStart.selectedDates[0]) {
      state.time_start = fpStart.selectedDates[0].toISOString();
    }

    if (fpEnd.selectedDates[0]) {
      state.time_end = fpEnd.selectedDates[0].toISOString();
    }

    if (addressInput) {
      state.location_address = addressInput.value.trim();
    }
  }

  /* ==========================
     FLATPICKR
  ========================== */
  const fpStart = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    allowInput: true,
  });

  const fpEnd = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    allowInput: true,
  });

  /* ==========================
     MAP
  ========================== */
  let addPartyMap = null;
  let addPartyMarker = null;

  function updateMapMarker() {
    const mapDiv = document.getElementById("addPartyMap");
    if (!mapDiv) return;

    if (!addPartyMap) {
      addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(addPartyMap);
    }

    if (state.latitude != null && state.longitude != null) {
      const latlng = [state.latitude, state.longitude];

      if (addPartyMarker) {
        addPartyMarker.setLatLng(latlng);
        addPartyMarker.setPopupContent(
          `<strong>${state.title || ""}</strong><br>${state.location_address || ""}`,
        );
      } else {
        addPartyMarker = L.marker(latlng)
          .bindPopup(
            `<strong>${state.title || ""}</strong><br>${state.location_address || ""}`,
          )
          .addTo(addPartyMap);
      }

      addPartyMap.setView(latlng, 15);
    } else {
      addPartyMap.setView([48.2082, 16.3738], 13);
    }

    setTimeout(() => {
      try {
        addPartyMap.invalidateSize();
      } catch {}
    }, 100);
  }

  function initAddPartyMap() {
    const mapDiv = document.getElementById("addPartyMap");
    if (!mapDiv) return;

    if (!addPartyMap) {
      addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(addPartyMap);
    }

    updateMapMarker();
  }

  /* ==========================
     STEP NAVIGATION
  ========================== */
  async function showStep(index) {
    steps.forEach((s) => s.classList.remove("active"));
    steps[index].classList.add("active");

    title.textContent = stepTitles[index];
    btn.textContent =
      index === steps.length - 1
        ? state.id
          ? "Update"
          : "Submit"
        : "Continue";

    if (index === 1 && state.visibility === "private") {
      await loadFollowersForUser();
      markSelectedUsers();
    }

    if (index === 3) {
      const mapDiv = document.getElementById("addPartyMap");
      const msgDiv = document.getElementById("mapMessage");

      if (mapDiv) mapDiv.style.display = "block";
      if (msgDiv) msgDiv.style.display = "none";

      if (
        (state.latitude == null || state.longitude == null) &&
        state.location_address
      ) {
        await geocodeAddress(state.location_address);
      }

      setTimeout(() => {
        initAddPartyMap();
      }, 100);
    }
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

      if (
        ["title", "time_start", "location_address"].includes(input.name) &&
        value === ""
      ) {
        error = true;
        console.log("Pflichtfeld leer:", input.name);
      }

      if (
        input.name === "location_address" &&
        (state.latitude == null || state.longitude == null)
      ) {
        error = true;
        console.log("Adresse hat keine Koordinaten");
      }

      if (input.name === "time_start" && fpStart.selectedDates[0]) {
        if (fpStart.selectedDates[0] < new Date()) {
          error = true;
          console.log("Startdatum liegt in der Vergangenheit");
        }
      }

      if (
        input.name === "time_end" &&
        fpStart.selectedDates[0] &&
        fpEnd.selectedDates[0] &&
        fpEnd.selectedDates[0] <= fpStart.selectedDates[0]
      ) {
        error = true;
        console.log("Enddatum ist vor oder gleich Startdatum");
      }

      input.classList.toggle("input-error", error);
      if (error) valid = false;
    });

    console.log("STATE nach validate:", state);
    return valid;
  }

  /* ==========================
     BUTTON EVENTS
  ========================== */
  btn.addEventListener("click", async () => {
    try {
      const timeStartInput = document.getElementById("time_start");
      const timeEndInput = document.getElementById("time_end");

      if (timeStartInput && timeStartInput.value && !fpStart.selectedDates[0]) {
        try {
          fpStart.setDate(timeStartInput.value, true);
        } catch {}
      }

      if (timeEndInput && timeEndInput.value && !fpEnd.selectedDates[0]) {
        try {
          fpEnd.setDate(timeEndInput.value, true);
        } catch {}
      }

      if (fpStart.selectedDates[0]) {
        state.time_start = fpStart.selectedDates[0].toISOString();
      }

      if (fpEnd.selectedDates[0]) {
        state.time_end = fpEnd.selectedDates[0].toISOString();
      }

      if (
        currentStep === 0 &&
        addressInput &&
        addressInput.value.trim() &&
        (state.latitude == null || state.longitude == null)
      ) {
        await geocodeAddress(addressInput.value.trim());
        updateMapMarker();
      }
    } catch (e) {
      console.error("Fehler vor Validierung:", e);
    }

    syncCurrentStepInputsToState();

    console.log("Titel:", document.querySelector('[name="title"]')?.value);
    console.log("Start:", document.querySelector('[name="time_start"]')?.value);
    console.log("Adresse:", document.querySelector('[name="location_address"]')?.value);
    console.log("Lat:", state.latitude, "Lon:", state.longitude);
    console.log("fpStart:", fpStart.selectedDates[0]);
    console.log("fpEnd:", fpEnd.selectedDates[0]);

    if (!validateStep()) return;

    if (currentStep < steps.length - 1) {
      currentStep++;
      await showStep(currentStep);
    } else {
      if (
        (state.latitude == null || state.longitude == null) &&
        addressInput &&
        addressInput.value.trim()
      ) {
        await geocodeAddress(addressInput.value.trim()).catch(() => {});
      }

      await submitPartyToBackend(state);
    }
  });

  backArrow.addEventListener("click", async () => {
    if (currentStep > 0) {
      currentStep--;
      await showStep(currentStep);
    } else {
      history.back();
    }
  });

  /* ==========================
     VISIBILITY STEP
  ========================== */
  document.querySelectorAll(".vis-card").forEach((card) => {
    card.addEventListener("click", async () => {
      document
        .querySelectorAll(".vis-card")
        .forEach((c) => c.classList.remove("active"));

      card.classList.add("active");
      state.visibility = card.dataset.mode;

      const isPublic = state.visibility === "public";
      userList.style.display = isPublic ? "none" : "flex";
      everyoneHint.style.display = isPublic ? "block" : "none";

      if (!isPublic) {
        await loadFollowersForUser();
        markSelectedUsers();
      } else {
        userList.innerHTML = "";
        state.selectedUsers = [];
      }
    });
  });

  function markSelectedUsers() {
    const checkboxes = userList.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      cb.checked = state.selectedUsers.includes(cb.value);
    });
  }

  /* ==========================
     ADDRESS AUTOCOMPLETE
  ========================== */
  let debounceTimer;

  if (addressInput) {
    addressInput.addEventListener("input", () => {
      clearTimeout(debounceTimer);

      state.latitude = null;
      state.longitude = null;
      state.location_address = addressInput.value.trim();

      const query = addressInput.value.trim();

      if (query.length < 3) {
        if (suggestionsBox) suggestionsBox.innerHTML = "";
        return;
      }

      debounceTimer = setTimeout(() => {
        searchAddress(query);
      }, 400);
    });
  }

  async function searchAddress(query) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        { headers: { "Accept-Language": "de" } },
      );

      if (!res.ok) return;

      const results = await res.json();
      if (!suggestionsBox) return;

      suggestionsBox.innerHTML = "";

      results.forEach((place) => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = place.display_name;

        div.addEventListener("click", () => {
          if (addressInput) addressInput.value = place.display_name;

          state.location_address = place.display_name;
          state.latitude = Number(place.lat);
          state.longitude = Number(place.lon);

          suggestionsBox.innerHTML = "";

          try {
            updateMapMarker();
          } catch {}
        });

        suggestionsBox.appendChild(div);
      });
    } catch (e) {
      console.error("Address search failed:", e);
    }
  }

  async function geocodeAddress(address) {
    if (!address) return null;

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { "Accept-Language": "de" } },
      );

      if (!r.ok) return null;

      const arr = await r.json().catch(() => null);

      if (Array.isArray(arr) && arr.length > 0) {
        const p = arr[0];
        state.latitude = Number(p.lat);
        state.longitude = Number(p.lon);

        if (!state.location_address) {
          state.location_address = p.display_name || address;
        }

        return { lat: state.latitude, lon: state.longitude };
      }
    } catch (e) {
      console.error("Geocode failed:", e);
    }

    return null;
  }

  async function reverseGeocode(lat, lon) {
    if (lat == null || lon == null) return "";

    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}`,
        { headers: { "Accept-Language": "de" } },
      );

      if (!r.ok) return "";

      const data = await r.json();
      return data.display_name || "";
    } catch (e) {
      console.error("Reverse geocode failed:", e);
      return "";
    }
  }

  /* ==========================
     USERS LADEN
  ========================== */
  async function loadFollowersForUser() {
    try {
      const userId =
        window.getCurrentUserId?.() || localStorage.getItem("userId");

      if (!userId) {
        console.error("User ID not available");
        userList.innerHTML =
          "<p style='color: #999;'>Nutzer-ID nicht verfügbar</p>";
        return;
      }

      const res = await fetch(`/follow/followers/${userId}`);

      if (!res.ok) {
        userList.innerHTML =
          "<p style='color: #999;'>Keine Freunde gefunden</p>";
        return;
      }

      const followers = await res.json();
      userList.innerHTML = "";

      if (!followers || followers.length === 0) {
        userList.innerHTML =
          "<p style='color: #999; padding: 20px; text-align: center;'>Keine Follower</p>";
        return;
      }

      followers.forEach((u) => {
        const el = document.createElement("div");
        el.className = "user-card";
        el.innerHTML = `
          <span>@${u.distinctName}</span>
          <input type="checkbox" value="${u.distinctName}">
        `;
        userList.appendChild(el);
      });
    } catch (e) {
      console.error("Error loading followers:", e);
      userList.innerHTML =
        "<p style='color: #999;'>Fehler beim Laden der Follower</p>";
    }
  }

  /* ==========================
     INIT
  ========================== */
  (async function init() {
    await showStep(0);
    await tryLoadEditingParty();
  })();

  /* ==========================
     EDIT MODE
  ========================== */
  function getQueryParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }

  async function tryLoadEditingParty() {
    const idParam = getQueryParam("id");
    const stored = localStorage.getItem("editingParty");
    const editingFrom = localStorage.getItem("editingFrom");
    let party = null;

    if (idParam) {
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (String(parsed.id) === String(idParam)) {
            party = parsed;
          }
        } catch {
          party = null;
        }
      }

      if (!party) {
        try {
          const res = await fetch(`/api/party/${encodeURIComponent(idParam)}`);
          if (res.ok) {
            party = await res.json().catch(() => null);
          }
        } catch {}
      }

      if (!party) {
        try {
          const list = JSON.parse(localStorage.getItem("parties") || "[]");
          const found = list.find((x) => String(x.id) === String(idParam));
          if (found) party = found;
        } catch {}
      }
    } else {
      if (stored && editingFrom === "profile") {
        try {
          party = JSON.parse(stored);
        } catch {
          party = null;
        }
      }
    }

    if (!party) return;

    console.log("Geladene Party:", party);

    await populateFormWithParty(party);

    stepTitles[0] = `Edit: ${party.title || "Party"}`;
    title.textContent = stepTitles[0];
    btn.textContent = "Continue";
  }

  async function populateFormWithParty(p) {
    state.id = p.id ?? null;
    state.title = p.title ?? "";
    state.description = p.description ?? "";

    state.latitude =
      p.latitude != null
        ? Number(p.latitude)
        : p.location && p.location.lat != null
          ? Number(p.location.lat)
          : null;

    state.longitude =
      p.longitude != null
        ? Number(p.longitude)
        : p.location && p.location.lon != null
          ? Number(p.location.lon)
          : null;

    let plainAddr = "";
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
      "location_text",
      "display_name",
    ];

    for (const k of addrKeys) {
      const v = pick(p, [k]) ?? (p.location && p.location[k]);
      if (typeof v === "string" && v.trim() && !looksLikeIsoDatetime(v)) {
        plainAddr = v.trim();
        break;
      }
    }

    if (!plainAddr && typeof p.location === "string" && p.location.trim()) {
      if (!looksLikeIsoDatetime(p.location)) plainAddr = p.location.trim();
    }

    if (!plainAddr && p.location && typeof p.location === "object") {
      const loc = p.location;
      const parts = [];

      [
        "street",
        "road",
        "address",
        "label",
        "name",
        "display_name",
        "formatted_address",
      ].forEach((k) => {
        const v = loc[k] || p[k];
        if (typeof v === "string" && v.trim() && !looksLikeIsoDatetime(v)) {
          parts.push(v.trim());
        }
      });

      if (loc.house_number && !parts.some((x) => x.includes(loc.house_number))) {
        parts.push(String(loc.house_number));
      }
      if (loc.postcode) parts.push(String(loc.postcode));
      if (loc.city) parts.push(String(loc.city));
      if (loc.country) parts.push(String(loc.country));

      if (parts.length) plainAddr = parts.join(", ");
    }

    if (!plainAddr) {
      const letterRx = /[A-Za-zÄÖÜäöüß]/;
      for (const k of Object.keys(p || {})) {
        const lower = String(k).toLowerCase();
        if (
          /(time|date|start|end|id|lat|lon|latitude|longitude|created|updated|fee|entry|min_age|max_age|website|title|description|theme)/.test(
            lower,
          )
        ) {
          continue;
        }

        const v = p[k];
        if (typeof v === "string" && v.trim()) {
          const s = v.trim();
          if (looksLikeIsoDatetime(s)) continue;

          if (
            letterRx.test(s) &&
            (/\d/.test(s) || /,/.test(s) || /strasse|straße|str\./i.test(s))
          ) {
            plainAddr = s;
            break;
          }
        }
      }
    }

    state.location_address = plainAddr || "";

    if (
      !state.location_address &&
      state.latitude != null &&
      state.longitude != null
    ) {
      const reverseAddress = await reverseGeocode(
        state.latitude,
        state.longitude,
      );
      if (reverseAddress) {
        state.location_address = reverseAddress;
      }
    }

    if (addressInput) {
      addressInput.value = state.location_address;
    }

    try {
      if (p.time_start) {
        const d1 = new Date(p.time_start);
        if (!isNaN(d1.getTime())) {
          fpStart.setDate(d1, true);
          state.time_start = d1.toISOString();
        } else {
          fpStart.setDate(p.time_start, true);
          state.time_start = fpStart.selectedDates[0]?.toISOString() ?? p.time_start;
        }
      }

      if (p.time_end) {
        const d2 = new Date(p.time_end);
        if (!isNaN(d2.getTime())) {
          fpEnd.setDate(d2, true);
          state.time_end = d2.toISOString();
        } else {
          fpEnd.setDate(p.time_end, true);
          state.time_end = fpEnd.selectedDates[0]?.toISOString() ?? p.time_end;
        }
      }
    } catch (e) {
      console.error("Flatpickr assignment failed:", e);
    }

    state.visibility = p.visibility || "private";
    state.entry_costs = p.entry_costs ?? p.fee ?? null;
    state.theme = p.theme ?? "";
    state.min_age = p.min_age ?? 18;
    state.max_age = p.max_age ?? null;
    state.website = p.website ?? "";
    state.selectedUsers = p.selectedUsers || p.selected_users || [];

    setInputValue("title", state.title);
    setInputValue("description", state.description);
    setInputValue("entry_costs", state.entry_costs);
    setInputValue("theme", state.theme);
    setInputValue("min_age", state.min_age);
    setInputValue("max_age", state.max_age);
    setInputValue("website", state.website);

    document.querySelectorAll(".vis-card").forEach((c) => {
      c.classList.remove("active");
    });

    const visCard = document.querySelector(
      `.vis-card[data-mode="${state.visibility}"]`,
    );
    if (visCard) visCard.classList.add("active");

    const isPublic = state.visibility === "public";
    userList.style.display = isPublic ? "none" : "flex";
    everyoneHint.style.display = isPublic ? "block" : "none";

    if (!isPublic) {
      await loadFollowersForUser();
      markSelectedUsers();
    }

    updateMapMarker();
  }

  /* ==========================
     SEND TO BACKEND
  ========================== */
  async function submitPartyToBackend(partyData) {
    const parties = JSON.parse(localStorage.getItem("parties") || "[]");

    if (partyData.id) {
      const idx = parties.findIndex(
        (x) => String(x.id) === String(partyData.id),
      );

      if (idx >= 0) {
        parties[idx] = Object.assign({}, parties[idx], {
          id: partyData.id,
          title: partyData.title,
          latitude: partyData.latitude,
          longitude: partyData.longitude,
          location_address: partyData.location_address,
          description: partyData.description,
          time_start: formatDateForBackend(partyData.time_start),
          time_end: formatDateForBackend(partyData.time_end),
          visibility: partyData.visibility,
          entry_costs: partyData.entry_costs,
          theme: partyData.theme,
          min_age: partyData.min_age,
          max_age: partyData.max_age,
          website: partyData.website,
          selectedUsers: partyData.selectedUsers,
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
          selectedUsers: partyData.selectedUsers,
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
        selectedUsers: partyData.selectedUsers,
      });
    }

    localStorage.setItem("parties", JSON.stringify(parties));

    try {
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
        latitude:
          partyData.latitude != null ? parseFloat(partyData.latitude) : null,
        longitude:
          partyData.longitude != null ? parseFloat(partyData.longitude) : null,
        location_address: partyData.location_address || null,
        min_age: parseInt(partyData.min_age) || 18,
        max_age: partyData.max_age ? parseInt(partyData.max_age) : null,
        website: partyData.website || null,
        theme: partyData.theme || null,
        visibility: partyData.visibility,
        selectedUsers: partyData.selectedUsers || [],
      };

      console.log("PAYLOAD:", backendPayload);

      const currentUserId =
        window.getCurrentUserId?.() || localStorage.getItem("userId");

      const headers = { "Content-Type": "application/json" };
      if (currentUserId) {
        headers["X-User-Id"] = String(currentUserId);
      }

      let response;

      if (partyData.id) {
        response = await fetch(`/api/party/${encodeURIComponent(partyData.id)}`, {
          method: "PUT",
          headers,
          body: JSON.stringify(backendPayload),
        });
      } else {
        response = await fetch("/api/party/add", {
          method: "POST",
          headers,
          body: JSON.stringify(backendPayload),
        });
      }

      if (!response.ok) {
        console.error("Backend error:", response.status, response.statusText);
        const errorText = await response.text();
        console.error("Backend response:", errorText);
      }
    } catch (err) {
      console.error("Backend not available:", err);
    }

    try {
      localStorage.removeItem("editingParty");
      localStorage.removeItem("editingFrom");
      localStorage.removeItem("editingPartyId");
    } catch {}

    alert(partyData.id ? "Party aktualisiert! 🎉" : "Party hinzugefügt! 🎉");

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 500);
  }
});