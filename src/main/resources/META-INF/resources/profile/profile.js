document.addEventListener("DOMContentLoaded", async function () {
  // Check authentication first - redirect to Keycloak if not authenticated
  try {
    const authResponse = await fetch("/api/auth/status", {
      credentials: "include"
    });
    const authData = await authResponse.json();

    if (!authData.authenticated) {
      // Redirect to login endpoint to trigger Keycloak authentication
      window.location.href = "/api/auth/login";
      return;
    }
  } catch (error) {
    console.error("Auth check failed:", error);
    // Redirect to login on error
    window.location.href = "/api/auth/login";
    return;
  }

  const img = document.getElementById("profileImg");
  const displayNameElement = document.getElementById("displayName");
  const distinctNameElement = document.getElementById("distinctName");
  let currentUserId = null;
  let isViewingOwnProfile = false;
  let viewedUserId = null;
  let relationshipStatus = null;
  let currentTab = "tabPartys";
  let currentFriendsView = "followers";

  if (!img) return;

  async function tryImageUrls(urls, timeout = 5000) {
    for (const url of urls) {
      try {
        const loaded = await new Promise((resolve) => {
          const testImg = new Image();
          const timer = setTimeout(() => resolve(false), timeout);
          testImg.onload = () => {
            clearTimeout(timer);
            resolve(true);
          };
          testImg.onerror = () => {
            clearTimeout(timer);
            resolve(false);
          };
          testImg.src = url;
        });
        if (loaded) return url;
      } catch (e) {}
    }
    return null;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const userHandle = urlParams.get("handle");
  const userId = urlParams.get("id");

  if (userHandle) {
    loadUserDataByHandle(userHandle);
  } else if (userId) {
    loadUserDataById(userId);
  } else {
    isViewingOwnProfile = true;
    loadCurrentUserData();
  }

  window.addEventListener("userChanged", function (event) {
    if (event.detail && event.detail.id) {
      const newUser = event.detail;
      currentUserId = newUser.id;
      isViewingOwnProfile = true;

      updateUserProfile(newUser);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("id", newUser.id);
      newUrl.searchParams.delete("handle");
      window.history.replaceState({}, "", newUrl);

      if (window.ToastManager) {
        window.ToastManager.success(`Switched to @${newUser.distinctName}`);
      }
    }
  });

  async function loadCurrentUserData() {
    try {
      const response = await fetch("/api/user-context/current");
      if (response.ok) {
        const userData = await response.json();
        currentUserId = userData.id;
        isViewingOwnProfile = true;
        updateUserProfile(userData);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", userData.id);
        window.history.replaceState({}, "", newUrl);
      } else {
        throw new Error("Failed to load current user");
      }
    } catch (error) {
      console.error("Failed to load current user data:", error);
      loadUserDataById(1);
    }
  }

  function loadUserDataByHandle(userHandle) {
    const userApiUrl = `/api/users/handle/${userHandle}`;
    fetch(userApiUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((userData) => {
        currentUserId = null;
        isViewingOwnProfile = false;
        viewedUserId = userData.id;
        disableTabsForOtherUser();
        updateUserProfile(userData);
      })
      .catch((error) => {
        console.error("Failed to load user data:", error);
        if (displayNameElement)
          displayNameElement.textContent = "User not found";
        if (distinctNameElement) distinctNameElement.textContent = "@unknown";
      });
  }

  function loadUserDataById(userId) {
    const userApiUrl = `/api/users/${userId}`;
    fetch(userApiUrl)
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((userData) => {
        fetch("/api/user-context/current")
          .then((r) => r.json())
          .then((context) => {
            currentUserId = context.id;
            isViewingOwnProfile = String(userId) === String(context.id);
            viewedUserId = userData.id;
            if (!isViewingOwnProfile) {
              disableTabsForOtherUser();
            }
            updateUserProfile(userData);
          })
          .catch(() => {
            currentUserId = null;
            isViewingOwnProfile = false;
            viewedUserId = userData.id;
            disableTabsForOtherUser();
            updateUserProfile(userData);
          });
      })
      .catch((error) => {
        console.error("Failed to load user data:", error);
        if (displayNameElement)
          displayNameElement.textContent = "User not found";
        if (distinctNameElement) distinctNameElement.textContent = "@unknown";
      });
  }

  function updateUserProfile(user) {
    currentUserId = user.id;

    img.src = `/api/users/${user.id}/profile-picture`;
    img.onerror = function () {
      this.onerror = null;
      this.src = "/images/default_profile-picture.jpg";
    };

    if (displayNameElement && user.displayName) {
      displayNameElement.textContent = user.displayName;
    }
    if (distinctNameElement && user.distinctName) {
      distinctNameElement.textContent = `@${user.distinctName}`;
    }

    if (isViewingOwnProfile) {
      loadUserStats(user.id);
      loadAttendingParties();
      loadMyParties();
      loadFriends();
      hideProfileActions();
    } else {
      loadUserStats(user.id);
      loadRelationshipStatus(user.id);
      // For other users' profiles, also update the edit link in case admin wants to edit
      updateEditProfileLink();
    }
  }

  function loadUserStats(userId) {
    const stats = [
      { key: "followers", id: "followersCount" },
      { key: "following", id: "followingCount" },
      { key: "media", id: "postsCount" },
    ];

    stats.forEach((stat) => {
      const el = document.getElementById(stat.id);
      if (!el) return;

      fetch(`/api/users/${userId}/${stat.key}/count`)
        .then((response) => {
          if (!response.ok) return { count: 0 };
          return response.json();
        })
        .then((data) => {
          const count = data.count !== undefined ? data.count : 0;
          el.textContent = formatCount(count);
        })
        .catch(() => {
          el.textContent = "0";
        });
    });
  }

  function formatCount(count) {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "M";
    if (count >= 1000) return (count / 1000).toFixed(1) + "K";
    return count.toString();
  }

  // ========== TAB 1: ATTENDING PARTIES ==========
  async function loadAttendingParties() {
    if (!currentUserId) return;

    const container = document.getElementById("attendingContainer");
    const template = document.getElementById("attending-template");
    const emptyState = document.getElementById("noAttendingState");

    if (!container || !template) return;

    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      const response = await fetch(`/api/users/${currentUserId}/attending`);
      if (!response.ok) throw new Error("Failed to load attending parties");

      const parties = await response.json();
      container.innerHTML = "";

      if (!parties || parties.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      parties.forEach((party) => {
        const card = createAttendingCard(party, template);
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading attending parties:", error);
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
    }
  }

  function createAttendingCard(party, template) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".attending-card");

    card.dataset.id = party.id;
    card.querySelector(".party-name").textContent =
      party.title || "Unnamed Party";

    const dateEl = card.querySelector(".party-date");
    const timeEl = card.querySelector(".party-time");
    const locationEl = card.querySelector(".party-location");

    if (party.time_start) {
      const date = new Date(party.time_start);
      dateEl.textContent = date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });
      timeEl.textContent = date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    locationEl.textContent =
      party.location?.address || party.location_address || "TBA";

    const viewBtn = card.querySelector(".view-party-btn");
    const cancelBtn = card.querySelector(".cancel-btn");

    viewBtn.addEventListener("click", () => {
      window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${party.id}`;
    });

    cancelBtn.addEventListener("click", async () => {
      if (!confirm("Cancel your attendance for this party?")) return;
      try {
        const res = await fetch(`/api/party/${party.id}/attend`, {
          method: "DELETE",
        });
        if (res.ok) {
          ToastManager.success("Attendance cancelled");
          loadAttendingParties();
        }
      } catch (e) {
        ToastManager.error("Failed to cancel attendance");
      }
    });

    return card;
  }

  // ========== TAB 2: MY PARTIES (MANAGEMENT) ==========
  async function loadMyParties() {
    if (!currentUserId) return;

    const container = document.getElementById("myPartiesContainer");
    const template = document.getElementById("my-party-template");
    const emptyState = document.getElementById("noMyPartiesState");

    if (!container || !template) return;

    container.innerHTML = '<div class="loading-spinner"></div>';

    try {
      let parties = [];

      if (
        typeof window.backend === "object" &&
        typeof window.backend.getPartiesByUser === "function"
      ) {
        try {
          parties = await window.backend.getPartiesByUser(currentUserId);
        } catch (e) {}
      }

      const res = await fetch(`/api/party?host_user_id=${currentUserId}`);
      if (res.ok) {
        parties = await res.json();
      }

      container.innerHTML = "";

      if (!parties || parties.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      parties.forEach((party) => {
        const card = createMyPartyCard(party, template);
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading my parties:", error);
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
    }
  }

  function createMyPartyCard(party, template) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".my-party-card");

    card.dataset.id = party.id;
    card.querySelector(".party-name").textContent =
      party.title || "Unnamed Party";

    const visibilityBadge = card.querySelector(".visibility-text");
    const visibilityIcon = card.querySelector(".visibility-icon");

    if (party.visibility === "private") {
      visibilityBadge.textContent = "Private";
      visibilityIcon.innerHTML = "";
    } else {
      visibilityBadge.textContent = "Public";
      visibilityIcon.innerHTML = "";
    }

    const dateEl = card.querySelector(".party-date");
    const attendeesEl = card.querySelector(".party-attendees");
    const locationEl = card.querySelector(".party-location");

    if (party.time_start) {
      const date = new Date(party.time_start);
      dateEl.textContent = date.toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
      });
    }

    attendeesEl.textContent = party.attendeeCount || party.users?.length || 0;
    locationEl.textContent =
      party.location?.address || party.location_address || "TBA";

    const manageBtn = card.querySelector(".manage-btn");
    const editBtn = card.querySelector(".edit-btn");
    const deleteBtn = card.querySelector(".delete-btn");

    manageBtn.addEventListener("click", () => {
      window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${party.id}`;
    });

    editBtn.addEventListener("click", () => {
      window.location.href = `/addParty/addParty.html?edit=${party.id}`;
    });

    deleteBtn.addEventListener("click", async () => {
      if (
        !confirm(
          "Are you sure you want to delete this party? This cannot be undone.",
        )
      )
        return;
      try {
        const res = await fetch(`/api/party/${party.id}`, { method: "DELETE" });
        if (res.ok) {
          ToastManager.success("Party deleted");
          loadMyParties();
        } else {
          throw new Error("Delete failed");
        }
      } catch (e) {
        ToastManager.error("Failed to delete party");
      }
    });

    return card;
  }

  // ========== TAB 3: FRIENDS/FOLLOWERS ==========
  async function loadFriends() {
    if (!currentUserId) return;

    if (currentFriendsView === "followers") {
      await loadFollowersList();
    } else {
      await loadFollowingList();
    }
  }

  async function loadFollowersList() {
    const container = document.getElementById("friendsContainer");
    const template = document.getElementById("friend-template");
    const emptyState = document.getElementById("noFriendsState");
    const emptyTitle = document.getElementById("noFriendsTitle");
    const emptyMessage = document.getElementById("noFriendsMessage");

    if (!container || !template) return;

    container.innerHTML = '<div class="loading-spinner"></div>';
    if (emptyTitle) emptyTitle.textContent = "No Followers";
    if (emptyMessage)
      emptyMessage.textContent =
        "You don't have any followers yet. Share your profile to connect with others!";

    try {
      const res = await fetch(`/api/users/${currentUserId}/followers`);
      if (!res.ok) throw new Error("Failed to load followers");

      const followers = await res.json();
      container.innerHTML = "";

      if (!followers || followers.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      followers.forEach((user) => {
        const card = createFriendCard(user, template, "follower");
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading followers:", error);
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
    }
  }

  async function loadFollowingList() {
    const container = document.getElementById("friendsContainer");
    const template = document.getElementById("friend-template");
    const emptyState = document.getElementById("noFriendsState");
    const emptyTitle = document.getElementById("noFriendsTitle");
    const emptyMessage = document.getElementById("noFriendsMessage");

    if (!container || !template) return;

    container.innerHTML = '<div class="loading-spinner"></div>';
    if (emptyTitle) emptyTitle.textContent = "Not Following Anyone";
    if (emptyMessage)
      emptyMessage.textContent =
        "You're not following anyone yet. Discover users and connect with them!";

    try {
      const res = await fetch(`/api/users/${currentUserId}/following`);
      if (!res.ok) throw new Error("Failed to load following");

      const following = await res.json();
      container.innerHTML = "";

      if (!following || following.length === 0) {
        if (emptyState) emptyState.style.display = "flex";
        return;
      }

      if (emptyState) emptyState.style.display = "none";

      following.forEach((user) => {
        const card = createFriendCard(user, template, "following");
        container.appendChild(card);
      });
    } catch (error) {
      console.error("Error loading following:", error);
      container.innerHTML = "";
      if (emptyState) emptyState.style.display = "flex";
    }
  }

  function createFriendCard(user, template, type) {
    const clone = template.content.cloneNode(true);
    const card = clone.querySelector(".friend-card");

    card.dataset.id = user.id;

    const avatar = card.querySelector(".friend-avatar");
    avatar.src = `/api/users/${user.id}/profile-picture`;
    avatar.onerror = () => {
      avatar.src = "/images/default_profile-picture.jpg";
    };
    avatar.alt = user.displayName || user.distinctName;

    card.querySelector(".friend-name").textContent =
      user.displayName || user.distinctName;
    card.querySelector(".friend-handle").textContent = `@${user.distinctName}`;

    const viewBtn = card.querySelector(".view-profile-btn");
    const unfollowBtn = card.querySelector(".unfollow-btn");
    const removeBtn = card.querySelector(".remove-follower-btn");

    viewBtn.addEventListener("click", () => {
      window.location.href = `/profile/profile.html?handle=${user.distinctName}`;
    });

    if (type === "following") {
      unfollowBtn.style.display = "flex";
      unfollowBtn.addEventListener("click", async () => {
        try {
          const res = await fetch(
            `/api/users/${user.id}/followers/${currentUserId}`,
            {
              method: "DELETE",
            },
          );
          if (res.ok) {
            ToastManager.success(`Unfollowed @${user.distinctName}`);
            loadFollowingList();
          }
        } catch (e) {
          ToastManager.error("Failed to unfollow");
        }
      });
    } else {
      removeBtn.style.display = "flex";
      removeBtn.addEventListener("click", async () => {
        if (!confirm(`Remove @${user.distinctName} from your followers?`))
          return;
        try {
          const res = await fetch(
            `/api/users/${currentUserId}/followers/${user.id}`,
            {
              method: "DELETE",
            },
          );
          if (res.ok) {
            ToastManager.success("Follower removed");
            loadFollowersList();
          }
        } catch (e) {
          ToastManager.error("Failed to remove follower");
        }
      });
    }

    return card;
  }

  // ========== TAB SWITCHING ==========
  function switchTab(tabId) {
    currentTab = tabId;

    document
      .querySelectorAll(".tab-btn")
      .forEach((btn) => btn.classList.remove("active"));
    document.getElementById(tabId).classList.add("active");

    document.querySelectorAll(".tab-section").forEach((section) => {
      section.style.display = "none";
    });

    const contentId = tabId.replace("tab", "tabContent");
    const contentSection = document.getElementById(contentId);
    if (contentSection) {
      contentSection.style.display = "block";
    }

    if (tabId === "tabPartys") {
      loadAttendingParties();
    } else if (tabId === "tabPosts") {
      loadMyParties();
    } else if (tabId === "tabFavorites") {
      loadFriends();
    }
  }

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!isViewingOwnProfile) return;
      switchTab(btn.id);
    });
  });

  // Friends sub-tabs
  const showFollowersBtn = document.getElementById("showFollowersBtn");
  const showFollowingBtn = document.getElementById("showFollowingBtn");

  if (showFollowersBtn) {
    showFollowersBtn.addEventListener("click", () => {
      currentFriendsView = "followers";
      showFollowersBtn.classList.add("active");
      showFollowingBtn.classList.remove("active");
      loadFollowersList();
    });
  }

  if (showFollowingBtn) {
    showFollowingBtn.addEventListener("click", () => {
      currentFriendsView = "following";
      showFollowingBtn.classList.add("active");
      showFollowersBtn.classList.remove("active");
      loadFollowingList();
    });
  }

  function disableTabsForOtherUser() {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.style.opacity = "0.5";
      btn.style.pointerEvents = "none";
    });
  }

  // ========== EXISTING FUNCTIONS ==========
  function loadFollowersListOld(userId) {
    const modal = document.getElementById("userListModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalUserList = document.getElementById("modalUserList");
    const modalLoading = document.getElementById("modalLoading");
    const modalEmpty = document.getElementById("modalEmpty");

    modalTitle.textContent = "Followers";
    modalUserList.innerHTML = "";
    modalLoading.style.display = "flex";
    modalEmpty.style.display = "none";
    modal.classList.remove("hidden");

    fetch(`/api/users/${userId}/followers`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load followers");
        return response.json();
      })
      .then((data) => {
        modalLoading.style.display = "none";
        const followers = data.followers || data || [];
        modalUserList.innerHTML = "";

        if (followers.length === 0) {
          modalEmpty.style.display = "flex";
          return;
        }

        followers.forEach((user) => {
          const item = createModalUserItem(user);
          modalUserList.appendChild(item);
        });
      })
      .catch((error) => {
        console.error("Error loading followers:", error);
        modalLoading.style.display = "none";
        modalEmpty.style.display = "flex";
      });
  }

  function loadFollowingListOld(userId) {
    const modal = document.getElementById("userListModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalUserList = document.getElementById("modalUserList");
    const modalLoading = document.getElementById("modalLoading");
    const modalEmpty = document.getElementById("modalEmpty");

    modalTitle.textContent = "Following";
    modalUserList.innerHTML = "";
    modalLoading.style.display = "flex";
    modalEmpty.style.display = "none";
    modal.classList.remove("hidden");

    fetch(`/api/users/${userId}/following`)
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load following");
        return response.json();
      })
      .then((data) => {
        modalLoading.style.display = "none";
        const following = data.following || data || [];
        modalUserList.innerHTML = "";

        if (following.length === 0) {
          modalEmpty.style.display = "flex";
          return;
        }

        following.forEach((user) => {
          const item = createModalUserItem(user);
          modalUserList.appendChild(item);
        });
      })
      .catch((error) => {
        console.error("Error loading following:", error);
        modalLoading.style.display = "none";
        modalEmpty.style.display = "flex";
      });
  }

  function createModalUserItem(user) {
    const item = document.createElement("div");
    item.className = "modal-user-item";
    item.innerHTML = `
            <img src="/api/users/${user.id}/profile-picture" class="modal-user-avatar" onerror="this.src='/images/default_profile-picture.jpg'" alt="${escapeHtml(user.displayName || user.distinctName)}">
            <div class="modal-user-info">
                <span class="modal-user-name">${escapeHtml(user.displayName || user.distinctName)}</span>
                <span class="modal-user-handle">@${escapeHtml(user.distinctName)}</span>
            </div>
        `;
    item.addEventListener("click", () => {
      window.location.href = `/profile/profile.html?handle=${user.distinctName}`;
      closeModal();
    });
    return item;
  }

  function closeModal() {
    const modal = document.getElementById("userListModal");
    modal.classList.add("hidden");
  }

  const searchInput = document.getElementById("searchInput");
  const searchDropdown = document.getElementById("searchDropdown");
  const searchResults = document.getElementById("searchResults");
  let searchTimeout;

  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const query = e.target.value.trim();
      if (searchTimeout) clearTimeout(searchTimeout);
      if (query === "") {
        if (searchDropdown) searchDropdown.classList.add("hidden");
        return;
      }
      searchTimeout = setTimeout(() => performSearch(query), 300);
    });
  }

  function performSearch(query) {
    fetch(`/api/users/all/search?name=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => displaySearchResults(data))
      .catch(() => {
        if (searchDropdown) searchDropdown.classList.add("hidden");
      });
  }

  function displaySearchResults(results) {
    if (!results || results.length === 0) {
      if (searchDropdown) searchDropdown.classList.add("hidden");
      return;
    }
    if (!searchResults) return;
    searchResults.innerHTML = "";
    results.forEach((user) => {
      const item = document.createElement("div");
      item.className = "search-result-item";
      item.innerHTML = `
                <img src="/api/users/${user.id}/profile-picture" class="search-result-avatar" onerror="this.src='/images/default_profile-picture.jpg'">
                <div class="search-result-info">
                    <div class="search-result-name">${user.displayName || user.distinctName}</div>
                    <div class="search-result-distinct-name">@${user.distinctName}</div>
                </div>
            `;
      item.addEventListener("click", () => {
        hideDropdown();
        try {
          setStoredUserId(user.id);
        } catch (e) {}
        loadUserDataByHandle(user.distinctName);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("handle", user.distinctName);
        newUrl.searchParams.delete("id");
        window.history.replaceState({}, "", newUrl);
      });
      searchResults.appendChild(item);
    });
    if (searchDropdown) searchDropdown.classList.remove("hidden");
  }

  function hideDropdown() {
    if (searchDropdown) {
      searchDropdown.classList.add("hidden");
      searchDropdown.setAttribute("aria-hidden", "true");
    }
  }

  const usernameBtn = document.getElementById("usernameBtn");
  const usernameDropdown = document.getElementById("usernameDropdown");
  const usernameList = document.getElementById("usernameList");

  if (usernameBtn && usernameDropdown) {
    usernameBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const isOpen = !usernameDropdown.classList.contains("hidden");
      if (isOpen) {
        usernameDropdown.classList.add("hidden");
        usernameDropdown.setAttribute("aria-hidden", "true");
        usernameBtn.setAttribute("aria-expanded", "false");
        return;
      }
      usernameBtn.setAttribute("aria-expanded", "true");
      usernameDropdown.setAttribute("aria-hidden", "false");

      try {
        const endpoints = ["/api/users", "/api/users/all"];
        let users = [];
        for (const url of endpoints) {
          try {
            const r = await fetch(url);
            if (!r.ok) continue;
            const d = await r.json().catch(() => null);
            if (!d) continue;
            users = Array.isArray(d) ? d : Array.isArray(d.data) ? d.data : [];
            if (users && users.length) break;
          } catch (err) {}
        }
        renderUsernameList(users || []);
      } catch (err) {
        renderUsernameList([]);
      }
      usernameDropdown.classList.remove("hidden");
    });
  }

  function renderUsernameList(users) {
    if (!usernameList) return;
    usernameList.innerHTML = "";
    users.forEach((u) => {
      const btn = document.createElement("button");
      btn.className = "username-item";
      btn.innerHTML = `<span>@${u.distinctName}</span>`;
      btn.onclick = () => {
        usernameDropdown.classList.add("hidden");
        usernameDropdown.setAttribute("aria-hidden", "true");
        usernameBtn.setAttribute("aria-expanded", "false");
        try {
          setStoredUserId(u.id);
        } catch (e) {}
        loadUserDataById(u.id);
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("id", u.id);
        newUrl.searchParams.delete("handle");
        window.history.replaceState({}, "", newUrl);
      };
      usernameList.appendChild(btn);
    });
  }

  document.addEventListener("click", (e) => {
    if (
      usernameDropdown &&
      !usernameDropdown.contains(e.target) &&
      e.target !== usernameBtn
    ) {
      usernameDropdown.classList.add("hidden");
    }
  });

  const followersBtn = document.getElementById("followersBtn");
  const followingBtn = document.getElementById("followingBtn");
  const modalClose = document.querySelector(".modal-close");
  const modalOverlay = document.querySelector(".modal-overlay");

  if (followersBtn) {
    followersBtn.addEventListener("click", () => {
      const userId = viewedUserId || currentUserId;
      if (userId) loadFollowersListOld(userId);
    });
  }

  if (followingBtn) {
    followingBtn.addEventListener("click", () => {
      const userId = viewedUserId || currentUserId;
      if (userId) loadFollowingListOld(userId);
    });
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

  function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function hideProfileActions() {
    const profileActions = document.getElementById("profileActions");
    const editAccountBtn = document.getElementById("editAccountBtn");
    if (profileActions) profileActions.classList.add("hidden");
    if (editAccountBtn) {
      editAccountBtn.style.display = "block";
      updateEditProfileLink();
    }
  }

  function showProfileActions() {
    const profileActions = document.getElementById("profileActions");
    const editAccountBtn = document.getElementById("editAccountBtn");
    if (profileActions) profileActions.classList.remove("hidden");
    if (editAccountBtn) editAccountBtn.style.display = "none";
  }

  function updateEditProfileLink() {
    const editAccountBtn = document.getElementById("editAccountBtn");
    if (!editAccountBtn) return;

    const link = editAccountBtn.querySelector('a');
    if (!link) return;

    const targetUserId = viewedUserId || currentUserId;
    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get('handle');
    const userId = urlParams.get('id');
    const currentUrl = window.location.href;
    
    if (targetUserId) {
      // Build edit profile URL with proper parameters
      let editUrl = '/editProfile/editProfile.html';
      
      if (userHandle) {
        editUrl += `?handle=${userHandle}`;
      } else if (userId) {
        editUrl += `?id=${userId}`;
      } else if (targetUserId !== currentUserId) {
        // We're viewing another user's profile
        editUrl += `?id=${targetUserId}&redirect=${encodeURIComponent(currentUrl)}`;
      } else {
        // Editing own profile
        editUrl += `?redirect=${encodeURIComponent(currentUrl)}`;
      }
      
      link.href = editUrl;
    }
  }

  function loadRelationshipStatus(userId) {
    if (!currentUserId || !userId || currentUserId === userId) {
      hideProfileActions();
      return;
    }

    fetch(`/api/users/${userId}/relationship?from=${currentUserId}`)
      .then((response) => {
        if (!response.ok) return { isFollowing: false };
        return response.json();
      })
      .then((data) => {
        relationshipStatus = data;
        updateActionButtons(data);
      })
      .catch(() => {
        relationshipStatus = { isFollowing: false };
        updateActionButtons(relationshipStatus);
      });
  }

  function updateActionButtons(status) {
    const followBtn = document.getElementById("followBtn");
    const followSpan = followBtn ? followBtn.querySelector("span") : null;

    if (!followBtn) return;

    showProfileActions();

    if (status.isFollowing) {
      followBtn.classList.add("following");
      followBtn.classList.remove("action-btn--primary");
      followBtn.classList.add("action-btn--secondary");
      if (followSpan) followSpan.textContent = "Following";
    } else {
      followBtn.classList.remove("following");
      followBtn.classList.add("action-btn--primary");
      followBtn.classList.remove("action-btn--secondary");
      if (followSpan) followSpan.textContent = "Follow";
    }
  }

  function handleFollow() {
    if (!viewedUserId || !currentUserId) return;

    const followBtn = document.getElementById("followBtn");
    const isCurrentlyFollowing = relationshipStatus?.isFollowing;

    if (isCurrentlyFollowing) {
      fetch(`/api/users/${viewedUserId}/followers/${currentUserId}`, {
        method: "DELETE",
      })
        .then((response) => {
          if (response.ok) {
            relationshipStatus.isFollowing = false;
            updateActionButtons(relationshipStatus);
            ToastManager.success("Unfollowed successfully");
            refreshStats();
          } else {
            throw new Error("Failed to unfollow");
          }
        })
        .catch(() => {
          ToastManager.error("Failed to unfollow");
        });
    } else {
      fetch(`/api/users/${viewedUserId}/followers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUserId }),
      })
        .then((response) => {
          if (response.ok || response.status === 201) {
            relationshipStatus.isFollowing = true;
            updateActionButtons(relationshipStatus);
            ToastManager.success("Now following");
            refreshStats();
          } else {
            throw new Error("Failed to follow");
          }
        })
        .catch(() => {
          ToastManager.error("Failed to follow");
        });
    }
  }

  function refreshStats() {
    if (viewedUserId) {
      loadUserStats(viewedUserId);
    }
  }

  const followBtn = document.getElementById("followBtn");
  if (followBtn) {
    followBtn.addEventListener("click", handleFollow);
  }
});
