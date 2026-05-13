/* addParty.js */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".party-form");
  const continueBtn = document.getElementById("continueBtn");
  const stepTitle = document.getElementById("stepTitle");
  const backArrow = document.querySelector(".back-arrow");
  const partyFeedback = document.getElementById("partyFeedback");

  const addressInput = document.getElementById("location_address");
  const addressSuggestions = document.getElementById("addressSuggestions");

  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  const mapElement = document.getElementById("addPartyMap");
  const mapMessage = document.getElementById("mapMessage");

  const visButtons = document.querySelectorAll(".vis-card");

  const steps = document.querySelectorAll(".step");
  const wizardSteps = document.querySelectorAll(".wizard-step");

  let currentStep = 1;
  let visibility = "private";
  let selectedUsers = [];
  let invitedUsersById = new Map();

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
    1: isEditMode ? "Edit Party" : "Add new Party",
    2: "Who can attend the party?",
    3: "Other Infos",
    4: "Map Preview",
  };

  init();

  async function init() {
    setupFlatpickr();
    setupStepButtons();
    setupVisibilityButtons();
    setupAddressSearch();

    if (isEditMode) {
      continueBtn.textContent = "Continue";
      await loadPartyForEdit(editPartyId);
    }

    await loadUsers();

    showStep(1);
  }

  function setupFlatpickr() {
    if (typeof flatpickr === "undefined") {
      console.error("Flatpickr was not loaded.");
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
      },
    });
  }

  function setupStepButtons() {
    continueBtn.addEventListener("click", async () => {
      clearFeedback();

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
      });
    });

    updateVisibilityUI();
  }

  function updateVisibilityUI() {
    if (!userList || !everyoneHint) {
      return;
    }

    if (visibility === "public") {
      userList.style.display = "none";
      everyoneHint.style.display = "block";
      selectedUsers = [];
    } else {
      userList.style.display = "block";
      everyoneHint.style.display = "none";
    }
  }

  function setupAddressSearch() {
    if (!addressInput) {
      console.error("Address field with id='location_address' was not found.");
      return;
    }

    addressInput.addEventListener("input", () => {
      const value = addressInput.value.trim();

      state.location_address = value;

      if (!value) {
        state.latitude = null;
        state.longitude = null;
        clearAddressSuggestions();
        return;
      }

      clearTimeout(addressSearchTimeout);

      addressSearchTimeout = setTimeout(() => {
        searchAddress(value);
      }, 400);
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
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        throw new Error("Address search failed.");
      }

      const results = await response.json();
      renderAddressSuggestions(results);
    } catch (error) {
      console.error("Error during address search:", error);
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

    console.log("Selected address:", {
      address: state.location_address,
      latitude: state.latitude,
      longitude: state.longitude,
    });

    updateMapMarker();
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

      users = mergeInvitedUsers(users);
      users = uniqueUsersById(users);

      if (!users || users.length === 0) {
        userList.innerHTML = currentUserId
          ? "<p>No friends found.</p>"
          : "<p>No users found.</p>";
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

        const isSelected = isSelectedUser(id);
        const item = document.createElement("label");
        item.className = "user-card";
        item.dataset.userId = id;

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "user-card-checkbox";
        checkbox.checked = isSelected;

        const name = document.createElement("span");
        name.className = "user-card-name";
        name.textContent = username.startsWith("@") ? username : `@${username}`;

        if (isSelected) {
          item.classList.add("selected");
        }

        checkbox.addEventListener("change", () => {
          setSelectedUser(id, checkbox.checked, item);
        });

        item.append(checkbox, name);
        userList.appendChild(item);
      });
    } catch (error) {
      console.error("Error loading users:", error);
      userList.innerHTML = "<p>Users could not be loaded.</p>";
    }
  }

  async function fetchUsers(url) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Users could not be loaded: ${response.status}`);
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

  function mergeInvitedUsers(users) {
    if (!invitedUsersById.size) {
      return users;
    }

    const merged = [...users];
    const userIds = new Set(
      merged
        .map(getUserId)
        .filter((id) => id != null)
        .map(String)
    );

    invitedUsersById.forEach((user, id) => {
      if (!userIds.has(String(id))) {
        merged.push(user);
      }
    });

    return merged;
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

  function isSelectedUser(id) {
    const idAsString = String(id);
    return selectedUsers.map(String).includes(idAsString);
  }

  function setSelectedUser(id, checked, item) {
    const idAsString = String(id);

    if (checked && !isSelectedUser(id)) {
      selectedUsers.push(id);
    }

    if (!checked) {
      selectedUsers = selectedUsers.filter((userId) => String(userId) !== idAsString);
    }

    if (item) {
      item.classList.toggle("selected", checked);
    }

    console.log("Selected users:", selectedUsers);
  }

  async function loadPartyForEdit(id) {
    try {
      let party = null;
      const currentUserId = getCurrentUserIdSafe();
      const hasUser =
        currentUserId !== null &&
        currentUserId !== undefined &&
        String(currentUserId) !== "";
      const headers = hasUser
        ? { "X-User-Id": String(currentUserId), "Cache-Control": "no-cache" }
        : { "Cache-Control": "no-cache" };
      const partyUrl = hasUser
        ? `/api/parties/${encodeURIComponent(id)}?user=${encodeURIComponent(currentUserId)}`
        : `/api/parties/${encodeURIComponent(id)}`;

      let response = await fetch(partyUrl, { cache: "no-store", headers });

      if (response.ok) {
        party = await response.json();
      } else {
        console.warn(`${partyUrl} failed, trying the backend party list ...`);
        const listUrl = hasUser
          ? `/api/parties?user=${encodeURIComponent(currentUserId)}`
          : "/api/parties";
        const listResponse = await fetch(listUrl, { cache: "no-store", headers });

        if (!listResponse.ok) {
          throw new Error(
            `Party could not be loaded from the backend. Detail status: ${response.status}, list status: ${listResponse.status}`
          );
        }

        const parties = await listResponse.json();
        party = parties.find((p) => String(p.id) === String(id));

        if (!party) {
          throw new Error(`Party with ID ${id} was not found in the visible backend party list.`);
        }
      }

      console.log("Loaded party:", party);
      console.log("All field names:", Object.keys(party));
      console.log("Address location_address:", party.location_address);
      console.log("Address locationAddress:", party.locationAddress);
      console.log("Address address:", party.address);
      console.log("Address location:", party.location);

      fillFormWithParty(party);
      await loadExistingInvitesForEdit(id, currentUserId);
    } catch (error) {
      console.error("Error loading party:", error);
      showFeedback("Party could not be loaded.", "error");
    }
  }

  async function loadExistingInvitesForEdit(partyId, currentUserId) {
    if (!isEditMode || !partyId || !currentUserId) {
      return;
    }

    invitedUsersById = new Map();

    try {
      const response = await fetch(
        `/api/parties/${encodeURIComponent(partyId)}/invited-members?user=${encodeURIComponent(currentUserId)}`,
        {
          cache: "no-store",
          headers: {
            "X-User-Id": String(currentUserId),
            "Cache-Control": "no-cache",
          },
        }
      );

      if (!response.ok) {
        console.warn("Existing invitations could not be loaded:", response.status);
        return;
      }

      const invitedMembers = await response.json();
      const activeInvitedIds = [];

      if (Array.isArray(invitedMembers)) {
        invitedMembers.forEach((member) => {
          const userId = getUserId(member);

          if (userId == null) {
            return;
          }

          invitedUsersById.set(String(userId), member);

          if (isActiveInvitationStatus(member.status)) {
            activeInvitedIds.push(userId);
          }
        });
      }

      selectedUsers = uniqueIds(activeInvitedIds);
    } catch (error) {
      console.warn("Existing invitations could not be loaded:", error);
    }
  }

  function isActiveInvitationStatus(status) {
    const normalized = String(status ?? "PENDING").toUpperCase();
    return normalized !== "DECLINED" &&
      normalized !== "REJECTED" &&
      normalized !== "CANCELLED" &&
      normalized !== "CANCELED";
  }

  function uniqueIds(ids) {
    const seen = new Set();

    return ids.filter((id) => {
      const key = String(id);

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
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

  console.log("Address written into field:", locationAddress);
  console.log("State after loading:", state);
}

  function setInputValue(name, value) {
    if (!form || !form.elements[name]) {
      console.warn(`Input with name='${name}' was not found.`);
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
        "Accept-Language": "en",
      },
    });

    if (!response.ok) {
      throw new Error("Reverse geocoding failed.");
    }

    const result = await response.json();

    const foundAddress = result.display_name || "";

    console.log("Address found from coordinates:", foundAddress);

    if (foundAddress) {
      state.location_address = foundAddress;

      const realAddressInput = document.getElementById("location_address");

      if (realAddressInput) {
        realAddressInput.value = foundAddress;
        realAddressInput.setAttribute("value", foundAddress);
      }
    }
  } catch (error) {
    console.error("Address could not be loaded from coordinates:", error);
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

  console.log("Start time from backend:", startValue);
  console.log("End time from backend:", endValue);

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
    // If the backend sends e.g. "2026-04-08T21:00:00"
    const normalDate = new Date(value);

    if (!isNaN(normalDate.getTime())) {
      return normalDate;
    }

    // If the backend sends e.g. "08.04.2026 21:00"
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

    updateWizard(stepNumber);

    if (stepNumber === 4) {
      continueBtn.textContent = isEditMode ? "Save changes" : "Create party";
      showMapPreview();
    } else {
      continueBtn.textContent = "Continue";
    }
  }

  function updateWizard(stepNumber) {
    wizardSteps.forEach((step) => {
      const number = Number(step.dataset.stepIndicator);
      const isActive = number === stepNumber;

      step.classList.toggle("active", isActive);
      step.classList.toggle("done", number < stepNumber);

      if (isActive) {
        step.setAttribute("aria-current", "step");
      } else {
        step.removeAttribute("aria-current");
      }
    });
  }

  function validateStep(stepNumber) {
    readFormIntoState();

    if (stepNumber === 1) {
      if (!state.title.trim()) {
        showFeedback("Please enter a name for the party.", "error");
        return false;
      }

      if (!state.description.trim()) {
        showFeedback("Please enter a description.", "error");
        return false;
      }

      if (!state.time_start) {
        showFeedback("Please enter a start time.", "error");
        return false;
      }

      if (!state.time_end) {
        showFeedback("Please enter an end time.", "error");
        return false;
      }

      if (state.time_end <= state.time_start) {
        showFeedback("The end time must be after the start time.", "error");
        return false;
      }

      if (!state.location_address.trim()) {
        showFeedback("Please enter an address.", "error");
        return false;
      }

      return true;
    }

    if (stepNumber === 2) {
      if (visibility === "private" && selectedUsers.length === 0) {
        const confirmPrivateWithoutUsers = confirm(
          "You have not selected anyone. Do you still want to continue?"
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
        showFeedback("The minimum age cannot be negative.", "error");
        return false;
      }

      if (maxAge !== null && maxAge < 0) {
        showFeedback("The maximum age cannot be negative.", "error");
        return false;
      }

      if (minAge !== null && maxAge !== null && maxAge < minAge) {
        showFeedback("The maximum age cannot be lower than the minimum age.", "error");
        return false;
      }

      return true;
    }

    if (stepNumber === 4) {
      return true;
    }

    return true;
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
          "Address could not be shown on the map.";
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
          "Accept-Language": "en",
        },
      });

      if (!response.ok) {
        throw new Error("Geocoding failed.");
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
      console.error("Error during geocoding:", error);
    }
  }

  function initMapIfNeeded() {
    if (addPartyMap || !mapElement) {
      return;
    }

    if (typeof L === "undefined") {
      console.error("Leaflet was not loaded.");
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

    addPartyMarker.bindPopup(state.location_address || "Party Location").openPopup();

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
    showFeedback("No user is logged in. Please log in again.", "error");
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
    setSavingState(true);

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
      console.error("Backend error:", responseText);
      throw new Error(`Saving failed. Status: ${response.status}`);
    }

    let savedParty = null;

    if (responseText && responseText.trim() !== "") {
      try {
        savedParty = JSON.parse(responseText);
      } catch (error) {
        console.warn("Response was not JSON:", responseText);
      }
    }

    console.log("Saved party:", savedParty);

    showFeedback(isEditMode ? "Party was saved." : "Party was created.", "success");

    window.setTimeout(() => {
      window.location.href = "../listPartys/listPartys.html";
    }, 900);
  } catch (error) {
    console.error("Error while saving:", error);
    showFeedback("Party could not be saved. Please try again.", "error");
    setSavingState(false);
  }
}

  function showFeedback(message, type = "success") {
    if (!partyFeedback) {
      return;
    }

    partyFeedback.hidden = false;
    partyFeedback.textContent = message;
    partyFeedback.className = `party-feedback ${type}`;
  }

  function clearFeedback() {
    if (!partyFeedback) {
      return;
    }

    partyFeedback.hidden = true;
    partyFeedback.textContent = "";
    partyFeedback.className = "party-feedback";
  }

  function setSavingState(isSaving) {
    if (!continueBtn) {
      return;
    }

    continueBtn.disabled = isSaving;
    continueBtn.textContent = isSaving
      ? "Saving..."
      : currentStep === 4
        ? isEditMode ? "Save changes" : "Create party"
        : "Continue";
  }

  function toBackendDate(date) {
    if (!date) {
      return null;
    }

    if (typeof date === "string") {
      return date;
    }

    /**
     * Sends local time without a UTC offset.
     * Example: 04/09/2026 21:00 becomes 2026-04-09T21:00:00
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
      console.warn("Current User ID could not be read:", error);
      return null;
    }
  }
});
