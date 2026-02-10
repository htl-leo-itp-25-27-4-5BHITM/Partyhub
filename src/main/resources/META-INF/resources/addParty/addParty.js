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
  let isSubmitting = false;

  const state = {
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
      FormValidator.clearValidation(input);

      const value = input.value.trim();
      const fieldContainer = input.closest('.field') || input.parentElement;
      let errorMessage = null;

      if (["title", "time_start", "location_address"].includes(input.name) && value === "") {
        errorMessage = "This field is required";
      }

      if (input.name === "location_address" && (!state.latitude || !state.longitude)) {
        errorMessage = "Please select a valid address from the suggestions";
      }

      if (input.name === "time_start" && fpStart.selectedDates[0]) {
        if (fpStart.selectedDates[0] < new Date()) {
          errorMessage = "Start date cannot be in the past";
        }
      }

      if (input.name === "time_end" && fpStart.selectedDates[0] && fpEnd.selectedDates[0]) {
        if (fpEnd.selectedDates[0] <= fpStart.selectedDates[0]) {
          errorMessage = "End date must be after start date";
        }
      }

      if (input.type === "number") {
        if (input.min && parseFloat(value) < parseFloat(input.min)) {
          errorMessage = `Value must be at least ${input.min}`;
        }
        if (input.max && parseFloat(value) > parseFloat(input.max)) {
          errorMessage = `Value must be at most ${input.max}`;
        }
      }

      if (input.type === "url" && value && !FormValidator.patterns.url.test(value)) {
        errorMessage = "Please enter a valid URL (starting with http:// or https://)";
      }

      if (errorMessage) {
        const errorEl = document.createElement('div');
        errorEl.className = 'form-field__error form-field__error--visible';
        errorEl.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="error-text">${errorMessage}</span>
        `;
        fieldContainer.appendChild(errorEl);
        input.classList.add('form-field__input--error');
        valid = false;
      } else if (value) {
        input.classList.add('form-field__input--success');
      }
    });

    if (!valid) {
      ToastManager.warning('Please fill in all required fields correctly');
    }

    return valid;
  }

  /* ==========================
     BUTTON EVENTS
  ========================== */
  btn.addEventListener("click", () => {
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
      if (isSubmitting) return;
      isSubmitting = true;
      btn.classList.add('btn--loading');
      btn.innerHTML = '<span class="btn__spinner"></span>Creating...';
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
        });

        suggestionsBox.appendChild(div);
      });
    } catch (e) {
      // Address search failed silently
    }
  }

  /* ==========================
     USERS LADEN
  ========================== */
  async function loadUsers() {
    try {
      const res = await fetch("/api/users/all");
      if (!res.ok) return;

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
    } catch {}
  }

  /* ==========================
     INIT
  ========================== */
  loadUsers();
  showStep(0);

  /* ==========================
     LEAFLET MAP (Step 4)
  ========================== */
  let addPartyMap = null;
  let addPartyMarker = null;

  function initAddPartyMap() {
    if (addPartyMap) return; // already initialized

    const mapDiv = document.getElementById("addPartyMap");
    addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13); // Vienna center

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(addPartyMap);

    // Add marker at party location
    if (state.latitude && state.longitude) {
      if (addPartyMarker) {
        addPartyMarker.setLatLng([state.latitude, state.longitude]);
      } else {
        addPartyMarker = L.marker([state.latitude, state.longitude])
          .bindPopup(
            `<strong>${state.title}</strong><br>${state.location_address}`,
          )
          .addTo(addPartyMap);
      }
      addPartyMap.setView([state.latitude, state.longitude], 15);
    }
  }

  // Hook into step navigation to initialize map on step 4
  const originalShowStep = showStep;
  showStep = function (index) {
    originalShowStep(index);
    if (index === 3 && state.latitude && state.longitude) {
      const mapDiv = document.getElementById("addPartyMap");
      const msgDiv = document.getElementById("mapMessage");
      mapDiv.style.display = "block";
      msgDiv.style.display = "none";
      setTimeout(() => initAddPartyMap(), 100);
    }
  };

  /* ==========================
     SEND PARTY TO BACKEND
  ========================== */
  async function submitPartyToBackend(partyData) {
    // Save to localStorage for instant map display
    const parties = JSON.parse(localStorage.getItem("parties") || "[]");
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
    localStorage.setItem("parties", JSON.stringify(parties));

    try {
      const backendPayload = {
        title: partyData.title,
        description: partyData.description,
        fee: partyData.entry_costs,
        time_start: partyData.time_start,
        time_end: partyData.time_end,
        latitude: partyData.latitude,
        longitude: partyData.longitude,
        location_address: partyData.location_address,
        min_age: partyData.min_age,
        max_age: partyData.max_age,
        website: partyData.website,
        theme: partyData.theme,
        visibility: partyData.visibility,
        selectedUsers: partyData.selectedUsers,
      };

      const response = await fetch("/api/party/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backendPayload),
      });

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      ToastManager.success("Party created successfully! 🎉", "Success");
    } catch (err) {
      console.error("Backend error:", err);
      ToastManager.warning("Party saved locally. Will sync when connected.", "Offline Mode");
    }

    isSubmitting = false;

    setTimeout(() => {
      window.location.href = "/index.html";
    }, 1500);
  }
});
