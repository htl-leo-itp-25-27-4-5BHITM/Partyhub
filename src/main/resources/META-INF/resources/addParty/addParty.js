// Extra JS Datei – nur hier dein JS-Code
document.addEventListener("DOMContentLoaded", () => {
  console.log("Flatpickr Typ:", typeof flatpickr); // Debug in Konsole

  flatpickr("#time_start", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });

  flatpickr("#time_end", {
    enableTime: true,
    dateFormat: "d.m.Y H:i",
    time_24hr: true,
    minuteIncrement: 15,
  });
});

// VISIBILITY DROPDOWN TOGGLE
const toggleBtn = document.getElementById("visibilityToggle");
const panel = document.getElementById("visibilityPanel");

toggleBtn.addEventListener("click", () => {
  panel.classList.toggle("open");
  toggleBtn.classList.toggle("open");
});

// USER DUMMY DATA (später ersetzt du das durch Backend)
const users = [
  { username: "partymausViki", avatar: "V", checked: true },
  { username: "max", avatar: "M", checked: false },
  { username: "evapartying", avatar: "E", checked: false },
  { username: "partywithviki", avatar: "V", checked: true },
  { username: "hannah._.", avatar: "H", checked: false },
];

// USER LIST CONTAINER
const userList = document.getElementById("userList");

// RENDER FUNCTION
users.forEach((user) => {
  const card = document.createElement("div");
  card.className = "user-card";

  card.innerHTML = `
    <div class="user-left">
      <div class="user-avatar">${user.avatar}</div>
      <span class="user-name">@${user.username}</span>
    </div>

    <label class="user-select">
      <input type="checkbox" name="visible_users" value="${user.username}" 
        ${user.checked ? "checked" : ""}>
      <span class="checkmark"></span>
    </label>
  `;

  userList.appendChild(card);
});


    document.querySelector('.party-form').addEventListener('submit', async e => {
    e.preventDefault();

    const payload = {
        title:        e.target.title.value,
        description:  e.target.description.value,
        time_start:   e.target.time_start.value,
        time_end:     e.target.time_end.value,
        longitude: 1.0,
        latitude: 1.0,
        fee:  Number(e.target.entry_costs.value) || 0,
        category_id:        1,
        min_age:      Number(e.target.min_age.value) || null,
        max_age:      Number(e.target.max_age.value) || null,
        website:      e.target.website.value
};

    try {
    const response = await fetch('/api/party/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
});

    if (!response.ok) throw new Error(`Status ${response.status}`);
    const result = await response.json();
    console.log('Server reply:', result);
} catch (err) {
    console.error('Submit failed:', err);
}
});