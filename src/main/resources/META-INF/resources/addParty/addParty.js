document.addEventListener("DOMContentLoaded", () => {
  // --- DOM ELEMENTE ---
  const steps = document.querySelectorAll(".step");
  const btn = document.getElementById("continueBtn");
  const title = document.getElementById("stepTitle");
  const backArrow = document.querySelector(".back-arrow");
  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  // --- STATE ---
  let currentStep = 0;
  const stepTitles = ["Add new Party", "Who can attend the party?", "Other Infos"];
  const state = { visibility: "private", selectedUsers: [] };

  // --- INITIALISIERUNG FLATPICKR ---
  // Wir speichern die Instanzen in Variablen, um später auf .selectedDates zuzugreifen
  const fpStart = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    onClose: () => validateField(document.getElementById("time_start"))
  });

  const fpEnd = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    onClose: () => validateField(document.getElementById("time_end"))
  });

  // --- VALIDIERUNGS-LOGIK ---
  function validateField(input) {
    if (!input) return true;
    const fieldName = input.name || input.id;
    const value = input.value.trim();
    let isInvalid = false;
    const now = new Date();

    // 1. Pflichtfelder (darf nicht leer sein)
    const requiredFields = ["title", "time_start", "location_name"];
    if (requiredFields.includes(fieldName) && value === "") {
      isInvalid = true;
    }

    // 2. Datum Validierung
    const startDate = fpStart.selectedDates[0]; // Das echte JS-Datum Objekt
    const endDate = fpEnd.selectedDates[0];

    if (fieldName === "time_start" && startDate) {
      // Start darf nicht in der Vergangenheit liegen (wir ziehen 1 Min Puffer ab)
      if (startDate < new Date(now.getTime() - 60000)) {
        isInvalid = true;
      }
    }

    if (fieldName === "time_end" && endDate && startDate) {
      // Ende muss nach Start liegen
      if (endDate <= startDate) {
        isInvalid = true;
      }
    }

    // Visuelles Feedback
    if (isInvalid) {
      input.classList.add("input-error");
    } else {
      input.classList.remove("input-error");
    }

    return !isInvalid;
  }

  function validateCurrentStep() {
    const activeStep = steps[currentStep];
    const inputs = activeStep.querySelectorAll("input");
    let allOk = true;

    inputs.forEach((input) => {
      if (!validateField(input)) {
        allOk = false;
      }
    });

    return allOk;
  }

  // --- NAVIGATION ---
  function showStep(index) {
    steps.forEach((s) => s.classList.remove("active"));
    steps[index].classList.add("active");
    title.textContent = stepTitles[index];
    btn.textContent = index === steps.length - 1 ? "Submit" : "Continue";
  }

  // --- EVENTS ---
  btn.addEventListener("click", () => {
    if (!validateCurrentStep()) {
      // Optional: Ein kleiner visueller Hinweis
      return;
    }

    // Daten sammeln
    const inputs = steps[currentStep].querySelectorAll("input");
    inputs.forEach((i) => {
      if (i.type === "checkbox") {
        if (i.checked && !state.selectedUsers.includes(i.value)) {
          state.selectedUsers.push(i.value);
        } else if (!i.checked) {
          state.selectedUsers = state.selectedUsers.filter(u => u !== i.value);
        }
      } else {
        state[i.name || i.id] = i.value;
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

  // Live-Korrektur beim Tippen
  document.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", () => {
      if (input.classList.contains("input-error")) {
        validateField(input);
      }
    });
  });

  // User Laden (Simuliert)
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