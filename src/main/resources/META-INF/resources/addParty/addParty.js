/*
    addParty.js
    - Initializes Flatpickr for date/time fields (including past-date check)
    - Renders a user list for visibility selection
    - Performs meaningful validations before submission
    - Well-commented for better overview
*/

document.addEventListener("DOMContentLoaded", () => {
  // ------------------------------
  // Back button functionality
  // ------------------------------
  const backArrow = document.querySelector(".back-arrow");
  if (backArrow) {
    backArrow.addEventListener("click", function () {
      window.history.back();
    });
  }

  // ------------------------------
  // Initialize Flatpickr
  // ------------------------------
  // minDate: "today" prevents selecting days in the past via the UI.
  const startPicker = flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
    minDate: "today",
  });

  const endPicker = flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
    minDate: "today",
  });

  // ------------------------------
  // When start time changes, set minimum for end date
  // ------------------------------
  startPicker.set("onChange", function (selectedDates) {
    if (selectedDates && selectedDates[0]) {
      endPicker.set("minDate", selectedDates[0]);
    }
  });

  // ------------------------------
  // Synchronize start date if end date is set before it
  // ------------------------------
  endPicker.set("onChange", function (selectedDates) {
    if (!selectedDates || !selectedDates[0]) return;
    const newEnd = selectedDates[0];
    const curStart = startPicker.selectedDates[0];
    if (curStart && newEnd < curStart) {
      startPicker.setDate(newEnd, true);
      console.log("Start date adjusted to new end date:", newEnd);
    }
  });

  // ------------------------------
  // Visibility dropdown
  // ------------------------------
  const toggleBtn = document.getElementById("visibilityToggle");
  const panel = document.getElementById("visibilityPanel");
  if (toggleBtn && panel) {
    toggleBtn.addEventListener("click", () => {
      panel.classList.toggle("open");
      toggleBtn.classList.toggle("open");
    });
  }

  // ------------------------------
  // Load users from backend API
  // ------------------------------
  const userList = document.getElementById("userList");
  let visibleUsersToCheck = null;

  async function loadUsers() {
    try {
      const response = await fetch("/api/users/all");
      if (!response.ok) {
        console.error("Failed to fetch users:", response.status);
        return;
      }
      const users = await response.json();
      renderUsers(users);

      if (visibleUsersToCheck && Array.isArray(visibleUsersToCheck)) {
        checkVisibleUsers(visibleUsersToCheck);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  function renderUsers(users) {
    if (!userList) return;
    userList.innerHTML = "";

    users.forEach((user) => {
      const card = document.createElement("div");
      card.className = "user-card";

      const avatarLetter = (user.displayName || user.distinctName || "?").charAt(0).toUpperCase();
      const username = user.distinctName || user.id.toString();

      card.innerHTML = `
                <div class="user-left">
                    <div class="user-avatar">${avatarLetter}</div>
                    <span class="user-name">@${username}</span>
                </div>
                <label class="user-select">
                    <input type="checkbox" name="visible_users" value="${username}">
                    <span class="checkmark"></span>
                </label>
            `;
      userList.appendChild(card);
    });
  }

  function checkVisibleUsers(visibleUsers) {
    const form = document.querySelector(".party-form");
    if (!form) return;

    Array.from(form.querySelectorAll('input[name="visible_users"]')).forEach(inp => {
      if (visibleUsers.includes(inp.value)) inp.checked = true;
      else inp.checked = false;
    });
  }

  loadUsers();

  // ------------------------------
  // Helper functions for validation
  // ------------------------------
  const showError = (msg) => {
    alert(msg);
  };

  const isPositiveNumber = (v) => {
    if (v === null || v === undefined || v === "") return false;
    const n = Number(v);
    return !Number.isNaN(n) && isFinite(n) && n >= 0;
  };

  const isInteger = (v) => {
    if (v === null || v === undefined || v === "") return false;
    const n = Number(v);
    return Number.isInteger(n);
  };

  const safeParseUrl = (u) => {
    try {
      return new URL(u);
    } catch (_) {
      return null;
    }
  };

  // ------------------------------
  // API Helpers
  // ------------------------------
  async function createParty(partyPayload) {
    try {
      const response = await fetch("/api/party/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(partyPayload),
      });

      const location = response.headers.get("Location");
      let data = null;
      try { data = await response.json(); } catch (_) {}

      if (response.ok || response.status === 201) {
        return { ok: true, status: response.status, data, location };
      }

      let text = null;
      try { text = await response.text(); } catch (_) {}
      return { ok: false, status: response.status, text, data };
    } catch (error) {
      console.error("Network error:", error);
      return { ok: false, error };
    }
  }

  async function updateParty(partyId, partyPayload) {
    try {
      if (window.backend && typeof window.backend.updateParty === "function") {
        const data = await window.backend.updateParty(partyId, partyPayload);
        return { ok: !!data, data };
      }
      const response = await fetch(`/api/party/${partyId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(partyPayload),
      });
      let data = null;
      try { data = await response.json(); } catch (_) {}
      if (response.ok) return { ok: true, status: response.status, data };
      return { ok: false, status: response.status, data };
    } catch (error) {
      console.error("Network error (update):", error);
      return { ok: false, error };
    }
  }

  const form = document.querySelector(".party-form");
  if (!form) return;

  // ------------------------------
  // Edit mode logic
  // ------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const editPartyId = urlParams.get("id");
  let isEditMode = false;
  (async function tryLoadEdit() {
    if (!editPartyId) return;
    isEditMode = true;
    const submitBtn = form.querySelector(".submit-btn");
    if (submitBtn) submitBtn.textContent = "Update";

    const parseFromBackend = (s) => {
      if (!s || typeof s !== "string") return null;
      const [datePart, timePart] = s.split(" ");
      if (!datePart || !timePart) return null;
      const [d, m, y] = datePart.split(".").map(Number);
      const [h, min] = timePart.split(":").map(Number);
      return new Date(y, m - 1, d, h, min);
    };

    let party = null;
    try {
      if (window.backend && typeof window.backend.getPartyById === "function") {
        party = await window.backend.getPartyById(editPartyId);
      } else {
        const res = await fetch(`/api/party/${editPartyId}`);
        if (res.ok) party = await res.json();
      }
    } catch (err) { console.error(err); }

    if (!party) return;

    form.title.value = party.title || "";
    form.description.value = party.description || "";
    if (party.location) {
      if (typeof party.location === 'object' && party.location.name) form.location_name.value = party.location.name;
      else if (typeof party.location === 'string') form.location_name.value = party.location;
    }
    if (party.website) form.website.value = party.website;
    if (party.fee !== undefined) form.entry_costs.value = party.fee;
    if (party.min_age !== undefined) form.min_age.value = party.min_age;
    if (party.max_age !== undefined) form.max_age.value = party.max_age;
    if (party.theme && form.theme) form.theme.value = party.theme;
    if (party.max_people && form.max_people) form.max_people.value = party.max_people;

    const sd = parseFromBackend(party.time_start || party.timeStart || party.start_time);
    const ed = parseFromBackend(party.time_end || party.timeEnd || party.end_time);
    if (sd) startPicker.setDate(sd, true);
    if (ed) endPicker.setDate(ed, true);

    if (Array.isArray(party.visible_users)) {
      visibleUsersToCheck = party.visible_users;
      checkVisibleUsers(party.visible_users);
      const panelEl = document.getElementById("visibilityPanel");
      const toggle = document.getElementById("visibilityToggle");
      if (panelEl && toggle) {
        panelEl.classList.add("open");
        toggle.classList.add("open");
      }
    }
  })();

  // ------------------------------
  // Form Submit with Validation
  // ------------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = form.title.value && form.title.value.trim();
    const locationName = form.location_name && form.location_name.value ? form.location_name.value.trim() : '';
    const entryCosts = form.entry_costs.value;
    const minAge = form.min_age.value;
    const maxAge = form.max_age.value;
    const website = form.website.value && form.website.value.trim();
    const startDate = startPicker.selectedDates[0] || null;
    const endDate = endPicker.selectedDates[0] || null;

    if (!title) {
      showError("Please enter a name for the party.");
      form.title.focus();
      return;
    }

    if (!locationName) {
      showError("Please enter a location name.");
      if (form.location_name) form.location_name.focus();
      return;
    }

    if (!startDate) {
      showError("Please select a start date and time.");
      return;
    }

    // --- Validation against past dates ---
    const now = new Date();
    // 1-minute grace period for filling out the form
    if (startDate < new Date(now.getTime() - 60000)) {
      showError("Oops! Your party cannot start in the past. 🕒 Please select a future time.");
      return;
    }

    if (!endDate) {
      showError("Please select an end date and time.");
      return;
    }
    if (startDate >= endDate) {
      showError("The end date must be after the start date.");
      return;
    }

    if (entryCosts && !isPositiveNumber(entryCosts)) {
      showError("The admission fee must be a positive number (or 0).");
      form.entry_costs.focus();
      return;
    }

    if (minAge && (!isInteger(minAge) || Number(minAge) < 0)) {
      showError("Invalid minimum age.");
      return;
    }

    if (minAge && maxAge && Number(minAge) > Number(maxAge)) {
      showError("The minimum age cannot be higher than the maximum age.");
      return;
    }

    // --- Website is OPTIONAL: Only validate if something was entered ---
    if (website && website !== "") {
      if (!safeParseUrl(website)) {
        showError("Please enter a valid website URL (including https://) or leave the field empty.");
        form.website.focus();
        return;
      }
    }

    const visibilityOpen = document.getElementById("visibilityPanel")?.classList.contains("open");
    let visibleUsers = [];
    if (visibilityOpen) {
      visibleUsers = Array.from(form.querySelectorAll('input[name="visible_users"]:checked')).map((i) => i.value);
      if (visibleUsers.length === 0) {
        if (!confirm("No users selected — do you want to proceed anyway?")) return;
      }
    }

    const formatToBackend = (d) => {
      if (!d || !(d instanceof Date)) return null;
      const pad = (n) => String(n).padStart(2, "0");
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const payload = {
      title,
      description: form.description.value.trim(),
      location_name: locationName || null,
      time_start: formatToBackend(startDate),
      time_end: formatToBackend(endDate),
      longitude: form.longitude?.value ? Number(form.longitude.value) : 16.3738,
      latitude: form.latitude?.value ? Number(form.latitude.value) : 48.2082,
      category_id: form.category_id?.value ? Number(form.category_id.value) : 2,
      website: website || null,
      visible_users: visibleUsers,
      theme: form.theme?.value ? String(form.theme.value).trim() : null,
    };

    if (form.max_people?.value) payload.max_people = Number(form.max_people.value);
    if (minAge) payload.min_age = Number(minAge);
    if (maxAge) payload.max_age = Number(maxAge);
    if (entryCosts) payload.fee = Number(entryCosts);

    const submitBtn = form.querySelector(".submit-btn");
    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute("aria-busy", "true");
      }

      let result;
      if (isEditMode && editPartyId) {
        result = await updateParty(editPartyId, payload);
        if (result.ok) {
          alert("Party successfully updated.");
          window.location.href = `/party/${editPartyId}`;
          return;
        }
      } else {
        result = await createParty(payload);
        if (result.ok) {
          alert("Party successfully created.");
          window.location.href = result.location || "/listPartys/listPartys.html";
          return;
        }
      }
      showError("An error occurred while saving the party.");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
      }
    }
  });
});