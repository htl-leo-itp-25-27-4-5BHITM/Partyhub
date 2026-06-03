document.addEventListener("DOMContentLoaded", async () => {
  let data = [];

  const list = document.getElementById("notifList");
  const tpl = document.getElementById("notifTpl");

  const isAuthenticated = await window.authService?.init?.({ requireLogin: true, redirectTo: window.location.pathname });
  if (isAuthenticated === false) return;

  let currentUserId = await resolveCurrentUserId();
  console.log("Current user:", currentUserId);

  if (!currentUserId) {
    console.warn("No user logged in");
  }

  function readId(inv, base) {
    const direct =
      inv?.[`${base}Id`] ??
      inv?.[`${base}_id`] ??
      inv?.[base];

    if (direct && typeof direct === "object") {
      return direct.id ?? direct.userId ?? direct.user_id ?? null;
    }
    return direct ?? null;
  }

  async function resolveCurrentUserId() {
    let userId = window.authService?.getCurrentUserId?.() ?? window.getCurrentUserId?.();
    if (userId != null) return userId;

    const currentUser = await window.authService?.getCurrentUser?.();
    userId = currentUser?.id ?? window.authService?.getCurrentUserId?.() ?? window.getCurrentUserId?.();
    if (userId != null) return userId;

    try {
      const response = await window.authService?.apiCall?.("/api/users/me");
      if (response?.ok) {
        const user = await response.json().catch(() => null);
        if (user?.id != null) {
          window.authService?.storeUser?.(user.id, user);
          return user.id;
        }
      }
    } catch (error) {
      console.warn("Could not resolve current user", error);
    }

    return null;
  }

  function readPartyId(item) {
    return (
      (item?.party && typeof item.party === "object" ? item.party.id : null) ??
      item?.partyId ??
      item?.party_id ??
      (typeof item?.party === "number" || typeof item?.party === "string" ? item.party : null) ??
      null
    );
  }

  function notificationKey(senderId, recipientId, partyId) {
    if (senderId == null || recipientId == null || partyId == null) return null;
    return `${senderId}-${recipientId}-${partyId}`;
  }

  function readNotificationId(notification) {
    return notification?.id ?? notification?.notificationId ?? notification?.notification_id ?? null;
  }

  function readCreatedAt(item) {
    return item?.createdAt ?? item?.created_at ?? item?.sentAt ?? item?.sent_at ?? item?.timestamp ?? null;
  }

  function notificationTimestamp(item) {
    const value = readCreatedAt(item);
    if (!value) return 0;

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  function invitationStatus(invitation) {
    return String(invitation?.status ?? "PENDING").toUpperCase();
  }

  function isPendingInvitation(invitation) {
    return invitationStatus(invitation) === "PENDING";
  }

  function isInvitationNotification(notification) {
    const rawMessage = notification?.message ?? notification?.text ?? "";
    const message = normalizeLegacyNotificationMessage(String(rawMessage)).toLowerCase();
    const rawLower = String(rawMessage).toLowerCase();

    return (
      message.includes("invited you to the party") ||
      message.includes("invited you to") ||
      rawLower.includes("invited") ||
      rawLower.includes("eingeladen")
    );
  }

  function isProtectedNotificationMessage(message) {
    const normalized = normalizeLegacyNotificationMessage(String(message ?? "")).toLowerCase();

    return (
      normalized.includes("accepted your follow request") ||
      normalized.includes("just followed you") ||
      normalized.includes("follows you now")
    );
  }

  function formatNotificationTime(value) {
    if (!value) return "just now";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";

    const diffMs = Date.now() - date.getTime();

    if (diffMs < 0) return "just now";

    const diffSeconds = Math.floor(diffMs / 1000);
    if (diffSeconds < 45) return "just now";

    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) {
      return diffMinutes === 1 ? "1 min ago" : `${diffMinutes} min ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  function normalizeLegacyNotificationMessage(message) {
    if (!message || typeof message !== "string") return "New notification";

    let normalized = message.trim();

    normalized = normalized.replace(
      /^(.+?) hat dich zu der Party "(.+?)" eingeladen\.?$/,
      '$1 invited you to the party "$2"'
    );

    normalized = normalized.replace(
      /^Die Party "(.+?)" wurde abgesagt\.?$/,
      'The party "$1" was canceled.'
    );

    normalized = normalized.replace(
      /^"(.+?)" wurde aktualisiert: (.+)$/,
      '"$1" was updated: $2'
    );

    normalized = normalized.replace(
      /^(.+?) hat deine Einladung zur Party "(.+?)" angenommen\.?$/,
      '$1 accepted your invitation to the party "$2".'
    );

    normalized = normalized.replace(
      /^(.+?) hat die Party "(.+?)" verlassen\.?$/,
      '$1 left the party "$2".'
    );

    return normalized;
  }

  function getUsername(user, id) {
    return (
      user?.username ||
      user?.displayName ||
      user?.distinctName ||
      user?.name ||
      `User#${id ?? "?"}`
    );
  }

  async function fetchJsonWithFallback(urls) {
    let lastError = null;

    for (const url of urls) {
      try {
        const res = await (window.authService?.apiCall || fetch)(url);
        if (res.ok) {
          const json = await res.json().catch(() => null);
          console.log("Fetch success:", url, json);
          return json;
        }

        console.warn("Fetch failed:", url, res.status);
        lastError = new Error(`${url} -> ${res.status}`);
      } catch (err) {
        console.warn("Fetch error:", url, err);
        lastError = err;
      }
    }

    throw lastError ?? new Error("All fetch attempts failed");
  }

  async function fetchPartyForNotification(partyId) {
    if (partyId == null) return null;

    const url = `/api/parties/${encodeURIComponent(partyId)}`;

    try {
      const res = await (window.authService?.apiCall || fetch)(url, {
        authRequired: false
      });

      if (!res.ok) {
        console.warn("Party fetch failed for notification:", url, res.status);
        return null;
      }

      return await res.json().catch(() => null);
    } catch (err) {
      console.warn("Party fetch error for notification:", url, err);
      return null;
    }
  }

  async function fetchWithFallback(requests) {
    let lastError = null;

    for (const req of requests) {
      try {
        const res = await (window.authService?.apiCall || fetch)(req.url, req.options || {});
        if (res.ok) {
          console.log("Request success:", req.url, res.status);
          return res;
        }

        console.warn("Request failed:", req.url, res.status);
        lastError = new Error(`${req.url} -> ${res.status}`);
      } catch (err) {
        console.warn("Request error:", req.url, err);
        lastError = err;
      }
    }

    throw lastError ?? new Error("All request attempts failed");
  }

  async function getReceivedInvites() {
    const userId = await resolveCurrentUserId();
    if (!userId) {
      console.warn("No user logged in for getReceivedInvites");
      return [];
    }

    try {
      const response = await window.authService.apiCall("/api/invitations?direction=received");
      if (!response.ok) {
        console.warn("Fetching invitations failed:", response.status);
        return [];
      }

      const json = await response.json().catch(() => null);

      if (Array.isArray(json)) return json;
      if (Array.isArray(json?.items)) return json.items;
      if (Array.isArray(json?.data)) return json.data;
      if (Array.isArray(json?.invitations)) return json.invitations;
      return [];
    } catch (err) {
      console.warn("Fetching invitations failed completely:", err);
      return [];
    }
  }

  async function getPendingFollowUsers() {
    const userId = window.getCurrentUserId();
    if (!userId) {
      console.warn("No user logged in for getPendingFollowUsers");
      return [];
    }

    try {
      const json = await fetchJsonWithFallback([
        `/api/users/${userId}/follow-requests`,
        `/users/${userId}/follow-requests`
      ]);

      if (Array.isArray(json)) return json;
      if (Array.isArray(json?.items)) return json.items;
      if (Array.isArray(json?.data)) return json.data;
      return [];
    } catch (err) {
      console.warn("Fetching follow pending failed completely:", err);
      return [];
    }
  }

  async function getBackendNotifications() {
    const userId = window.getCurrentUserId();
    if (!userId) {
      console.warn("No user logged in for getBackendNotifications");
      return [];
    }

    try {
      const response = await window.authService.apiCall("/api/notifications");
      if (!response.ok) {
        console.warn("Fetching notifications failed:", response.status);
        return [];
      }

      const json = await response.json().catch(() => null);

      if (Array.isArray(json)) return json;
      if (Array.isArray(json?.items)) return json.items;
      if (Array.isArray(json?.data)) return json.data;
      if (Array.isArray(json?.notifications)) return json.notifications;
      return [];
    } catch (err) {
      console.warn("Fetching notifications failed completely:", err);
      return [];
    }
  }

  async function acceptFollowRequest(currentUserId, followerId) {
    return fetchWithFallback([
      {
        url: `/api/users/${encodeURIComponent(currentUserId)}/followers/${encodeURIComponent(followerId)}`,
        options: { method: "PUT" }
      },
      {
        url: `/users/${encodeURIComponent(currentUserId)}/followers/${encodeURIComponent(followerId)}`,
        options: { method: "PUT" }
      }
    ]);
  }

  async function removeFollowRequest(currentUserId, followerId) {
    return fetchWithFallback([
      {
        url: `/api/users/${encodeURIComponent(currentUserId)}/followers/${encodeURIComponent(followerId)}`,
        options: { method: "DELETE" }
      },
      {
        url: `/users/${encodeURIComponent(currentUserId)}/followers/${encodeURIComponent(followerId)}`,
        options: { method: "DELETE" }
      }
    ]);
  }

  async function deleteBackendNotification(notificationId) {
    const userId = window.getCurrentUserId();
    if (!userId || !notificationId) return null;

    const response = await window.authService.apiCall(`/api/notifications/${encodeURIComponent(notificationId)}`, {
      method: "DELETE"
    });

    if (response.ok || response.status === 404) {
      return response;
    }

    throw new Error(`${url} -> ${response.status}`);
  }

  function isNotFoundError(error) {
    return /404|not found/i.test(String(error?.message ?? error ?? ""));
  }

  async function deleteInvitationRecord(invitationId) {
    const deleteFn = window.deleteInvite || window.backend?.deleteInvite;

    if (!deleteFn || !invitationId) {
      return false;
    }

    try {
      await deleteFn(invitationId);
      return true;
    } catch (error) {
      if (isNotFoundError(error)) {
        return true;
      }
      throw error;
    }
  }

  async function deleteInviteNotifications(item) {
    const notificationIds = [
      ...(Array.isArray(item.notificationIds) ? item.notificationIds : []),
      item.notificationId
    ].filter(id => id != null);

    const uniqueIds = [...new Set(notificationIds.map(id => String(id)))];

    if (!uniqueIds.length) {
      return false;
    }

    const results = await Promise.allSettled(
      uniqueIds.map(id => deleteBackendNotification(id))
    );
    const failed = results.find(result => result.status === "rejected");

    if (failed && results.every(result => result.status === "rejected")) {
      throw failed.reason;
    }

    return true;
  }

  async function declineInvite(item) {
    if (item.invitationId) {
      return deleteInvitationRecord(item.invitationId);
    }

    return deleteInviteNotifications(item);
  }

  function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 2200);
  }

  function confirmIconSvg(icon) {
    if (icon === "trash") {
      return `
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="6.5" y="6" width="11" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M9.5 10v6M12 10v6M14.5 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 6h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="9" y="3" width="6" height="3" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `;
    }

    return `
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M8.75 8.75l6.5 6.5M15.25 8.75l-6.5 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `;
  }

  function showConfirmBox({
    title,
    message,
    confirmLabel = "Bestätigen",
    cancelLabel = "Abbrechen",
    icon = "x"
  }) {
    const overlay = document.getElementById("confirmOverlay");
    const titleEl = document.getElementById("confirmTitle");
    const messageEl = document.getElementById("confirmMessage");
    const iconEl = document.getElementById("confirmIcon");
    const cancelBtn = document.getElementById("confirmCancelBtn");
    const confirmBtn = document.getElementById("confirmConfirmBtn");

    if (!overlay || !titleEl || !messageEl || !iconEl || !cancelBtn || !confirmBtn) {
      return Promise.resolve(false);
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    iconEl.innerHTML = confirmIconSvg(icon);
    cancelBtn.textContent = cancelLabel;
    confirmBtn.textContent = confirmLabel;

    return new Promise(resolve => {
      const previousFocus = document.activeElement;

      function close(result) {
        overlay.hidden = true;
        cancelBtn.removeEventListener("click", onCancel);
        confirmBtn.removeEventListener("click", onConfirm);
        overlay.removeEventListener("click", onOverlayClick);
        document.removeEventListener("keydown", onKeyDown);

        if (previousFocus && typeof previousFocus.focus === "function") {
          previousFocus.focus();
        }

        resolve(result);
      }

      function onCancel() {
        close(false);
      }

      function onConfirm() {
        close(true);
      }

      function onOverlayClick(event) {
        if (event.target === overlay) {
          close(false);
        }
      }

      function onKeyDown(event) {
        if (event.key === "Escape") {
          close(false);
        }
      }

      cancelBtn.addEventListener("click", onCancel);
      confirmBtn.addEventListener("click", onConfirm);
      overlay.addEventListener("click", onOverlayClick);
      document.addEventListener("keydown", onKeyDown);

      overlay.hidden = false;
      cancelBtn.focus();
    });
  }

  async function confirmTwice(firstOptions, secondOptions) {
    const firstConfirmed = await showConfirmBox(firstOptions);
    if (!firstConfirmed) return false;

    return showConfirmBox(secondOptions);
  }

  function setDismissButtonMode(button, item) {
    if (!button) return;

    const isPlainNotification = item.type === "notification";

    button.setAttribute(
      "aria-label",
      isPlainNotification ? "Benachrichtigung löschen" : "Ablehnen"
    );
    button.setAttribute("title", isPlainNotification ? "Löschen" : "Ablehnen");

    button.innerHTML = isPlainNotification
      ? `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <rect x="6.5" y="6" width="11" height="12" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M9.5 10v6M12 10v6M14.5 10v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M5 6h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="9" y="3" width="6" height="3" rx="1.5" stroke="currentColor" stroke-width="2" fill="none"/>
        </svg>
      `
      : `
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M8.75 8.75l6.5 6.5M15.25 8.75l-6.5 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `;
  }

  async function loadNotificationData({ quiet = false } = {}) {
    try {
      currentUserId = await resolveCurrentUserId();
      const invitations = await getReceivedInvites();
      const pendingFollowUsers = await getPendingFollowUsers();
      const backendNotifications = await getBackendNotifications();
      console.log("notifications: raw pending follow users ->", pendingFollowUsers);
      console.log("notifications: raw backend notifications ->", backendNotifications);

      try {
        console.table(
          invitations.map(inv => ({
            id: inv.id ?? inv.invitationId ?? null,
            senderId: readId(inv, "sender"),
            recipientId: readId(inv, "recipient"),
            partyId:
              (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
              inv.partyId ??
              inv.party_id ??
              null,
            partyTitle: inv.party?.title ?? inv.party?.name ?? null
          }))
        );
      } catch {}

      let relevantInvites = invitations;

      if (currentUserId != null) {
        const invitationsWithRecipientId = invitations.filter(inv => readId(inv, "recipient") != null);

        if (invitationsWithRecipientId.length > 0) {
          relevantInvites = invitations.filter(inv => {
            const rid = readId(inv, "recipient");
            return rid != null && Number(rid) === Number(currentUserId);
          });
        } else if (invitations.length > 0) {
          console.warn("Invitations did not contain recipient ids; falling back to backend list");
        }
      }

      let filteredInvites = relevantInvites.filter(isPendingInvitation);

      const ids = new Set();

      filteredInvites.forEach(inv => {
        const sid = readId(inv, "sender");
        const rid = readId(inv, "recipient");

        if (sid != null) ids.add(String(sid));
        if (rid != null) ids.add(String(rid));
      });

      backendNotifications.forEach(notification => {
        const sid = readId(notification, "sender");
        const rid = readId(notification, "recipient");

        if (sid != null) ids.add(String(sid));
        if (rid != null) ids.add(String(rid));
      });

      pendingFollowUsers.forEach(user => {
        const uid = user?.id ?? user?.userId ?? user?.user_id ?? null;
        if (uid != null) ids.add(String(uid));
      });

      const userMap = {};

      if (typeof getUserById === "function") {
        await Promise.all(
          [...ids].map(async (id) => {
            try {
              userMap[id] = (await getUserById(id)) ?? null;
            } catch {
              userMap[id] = null;
            }
          })
        );
      } else {
        console.warn("getUserById() is missing; usernames will be shown as User#id");
      }

      console.log("notifications: userMap ->", userMap);

      const partyIds = new Set();

      filteredInvites.forEach(inv => {
        const pid = readPartyId(inv);

        if (pid != null) partyIds.add(String(pid));
      });

      backendNotifications.forEach(notification => {
        const pid = readPartyId(notification);
        if (pid != null) partyIds.add(String(pid));
      });

      const partyMap = {};

      await Promise.all(
        [...partyIds].map(async (id) => {
          partyMap[id] = await fetchPartyForNotification(id);
        })
      );

      const nextData = [];

      const invitationNotificationKeys = new Set();
      const invitationStatusByKey = new Map();
      const backendInviteNotificationsByKey = new Map();

      relevantInvites.forEach(inv => {
        const key = notificationKey(readId(inv, "sender"), readId(inv, "recipient"), readPartyId(inv));
        if (key) {
          invitationStatusByKey.set(key, invitationStatus(inv));
        }
      });

      backendNotifications.forEach(notification => {
        const key = notificationKey(readId(notification, "sender"), readId(notification, "recipient"), readPartyId(notification));

        if (key && isInvitationNotification(notification)) {
          const existing = backendInviteNotificationsByKey.get(key) ?? [];
          existing.push(notification);
          backendInviteNotificationsByKey.set(key, existing);
        }
      });

      filteredInvites.forEach(inv => {
        const key = notificationKey(readId(inv, "sender"), readId(inv, "recipient"), readPartyId(inv));
        if (key) {
          invitationNotificationKeys.add(key);
        }
      });

      filteredInvites.forEach(inv => {
        const sid = readId(inv, "sender");
        const rid = readId(inv, "recipient");
        const sender = sid != null ? userMap[String(sid)] : null;

        const partyId = readPartyId(inv);

        let partyTitle =
          inv.party?.title ??
          inv.party?.name ??
          inv.partyTitle ??
          inv.party_name ??
          null;

        if (!partyTitle && partyId != null) {
          const p = partyMap[String(partyId)];
          if (p) {
            partyTitle = p.title ?? p.name ?? null;
          }
        }

        const inviteKey = notificationKey(sid, rid, partyId);
        const matchingBackendNotifications = inviteKey
          ? backendInviteNotificationsByKey.get(inviteKey) ?? []
          : [];
        const backendNotificationIds = matchingBackendNotifications
          .map(readNotificationId)
          .filter(id => id != null);
        const createdAt =
          matchingBackendNotifications.map(readCreatedAt).find(Boolean) ??
          readCreatedAt(inv);

        const message =
          rid != null && String(rid) === String(currentUserId)
            ? `${getUsername(sender, sid)} invited you to "${partyTitle ?? "an event"}"`
            : `${getUsername(sender, sid)} sent ${getUsername(null, rid)} an invitation${partyTitle ? ` to ${partyTitle}` : ""}`;

        nextData.push({
          id: `invite-${inv.id ?? inv.invitationId ?? `${sid}-${rid}-${partyId ?? "x"}`}`,
          type: "invite",
          invitationId: inv.id ?? inv.invitationId ?? null,
          notificationId: backendNotificationIds.length ? Number(backendNotificationIds[0]) : null,
          notificationIds: backendNotificationIds.map(id => Number(id)),
          partyId: partyId != null ? Number(partyId) : null,
          text: message,
          createdAt,
          actorAvatar: sender?.id
            ? `/api/users/${sender.id}/profile-picture`
            : "/images/default_profile-picture.svg",
          actorProfile: sender?.distinctName
            ? `/profile/profile.html?handle=${sender.distinctName}`
            : "#",
          _raw: inv
        });
      });

      backendNotifications.forEach(notification => {
        const notificationId = readNotificationId(notification);
        const sid = readId(notification, "sender");
        const rid = readId(notification, "recipient");
        const partyId = readPartyId(notification);
        const rawMessage = notification.message ?? notification.text ?? "New notification";
        const message = normalizeLegacyNotificationMessage(rawMessage);
        const duplicateInviteKey = notificationKey(sid, rid, partyId);
        const invitationState = duplicateInviteKey
          ? invitationStatusByKey.get(duplicateInviteKey)
          : null;
        const isBackendInvite = isInvitationNotification(notification);
        const isInviteDuplicate =
          partyId != null &&
          duplicateInviteKey != null &&
          invitationNotificationKeys.has(duplicateInviteKey) &&
          isBackendInvite;
        const isStaleInviteNotification =
          partyId != null &&
          duplicateInviteKey != null &&
          invitationState != null &&
          invitationState !== "PENDING" &&
          isBackendInvite;

        if (isInviteDuplicate || isStaleInviteNotification) {
          return;
        }

        const sender = sid != null ? userMap[String(sid)] : null;

        nextData.push({
          id: `notification-${notificationId ?? `${sid ?? "x"}-${rid ?? "x"}-${partyId ?? "x"}`}`,
          type: "notification",
          notificationId: notificationId != null ? Number(notificationId) : null,
          partyId: partyId != null ? Number(partyId) : null,
          text: message,
          createdAt: readCreatedAt(notification),
          locked: isProtectedNotificationMessage(message),
          actorAvatar: sender?.id
            ? `/api/users/${sender.id}/profile-picture`
            : "/images/default_profile-picture.svg",
          actorProfile: sender?.distinctName
            ? `/profile/profile.html?handle=${sender.distinctName}`
            : "#",
          _raw: notification
        });
      });

      pendingFollowUsers.forEach(user => {
        const followerId = user?.id ?? user?.userId ?? user?.user_id ?? null;
        if (followerId == null) return;

        const sender = userMap[String(followerId)] ?? user;

        nextData.push({
          id: `follow-${followerId}`,
          type: "follow",
          followerId: Number(followerId),
          text: `${getUsername(sender, followerId)} wants to follow you`,
          createdAt: readCreatedAt(user),
          actorAvatar: sender?.id
            ? `/api/users/${sender.id}/profile-picture`
            : "/images/default_profile-picture.svg",
          actorProfile: sender?.distinctName
            ? `/profile/profile.html?handle=${sender.distinctName}`
            : "#",
          _raw: user
        });
      });

      nextData.sort((a, b) => notificationTimestamp(b) - notificationTimestamp(a));

      console.log("Final notification data:", nextData);
      return nextData;
    } catch (e) {
      if (quiet) {
        console.warn("Silent notification refresh failed:", e);
      } else {
        console.error("Load failed:", e);
      }
      return data;
    }
  }

  let refreshInFlight = null;

  async function refreshNotifications({ quiet = false, force = false } = {}) {
    if (refreshInFlight) {
      if (!force) return refreshInFlight;
      await refreshInFlight.catch(() => {});
    }

    refreshInFlight = (async () => {
      data = await loadNotificationData({ quiet });
      render();
    })().finally(() => {
      refreshInFlight = null;
    });

    return refreshInFlight;
  }

  function render() {
    if (!list || !tpl) return;

    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = "<p class='muted'>No notifications</p>";
      return;
    }

    data.forEach(item => {
      const clone = tpl.content.cloneNode(true);

      const img = clone.querySelector(".notif-avatar img");
      if (img) {
        img.src = item.actorAvatar || "/images/default_profile-picture.svg";
        img.onerror = function () {
          this.onerror = null;
          this.src = "/images/default_profile-picture.svg";
        };
      }

      const link = clone.querySelector(".avatar-link");
      if (link) link.href = item.actorProfile || "#";

      const messageEl = clone.querySelector(".notif-message");
      if (messageEl) messageEl.textContent = item.text;

      const timeEl = clone.querySelector(".notif-time");
      if (timeEl) timeEl.textContent = formatNotificationTime(item.createdAt);

      const viewBtn = clone.querySelector(".btn-view-party");
      const acceptBtn = clone.querySelector(".btn-accept");
      const dismissBtn = clone.querySelector(".btn-dismiss");

      if (viewBtn) {
        if ((item.type === "invite" || item.type === "notification") && item.partyId) {
          viewBtn.style.display = "";
          viewBtn.addEventListener("click", () => {
            if (item.partyId) {
              window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${item.partyId}`;
            } else {
              showToast("No party information available", "error");
            }
          });
        } else {
          viewBtn.style.display = "none";
        }
      }

      if (acceptBtn) {
        if (item.type === "notification") {
          acceptBtn.style.display = "none";
          acceptBtn.disabled = true;
        } else {
          acceptBtn.addEventListener("click", async () => {
            try {
              if (item.type === "invite") {
                if (typeof attendParty === "function" && item.partyId) {
                  const joined = await attendParty(item.partyId);
                  if (joined === false || joined?.ok === false) {
                    throw new Error("Party could not be accepted");
                  }
                }
              } else if (item.type === "follow") {
                if (item.followerId != null && currentUserId != null) {
                  await acceptFollowRequest(currentUserId, item.followerId);
                }
              }

              await refreshNotifications({ quiet: true, force: true });
              showToast(
                item.type === "follow"
                  ? "Follow request accepted ✓"
                  : "Invitation accepted ✓",
                "success"
              );
            } catch (err) {
              console.error("Accept failed", err);
              showToast("Error while accepting", "error");
            }
          });
        }
      }

      if (dismissBtn) {
        if (item.locked) {
          dismissBtn.style.display = "none";
          dismissBtn.disabled = true;
          dismissBtn.setAttribute("aria-hidden", "true");
        } else {
          setDismissButtonMode(dismissBtn, item);
          dismissBtn.addEventListener("click", async () => {
            try {
              if (item.type === "invite") {
                const confirmed = await confirmTwice(
                  {
                    title: "Einladung ablehnen?",
                    message: "Willst du diese Einladung wirklich ablehnen?",
                    confirmLabel: "Ablehnen",
                    icon: "x"
                  },
                  {
                    title: "Wirklich ablehnen?",
                    message: "Bist du dir sicher? Die Einladung wird abgelehnt.",
                    confirmLabel: "Ja, ablehnen",
                    icon: "x"
                  }
                );

                if (!confirmed) return;
              }

              if (item.type === "notification") {
                const confirmed = await confirmTwice(
                  {
                    title: "Notification löschen?",
                    message: "Willst du diese Benachrichtigung wirklich löschen?",
                    confirmLabel: "Löschen",
                    icon: "trash"
                  },
                  {
                    title: "Endgültig löschen?",
                    message: "Bist du dir sicher? Die Benachrichtigung wird endgültig gelöscht.",
                    confirmLabel: "Ja, löschen",
                    icon: "trash"
                  }
                );

                if (!confirmed) return;
              }

              let deleted = false;
              if (item.type === "invite") {
                deleted = await declineInvite(item);
              } else if (item.type === "follow") {
                if (item.followerId != null && currentUserId != null) {
                  await removeFollowRequest(currentUserId, item.followerId);
                  deleted = true;
                }
              } else if (item.type === "notification") {
                if (item.notificationId != null) {
                  await deleteBackendNotification(item.notificationId);
                  deleted = true;
                }
              }

              if (deleted) {
                await refreshNotifications({ quiet: true, force: true });
                showToast(
                  item.type === "follow"
                    ? "Follow request declined"
                    : item.type === "notification"
                      ? "Notification deleted"
                    : "Invitation declined",
                  "success"
                );
              }
            } catch (err) {
              console.error("Reject failed", err);
              showToast("Error while declining: " + err.message, "error");
            }
          });
        }
      }

      list.appendChild(clone);
    });
  }

  await refreshNotifications();

  window.addEventListener("focus", () => {
    refreshNotifications({ quiet: true });
  });

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshNotifications({ quiet: true });
    }
  });

  window.setInterval(() => {
    if (!document.hidden) {
      refreshNotifications({ quiet: true });
    }
  }, 5000);
});
