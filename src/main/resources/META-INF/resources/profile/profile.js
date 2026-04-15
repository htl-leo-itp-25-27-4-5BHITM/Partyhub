document.addEventListener("DOMContentLoaded", function () {
  const img = document.getElementById("profileImg");
  const displayNameElement = document.getElementById("displayName");
  const distinctNameElement = document.getElementById("distinctName");

  const searchInput = document.getElementById("searchInput");
  const searchResults = document.getElementById("searchResults");
  const searchDropdown = document.getElementById("searchDropdown");
  let searchTimeout = null;

  let viewedUserId = null;
  let viewedUserFollowStatus = "not_following";

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

  function safeSetImgSrc(src) {
    if (img) img.src = src;
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

  const STORAGE_KEY = "loggedInUserId";

  function parseFiniteNumber(x) {
    const n = Number(x);
    return Number.isFinite(n) ? n : null;
  }

  function getStoredUserId() {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      const n1 = s != null ? parseFiniteNumber(s) : null;
      if (n1 != null) return n1;

      const l = localStorage.getItem(STORAGE_KEY);
      const n2 = l != null ? parseFiniteNumber(l) : null;
      return n2;
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

  window.getCurrentUserId = function () {
    return getStoredUserId();
  };

  window.setLoggedInUser = setStoredUserId;

  // -----------------------------
  // Search dropdown
  // -----------------------------
  function showSearchDropdown() {
    if (!searchDropdown) return;
    searchDropdown.classList.remove("hidden");
    searchDropdown.style.display = "block";
  }

  function hideSearchDropdown() {
    if (!searchDropdown) return;
    searchDropdown.classList.add("hidden");
    searchDropdown.style.display = "none";
  }

  // -----------------------------
  // Follow dropdown popup
  // -----------------------------
  let activeFollowMenu = null;

  function closeFollowMenu() {
    if (activeFollowMenu) {
      activeFollowMenu.remove();
      activeFollowMenu = null;
    }
  }

  function positionFollowMenu(anchor, menu) {
    const rect = anchor.getBoundingClientRect();

    menu.style.position = "fixed";
    menu.style.top = `${rect.bottom + 10}px`;
    menu.style.left = `${Math.max(12, rect.left + rect.width / 2 - 160)}px`;

    const maxLeft = window.innerWidth - 12 - 320;
    const currentLeft = parseFloat(menu.style.left);
    if (currentLeft > maxLeft) {
      menu.style.left = `${Math.max(12, maxLeft)}px`;
    }
  }

  function openUserProfileFromList(user) {
    if (!user) return;

    closeFollowMenu();

    if (user.distinctName) {
      loadUserDataByHandle(user.distinctName);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("handle", user.distinctName);
      newUrl.searchParams.delete("id");
      window.history.replaceState({}, "", newUrl);
      return;
    }

    if (user.id != null) {
      loadUserDataById(user.id);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("id", user.id);
      newUrl.searchParams.delete("handle");
      window.history.replaceState({}, "", newUrl);
    }
  }

  function createFollowMenuItem(user) {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "follow-menu-item";
    item.setAttribute("role", "menuitem");
    item.tabIndex = 0;

    const avatar = document.createElement("img");
    avatar.className = "follow-menu-avatar";
    avatar.src = `/api/users/${user.id}/profile-picture`;
    avatar.alt = user.displayName || user.distinctName || "User";
    avatar.onerror = function () {
      this.onerror = null;
      this.src = defaultAvatarDataUri();
    };

    const info = document.createElement("div");
    info.className = "follow-menu-info";

    const name = document.createElement("div");
    name.className = "follow-menu-name";
    name.textContent = user.displayName || user.name || user.distinctName || "Unknown User";

    const distinct = document.createElement("div");
    distinct.className = "follow-menu-distinct";
    distinct.textContent = user.distinctName ? `@${user.distinctName}` : "";

    info.appendChild(name);
    info.appendChild(distinct);

    item.appendChild(avatar);
    item.appendChild(info);

    item.addEventListener("click", (e) => {
      e.stopPropagation();
      openUserProfileFromList(user);
    });

    // Keyboard support: Enter / Space activates the item
    item.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        item.click();
      }
    });

    return item;
  }

  function showFollowMenu(anchor, users, title) {
    closeFollowMenu();

    const menu = document.createElement("div");
    menu.className = "follow-menu-dropdown";
    menu.setAttribute("role", "menu");
    menu.setAttribute("tabindex", "-1");

    const header = document.createElement("div");
    header.className = "follow-menu-header";
    header.textContent = title;

    const content = document.createElement("div");
    content.className = "follow-menu-content";

    if (!users || users.length === 0) {
      const empty = document.createElement("div");
      empty.className = "follow-menu-empty";
      // freundlicher deutscher Text
      empty.textContent = "Keine Nutzer gefunden";
      content.appendChild(empty);
    } else {
      users.forEach((user) => {
        content.appendChild(createFollowMenuItem(user));
      });
    }

    menu.appendChild(header);
    menu.appendChild(content);
    document.body.appendChild(menu);

    positionFollowMenu(anchor, menu);
    // damit resize/positionierung weiß, wo das Menü verankert ist
    menu._anchorEl = anchor;
    // Klasse für CSS-Animation (Einblenden / Hebung)
    menu.classList.add("follow-menu-open");
    // Fokus auf das Menü (so können Tasten wie Escape wirken)
    try {
      menu.focus();
      // Fokus auf erstes Element, falls vorhanden
      const firstItem = menu.querySelector(".follow-menu-item");
      if (firstItem) firstItem.focus();
    } catch (e) {
      // ignore
    }

    // Keyboard: Escape schließt, Pfeiltasten bewegen Fokus innerhalb der Items
    menu.addEventListener("keydown", (ev) => {
      const items = Array.from(menu.querySelectorAll(".follow-menu-item"));
      const idx = items.indexOf(document.activeElement);
      if (ev.key === "Escape") {
        ev.preventDefault();
        closeFollowMenu();
        return;
      }
      if (ev.key === "ArrowDown") {
        ev.preventDefault();
        const next = items[Math.min(items.length - 1, Math.max(0, idx + 1))] || items[0];
        next?.focus();
      } else if (ev.key === "ArrowUp") {
        ev.preventDefault();
        const prev = items[Math.min(items.length - 1, Math.max(0, idx - 1))] || items[items.length - 1];
        prev?.focus();
      }
    });

    activeFollowMenu = menu;
  }

  window.addEventListener("resize", () => {
    if (activeFollowMenu) {
      const anchor = activeFollowMenu._anchorEl;
      if (anchor) positionFollowMenu(anchor, activeFollowMenu);
    }
  });

  document.addEventListener("click", (e) => {
    if (activeFollowMenu && !activeFollowMenu.contains(e.target)) {
      closeFollowMenu();
    }
  });

  // -----------------------------
  // Follow status
  // -----------------------------
  async function syncViewedUserFollowStatus() {
    const loggedInUserId = getStoredUserId();

    if (loggedInUserId == null || viewedUserId == null) {
      viewedUserFollowStatus = "not_following";
      return viewedUserFollowStatus;
    }

    if (String(loggedInUserId) === String(viewedUserId)) {
      viewedUserFollowStatus = "self";
      return viewedUserFollowStatus;
    }

    try {
      const result = await window.backend.getFollowStatus(loggedInUserId, viewedUserId);
      viewedUserFollowStatus = result?.status || "not_following";
      return viewedUserFollowStatus;
    } catch (err) {
      console.error("syncViewedUserFollowStatus failed", err);
      viewedUserFollowStatus = "not_following";
      return viewedUserFollowStatus;
    }
  }

  function getActionButtonLabel() {
    if (viewedUserFollowStatus === "following") return "Unfollow";
    if (viewedUserFollowStatus === "pending") return "Requested";
    return "Follow";
  }

  async function refreshProfileFollowState() {
    if (viewedUserId == null) return;

    try {
      await syncViewedUserFollowStatus();
      await renderActionButton();

      const followers = await window.backend.getFollowers(viewedUserId);
      const followings = await window.backend.getFollowings(viewedUserId);

      const followersCountEl = document.getElementById("followersCount");
      const followingCountEl = document.getElementById("followingCount");

      if (followersCountEl) {
        followersCountEl.textContent = String(Array.isArray(followers) ? followers.length : 0);
      }

      if (followingCountEl) {
        followingCountEl.textContent = String(Array.isArray(followings) ? followings.length : 0);
      }

      attachFollowCountMenus(followers, followings);
    } catch (err) {
      console.error("refreshProfileFollowState failed", err);
    }
  }

  // -----------------------------
  // QR helper for profile owner
  // -----------------------------
  async function initQrHelper() {
    const showBtn = document.getElementById('showQrBtn');
    const preview = document.getElementById('qrPreview');
    const img = document.getElementById('profileQrImg');
    const info = document.getElementById('profileQrInfo');

    const loggedInUserId = getStoredUserId();
    if (!loggedInUserId || viewedUserId == null || String(loggedInUserId) !== String(viewedUserId)) {
      // Not owner - hide button
      if (showBtn) showBtn.style.display = 'none';
      return;
    }

    if (showBtn) showBtn.style.display = 'inline-block';

    if (showBtn) {
      // remove previous listeners to avoid duplicate handlers
      try { showBtn.replaceWith(showBtn.cloneNode(true)); } catch (e) { /* ignore */ }
      const btn = document.getElementById('showQrBtn');
      if (!btn) return;

      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        console.debug('Show QR button clicked');
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Generating...';
        if (info) info.textContent = '';

        try {
          console.log('QR button clicked, checking auth...');
          
          if (!window.authService || !window.authService.apiCall) {
            console.warn('authService not available');
            if (info) info.textContent = 'Auth not available. Please login.';
            return;
          }

          // Use profile.js's own getStoredUserId() to get the currently logged in user
          const userId = getStoredUserId();
          console.log('Current userId from profile.js:', userId);
          
          if (!userId) {
            // Try to get from URL params for testing
            const urlParams = new URLSearchParams(window.location.search);
            const urlUserId = urlParams.get('userId');
            if (urlUserId) {
              console.log('Using userId from URL:', urlUserId);
              sessionStorage.setItem(STORAGE_KEY, urlUserId);
            } else {
              if (info) info.textContent = 'Please log in to generate QR code.';
              return;
            }
          }

          const finalUserId = getStoredUserId();
          console.log('Using userId for QR:', finalUserId);

          const res = await window.authService.apiCall('/api/qr/generate?userId=' + finalUserId);
          if (!res.ok) {
            console.warn('QR generate returned', res.status);
            if (info) info.textContent = res.status === 401 ? 'Please log in.' : 'Could not generate QR.';
            return;
          }

          const data = await res.json();
          const payload = encodeURIComponent(data.payload);
          const imageUrl = data.imageUrl || `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${payload}`;
          if (img) img.src = imageUrl;
          if (info) info.textContent = `User: ${data.username} (ID: ${data.userId})`;
          if (preview) preview.style.display = 'block';
        } catch (e) {
          console.error('showQr failed', e);
          if (info) info.textContent = 'Error generating QR.';
        } finally {
          btn.disabled = false;
          btn.textContent = originalText;
        }
      });
    }
  }

  function attachFollowCountMenus(followers, followings) {
    const followersCountEl = document.getElementById("followersCount");
    const followingCountEl = document.getElementById("followingCount");

    if (followersCountEl) {
      followersCountEl.style.cursor = "pointer";
      followersCountEl.onclick = (e) => {
        e.stopPropagation();
        showFollowMenu(followersCountEl, followers, "Followers");
        if (activeFollowMenu) activeFollowMenu._anchorEl = followersCountEl;
      };
    }

    if (followingCountEl) {
      followingCountEl.style.cursor = "pointer";
      followingCountEl.onclick = (e) => {
        e.stopPropagation();
        showFollowMenu(followingCountEl, followings, "Following");
        if (activeFollowMenu) activeFollowMenu._anchorEl = followingCountEl;
      };
    }
  }

  // -----------------------------
  // Init
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
      const n = parseFiniteNumber(userIdParam);
      if (n != null) loadUserDataById(n);
      else failUserLoad("Invalid id param");
      return;
    }

    const stored = getStoredUserId();
    if (stored != null) {
      loadUserDataById(stored);
      return;
    }

    loadUserDataById(1);
  })();

  function failUserLoad(reason) {
    console.error("User load failed:", reason);
    viewedUserId = null;
    viewedUserFollowStatus = "not_following";

    if (displayNameElement) displayNameElement.textContent = "User not found";
    if (distinctNameElement) distinctNameElement.textContent = "@unknown";
    safeSetImgSrc(defaultAvatarDataUri());

    const followersCountEl = document.getElementById("followersCount");
    const followingCountEl = document.getElementById("followingCount");
    const postsCountEl = document.getElementById("postsCount");

    if (followersCountEl) followersCountEl.textContent = "0";
    if (followingCountEl) followingCountEl.textContent = "0";
    if (postsCountEl) postsCountEl.textContent = "0";

    renderParties([]);
    renderActionButton().catch(() => {});
    closeFollowMenu();
  }

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
        failUserLoad(err?.message || err);
      });
  }

  function loadUserDataById(userId) {
    fetch(`/api/users/${encodeURIComponent(userId)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(updateUserProfile)
      .catch((err) => {
        console.error("Failed to load user by id:", err);
        failUserLoad(err?.message || err);
      });
  }

  async function updateUserProfile(user) {
    viewedUserId = user?.id ?? null;
    viewedUserFollowStatus = "not_following";
    closeFollowMenu();

    if (displayNameElement) {
      displayNameElement.textContent = user?.displayName || user?.name || "";
    }

    if (distinctNameElement) {
      distinctNameElement.textContent = user?.distinctName ? `@${user.distinctName}` : "";
    }

    if (!viewedUserId) {
      safeSetImgSrc(defaultAvatarDataUri());
    } else {
      const url = await tryImageUrls([`/api/users/${viewedUserId}/profile-picture`]);
      safeSetImgSrc(url || defaultAvatarDataUri());
    }

    await syncViewedUserFollowStatus();
    await renderActionButton();
    await loadUserParties().catch((e) => console.debug("loadUserParties failed", e));

    try {
      const followers = (await window.backend.getFollowers(viewedUserId)) || [];
      const followings = (await window.backend.getFollowings(viewedUserId)) || [];

      const followersCountEl = document.getElementById("followersCount");
      const followingCountEl = document.getElementById("followingCount");

      if (followersCountEl) {
        followersCountEl.textContent = String(Array.isArray(followers) ? followers.length : 0);
      }

      if (followingCountEl) {
        followingCountEl.textContent = String(Array.isArray(followings) ? followings.length : 0);
      }

      attachFollowCountMenus(followers, followings);
    } catch (err) {
      console.debug("load follow lists failed", err);
    }

    if (viewedUserId != null) {
      try {
        await refreshCreatedPartiesCount(viewedUserId);
      } catch (err) {
        console.debug("refreshCreatedPartiesCount failed", err);
      }
    }
    // Initialize QR helper (shows QR button for profile owner)
    try {
      await initQrHelper();
    } catch (e) {
      console.debug('initQrHelper failed', e);
    }
  }

  // -----------------------------
  // Counts / button
  // -----------------------------
  async function refreshCreatedPartiesCount(userId) {
    const postsCountEl = document.getElementById("postsCount");
    if (!postsCountEl) return;

    try {
      const parties = await window.backend.getPartiesByUser(userId);
      postsCountEl.textContent = String(Array.isArray(parties) ? parties.length : 0);
    } catch (err) {
      console.error("refreshCreatedPartiesCount failed", err);
      postsCountEl.textContent = "0";
    }
  }

  async function renderActionButton() {
    const container = document.getElementById("actionButton");
    if (!container) return;

    container.innerHTML = "";

    const loggedInUserId = getStoredUserId();
    const profileUserId = viewedUserId;

    if (profileUserId == null) return;

    if (loggedInUserId == null) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "edit-account-btn";
      btn.textContent = "Sign in with QR";
      btn.disabled = true;
      container.appendChild(btn);
      return;
    }

    if (String(loggedInUserId) === String(profileUserId)) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "edit-account-btn";

      const a = document.createElement("a");
      a.href = "../editProfile/editProfile.html";
      a.textContent = "Edit Account";
      a.style.color = "inherit";
      a.style.textDecoration = "none";

      btn.appendChild(a);
      container.appendChild(btn);
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "follow-action-main";
    btn.textContent = getActionButtonLabel();
    btn.disabled = viewedUserFollowStatus === "pending";
    container.appendChild(btn);

    btn.onclick = async (ev) => {
      ev.stopPropagation();
      btn.disabled = true;

      try {
        await syncViewedUserFollowStatus();

        if (viewedUserFollowStatus === "following") {
          const res = await window.backend.unfollowUser(profileUserId);
          if (!res?.ok) {
            console.warn("unfollow failed", res);
          }
        } else if (viewedUserFollowStatus === "not_following") {
          const res = await window.backend.followUser(profileUserId);
          if (!res?.ok) {
            console.warn("follow failed", res);
          }
        }

        await refreshProfileFollowState();
      } catch (err) {
        console.error("follow action failed", err);
      } finally {
        if (viewedUserFollowStatus !== "pending") {
          btn.disabled = false;
        }
      }
    };
  }

  // -----------------------------
  // Search
  // -----------------------------
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
          <div class="search-result-name">${u.displayName || u.name || u.distinctName || ""}</div>
          <div class="search-result-distinct-name">@${u.distinctName || ""}</div>
        </div>
      `;

      const action = document.createElement("div");
      action.className = "search-action";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "follow-toggle-btn";
      btn.textContent = "Loading...";
      btn.disabled = true;

      action.appendChild(btn);
      item.appendChild(action);

      (async () => {
        const current = getStoredUserId();

        if (current == null || String(current) === String(u.id)) {
          btn.textContent = "";
          btn.disabled = true;
          btn.style.visibility = "hidden";
          return;
        }

        try {
          let status = await window.backend.getFollowStatus(current, u.id);
          let statusValue = status?.status || "not_following";

          btn.textContent =
            statusValue === "following"
              ? "Unfollow"
              : statusValue === "pending"
              ? "Requested"
              : "Follow";

          btn.disabled = statusValue === "pending";
          btn.style.visibility = "visible";

          btn.addEventListener("click", async (ev) => {
            ev.stopPropagation();
            btn.disabled = true;

            try {
              status = await window.backend.getFollowStatus(current, u.id);
              statusValue = status?.status || "not_following";

              if (statusValue === "following") {
                const resp = await window.backend.unfollowUser(u.id);
                if (!resp?.ok) {
                  console.warn("unfollow failed", resp);
                }
              } else if (statusValue === "not_following") {
                const resp = await window.backend.followUser(u.id);
                if (!resp?.ok) {
                  console.warn("follow failed", resp);
                }
              }

              status = await window.backend.getFollowStatus(current, u.id);
              statusValue = status?.status || "not_following";

              btn.textContent =
                statusValue === "following"
                  ? "Unfollow"
                  : statusValue === "pending"
                  ? "Requested"
                  : "Follow";

              btn.disabled = statusValue === "pending";

              if (viewedUserId != null && String(viewedUserId) === String(u.id)) {
                await syncViewedUserFollowStatus();
                await refreshProfileFollowState();
              }
            } catch (err) {
              console.error("search follow toggle failed", err);
            } finally {
              if (btn.textContent !== "Requested") {
                btn.disabled = false;
              }
            }
          });
        } catch (err) {
          btn.textContent = "";
          btn.disabled = true;
          btn.style.visibility = "hidden";
        }
      })();

      item.addEventListener("click", () => {
        hideSearchDropdown();

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
      const res = await fetch(`/api/users?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      displaySearchResults(Array.isArray(data) ? data : []);
    } catch (e) {
      console.debug("performSearch failed", e);
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
  // Username dropdown
  // -----------------------------
  const usernameBtn = document.getElementById("usernameBtn");
  const usernameDropdown = document.getElementById("usernameDropdown");
  const usernameList = document.getElementById("usernameList");

  function closeUsernameDropdown() {
    if (!usernameDropdown) return;

    // If some element inside the dropdown currently has focus, move focus back to the button
    try {
      const active = document.activeElement;
      if (active && usernameDropdown.contains(active)) {
        // move focus to the toggle before hiding so we don't hide a focused element
        usernameBtn?.focus();
      }
    } catch (e) {
      // ignore focus errors
    }

    usernameDropdown.classList.add("hidden");
    // prefer inert if available (prevents focus); if not, set aria-hidden only after focus moved
    if ("inert" in usernameDropdown) {
      usernameDropdown.inert = true;
      usernameDropdown.setAttribute("aria-hidden", "true");
    } else {
      usernameDropdown.setAttribute("aria-hidden", "true");
    }
    usernameBtn?.setAttribute("aria-expanded", "false");
  }

  function openUsernameDropdown() {
    if (!usernameDropdown) return;
    // remove inert / aria-hidden and show
    if ("inert" in usernameDropdown) usernameDropdown.inert = false;
    usernameDropdown.classList.remove("hidden");
    usernameDropdown.setAttribute("aria-hidden", "false");
    usernameBtn?.setAttribute("aria-expanded", "true");

    // Focus first focusable item in the dropdown so keyboard users can start navigating
    try {
      const first = usernameList?.querySelector("button, [tabindex]:not([tabindex='-1'])");
      if (first) first.focus();
    } catch (e) {
      // ignore
    }
  }

  async function fetchUsersAll() {
    const res = await fetch("/api/users");
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

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
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

  if (usernameDropdown) {
    usernameDropdown.addEventListener("click", (e) => e.stopPropagation());
  }

  if (usernameBtn && usernameDropdown) {
    usernameBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = !usernameDropdown.classList.contains("hidden");
      if (isOpen) {
        closeUsernameDropdown();
        return;
      }

      try {
        const users = await fetchUsersAll();
        renderUsernameList(users);
      } catch (err) {
        console.error("Failed to fetch /api/users:", err);
        renderUsernameList([]);
      }

      openUsernameDropdown();
    });

    document.addEventListener("click", () => closeUsernameDropdown());
  }

  // -----------------------------
  // Parties
  // -----------------------------
  async function loadUserParties() {
    if (viewedUserId == null) {
      console.warn("loadUserParties: no viewedUserId");
      renderParties([]);
      return;
    }

    try {
      const parties = await window.backend.getPartiesByUser(viewedUserId);
      renderParties(Array.isArray(parties) ? parties : []);
    } catch (err) {
      console.error("Failed to load user parties:", err);
      renderParties([]);
    }
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

    const loggedInUserId = getStoredUserId();
    const isOwnProfile =
      loggedInUserId != null &&
      viewedUserId != null &&
      String(loggedInUserId) === String(viewedUserId);

    parties.forEach((p) => {
      const node = template.content.cloneNode(true);

      const article = node.querySelector(".party-card");
      if (article && p.id != null) {
        article.dataset.id = p.id;
      }

      const nameEl = node.querySelector(".party-name");
      if (nameEl) {
        nameEl.textContent = p.title || p.name || "Party";
      }

      const infoValues = node.querySelectorAll(".info-value");
      if (infoValues[0]) infoValues[0].textContent = p.date || p.time_start?.split?.("T")?.[0] || "-";
      if (infoValues[1]) infoValues[1].textContent = p.time || p.time_start || "-";
      if (infoValues[2]) infoValues[2].textContent = p.location || p.place || p.address || "-";

      const extra = node.querySelector(".party-extra");
      const jsonPre = node.querySelector(".party-json");
      const detailsBtn = node.querySelector(".details-btn");

      if (jsonPre) {
        jsonPre.textContent = JSON.stringify(p, null, 2);
      }

      if (detailsBtn && extra) {
        detailsBtn.onclick = (e) => {
          e.stopPropagation();
          const hidden = extra.classList.contains("hidden");
          extra.classList.toggle("hidden", !hidden);
          extra.setAttribute("aria-hidden", String(!hidden));
          detailsBtn.setAttribute("aria-expanded", String(hidden));
        };
      }

      const deleteBtn = node.querySelector(".delete-btn");
      if (deleteBtn) {
        if (!isOwnProfile) {
          deleteBtn.style.display = "none";
        } else {
          deleteBtn.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm("Löschen?")) return;

            const res = await fetch(`/api/parties/${encodeURIComponent(p.id)}`, {
              method: "DELETE"
            });

            if (res.ok) {
              await loadUserParties();
              await refreshCreatedPartiesCount(viewedUserId);
            } else {
              console.error("Delete failed:", res.status);
            }
          };
        }
      }

      const editBtn = node.querySelector(".edit-btn");
      if (editBtn) {
        if (!isOwnProfile) {
          editBtn.style.display = "none";
        } else {
          editBtn.onclick = (e) => {
            e.stopPropagation();
            try {
              // mark editing intent and store party snapshot for the editor
              localStorage.setItem("editingParty", JSON.stringify(p));
              localStorage.setItem("editingFrom", "profile");
              if (p && p.id != null) localStorage.setItem("editingPartyId", String(p.id));
            } catch {}
            window.location.href = `/addParty/addParty.html?id=${encodeURIComponent(p.id)}`;
          };
        }
      }

      container.appendChild(node);
    });
  }

  // -----------------------------
  // Tabs
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

      if (name === "Partys" && viewedUserId != null) {
        loadUserParties().catch(() => {});
      }
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

    showTab("Partys");
  })();
});
