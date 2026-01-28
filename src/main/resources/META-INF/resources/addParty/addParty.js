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
  btn.addEventListener("click", async () => {
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
      // FINAL: build backend DTO and POST
      btn.disabled = true;
      btn.textContent = "Saving...";
      // helper: format flatpickr date -> "dd.MM.yyyy HH:mm"
      const formatToBackend = (fp) => {
        const d = fp?.selectedDates?.[0];
        if (!d) return null;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(d.getDate())}.${pad(d.getMonth()+1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };

      const payload = {
        title: state.title || null,
        description: state.description || null,
        fee: state.entry_costs ? Number(state.entry_costs) : null,
        time_start: formatToBackend(fpStart) || null,
        time_end: formatToBackend(fpEnd) || null,
        max_people: state.max_people ? Number(state.max_people) : null,
        min_age: state.min_age ? Number(state.min_age) : null,
        max_age: state.max_age ? Number(state.max_age) : null,
        website: state.website || null,
        // latitude/longitude come from the new inputs (stored in state by collector)
        latitude: (state.latitude !== undefined && state.latitude !== "") ? Number(state.latitude) : null,
        longitude: (state.longitude !== undefined && state.longitude !== "") ? Number(state.longitude) : null,
        category_id: state.category_id ? Number(state.category_id) : null
      };

      // --- SANITIZE: remove any location/nested id fields that might have been collected ---
      // Defensive: ensure we only send the DTO fields; remove common location keys if present
      const forbiddenKeys = ['location', 'location_name', 'location_id', 'location.id', 'locationId', 'locationId', 'id'];
      forbiddenKeys.forEach(k => {
        if (k.includes('.')) {
          const [parent, child] = k.split('.');
          if (payload[parent] && typeof payload[parent] === 'object') {
            delete payload[parent][child];
            // if parent becomes empty, delete it
            if (Object.keys(payload[parent]).length === 0) delete payload[parent];
          }
        } else {
          if (payload.hasOwnProperty(k)) delete payload[k];
        }
      });

      // Extra defensive: if any value is an object (unexpected), remove it
      Object.keys(payload).forEach(key => {
        if (payload[key] && typeof payload[key] === 'object') {
          delete payload[key];
        }
      });

      // Debug log: show exact payload sent to backend (remove in production)
      console.debug('Submitting party payload (sanitized):', payload);

      try {
        const res = await fetch('/api/party/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json().catch(() => null);
          const id = data && (data.id || data.partyId);
          if (id) {
            window.location.href = `/party/${id}`;
            return;
          }
          alert('Party erfolgreich erstellt.');
          window.location.href = '/listPartys/listPartys.html';
        } else {
          let msg = 'Serverfehler';
          try {
            const j = await res.json().catch(() => null);
            if (j && (j.detail || j.message)) msg = j.detail || j.message;
            else {
              const t = await res.text().catch(() => null);
              if (t) msg = t;
            }
          } catch (_) {}
          alert('Fehler beim Speichern: ' + msg);
        }
      } catch (err) {
        console.error('Netzwerkfehler', err);
        alert('Netzwerkfehler beim Verbinden mit dem Backend.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Submit';
      }
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