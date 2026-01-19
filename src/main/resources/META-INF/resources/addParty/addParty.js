document.addEventListener("DOMContentLoaded", () => {
  const steps = document.querySelectorAll(".step");
  const btn = document.getElementById("continueBtn");
  const title = document.getElementById("stepTitle");
  let currentStep = 0;

  const stepTitles = [
    "Add new Party",
    "Who can attend the party?",
    "Other Infos",
  ];

  const state = {};

  flatpickr("#time_start", { enableTime: true, dateFormat: "d.m.Y H:i" });
  flatpickr("#time_end", { enableTime: true, dateFormat: "d.m.Y H:i" });

  function showStep(index) {
    steps.forEach((s) => s.classList.remove("active"));
    steps[index].classList.add("active");
    title.textContent = stepTitles[index];
    btn.textContent = index === steps.length - 1 ? "Submit" : "Continue";
  }

  btn.addEventListener("click", () => {
    const inputs = steps[currentStep].querySelectorAll("input");
    inputs.forEach((i) => (state[i.name || i.id] = i.value));

    if (currentStep < steps.length - 1) {
      currentStep++;
      showStep(currentStep);
    } else {
      console.log("FINAL PAYLOAD", state);
      alert("Party ready 🚀 (siehe Konsole)");
    }
  });

  const userList = document.getElementById("userList");
  const everyoneHint = document.getElementById("everyoneHint");

  document.querySelectorAll(".vis-card").forEach((btn) => {
    btn.addEventListener("click", () => {
      // active State
      document
        .querySelectorAll(".vis-card")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const mode = btn.dataset.mode;
      state.visibility = mode;

      if (mode === "public") {
        // Everyone
        userList.style.display = "none";
        everyoneHint.style.display = "block";
      } else {
        // Only chosen people
        userList.style.display = "flex";
        everyoneHint.style.display = "none";
      }
    });
  });

  async function loadUsers() {
    const res = await fetch("/api/users/all");
    if (!res.ok) return;
    const users = await res.json();

    const list = document.getElementById("userList");
    users.forEach((u) => {
      const el = document.createElement("div");
      el.className = "user-card";
      el.innerHTML = `
        <span>@${u.distinctName}</span>
        <input type="checkbox" value="${u.distinctName}">
      `;
      list.appendChild(el);
    });
  }

  loadUsers();
  showStep(0);
});

const backArrow = document.querySelector(".back-arrow");

let currentStep = 0;
const steps = document.querySelectorAll(".step");

backArrow.addEventListener("click", () => {
  if (currentStep > 0) {
    // einen Step zurück
    currentStep--;
    showStep(currentStep);
  } else {
    // erster Step → Seite verlassen
    history.back();
  }
});

const userList = document.getElementById("userList");
const everyoneHint = document.getElementById("everyoneHint");

document.querySelectorAll(".vis-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".vis-card")
      .forEach((b) => b.classList.remove("active"));

    btn.classList.add("active");
    state.visibility = btn.dataset.mode;

    if (btn.dataset.mode === "public") {
      // Everyone
      userList.style.display = "none";
      everyoneHint.style.display = "block";
    } else {
      // Only chosen people
      userList.style.display = "flex";
      everyoneHint.style.display = "none";
    }
  });
});
