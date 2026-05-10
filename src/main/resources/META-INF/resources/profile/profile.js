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
  let activeFollowMenu = null;

  const STORAGE_KEY = "loggedInUserId";
  const AUTH_STORAGE_KEY = "partyhub_user_id";

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
    if (img) {
      img.src = src;
    }
  }

  async function tryImageUrls(urls, timeout = 2500) {
    for (const url of urls) {
      try {
        const ok = await new Promise((resolve) => {
          const testImage = new Image();

          const timer = setTimeout(() => {
            testImage.onload = null;
            testImage.onerror = null;
            resolve(false);
          }, timeout);

          testImage.onload = () => {
            clearTimeout(timer);
            resolve(true);
          };

          testImage.onerror = () => {
            clearTimeout(timer);
            resolve(false);
          };

          testImage.src = url;
        });

        if (ok) {
          return url;
        }
      } catch {
        // ignore
      }
    }

    return null;
  }

  function normalizeToArray(payload) {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (Array.isArray(payload?.data)) {
      return payload.data;
    }

    if (Array.isArray(payload?.items)) {
      return payload.items;
    }

    return [];
  }

  function parseFiniteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function getStoredUserId() {
    try {
      const sessionValue = sessionStorage.getItem(STORAGE_KEY);
      const sessionNumber =
        sessionValue != null ? parseFiniteNumber(sessionValue) : null;

      if (sessionNumber != null) {
        return sessionNumber;
      }

      const localValue = localStorage.getItem(STORAGE_KEY);
      const localNumber =
        localValue != null ? parseFiniteNumber(localValue) : null;

      if (localNumber != null) {
        return localNumber;
      }

      const authValue = localStorage.getItem(AUTH_STORAGE_KEY);
      return authValue != null ? parseFiniteNumber(authValue) : null;
    } catch {
      return null;
    }
  }

  function setStoredUserId(id) {
    try {
      if (id == null) {
        sessionStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
        return;
      }

      sessionStorage.setItem(STORAGE_KEY, String(id));
      localStorage.setItem(STORAGE_KEY, String(id));
      localStorage.setItem(AUTH_STORAGE_KEY, String(id));
    } catch {
      // ignore
    }
  }

  function getPartyHostId(party) {
    return (
      party.host_user?.id ??
      party.hostUser?.id ??
      party.host?.id ??
      party.host_user_id ??
      party.hostUserId ??
      party.user_id ??
      party.userId ??
      null
    );
  }

  function filterCreatedParties(parties, userId) {
    if (!Array.isArray(parties)) {
      return [];
    }

    return parties.filter((party) => {
      const hostId = getPartyHostId(party);
      return String(hostId) === String(userId);
    });
  }

  window.getCurrentUserId = function () {
    return getStoredUserId();
  };

  window.setLoggedInUser = setStoredUserId;

  // -----------------------------
  // Backend routes
  // -----------------------------
  function setupBackendApi() {
    const existingBackend = window.backend || {};

    window.backend = {
      ...existingBackend,

      async getFollowers(userId) {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}/followers`
        );

        if (!response.ok) {
          console.warn("getFollowers failed:", response.status);
          return [];
        }

        const data = await response.json().catch(() => []);
        return normalizeToArray(data);
      },

      async getFollowings(userId) {
        const response = await fetch(
          `/api/users/${encodeURIComponent(userId)}/following`
        );

        if (!response.ok) {
          console.warn("getFollowings failed:", response.status);
          return [];
        }

        const data = await response.json().catch(() => []);
        return normalizeToArray(data);
      },

      async getFollowStatus(currentUserId, targetUserId) {
        if (!currentUserId || !targetUserId) {
          return { status: "not_following" };
        }

        const response = await fetch(
          `/api/users/${encodeURIComponent(currentUserId)}/followers/${encodeURIComponent(targetUserId)}/status`
        );

        if (!response.ok) {
          console.warn("getFollowStatus failed:", response.status);
          return { status: "not_following" };
        }

        const isFollowing = await response.json().catch(() => false);

        if (isFollowing) {
          return { status: "following" };
        }

        const pendingResponse = await fetch(
          `/api/users/${encodeURIComponent(targetUserId)}/follow-requests`
        );

        if (pendingResponse.ok) {
          const pendingUsers = await pendingResponse.json().catch(() => []);

          if (
            Array.isArray(pendingUsers) &&
            pendingUsers.some((user) => String(user?.id) === String(currentUserId))
          ) {
            return { status: "pending" };
          }
        }

        return { status: "not_following" };
      },

      async followUser(targetUserId) {
        const currentUserId = getStoredUserId();

        if (!currentUserId || !targetUserId) {
          console.error("followUser: currentUserId oder targetUserId fehlt.");
          return { ok: false, status: 400 };
        }

        const response = await fetch(
          `/api/users/${encodeURIComponent(currentUserId)}/follow?targetUserId=${encodeURIComponent(targetUserId)}`,
          {
            method: "POST",
          }
        );

        if (response.status === 409) {
          return {
            ok: true,
            status: 409,
            alreadyRequested: true,
          };
        }

        return response;
      },

      async unfollowUser(targetUserId) {
        const currentUserId = getStoredUserId();

        if (!currentUserId || !targetUserId) {
          console.error("unfollowUser: currentUserId oder targetUserId fehlt.");
          return { ok: false, status: 400 };
        }

        return fetch(
          `/api/users/${encodeURIComponent(targetUserId)}/followers/${encodeURIComponent(currentUserId)}`,
          {
            method: "DELETE",
          }
        );
      },

      async getPartiesByUser(userId) {
        const response = await fetch(`/api/parties?user=${encodeURIComponent(userId)}`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache",
            "X-User-Id": String(userId),
          },
        });

        if (!response.ok) {
          console.warn("getPartiesByUser failed:", response.status);
          return [];
        }

        const data = await response.json().catch(() => []);
        return normalizeToArray(data);
      },
    };
  }

  setupBackendApi();

  // -----------------------------
  // Search dropdown
  // -----------------------------
  function showSearchDropdown() {
    if (!searchDropdown) {
      return;
    }

    searchDropdown.classList.remove("hidden");
    searchDropdown.style.display = "block";
  }

  function hideSearchDropdown() {
    if (!searchDropdown) {
      return;
    }

    searchDropdown.classList.add("hidden");
    searchDropdown.style.display = "none";
  }

  // -----------------------------
  // Follow dropdown popup
  // -----------------------------
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
    if (!user) {
      return;
    }

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
    name.textContent =
      user.displayName || user.name || user.distinctName || "Unknown User";

    const distinct = document.createElement("div");
    distinct.className = "follow-menu-distinct";
    distinct.textContent = user.distinctName ? `@${user.distinctName}` : "";

    info.appendChild(name);
    info.appendChild(distinct);

    item.appendChild(avatar);
    item.appendChild(info);

    item.addEventListener("click", (event) => {
      event.stopPropagation();
      openUserProfileFromList(user);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
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
      empty.textContent = "No users found";
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
    menu._anchorEl = anchor;
    menu.classList.add("follow-menu-open");

    try {
      menu.focus();

      const firstItem = menu.querySelector(".follow-menu-item");

      if (firstItem) {
        firstItem.focus();
      }
    } catch {
      // ignore
    }

    menu.addEventListener("keydown", (event) => {
      const items = Array.from(menu.querySelectorAll(".follow-menu-item"));
      const index = items.indexOf(document.activeElement);

      if (event.key === "Escape") {
        event.preventDefault();
        closeFollowMenu();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();

        const next =
          items[Math.min(items.length - 1, Math.max(0, index + 1))] || items[0];

        next?.focus();
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        const previous =
          items[Math.min(items.length - 1, Math.max(0, index - 1))] ||
          items[items.length - 1];

        previous?.focus();
      }
    });

    activeFollowMenu = menu;
  }

  window.addEventListener("resize", () => {
    if (activeFollowMenu) {
      const anchor = activeFollowMenu._anchorEl;

      if (anchor) {
        positionFollowMenu(anchor, activeFollowMenu);
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (activeFollowMenu && !activeFollowMenu.contains(event.target)) {
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
    } catch (error) {
      console.error("syncViewedUserFollowStatus failed", error);
      viewedUserFollowStatus = "not_following";
      return viewedUserFollowStatus;
    }
  }

  function getActionButtonLabel() {
    if (viewedUserFollowStatus === "following") {
      return "Unfollow";
    }

    if (viewedUserFollowStatus === "pending") {
      return "Requested";
    }

    return "Follow";
  }

  async function refreshProfileFollowState() {
    if (viewedUserId == null) {
      return;
    }

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
    } catch (error) {
      console.error("refreshProfileFollowState failed", error);
    }
  }

  function attachFollowCountMenus(followers, followings) {
    const followersCountEl = document.getElementById("followersCount");
    const followingCountEl = document.getElementById("followingCount");

    if (followersCountEl) {
      followersCountEl.style.cursor = "pointer";

      followersCountEl.onclick = (event) => {
        event.stopPropagation();
        showFollowMenu(followersCountEl, followers, "Followers");

        if (activeFollowMenu) {
          activeFollowMenu._anchorEl = followersCountEl;
        }
      };
    }

    if (followingCountEl) {
      followingCountEl.style.cursor = "pointer";

      followingCountEl.onclick = (event) => {
        event.stopPropagation();
        showFollowMenu(followingCountEl, followings, "Following");

        if (activeFollowMenu) {
          activeFollowMenu._anchorEl = followingCountEl;
        }
      };
    }
  }

  // -----------------------------
  // QR helper for profile owner
  // -----------------------------
  async function initQrHelper() {
    const showBtn = document.getElementById("showQrBtn");
    const preview = document.getElementById("qrPreview");
    const qrImg = document.getElementById("profileQrImg");
    const info = document.getElementById("profileQrInfo");

    const loggedInUserId = getStoredUserId();

    if (
      !loggedInUserId ||
      viewedUserId == null ||
      String(loggedInUserId) !== String(viewedUserId)
    ) {
      if (showBtn) {
        showBtn.style.display = "none";
      }

      return;
    }

    if (showBtn) {
      showBtn.style.display = "inline-block";
    }

    if (!showBtn) {
      return;
    }

    try {
      showBtn.replaceWith(showBtn.cloneNode(true));
    } catch {
      // ignore
    }

    const btn = document.getElementById("showQrBtn");

    if (!btn) {
      return;
    }

    btn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      btn.disabled = true;

      const originalText = btn.textContent;
      btn.textContent = "Generating...";

      if (info) {
        info.textContent = "";
      }

      try {
        if (!window.authService || !window.authService.apiCall) {
          if (info) {
            info.textContent = "Auth not available. Please login.";
          }

          return;
        }

        let userId = getStoredUserId();

        if (!userId) {
          const urlParams = new URLSearchParams(window.location.search);
          const urlUserId = urlParams.get("userId");

          if (urlUserId) {
            sessionStorage.setItem(STORAGE_KEY, urlUserId);
            userId = getStoredUserId();
          } else {
            if (info) {
              info.textContent = "Please log in to generate QR code.";
            }

            return;
          }
        }

        const response = await window.authService.apiCall(
          `/api/qr/generate?userId=${encodeURIComponent(userId)}`
        );

        if (!response.ok) {
          if (info) {
            info.textContent =
              response.status === 401 ? "Please log in." : "Could not generate QR.";
          }

          return;
        }

        const data = await response.json();
        const payload = encodeURIComponent(data.payload);
        const imageUrl =
          data.imageUrl ||
          `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${payload}`;

        if (qrImg) {
          qrImg.src = imageUrl;
        }

        if (info) {
          info.textContent = `User: ${data.username} (ID: ${data.userId})`;
        }

        if (preview) {
          preview.style.display = "block";
        }
      } catch (error) {
        console.error("showQr failed", error);

        if (info) {
          info.textContent = "Error generating QR.";
        }
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  // -----------------------------
  // Init profile load
  // -----------------------------
  function initProfileLoad() {
    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get("handle");
    const userIdParam = urlParams.get("id");

    if (userHandle) {
      loadUserDataByHandle(userHandle);
      return;
    }

    if (userIdParam) {
      const number = parseFiniteNumber(userIdParam);

      if (number != null) {
        loadUserDataById(number);
      } else {
        failUserLoad("Invalid id param");
      }

      return;
    }

    const stored = getStoredUserId();

    if (stored != null) {
      loadUserDataById(stored);
      return;
    }

    loadUserDataById(1);
  }

  function failUserLoad(reason) {
    console.error("User load failed:", reason);

    viewedUserId = null;
    viewedUserFollowStatus = "not_following";

    if (displayNameElement) {
      displayNameElement.textContent = "User not found";
    }

    if (distinctNameElement) {
      distinctNameElement.textContent = "@unknown";
    }

    safeSetImgSrc(defaultAvatarDataUri());

    const followersCountEl = document.getElementById("followersCount");
    const followingCountEl = document.getElementById("followingCount");
    const postsCountEl = document.getElementById("postsCount");

    if (followersCountEl) {
      followersCountEl.textContent = "0";
    }

    if (followingCountEl) {
      followingCountEl.textContent = "0";
    }

    if (postsCountEl) {
      postsCountEl.textContent = "0";
    }

    renderParties([]);
    renderActionButton().catch(() => {});
    closeFollowMenu();
  }

  // -----------------------------
  // Load user
  // -----------------------------
  function loadUserDataByHandle(userHandle) {
    fetch(`/api/users/handle/${encodeURIComponent(userHandle)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then(updateUserProfile)
      .catch((error) => {
        console.error("Failed to load user by handle:", error);
        failUserLoad(error?.message || error);
      });
  }

  function loadUserDataById(userId) {
    fetch(`/api/users/${encodeURIComponent(userId)}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        return response.json();
      })
      .then(updateUserProfile)
      .catch((error) => {
        console.error("Failed to load user by id:", error);
        failUserLoad(error?.message || error);
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
      distinctNameElement.textContent = user?.distinctName
        ? `@${user.distinctName}`
        : "";
    }

    if (!viewedUserId) {
      safeSetImgSrc(defaultAvatarDataUri());
    } else {
      const profilePictureUrl = await tryImageUrls([
        `/api/users/${viewedUserId}/profile-picture`,
      ]);

      safeSetImgSrc(profilePictureUrl || defaultAvatarDataUri());
    }

    await syncViewedUserFollowStatus();
    await renderActionButton();

    await loadUserParties().catch((error) => {
      console.debug("loadUserParties failed", error);
    });

    try {
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
    } catch (error) {
      console.debug("load follow lists failed", error);
    }

    if (viewedUserId != null) {
      try {
        await refreshCreatedPartiesCount(viewedUserId);
      } catch (error) {
        console.debug("refreshCreatedPartiesCount failed", error);
      }
    }

    try {
      await initQrHelper();
    } catch (error) {
      console.debug("initQrHelper failed", error);
    }
  }

  // -----------------------------
  // Counts / button
  // -----------------------------
  async function refreshCreatedPartiesCount(userId) {
    const postsCountEl = document.getElementById("postsCount");

    if (!postsCountEl) {
      return;
    }

    try {
      const parties = await window.backend.getPartiesByUser(userId);
      const ownParties = filterCreatedParties(parties, userId);

      postsCountEl.textContent = String(ownParties.length);
    } catch (error) {
      console.error("refreshCreatedPartiesCount failed", error);
      postsCountEl.textContent = "0";
    }
  }

  async function renderActionButton() {
    const container = document.getElementById("actionButton");

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const loggedInUserId = getStoredUserId();
    const profileUserId = viewedUserId;

    if (profileUserId == null) {
      return;
    }

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

      const link = document.createElement("a");
      link.href = "../editProfile/editProfile.html";
      link.textContent = "Edit Account";
      link.style.color = "inherit";
      link.style.textDecoration = "none";

      btn.appendChild(link);
      container.appendChild(btn);
      return;
    }

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "follow-action-main";
    btn.textContent = getActionButtonLabel();
    btn.disabled = viewedUserFollowStatus === "pending";
    container.appendChild(btn);

    btn.onclick = async (event) => {
      event.stopPropagation();
      btn.disabled = true;

      try {
        await syncViewedUserFollowStatus();

        if (viewedUserFollowStatus === "following") {
          const response = await window.backend.unfollowUser(profileUserId);

          if (!response?.ok) {
            console.warn("unfollow failed", response);
          } else {
            viewedUserFollowStatus = "not_following";
          }

          await refreshProfileFollowState();
          return;
        }

        if (viewedUserFollowStatus === "not_following") {
          const response = await window.backend.followUser(profileUserId);

          if (response?.alreadyRequested) {
            viewedUserFollowStatus = "pending";
          } else if (!response?.ok) {
            console.warn("follow failed", response);
          } else {
            viewedUserFollowStatus = "pending";
          }

          await renderActionButton();
          return;
        }
      } catch (error) {
        console.error("follow action failed", error);
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
    if (!searchResults) {
      return;
    }

    if (!results || results.length === 0) {
      hideSearchDropdown();
      return;
    }

    searchResults.innerHTML = "";

    results.forEach((user) => {
      const item = document.createElement("div");
      item.className = "search-result-item";

      item.innerHTML = `
        <img src="/api/users/${user.id}/profile-picture" class="search-result-avatar"
             onerror="this.onerror=null;this.src='${defaultAvatarDataUri()}';">
        <div class="search-result-info">
          <div class="search-result-name">${user.displayName || user.name || user.distinctName || ""}</div>
          <div class="search-result-distinct-name">@${user.distinctName || ""}</div>
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

      setupSearchFollowButton(btn, user);

      item.addEventListener("click", () => {
        hideSearchDropdown();

        if (user.distinctName) {
          loadUserDataByHandle(user.distinctName);

          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("handle", user.distinctName);
          newUrl.searchParams.delete("id");
          window.history.replaceState({}, "", newUrl);
        } else if (user.id != null) {
          loadUserDataById(user.id);

          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set("id", user.id);
          newUrl.searchParams.delete("handle");
          window.history.replaceState({}, "", newUrl);
        }
      });

      searchResults.appendChild(item);
    });

    showSearchDropdown();
  }

  async function setupSearchFollowButton(btn, user) {
    const currentUserId = getStoredUserId();

    if (currentUserId == null || String(currentUserId) === String(user.id)) {
      btn.textContent = "";
      btn.disabled = true;
      btn.style.visibility = "hidden";
      return;
    }

    try {
      let status = await window.backend.getFollowStatus(currentUserId, user.id);
      let statusValue = status?.status || "not_following";

      btn.textContent =
        statusValue === "following"
          ? "Unfollow"
          : statusValue === "pending"
          ? "Requested"
          : "Follow";

      btn.disabled = statusValue === "pending";
      btn.style.visibility = "visible";

      btn.addEventListener("click", async (event) => {
        event.stopPropagation();
        btn.disabled = true;

        try {
          status = await window.backend.getFollowStatus(currentUserId, user.id);
          statusValue = status?.status || "not_following";

          if (statusValue === "following") {
            const response = await window.backend.unfollowUser(user.id);

            if (!response?.ok) {
              console.warn("unfollow failed", response);
            } else {
              statusValue = "not_following";
            }
          } else if (statusValue === "not_following") {
            const response = await window.backend.followUser(user.id);

            if (response?.alreadyRequested) {
              statusValue = "pending";
            } else if (!response?.ok) {
              console.warn("follow failed", response);
            } else {
              statusValue = "pending";
            }
          }

          btn.textContent =
            statusValue === "following"
              ? "Unfollow"
              : statusValue === "pending"
              ? "Requested"
              : "Follow";

          btn.disabled = statusValue === "pending";

          if (viewedUserId != null && String(viewedUserId) === String(user.id)) {
            viewedUserFollowStatus = statusValue;
            await renderActionButton();
          }
        } catch (error) {
          console.error("search follow toggle failed", error);
        } finally {
          if (btn.textContent !== "Requested") {
            btn.disabled = false;
          }
        }
      });
    } catch (error) {
      btn.textContent = "";
      btn.disabled = true;
      btn.style.visibility = "hidden";
    }
  }

  async function performSearch(query) {
    try {
      const response = await fetch(`/api/users?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      displaySearchResults(Array.isArray(data) ? data : []);
    } catch (error) {
      console.debug("performSearch failed", error);
      hideSearchDropdown();
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      const query = event.target.value.trim();

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

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
    if (!usernameDropdown) {
      return;
    }

    try {
      const active = document.activeElement;

      if (active && usernameDropdown.contains(active)) {
        usernameBtn?.focus();
      }
    } catch {
      // ignore
    }

    usernameDropdown.classList.add("hidden");

    if ("inert" in usernameDropdown) {
      usernameDropdown.inert = true;
      usernameDropdown.setAttribute("aria-hidden", "true");
    } else {
      usernameDropdown.setAttribute("aria-hidden", "true");
    }

    usernameBtn?.setAttribute("aria-expanded", "false");
  }

  function openUsernameDropdown() {
    if (!usernameDropdown) {
      return;
    }

    if ("inert" in usernameDropdown) {
      usernameDropdown.inert = false;
    }

    usernameDropdown.classList.remove("hidden");
    usernameDropdown.setAttribute("aria-hidden", "false");
    usernameBtn?.setAttribute("aria-expanded", "true");

    try {
      const first = usernameList?.querySelector(
        "button, [tabindex]:not([tabindex='-1'])"
      );

      if (first) {
        first.focus();
      }
    } catch {
      // ignore
    }
  }

  async function fetchUsersAll() {
    const response = await fetch("/api/users");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json().catch(() => null);
    return normalizeToArray(data);
  }

  function renderUsernameList(users) {
    if (!usernameList) {
      return;
    }

    usernameList.innerHTML = "";

    users.forEach((user) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "username-item";
      btn.innerHTML = `<span>@${user.distinctName || user.displayName || user.id}</span>`;

      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        closeUsernameDropdown();

        setStoredUserId(user.id);
        loadUserDataById(user.id);

        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", user.id);
        newUrl.searchParams.delete("handle");
        window.history.replaceState({}, "", newUrl);
      });

      usernameList.appendChild(btn);
    });
  }

  if (usernameDropdown) {
    usernameDropdown.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  if (usernameBtn && usernameDropdown) {
    usernameBtn.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();

      const isOpen = !usernameDropdown.classList.contains("hidden");

      if (isOpen) {
        closeUsernameDropdown();
        return;
      }

      try {
        const users = await fetchUsersAll();
        renderUsernameList(users);
      } catch (error) {
        console.error("Failed to fetch /api/users:", error);
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
      const ownParties = filterCreatedParties(parties, viewedUserId);

      console.log("All loaded parties:", parties);
      console.log("Only parties created by user", viewedUserId, ownParties);

      renderParties(ownParties);
    } catch (error) {
      console.error("Failed to load user parties:", error);
      renderParties([]);
    }
  }

  function renderParties(parties) {
    const container = document.getElementById("partiesContainer");
    const template = document.getElementById("party-template");
    const noMsg = document.querySelector("#tabContentParties .no-parties");

    if (!container || !template) {
      return;
    }

    container.innerHTML = "";

    if (!parties || parties.length === 0) {
      if (noMsg) {
        noMsg.style.display = "block";
      }

      return;
    }

    if (noMsg) {
      noMsg.style.display = "none";
    }

    const loggedInUserId = getStoredUserId();
    const isOwnProfile =
      loggedInUserId != null &&
      viewedUserId != null &&
      String(loggedInUserId) === String(viewedUserId);

    parties.forEach((party) => {
      const node = template.content.cloneNode(true);

      const article = node.querySelector(".party-card");

      if (article && party.id != null) {
        article.dataset.id = party.id;
      }

      const nameEl = node.querySelector(".party-name");

      if (nameEl) {
        nameEl.textContent = party.title || party.name || "Party";
      }

      const infoValues = node.querySelectorAll(".info-value");

      if (infoValues[0]) {
        infoValues[0].textContent =
          party.date || party.time_start?.split?.("T")?.[0] || "-";
      }

      if (infoValues[1]) {
        infoValues[1].textContent = party.time || party.time_start || "-";
      }

      if (infoValues[2]) {
        infoValues[2].textContent =
          party.location_address ||
          party.locationAddress ||
          party.location_adress ||
          party.locationAdress ||
          party.location ||
          party.place ||
          party.address ||
          party.adress ||
          "-";
      }

      const extra = node.querySelector(".party-extra");
      const jsonPre = node.querySelector(".party-json");
      const detailsBtn = node.querySelector(".details-btn");

      if (jsonPre) {
        jsonPre.textContent = JSON.stringify(party, null, 2);
      }

      if (detailsBtn && extra) {
        detailsBtn.onclick = (event) => {
          event.stopPropagation();

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
          deleteBtn.onclick = async (event) => {
            event.stopPropagation();

            if (!confirm("Delete?")) {
              return;
            }

            const response = await fetch(`/api/parties/${encodeURIComponent(party.id)}`, {
              method: "DELETE",
            });

            if (response.ok) {
              await loadUserParties();
              await refreshCreatedPartiesCount(viewedUserId);
            } else {
              console.error("Delete failed:", response.status);
            }
          };
        }
      }

      const editBtn = node.querySelector(".edit-btn");

      if (editBtn) {
        if (!isOwnProfile) {
          editBtn.style.display = "none";
        } else {
          editBtn.onclick = (event) => {
            event.stopPropagation();

            try {
              localStorage.setItem("editingParty", JSON.stringify(party));
              localStorage.setItem("editingFrom", "profile");

              if (party && party.id != null) {
                localStorage.setItem("editingPartyId", String(party.id));
              }
            } catch {
              // ignore
            }

            window.location.href = `/addParty/addParty.html?id=${encodeURIComponent(party.id)}`;
          };
        }
      }

      container.appendChild(node);
    });
  }

  // -----------------------------
  // Tabs
  // -----------------------------
  function initTabs() {
    const ids = ["Parties", "Posts", "Favorites"];

    function showTab(name) {
      ids.forEach((key) => {
        const btn = document.getElementById(`tab${key}`);
        const section = document.getElementById(`tabContent${key}`);

        if (btn) {
          btn.classList.toggle("active", key === name);
        }

        if (section) {
          section.style.display = key === name ? "block" : "none";
        }
      });

      if (name === "Parties" && viewedUserId != null) {
        loadUserParties().catch(() => {});
      }
    }

    ids.forEach((key) => {
      const btn = document.getElementById(`tab${key}`);

      if (!btn) {
        return;
      }

      btn.setAttribute("type", "button");

      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        showTab(key);
      });

      btn.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          btn.click();
        }
      });
    });

    showTab("Parties");
  }

  initTabs();
  initProfileLoad();
});
