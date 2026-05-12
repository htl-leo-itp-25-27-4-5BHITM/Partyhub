/* addParty.js */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".party-form");
  const continueBtn = document.getElementById("continueBtn");
  const stepTitle = document.getElementById("stepTitle");
  const backArrow = document.querySelector(".back-arrow");

  const addressInput = document.getElementById("location_address");
  const addressSuggestions = document.getElementById("addressSuggestions");

  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  const mapElement = document.getElementById("addPartyMap");
  const mapMessage = document.getElementById("mapMessage");

  const visButtons = document.querySelectorAll(".vis-card");

  const steps = document.querySelectorAll(".step");

  let currentStep = 1;
  let visibility = "private";
  let selectedUsers = [];

  let addPartyMap = null;
  let addPartyMarker = null;

  let fpStart = null;
  let fpEnd = null;

  let addressSearchTimeout = null;

  const state = {
    id: null,
    title: "",
    description: "",
    time_start: null,
    time_end: null,
    location_address: "",
    latitude: null,
    longitude: null,
    visibility: "private",
    entry_costs: null,
    theme: null,
    min_age: 18,
    max_age: null,
    website: null,
  };

  const params = new URLSearchParams(window.location.search);

  const editPartyId =
    params.get("id") ||
    params.get("partyId") ||
    params.get("edit") ||
    null;

  const isEditMode = Boolean(editPartyId);

  const stepTitles = {
    1: isEditMode ? "Party bearbeiten" : "Neue Party erstellen",
    2: "Wer kann an der Party teilnehmen?",
    3: "Weitere Infos",
    4: "Kartenvorschau",
  };

  init();

  async function init() {
    setupFlatpickr();
    setupStepButtons();
    setupVisibilityButtons();
    setupAddressSearch();
    setupValidationListeners();

    if (isEditMode) {
      continueBtn.textContent = "Weiter";
      await loadPartyForEdit(editPartyId);
    }

    await loadUsers();

    showStep(1);
    updateContinueButtonState();
  }

  function setupFlatpickr() {
    if (typeof flatpickr === "undefined") {
      console.error("Flatpickr wurde nicht geladen.");
      return;
    }

    fpStart = flatpickr("#time_start", {
      enableTime: true,
      dateFormat: "d.m.Y H:i",
      time_24hr: true,
      minDate: "today",
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          state.time_start = selectedDates[0];

          if (fpEnd) {
            fpEnd.set("minDate", selectedDates[0]);
          }
        }

        updateContinueButtonState();
      },
    });

    fpEnd = flatpickr("#time_end", {
      enableTime: true,
      dateFormat: "d.m.Y H:i",
      time_24hr: true,
      minDate: "today",
      onChange: function (selectedDates) {
        if (selectedDates.length > 0) {
          state.time_end = selectedDates[0];
        }

        updateContinueButtonState();
      },
    });
  }

  function setupStepButtons() {
    continueBtn.addEventListener("click", async () => {
      if (currentStep < 4) {
        if (!validateStep(currentStep)) {
          return;
        }

        currentStep++;
        showStep(currentStep);
        return;
      }

      if (!validateStep(4)) {
        return;
      }

      await saveParty();
    });

    backArrow.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
      } else {
        window.history.back();
      }
    });
  }

  function setupVisibilityButtons() {
    visButtons.forEach((button) => {
      button.addEventListener("click", () => {
        visButtons.forEach((btn) => btn.classList.remove("active"));
        button.classList.add("active");

        visibility = button.dataset.mode;
        state.visibility = visibility;

        updateVisibilityUI();
        updateContinueButtonState();
      });
    });

    updateVisibilityUI();
  }

  function updateVisibilityUI() {
    const friendsSection = document.getElementById("friendsSection");
    if (!friendsSection || !everyoneHint) {
      return;
    }

    if (visibility === "public") {
      friendsSection.style.display = "none";
      everyoneHint.style.display = "block";
      selectedUsers = [];
      const selectedCountEl = document.getElementById("selectedCount");
      if (selectedCountEl) selectedCountEl.innerHTML = "";
    } else {
      friendsSection.style.display = "block";
      everyoneHint.style.display = "none";
      updateSelectedCount();
    }
  }

  function setupAddressSearch() {
    if (!addressInput) {
      console.error("Adressfeld mit id='location_address' wurde nicht gefunden.");
      return;
    }

    addressInput.addEventListener("input", () => {
      const value = addressInput.value.trim();

      state.location_address = value;

      if (!value) {
        state.latitude = null;
        state.longitude = null;
        clearAddressSuggestions();
        updateContinueButtonState();
        return;
      }

      clearTimeout(addressSearchTimeout);

      addressSearchTimeout = setTimeout(() => {
        searchAddress(value);
      }, 400);

      updateContinueButtonState();
    });

    document.addEventListener("click", (event) => {
      if (
        addressSuggestions &&
        !addressSuggestions.contains(event.target) &&
        event.target !== addressInput
      ) {
        clearAddressSuggestions();
      }
    });
  }

  async function searchAddress(query) {
    if (!query || query.length < 3) {
      clearAddressSuggestions();
      return;
    }

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: query,
          format: "json",
          addressdetails: "1",
          limit: "5",
          countrycodes: "at",
        });

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "de",
        },
      });

      if (!response.ok) {
        throw new Error("Adresssuche fehlgeschlagen.");
      }

      const results = await response.json();
      renderAddressSuggestions(results);
    } catch (error) {
      console.error("Fehler bei der Adresssuche:", error);
    }
  }

  function renderAddressSuggestions(results) {
    if (!addressSuggestions) {
      return;
    }

    clearAddressSuggestions();

    if (!results || results.length === 0) {
      return;
    }

    results.forEach((result) => {
      const item = document.createElement("div");
      item.className = "suggestion-item";
      item.textContent = result.display_name;

      item.addEventListener("click", () => {
        selectAddress(result);
      });

      addressSuggestions.appendChild(item);
    });
  }

  function selectAddress(result) {
    const displayName = result.display_name || "";

    state.location_address = displayName;
    state.latitude = Number(result.lat);
    state.longitude = Number(result.lon);

    if (addressInput) {
      addressInput.value = displayName;
      addressInput.dispatchEvent(new Event("change", { bubbles: true }));
    }

    clearAddressSuggestions();

    console.log("Adresse ausgewählt:", {
      address: state.location_address,
      latitude: state.latitude,
      longitude: state.longitude,
    });

    updateMapMarker();
    updateContinueButtonState();
  }

  function clearAddressSuggestions() {
    if (addressSuggestions) {
      addressSuggestions.innerHTML = "";
    }
  }

  async function loadUsers() {
    if (!userList) {
      return;
    }

    userList.innerHTML = "";

    try {
      const currentUserId = getCurrentUserIdSafe();
      let users = [];

      if (currentUserId) {
        const [followersRaw, followingRaw] = await Promise.all([
          fetchUsers(`/api/users/${encodeURIComponent(currentUserId)}/followers`),
          fetchUsers(`/api/users/${encodeURIComponent(currentUserId)}/following`),
        ]);

        users = getMutualUsers(
          normalizeUsers(followersRaw),
          normalizeUsers(followingRaw),
          currentUserId
        );
      } else {
        users = normalizeUsers(await fetchUsers("/api/users"));
      }

      users = uniqueUsersById(users);

      if (!users || users.length === 0) {
        userList.innerHTML = currentUserId
          ? "<p>Keine gegenseitigen Follower gefunden.</p>"
          : "<p>Keine User gefunden.</p>";
        return;
      }

      users.forEach((user) => {
        const id = getUserId(user);
        const username =
          user.distinctName ||
          user.username ||
          user.handle ||
          user.displayName ||
          user.name ||
          user.email ||
          `User ${id}`;

        if (!id) {
          return;
        }

        const item = document.createElement("button");
        item.type = "button";
        item.className = "user-card";
        item.dataset.userId = id;

        const displayName = username.startsWith("@") ? username : `@${username}`;
        const isSelected = selectedUsers.includes(String(id)) || selectedUsers.includes(Number(id));

        item.innerHTML = `
          <div class="user-card-content">
            <div class="user-card-name">${displayName}</div>
          </div>
          <div class="user-card-icon">${isSelected ? "✓" : "○"}</div>
        `;

        if (isSelected) {
          item.classList.add("selected");
        }

        item.addEventListener("click", (e) => {
          e.preventDefault();
          toggleSelectedUser(id, item);
          // Update icon
          const icon = item.querySelector(".user-card-icon");
          if (item.classList.contains("selected")) {
            icon.textContent = "✓";
          } else {
            icon.textContent = "○";
          }
        });

        userList.appendChild(item);
      });
    } catch (error) {
      console.error("Fehler beim Laden der User:", error);
      userList.innerHTML = "<p>User konnten nicht geladen werden.</p>";
    }
  }

  async function fetchUsers(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`User konnten nicht geladen werden: ${response.status}`);
    }

    return response.json();
  }

  function getUserId(user) {
    return user?.id ?? user?.userId ?? user?.user_id ?? null;
  }

  function uniqueUsersById(users) {
    const seen = new Set();

    return users.filter((user) => {
      const id = getUserId(user);

      if (id == null || seen.has(String(id))) {
        return false;
      }

      seen.add(String(id));
      return true;
    });
  }

  function getMutualUsers(followers, following, currentUserId) {
    const followingIds = new Set(
      following
        .map(getUserId)
        .filter((id) => id != null)
        .map(String)
    );

    return followers.filter((user) => {
      const id = getUserId(user);
      return (
        id != null &&
        String(id) !== String(currentUserId) &&
        followingIds.has(String(id))
      );
    });
  }

  function normalizeUsers(users) {
    if (!Array.isArray(users)) {
      return [];
    }

    return users
      .map((entry) => {
        if (entry.follower) {
          return entry.follower;
        }

        if (entry.following) {
          return entry.following;
        }

        if (entry.user) {
          return entry.user;
        }

        return entry;
      })
      .filter(Boolean);
  }

  function toggleSelectedUser(id, item) {
    const idAsString = String(id);

    if (selectedUsers.map(String).includes(idAsString)) {
      selectedUsers = selectedUsers.filter((userId) => String(userId) !== idAsString);
      item.classList.remove("selected");
    } else {
      selectedUsers.push(id);
      item.classList.add("selected");
    }

    updateSelectedCount();
    console.log("Ausgewählte User:", selectedUsers);
    updateContinueButtonState();
  }

  function updateSelectedCount() {
    const selectedCountEl = document.getElementById("selectedCount");
    if (!selectedCountEl) return;

    if (selectedUsers.length === 0) {
      selectedCountEl.innerHTML = "";
    } else {
      selectedCountEl.innerHTML = `<span style="color: #4caf50; font-weight: 600;">✓ ${selectedUsers.length} Freund${selectedUsers.length === 1 ? "" : "e"} ausgewählt</span>`;
    }
  }

  function setupValidationListeners() {
    if (!form) {
      return;
    }

    form.addEventListener("input", () => {
      updateContinueButtonState();
    });

    form.addEventListener("change", () => {
      updateContinueButtonState();
    });
  }

  async function loadPartyForEdit(id) {
  try {
    let party = null;

    let response = await fetch(`/api/parties/${id}`);

    if (response.ok) {
      party = await response.json();
    } else {
      console.warn(`/api/parties/${id} ging nicht, versuche /api/parties/ ...`);

      const listResponse = await fetch("/api/parties/");

      if (!listResponse.ok) {
        throw new Error(
          `Party konnte nicht geladen werden. Einzelstatus: ${response.status}, Listenstatus: ${listResponse.status}`
        );
      }

      const parties = await listResponse.json();

      party = parties.find((p) => String(p.id) === String(id));

      if (!party) {
        throw new Error(`Party mit ID ${id} wurde in der Liste nicht gefunden.`);
      }
    }

    console.log("Geladene Party:", party);
    console.log("Alle Feldnamen:", Object.keys(party));
    console.log("Adresse location_address:", party.location_address);
    console.log("Adresse locationAddress:", party.locationAddress);
    console.log("Adresse address:", party.address);
    console.log("Adresse location:", party.location);

    fillFormWithParty(party);
  } catch (error) {
    console.error("Fehler beim Laden der Party:", error);
  }
}

  function fillFormWithParty(party) {
  state.id = party.id ?? editPartyId;

  const title = party.title || "";
  const description = party.description || "";

  let locationAddress =
    party.location_address ||
    party.locationAddress ||
    party.location_adress ||
    party.locationAdress ||
    party.address ||
    party.adress ||
    party.location?.address ||
    party.location?.adress ||
    party.location?.location_address ||
    party.location?.location_adress ||
    party.location?.display_name ||
    party.location?.displayName ||
    "";

  const latitude =
    party.latitude ??
    party.lat ??
    party.location_latitude ??
    party.locationLatitude ??
    null;

  const longitude =
    party.longitude ??
    party.lon ??
    party.lng ??
    party.location_longitude ??
    party.locationLongitude ??
    null;

  state.title = title;
  state.description = description;
  state.location_address = locationAddress;
  state.latitude = latitude !== null ? Number(latitude) : null;
  state.longitude = longitude !== null ? Number(longitude) : null;

  if (!locationAddress && state.latitude && state.longitude) {
    reverseGeocodeAddress(state.latitude, state.longitude);
  }

  state.visibility = party.visibility || "private";
  visibility = state.visibility;

  state.entry_costs =
    party.entry_costs ??
    party.entryCosts ??
    party.fee ??
    null;

  state.theme = party.theme || null;
  state.min_age = party.min_age ?? party.minAge ?? 18;
  state.max_age = party.max_age ?? party.maxAge ?? null;
  state.website = party.website || null;

  setInputValue("title", title);
  setInputValue("description", description);

  const realAddressInput = document.getElementById("location_address");

  if (realAddressInput) {
    realAddressInput.value = locationAddress;
    realAddressInput.setAttribute("value", locationAddress);
  }

  setInputValue("entry_costs", state.entry_costs);
  setInputValue("theme", state.theme);
  setInputValue("min_age", state.min_age);
  setInputValue("max_age", state.max_age);
  setInputValue("website", state.website);

  setDateValues(party);
  setVisibilityFromParty();

  console.log("Adresse ins Feld geschrieben:", locationAddress);
  console.log("State nach Laden:", state);
}

  function setInputValue(name, value) {
    if (!form || !form.elements[name]) {
      console.warn(`Input mit name='${name}' wurde nicht gefunden.`);
      return;
    }

    form.elements[name].value = value ?? "";
  }


  async function reverseGeocodeAddress(latitude, longitude) {
  try {
    const url =
      "https://nominatim.openstreetmap.org/reverse?" +
      new URLSearchParams({
        lat: latitude,
        lon: longitude,
        format: "json",
        addressdetails: "1",
      });

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "de",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse Geocoding fehlgeschlagen.");
    }

    const result = await response.json();

    const foundAddress = result.display_name || "";

    console.log("Adresse aus Koordinaten gefunden:", foundAddress);

    if (foundAddress) {
      state.location_address = foundAddress;

      const realAddressInput = document.getElementById("location_address");

      if (realAddressInput) {
        realAddressInput.value = foundAddress;
        realAddressInput.setAttribute("value", foundAddress);
      }
    }
  } catch (error) {
    console.error("Adresse konnte nicht aus Koordinaten geladen werden:", error);
  }
}

 function setDateValues(party) {
  const startValue =
    party.time_start ||
    party.timeStart ||
    party.start_time ||
    party.startTime ||
    party.start ||
    null;

  const endValue =
    party.time_end ||
    party.timeEnd ||
    party.end_time ||
    party.endTime ||
    party.end ||
    null;

  console.log("Startzeit aus Backend:", startValue);
  console.log("Endzeit aus Backend:", endValue);

  if (startValue) {
    const startDate = parseBackendDate(startValue);

    console.log("StartDate parsed:", startDate);

    if (startDate && !isNaN(startDate.getTime())) {
      state.time_start = startDate;

      if (fpStart) {
        fpStart.setDate(startDate, true);
      }

      const startInput = document.getElementById("time_start");
      if (startInput) {
        startInput.value = formatDateForInput(startDate);
      }
    }
  }

  if (endValue) {
    const endDate = parseBackendDate(endValue);

    console.log("EndDate parsed:", endDate);

    if (endDate && !isNaN(endDate.getTime())) {
      state.time_end = endDate;

      if (fpEnd) {
        fpEnd.setDate(endDate, true);
      }

      const endInput = document.getElementById("time_end");
      if (endInput) {
        endInput.value = formatDateForInput(endDate);
      }
    }
  }
}

function parseBackendDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    // Falls Backend z. B. "2026-04-08T21:00:00" sendet
    const normalDate = new Date(value);

    if (!isNaN(normalDate.getTime())) {
      return normalDate;
    }

    // Falls Backend z. B. "08.04.2026 21:00" sendet
    const match = value.match(
      /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/
    );

    if (match) {
      const [, day, month, year, hour, minute] = match;

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );
    }
  }

  return null;
}

  function setVisibilityFromParty() {
    visButtons.forEach((button) => {
      button.classList.remove("active");

      if (button.dataset.mode === visibility) {
        button.classList.add("active");
      }
    });

    updateVisibilityUI();
  }

  function showStep(stepNumber) {
    steps.forEach((step) => {
      const number = Number(step.dataset.step);
      step.classList.toggle("active", number === stepNumber);
    });

    if (stepTitle) {
      stepTitle.textContent = stepTitles[stepNumber] || "";
    }

    if (stepNumber === 4) {
      continueBtn.textContent = isEditMode ? "Änderungen speichern" : "Party erstellen";
      showMapPreview();
    } else {
      continueBtn.textContent = "Weiter";
    }

    updateContinueButtonState();
  }

  function validateStep(stepNumber) {
    readFormIntoState();

    if (stepNumber === 1) {
      if (!state.title.trim()) {
        alert("Bitte gib einen Namen für die Party ein.");
        return false;
      }

      if (!state.description.trim()) {
        alert("Bitte gib eine Beschreibung ein.");
        return false;
      }

      if (!state.time_start) {
        alert("Bitte gib eine Startzeit ein.");
        return false;
      }

      if (!state.time_end) {
        alert("Bitte gib eine Endzeit ein.");
        return false;
      }

      if (state.time_end <= state.time_start) {
        alert("Die Endzeit muss nach der Startzeit liegen.");
        return false;
      }

      if (!state.location_address.trim()) {
        alert("Bitte gib eine Adresse ein.");
        return false;
      }

      return true;
    }

    if (stepNumber === 2) {
      if (visibility === "private" && selectedUsers.length === 0) {
        const confirmPrivateWithoutUsers = confirm(
          "Du hast keine Personen ausgewählt. Willst du trotzdem fortfahren?"
        );

        if (!confirmPrivateWithoutUsers) {
          return false;
        }
      }

      return true;
    }

    if (stepNumber === 3) {
      const minAge = state.min_age;
      const maxAge = state.max_age;

      if (minAge !== null && minAge < 0) {
        alert("Das Mindestalter darf nicht negativ sein.");
        return false;
      }

      if (maxAge !== null && maxAge < 0) {
        alert("Das maximale Alter darf nicht negativ sein.");
        return false;
      }

      if (minAge !== null && maxAge !== null && maxAge < minAge) {
        alert("Das maximale Alter darf nicht kleiner als das Mindestalter sein.");
        return false;
      }

      return true;
    }

    if (stepNumber === 4) {
      return true;
    }

    return true;
  }

  function validateStepSilently(stepNumber) {
    readFormIntoState();

    if (stepNumber === 1) {
      if (!state.title.trim()) {
        return false;
      }

      if (!state.description.trim()) {
        return false;
      }

      if (!state.time_start || !state.time_end) {
        return false;
      }

      if (state.time_end <= state.time_start) {
        return false;
      }

      if (!state.location_address.trim()) {
        return false;
      }

      return true;
    }

    if (stepNumber === 3) {
      const minAge = state.min_age;
      const maxAge = state.max_age;

      if (minAge !== null && minAge < 0) {
        return false;
      }

      if (maxAge !== null && maxAge < 0) {
        return false;
      }

      if (minAge !== null && maxAge !== null && maxAge < minAge) {
        return false;
      }
    }

    return true;
  }

  function updateContinueButtonState() {
    if (!continueBtn) {
      return;
    }

    const isValid = validateStepSilently(currentStep);
    continueBtn.disabled = !isValid;
    continueBtn.setAttribute("aria-disabled", String(!isValid));
  }

  function readFormIntoState() {
    state.title = getInputValue("title");
    state.description = getInputValue("description");

    if (addressInput) {
      state.location_address = addressInput.value.trim();
    }

    state.visibility = visibility;

    state.entry_costs = getNumberValue("entry_costs");
    state.theme = emptyToNull(getInputValue("theme"));
    state.min_age = getNumberValue("min_age");
    state.max_age = getNumberValue("max_age");
    state.website = emptyToNull(getInputValue("website"));

    if (fpStart && fpStart.selectedDates.length > 0) {
      state.time_start = fpStart.selectedDates[0];
    }

    if (fpEnd && fpEnd.selectedDates.length > 0) {
      state.time_end = fpEnd.selectedDates[0];
    }
  }

  function getInputValue(name) {
    if (!form || !form.elements[name]) {
      return "";
    }

    return form.elements[name].value.trim();
  }

  function getNumberValue(name) {
    const value = getInputValue(name);

    if (value === "") {
      return null;
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
      return null;
    }

    return number;
  }

  function emptyToNull(value) {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    return value;
  }

  async function showMapPreview() {
    readFormIntoState();

    if (!state.latitude || !state.longitude) {
      await geocodeTypedAddress();
    }

    if (!state.latitude || !state.longitude) {
      if (mapElement) {
        mapElement.style.display = "none";
      }

      if (mapMessage) {
        mapMessage.style.display = "block";
        mapMessage.textContent =
          "Adresse konnte nicht auf der Karte angezeigt werden.";
      }

      return;
    }

    if (mapElement) {
      mapElement.style.display = "block";
    }

    if (mapMessage) {
      mapMessage.style.display = "none";
    }

    setTimeout(() => {
      initMapIfNeeded();
      updateMapMarker();
    }, 100);
  }

  async function geocodeTypedAddress() {
    if (!state.location_address || state.location_address.length < 3) {
      return;
    }

    try {
      const url =
        "https://nominatim.openstreetmap.org/search?" +
        new URLSearchParams({
          q: state.location_address,
          format: "json",
          addressdetails: "1",
          limit: "1",
          countrycodes: "at",
        });

      const response = await fetch(url, {
        headers: {
          "Accept-Language": "de",
        },
      });

      if (!response.ok) {
        throw new Error("Geocoding fehlgeschlagen.");
      }

      const results = await response.json();

      if (results && results.length > 0) {
        state.location_address = results[0].display_name || state.location_address;
        state.latitude = Number(results[0].lat);
        state.longitude = Number(results[0].lon);

        if (addressInput) {
          addressInput.value = state.location_address;
        }
      }
    } catch (error) {
      console.error("Fehler beim Geocoding:", error);
    }
  }

  function initMapIfNeeded() {
    if (addPartyMap || !mapElement) {
      return;
    }

    if (typeof L === "undefined") {
      console.error("Leaflet wurde nicht geladen.");
      return;
    }

    addPartyMap = L.map("addPartyMap").setView(
      [state.latitude, state.longitude],
      15
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(addPartyMap);
  }

  function updateMapMarker() {
    if (!state.latitude || !state.longitude) {
      return;
    }

    if (!addPartyMap) {
      return;
    }

    const latLng = [state.latitude, state.longitude];

    addPartyMap.setView(latLng, 15);

    if (addPartyMarker) {
      addPartyMarker.setLatLng(latLng);
    } else {
      addPartyMarker = L.marker(latLng).addTo(addPartyMap);
    }

    addPartyMarker.bindPopup(state.location_address || "Party-Standort").openPopup();

    setTimeout(() => {
      addPartyMap.invalidateSize();
    }, 150);
  }

  async function saveParty() {
  readFormIntoState();

  if (!state.latitude || !state.longitude) {
    await geocodeTypedAddress();
  }

  const currentUserId = getCurrentUserIdSafe();

  if (!currentUserId) {
    alert("Kein User angemeldet. Bitte neu einloggen.");
    return;
  }

  const payload = {
    title: state.title,
    description: state.description,
    time_start: toBackendDate(state.time_start),
    time_end: toBackendDate(state.time_end),

    location_address: state.location_address,
    latitude: state.latitude,
    longitude: state.longitude,

    visibility: state.visibility,
    selectedUsers: visibility === "private" ? selectedUsers : [],

    entry_costs: state.entry_costs,
    fee: state.entry_costs,

    theme: state.theme,
    min_age: state.min_age,
    max_age: state.max_age,
    website: state.website,

    host_user_id: Number(currentUserId),
    hostUserId: Number(currentUserId),
  };

  console.log("PAYLOAD:", payload);

  try {
    const url = isEditMode
  ? `/api/parties/${encodeURIComponent(editPartyId)}?user=${encodeURIComponent(currentUserId)}`
  : `/api/parties?user=${encodeURIComponent(currentUserId)}`;

    const method = isEditMode ? "PUT" : "POST";

    console.log("SAVE URL:", url);
    console.log("SAVE METHOD:", method);

    const response = await fetch(url, {
      method: method,
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": String(currentUserId),
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();

    console.log("SAVE STATUS:", response.status);
    console.log("SAVE RESPONSE TEXT:", responseText);

    if (!response.ok) {
      console.error("Backend Fehler:", responseText);
      throw new Error(`Speichern fehlgeschlagen. Status: ${response.status}`);
    }

    let savedParty = null;

    if (responseText && responseText.trim() !== "") {
      try {
        savedParty = JSON.parse(responseText);
      } catch (error) {
        console.warn("Response war kein JSON:", responseText);
      }
    }

    console.log("Gespeicherte Party:", savedParty);

    window.location.href = "../listPartys/listPartys.html";
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
  }
}

  function toBackendDate(date) {
    if (!date) {
      return null;
    }

    if (typeof date === "string") {
      return date;
    }

    /**
     * Sendet lokale Zeit ohne UTC-Verschiebung.
     * Beispiel: 09.04.2026 21:00 wird zu 2026-04-09T21:00:00
     */
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function formatDateForInput(date) {
    return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }

  async function safeJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  function getCurrentUserIdSafe() {
    try {
      if (typeof window.getCurrentUserId === "function") {
        const id = window.getCurrentUserId();

        if (id) {
          return id;
        }
      }

      return (
        localStorage.getItem("loggedInUserId") ||
        sessionStorage.getItem("loggedInUserId") ||
        null
      );
    } catch (error) {
      console.warn("Current User ID konnte nicht gelesen werden:", error);
      return null;
    }
  }
});
