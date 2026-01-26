document.addEventListener("DOMContentLoaded", () => {
  // --- DOM ELEMENTE ---
  const steps = document.querySelectorAll(".step");
  const btn = document.getElementById("continueBtn");
  const title = document.getElementById("stepTitle");
  const backArrow = document.querySelector(".back-arrow");
  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");
  const form = document.querySelector(".party-form");

  // --- STATE ---
  // Wir initialisieren alle Felder, damit sie im JSON vorhanden sind
  let currentStep = 0;
  const stepTitles = ["Add new Party", "Who can attend the party?", "Other Infos"];
  const state = {
    title: "",
    description: "",
    time_start: "",
    time_end: "",
    location_name: "",
    visibility: "private",
    selectedUsers: [],
    entry_costs: 0,
    theme: "",
    min_age: 18,
    max_age: null,
    website: "",
    latitude: 0.0,
    longitude: 0.0
  };

  // --- INITIALISIERUNG FLATPICKR ---
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

  // --- STANDORT-LOGIK ---
  function fetchLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (pos) => {
            // Wir runden auf 6 Nachkommastellen (reicht für Meter-Präzision)
            state.latitude = parseFloat(pos.coords.latitude.toFixed(6));
            state.longitude = parseFloat(pos.coords.longitude.toFixed(6));
            console.log("📍 Standort erfasst:", state.latitude, state.longitude);
          },
          (err) => {
            console.warn("Standort-Zugriff nicht möglich, nutze 0.0");
          }
      );
    }
  }
  // Standort sofort beim Laden abfragen
  fetchLocation();

  // --- NAVIGATION ---
  function showStep(index) {
    steps.forEach((s) => s.classList.remove("active"));
    steps[index].classList.add("active");
    title.textContent = stepTitles[index];
    btn.textContent = index === steps.length - 1 ? "Submit" : "Continue";
  }

  // --- DATEN SAMMELN ---
  function collectStepData() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll("input");

    inputs.forEach((input) => {
      const key = input.name || input.id;
      if (!key) return;

      if (input.type === "checkbox") {
        if (input.checked && !state.selectedUsers.includes(input.value)) {
          state.selectedUsers.push(input.value);
        } else if (!input.checked) {
          state.selectedUsers = state.selectedUsers.filter(u => u !== input.value);
        }
      } else if (input.type === "number") {
        state[key] = input.value ? parseFloat(input.value) : 0;
      } else {
        state[key] = input.value;
      }
    });
  }

  // --- SPEICHERN ---
  async function saveParty() {
    // Button deaktivieren um Duplicate Key Fehler durch Mehrfachklicks zu verhindern
    if (btn.disabled) return;
    btn.disabled = true;
    btn.textContent = "Saving...";

    try {
      const response = await fetch("/api/party/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(state),
      });

      if (response.ok) {
        form.innerHTML = `
          <div style="text-align: center; padding: 40px 0;">
            <h2 style="color: #fff; margin-bottom: 10px;">Party ready 🚀</h2>
            <p style="color: #aaa;">Deine Party wurde erfolgreich gespeichert.</p>
            <button type="button" class="submit-btn" style="margin-top: 20px;" onclick="window.location.href='/'">Back to Home</button>
          </div>
        `;
        title.textContent = "Success!";
      } else {
        const errData = await response.json();
        // Falls das Backend den ID-Fehler wirft, zeigen wir die Details an
        alert("Fehler: " + (errData.details || "Server Fehler"));
        btn.disabled = false;
        btn.textContent = "Submit";
      }
    } catch (e) {
      console.error(e);
      alert("Netzwerkfehler zum Quarkus-Backend.");
      btn.disabled = false;
      btn.textContent = "Submit";
    }
  }

  // --- EVENTS ---
  btn.addEventListener("click", () => {
    collectStepData();

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      saveParty();
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

  // Sichtbarkeit Step 2
  document.querySelectorAll(".vis-card").forEach((vBtn) => {
    vBtn.addEventListener("click", () => {
      document.querySelectorAll(".vis-card").forEach((b) => b.classList.remove("active"));
      vBtn.classList.add("active");
      state.visibility = vBtn.dataset.mode;
      userList.style.display = state.visibility === "public" ? "none" : "flex";
      everyoneHint.style.display = state.visibility === "public" ? "block" : "none";
    });
  });

  // User Laden
  async function loadUsers() {
    try {
      const res = await fetch("/api/users/all");
      if (!res.ok) return;
      const users = await res.json();
      userList.innerHTML = "";
      users.forEach((u) => {
        const el = document.createElement("div");
        el.className = "user-card";
        el.innerHTML = `<span>@${u.distinctName}</span><input type="checkbox" value="${u.distinctName}">`;
        userList.appendChild(el);
      });
    } catch (e) {}
  }

  loadUsers();
  showStep(0);
});