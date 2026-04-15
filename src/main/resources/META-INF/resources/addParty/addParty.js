document.addEventListener("DOMContentLoaded", () => {
  /* ==========================
     DOM ELEMENTE
  ========================== */
  const steps = document.querySelectorAll(".step");
  const titleEl = document.getElementById("stepTitle");
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

  const stepTitles = [
    "Add new Party",
    "Who can attend the party?",
    "Other Infos",
    "Map Preview",
  ];

  let addPartyMap = null;
  let addPartyMarker = null;

  /* ==========================
     FLATPICKR INITIALISIERUNG
  ========================== */
  const fpConfig = {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    allowInput: true
  };
  const fpStart = flatpickr("#time_start", fpConfig);
  const fpEnd = flatpickr("#time_end", fpConfig);

  /* ==========================
     HILFSFUNKTIONEN
  ========================== */
  function formatDateForBackend(isoString) {
    if (!isoString) return null;
    // Entfernt Millisekunden und Z (.000Z), da viele Backends hier 400 Bad Request werfen
    return isoString.split('.')[0];
  }

  function syncInputsToState() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll("input, textarea");

    inputs.forEach((input) => {
      if (input.type === "checkbox") {
        if (input.checked) {
          if (!state.selectedUsers.includes(input.value)) state.selectedUsers.push(input.value);
        } else {
          state.selectedUsers = state.selectedUsers.filter(u => u !== input.value);
        }
      } else if (input.name) {
        state[input.name] = input.value;
      }
    });

    if (fpStart.selectedDates[0]) state.time_start = fpStart.selectedDates[0].toISOString();
    if (fpEnd.selectedDates[0]) state.time_end = fpEnd.selectedDates[0].toISOString();
    if (addressInput) state.location_address = addressInput.value.trim();
  }

  /* ==========================
     VALIDIERUNG
  ========================== */
  function validateStep() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll("input[name]");
    let isValid = true;

    inputs.forEach((input) => {
      let hasError = false;
      const val = input.value.trim();

      // Pflichtfelder Step 1
      if (["title", "time_start", "location_address"].includes(input.name) && !val) {
        hasError = true;
      }

      // Geo-Daten Check
      if (input.name === "location_address" && (!state.latitude || !state.longitude)) {
        hasError = true;
      }

      // Datum Logik
      if (input.name === "time_start" && fpStart.selectedDates[0]) {
        if (fpStart.selectedDates[0] < new Date(Date.now() - 60000)) hasError = true;
      }

      input.classList.toggle("input-error", hasError);
      if (hasError) isValid = false;
    });

    return isValid;
  }

  /* ==========================
     STEP NAVIGATION
  ========================== */
  async function showStep(index) {
    steps.forEach((s, i) => s.classList.toggle("active", i === index));
    titleEl.textContent = stepTitles[index];
    
    // Button Text
    if (index === steps.length - 1) {
      btn.textContent = state.id ? "Update" : "Submit";
    } else {
      btn.textContent = "Continue";
    }

    // Spezielle Logik für Steps
    if (index === 1 && state.visibility === "private") {
      await loadFollowers();
    }

    if (index === 3) {
      document.getElementById("addPartyMap").style.display = "block";
      document.getElementById("mapMessage").style.display = "none";
      setTimeout(initMap, 100);
    }
  }

  /* ==========================
     MAP LOGIK
  ========================== */
  function initMap() {
    const mapDiv = document.getElementById("addPartyMap");
    if (!mapDiv) return;

    if (!addPartyMap) {
      addPartyMap = L.map(mapDiv).setView([48.2082, 16.3738], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(addPartyMap);
    }

    if (state.latitude && state.longitude) {
      const pos = [state.latitude, state.longitude];
      if (addPartyMarker) {
        addPartyMarker.setLatLng(pos);
      } else {
        addPartyMarker = L.marker(pos).addTo(addPartyMap);
      }
      addPartyMap.setView(pos, 15);
      addPartyMarker.bindPopup(`<b>${state.title}</b>`).openPopup();
    }
    
    setTimeout(() => addPartyMap.invalidateSize(), 200);
  }

  /* ==========================
     EVENTS
  ========================== */
  btn.addEventListener("click", async () => {
    syncInputsToState();

    // Adresse noch schnell geocoden falls nötig
    if (currentStep === 0 && state.location_address && !state.latitude) {
      await geocodeAddress(state.location_address);
    }

    if (!validateStep()) {
      console.warn("Validierung fehlgeschlagen");
      return;
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      await showStep(currentStep);
    } else {
      await submitParty();
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

  // Visibility Cards
  document.querySelectorAll(".vis-card").forEach(card => {
    card.addEventListener("click", async () => {
      document.querySelectorAll(".vis-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      state.visibility = card.dataset.mode.toUpperCase();

      const isPublic = state.visibility === "PUBLIC";
      userList.style.display = isPublic ? "none" : "flex";
      everyoneHint.style.display = isPublic ? "block" : "none";

      if (!isPublic) await loadFollowers();
    });
  });

  /* ==========================
     API / BACKEND CALLS
  ========================== */
  async function geocodeAddress(addr) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&limit=1`);
      const data = await res.json();
      if (data && data.length > 0) {
        state.latitude = parseFloat(data[0].lat);
        state.longitude = parseFloat(data[0].lon);
        return true;
      }
    } catch (e) { console.error("Geocoding Error", e); }
    return false;
  }

  async function loadFollowers() {
    const uid = localStorage.getItem("userId");
    if (!uid) return;
    try {
      const res = await fetch(`/api/users/${uid}/followers`);
      const followers = await res.json();
      userList.innerHTML = "";
      followers.forEach(u => {
        const div = document.createElement("div");
        div.className = "user-card";
        div.innerHTML = `<span>@${u.distinctName}</span><input type="checkbox" value="${u.distinctName}" ${state.selectedUsers.includes(u.distinctName) ? 'checked' : ''}>`;
        userList.appendChild(div);
      });
    } catch (e) { console.error("Follower Load Error", e); }
  }

  async function submitParty() {
  // Hol dir die User-ID (wir wissen aus deinem Log, dass sie '1' ist)
  const userId = localStorage.getItem("userId") || "1"; 

  const payload = {
    ...state,
    // Sicherstellen, dass die User-ID AUCH im Body steht, falls das Backend das braucht
    userId: parseInt(userId), 
    fee: state.entry_costs ? parseFloat(state.entry_costs) : null,
    time_start: formatDateForBackend(state.time_start),
    time_end: formatDateForBackend(state.time_end),
    min_age: parseInt(state.min_age) || 18,
    max_age: state.max_age ? parseInt(state.max_age) : null
  };

  try {
    const method = state.id ? "PUT" : "POST";
    const url = state.id ? `/api/parties/${state.id}` : "/api/parties";
    
    const res = await fetch(url, {
      method: method,
      headers: { 
        "Content-Type": "application/json",
        // Hier schicken wir die ID im Header (X-User-Id ist Standard für viele Dev-Backends)
        "X-User-Id": userId.toString(),
        // Falls dein Backend einen Authorization Header erwartet:
        "Authorization": `User ${userId}` 
      },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      alert(state.id ? "Party aktualisiert!" : "Party erstellt!");
      window.location.href = "/index.html";
    } else {
      const errResponse = await res.text();
      console.error("Backend Fehler Details:", errResponse);
      alert("Fehler: " + errResponse);
    }
  } catch (e) {
    console.error("Netzwerkfehler:", e);
  }
}

  /* ==========================
     INIT & EDIT MODE
  ========================== */
  async function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (id) {
      // Edit Mode
      try {
        const res = await fetch(`/api/parties/${id}`);
        if (res.ok) {
          const party = await res.json();
          Object.assign(state, party);
          // UI befüllen
          document.querySelector('[name="title"]').value = state.title;
          document.querySelector('[name="description"]').value = state.description;
          if (state.time_start) fpStart.setDate(new Date(state.time_start));
          if (state.time_end) fpEnd.setDate(new Date(state.time_end));
          addressInput.value = state.location_address;
          document.querySelector('[name="entry_costs"]').value = state.entry_costs || "";
          document.querySelector('[name="min_age"]').value = state.min_age;
        }
      } catch (e) { console.error("Load Error", e); }
    }
    showStep(0);
  }

  init();

  // Address Suggestions
  addressInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = addressInput.value.trim();
    if (q.length < 3) return;
    debounceTimer = setTimeout(async () => {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      suggestionsBox.innerHTML = "";
      data.forEach(place => {
        const d = document.createElement("div");
        d.className = "suggestion";
        d.textContent = place.display_name;
        d.onclick = () => {
          addressInput.value = place.display_name;
          state.latitude = parseFloat(place.lat);
          state.longitude = parseFloat(place.lon);
          suggestionsBox.innerHTML = "";
        };
        suggestionsBox.appendChild(d);
      });
    }, 400);
  });
  let debounceTimer;
});