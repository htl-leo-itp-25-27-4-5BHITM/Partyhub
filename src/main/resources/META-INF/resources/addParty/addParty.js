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
    title: "",
    description: "",
    time_start: "",
    time_end: "",
    location_address: "",
    visibility: "private",
    selectedUsers: [],
    entry_costs: null,
    theme: "",
    min_age: 18,
    max_age: null,
    website: ""
  };

  const stepTitles = [
    "Add new Party",
    "Who can attend the party?",
    "Other Infos"
  ];

  /* ==========================
     FLATPICKR
  ========================== */
  const fpStart = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true
  });

  const fpEnd = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true
  });

  /* ==========================
     STEP LOGIK
  ========================== */
  function showStep(index) {
    steps.forEach(s => s.classList.remove("active"));
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

    inputs.forEach(input => {
      const value = input.value.trim();
      let error = false;

      if (
        ["title", "time_start", "location_address"].includes(input.name) &&
        value === ""
      ) {
        error = true;
      }

      if (input.name === "time_start" && fpStart.selectedDates[0]) {
        if (fpStart.selectedDates[0] < new Date()) error = true;
      }

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
  btn.addEventListener("click", () => {
    if (!validateStep()) return;

    const inputs = steps[currentStep].querySelectorAll("input");

    inputs.forEach(input => {
      if (input.type === "checkbox") {
        if (input.checked && !state.selectedUsers.includes(input.value)) {
          state.selectedUsers.push(input.value);
        }
      } else {
        state[input.name] = input.value;
      }
    });

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      console.log("FINAL PAYLOAD", state);
      alert("Party ready 🚀");
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
  document.querySelectorAll(".vis-card").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".vis-card")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      state.visibility = btn.dataset.mode;

      const isPublic = state.visibility === "public";
      userList.style.display = isPublic ? "none" : "flex";
      everyoneHint.style.display = isPublic ? "block" : "none";
    });
  });

  /* ==========================
     ADRESS AUTOCOMPLETE
  ========================== */
  let debounceTimer;

  addressInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);

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
        { headers: { "Accept-Language": "de" } }
      );

      const results = await res.json();
      suggestionsBox.innerHTML = "";

      results.forEach(place => {
        const div = document.createElement("div");
        div.className = "suggestion";
        div.textContent = place.display_name;

        div.addEventListener("click", () => {
          addressInput.value = place.display_name;
          state.location_address = place.display_name;
          suggestionsBox.innerHTML = "";
        });

        suggestionsBox.appendChild(div);
      });
    } catch (e) {
      console.error("Adresse konnte nicht geladen werden", e);
    }
  }

  /* ==========================
     USERS LADEN (SIMULIERT)
  ========================== */
  async function loadUsers() {
    try {
      const res = await fetch("/api/users/all");
      if (!res.ok) return;

      const users = await res.json();
      userList.innerHTML = "";

      users.forEach(u => {
        const card = document.createElement("div");
        card.className = "user-card";
        card.innerHTML = `
          <span>@${u.distinctName}</span>
          <input type="checkbox" value="${u.distinctName}">
        `;
        userList.appendChild(card);
      });
    } catch {}
  }

  /* ==========================
     INIT
  ========================== */
  loadUsers();
  showStep(0);
});
