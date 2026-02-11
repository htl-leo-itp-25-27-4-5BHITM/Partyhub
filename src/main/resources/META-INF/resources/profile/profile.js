document.addEventListener("DOMContentLoaded", function () {
  const img = document.getElementById("profileImg");
  const displayNameElement = document.getElementById("displayName");
  const distinctNameElement = document.getElementById("distinctName");

  if (!img) return;

  // -----------------------------
  // Helpers
  // -----------------------------
  function defaultAvatarDataUri() {
    return (
      "data:image/svg+xml;utf8," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 120 120">
          <rect width="100%" height="100%" fill="#6b6b6b"/>
          <text x="50%" y="50%" fill="#fff" font-size="24" font-family="Arial" text-anchor="middle" dominant-baseline="central">No Img</text>
        </svg>`
      )
    );
  }

  async function tryImageUrls(urls, timeout = 2500) {
    for (const u of urls) {
      try {
        const ok = await new Promise((resolve) => {
          const t = new Image();
          const timer = setTimeout(() => {
            t.onload = t.onerror = null;
            resolve(false);
          }, timeout);
          t.onload = () => {
            clearTimeout(timer);
            resolve(true);
          };
          t.onerror = () => {
            clearTimeout(timer);
            resolve(false);
          };
          t.src = u;
        });
        if (ok) return u;
      } catch {}
    }
    return null;
  }

  function normalizeToArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
  }

  // -----------------------------
  // Storage: selected user (fake login)
  // -----------------------------
  const STORAGE_KEY = "loggedInUserId";
  function getStoredUserId() {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) return Number(s);
      const l = localStorage.getItem(STORAGE_KEY);
      return l ? Number(l) : null;
    } catch {
      return null;
    }
  }
  function setStoredUserId(id) {
    try {
      if (id == null) {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, String(id));
        localStorage.setItem(STORAGE_KEY, String(id));
      }
    } catch {}
  }
  window.setLoggedInUser = setStoredUserId;

  // -----------------------------
  // Current shown profile user id
  // -----------------------------
  let currentUserId = null;

  // -----------------------------
  // Init: handle/id/stored/fallback
  // -----------------------------
  (function initProfileLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get("handle");
    const userIdParam = urlParams.get("id");

    if (userHandle) {
      loadUserDataByHandle(userHandle);
      return;
    }

    if (userIdParam) {
      loadUserDataById(userIdParam);
      return;
    }

    const stored = getStoredUserId();
    if (stored != null) {
      loadUserDataById(stored);
      return;
    }

    // dev fallback
    loadUserDataById(1);
  })();

  // -----------------------------
  // Load user
  // -----------------------------
  function loadUserDataByHandle(userHandle) {
    fetch(`/api/users/handle/${encodeURIComponent(userHandle)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(updateUserProfile)
      .catch((err) => {
        console.error("Failed to load user by handle:", err);
        if (displayNameElement) displayNameElement.textContent = "User not found";
        if (distinctNameElement) distinctNameElement.textContent = "@unknown";
        img.src = defaultAvatarDataUri();
      });
  }

  function loadUserDataById(userId) {
    fetch(`/api/users/${userId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(updateUserProfile)
      .catch((err) => {
        console.error("Failed to load user by id:", err);
        if (displayNameElement) displayNameElement.textContent = "User not found";
        if (distinctNameElement) distinctNameElement.textContent = "@unknown";
        img.src = defaultAvatarDataUri();
      });
  }

  function updateUserProfile(user) {
    currentUserId = user?.id ?? null;
    if (currentUserId != null) setStoredUserId(currentUserId);

    if (displayNameElement) displayNameElement.textContent = user.displayName || "";
    if (distinctNameElement) distinctNameElement.textContent = user.distinctName ? `@${user.distinctName}` : "";

    // Profile image: ONLY endpoint that exists
    (async () => {
      const url = await tryImageUrls([`/api/users/${currentUserId}/profile-picture`]);
      img.src = url || defaultAvatarDataUri();
    })();

    // Parties for selected user
    loadUserParties().catch((e) => console.debug("loadUserParties failed", e));
  }

  img.onerror = function () {
    this.onerror = null;
    this.src = defaultAvatarDataUri();
  };

  // -----------------------------
  // Search
  // -----------------------------
  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchResults = document.getElementById("searchResults");
  let searchTimeout = null;

  function hideSearchDropdown() {
    if (!searchDropdown) return;
    searchDropdown.classList.add("hidden");
    searchDropdown.setAttribute("aria-hidden", "true");
  }

  function showSearchDropdown() {
    if (!searchDropdown) return;
    searchDropdown.classList.remove("hidden");
    searchDropdown.setAttribute("aria-hidden", "false");
  }

  function displaySearchResults(results) {
    if (!searchResults) return;
    if (!results || results.length === 0) {
      hideSearchDropdown();
      return;
    }

    searchResults.innerHTML = "";
    results.forEach((u) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
        <img src="/api/users/${u.id}/profile-picture" class="search-result-avatar"
             onerror="this.onerror=null;this.src='${defaultAvatarDataUri()}';">
        <div class="search-result-info">
          <div class="search-result-name">${u.displayName || u.distinctName || ""}</div>
          <div class="search-result-distinct-name">@${u.distinctName || ""}</div>
        </div>
      `;
      item.addEventListener("click", () => {
        hideSearchDropdown();
        setStoredUserId(u.id);
        loadUserDataByHandle(u.distinctName);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("handle", u.distinctName);
        newUrl.searchParams.delete("id");
        window.history.replaceState({}, "", newUrl);
      });
      searchResults.appendChild(item);
    });

    showSearchDropdown();
  }

  async function performSearch(query) {
    try {
      const res = await fetch(`/api/users/all/search?name=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      displaySearchResults(Array.isArray(data) ? data : []);
    } catch {
      hideSearchDropdown();
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.trim();
      if (searchTimeout) clearTimeout(searchTimeout);
      if (!query) {
        hideSearchDropdown();
        return;
      }
      searchTimeout = setTimeout(() => performSearch(query), 600);
    });
  }

  // -----------------------------
  // Username dropdown (ONLY /api/users/all to avoid 500)
  // -----------------------------
  const usernameBtn = document.getElementById("usernameBtn");
  const usernameDropdown = document.getElementById("usernameDropdown");
  const usernameList = document.getElementById("usernameList");

  function closeUsernameDropdown() {
    if (!usernameDropdown) return;
    try { usernameBtn?.focus(); } catch {}
    usernameDropdown.classList.add("hidden");
    usernameDropdown.setAttribute("aria-hidden", "true");
    usernameBtn?.setAttribute("aria-expanded", "false");
  }

  async function fetchUsersAll() {
    const res = await fetch("/api/users/all");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json().catch(() => null);
    return normalizeToArray(d);
  }

  function renderUsernameList(users) {
    if (!usernameList) return;
    usernameList.innerHTML = "";

    users.forEach((u) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "username-item";
      btn.innerHTML = `<span>@${u.distinctName}</span>`;
      btn.addEventListener("click", () => {
        closeUsernameDropdown();
        setStoredUserId(u.id);
        loadUserDataById(u.id);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", u.id);
        newUrl.searchParams.delete("handle");
        window.history.replaceState({}, "", newUrl);
      });
      usernameList.appendChild(btn);
    });
  }

  if (usernameBtn && usernameDropdown) {
    usernameBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isOpen = !usernameDropdown.classList.contains("hidden");
      if (isOpen) {
        closeUsernameDropdown();
        return;
      }

      usernameBtn.setAttribute("aria-expanded", "true");
      usernameDropdown.setAttribute("aria-hidden", "false");

      try {
        const users = await fetchUsersAll();
        renderUsernameList(users);
      } catch (err) {
        console.error("Failed to fetch /api/users/all:", err);
        renderUsernameList([]);
      }

      usernameDropdown.classList.remove("hidden");
    });

    document.addEventListener("click", () => closeUsernameDropdown());
  }

  // -----------------------------
  // Parties: ONLY /api/party/ and filter by Party.host_user.id
  // -----------------------------
  function readHostUserId(p) {
    const hu = p?.host_user;
    if (hu && typeof hu === "object") return hu.id ?? null;
    return p?.host_user_id ?? null; // falls du später getter hinzufügst
  }

  async function loadUserParties() {
  if (!currentUserId) {
    console.warn("loadUserParties: no currentUserId");
    return;
  }

  console.log("=== loadUserParties START ===");
  console.log("Current profile user:", currentUserId);

  let parties = [];

  try {
    const res = await fetch("/api/party/");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json().catch(() => null);
    parties = normalizeToArray(json);

  } catch (err) {
    console.error("Failed to fetch /api/party/:", err);
    return;
  }

  // 👉 RAW backend data
  console.log("RAW parties from backend:");
  console.log(parties);

  try {
    console.table(parties.map(p => ({
      id: p.id,
      title: p.title,
      host_user: p.host_user?.id ?? null
    })));
  } catch {}

  // helper: host id lesen
  function readHostUserId(p) {
    const hu = p?.host_user;
    if (hu && typeof hu === "object") return hu.id ?? null;
    return p?.host_user_id ?? null;
  }

  // 👉 Filtering
  const filtered = parties.filter(p => {
    const hostId = readHostUserId(p);
    const match = hostId != null && String(hostId) === String(currentUserId);

    console.log(
      `Party ${p.id}: host=${hostId} → match=${match}`
    );

    return match;
  });

  console.log("Filtered parties:");
  console.log(filtered);

  try {
    console.table(filtered.map(p => ({
      id: p.id,
      title: p.title,
      host_user: readHostUserId(p)
    })));
  } catch {}

  console.log(`Result: ${filtered.length} / ${parties.length} parties`);
  console.log("=== loadUserParties END ===");

  renderParties(filtered);
}


  function renderParties(parties) {
    const container = document.getElementById("partiesContainer");
    const template = document.getElementById("party-template");
    const noMsg = document.querySelector("#tabContentPartys .no-parties");

    if (!container || !template) return;
    container.innerHTML = "";

    if (!parties || parties.length === 0) {
      if (noMsg) noMsg.style.display = "block";
      return;
    }
    if (noMsg) noMsg.style.display = "none";

    parties.forEach((p) => {
      const node = template.content.cloneNode(true);

      const nameEl = node.querySelector(".party-name");
      if (nameEl) nameEl.textContent = p.title || "Party";

      // optional meta
      let metaEl = node.querySelector(".party-meta");
      if (!metaEl) {
        metaEl = document.createElement("div");
        metaEl.className = "party-meta";
        const host = node.querySelector(".party-header") || nameEl?.parentElement;
        if (host) host.appendChild(metaEl);
      }
      metaEl.textContent = (p.time_start || "").toString();

      const deleteBtn = node.querySelector(".delete-btn");
      if (deleteBtn) {
        deleteBtn.onclick = async (e) => {
          e.stopPropagation();
          if (!confirm("Löschen?")) return;
          const res = await fetch(`/api/party/${p.id}`, { method: "DELETE" });
          if (res.ok) loadUserParties();
        };
      }

      container.appendChild(node);
    });
  }

  // -----------------------------
  // Tabs: reload parties when showing "Partys"
  // -----------------------------
  (function initTabs() {
    const ids = ["Partys", "Posts", "Favorites"];

    function showTab(name) {
      ids.forEach((k) => {
        const btn = document.getElementById(`tab${k}`);
        const sec = document.getElementById(`tabContent${k}`);
        if (btn) btn.classList.toggle("active", k === name);
        if (sec) sec.style.display = k === name ? "block" : "none";
      });
      if (name === "Partys") loadUserParties().catch(() => {});
    }

    ids.forEach((k) => {
      const btn = document.getElementById(`tab${k}`);
      if (!btn) return;
      btn.setAttribute("type", "button");
      btn.addEventListener("click", (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        showTab(k);
      });
      btn.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          btn.click();
        }
      });
    });

    const initial = /* force initial tab to "Partys" */ "Partys";
    showTab(initial);
  })();
});
