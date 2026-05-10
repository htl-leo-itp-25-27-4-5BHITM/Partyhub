document.addEventListener("DOMContentLoaded", async () => {
  let data = [];

  const list = document.getElementById("notifList");
  const tpl = document.getElementById("notifTpl");

  const currentUserId = window.getCurrentUserId();
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

  function formatNotificationTime(value) {
    if (!value) return "just now";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";

    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
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
        const res = await fetch(url);
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

    const userId = currentUserId ?? window.getCurrentUserId?.() ?? null;
    const hasUser = userId !== null && userId !== undefined && String(userId) !== "";
    const url = hasUser
      ? `/api/parties/${encodeURIComponent(partyId)}?user=${encodeURIComponent(userId)}`
      : `/api/parties/${encodeURIComponent(partyId)}`;

    try {
      const res = await fetch(url, {
        headers: hasUser ? { "X-User-Id": String(userId) } : {}
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
        const res = await fetch(req.url, req.options);
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
    const userId = window.getCurrentUserId();
    if (!userId) {
      console.warn("No user logged in for getReceivedInvites");
      return [];
    }

    const json = await fetchJsonWithFallback([
      `/api/invitations?user=${userId}&direction=received`,
      `/invitations?user=${userId}&direction=received`
    ]);

    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.items)) return json.items;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.invitations)) return json.invitations;
    return [];
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
      const json = await fetchJsonWithFallback([
        `/api/notifications?user=${userId}`
      ]);

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

    return fetchWithFallback([
      {
        url: `/api/notifications/${encodeURIComponent(notificationId)}?user=${encodeURIComponent(userId)}`,
        options: {
          method: "DELETE",
          headers: { "X-User-Id": String(userId) }
        }
      }
    ]);
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

  try {
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

    let filteredInvites = invitations;

    if (currentUserId != null) {
      filteredInvites = invitations.filter(inv => {
        const rid = readId(inv, "recipient");
        return rid != null && Number(rid) === Number(currentUserId);
      });

      if (filteredInvites.length === 0 && invitations.length > 0) {
        console.warn("Filter removed all items; falling back to backend list");
        filteredInvites = invitations;
      }
    }

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

    data = [];

    const invitationNotificationKeys = new Set();

    filteredInvites.forEach(inv => {
      invitationNotificationKeys.add(
        notificationKey(readId(inv, "sender"), readId(inv, "recipient"), readPartyId(inv))
      );
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

      const message =
        rid != null && String(rid) === String(currentUserId)
          ? `${getUsername(sender, sid)} invited you to "${partyTitle ?? "an event"}"`
          : `${getUsername(sender, sid)} sent ${getUsername(null, rid)} an invitation${partyTitle ? ` to ${partyTitle}` : ""}`;

      data.push({
        id: `invite-${inv.id ?? inv.invitationId ?? `${sid}-${rid}-${partyId ?? "x"}`}`,
        type: "invite",
        invitationId: inv.id ?? inv.invitationId ?? null,
        partyId: partyId != null ? Number(partyId) : null,
        text: message,
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
      const notificationId = notification.id ?? notification.notificationId ?? null;
      const sid = readId(notification, "sender");
      const rid = readId(notification, "recipient");
      const partyId = readPartyId(notification);
      const rawMessage = notification.message ?? notification.text ?? "New notification";
      const message = normalizeLegacyNotificationMessage(rawMessage);
      const duplicateInviteKey = notificationKey(sid, rid, partyId);
      const isInviteDuplicate =
        partyId != null &&
        duplicateInviteKey != null &&
        invitationNotificationKeys.has(duplicateInviteKey) &&
        (/\u0065ingeladen|invited/.test(String(rawMessage).toLowerCase()) ||
          message.toLowerCase().includes("invited"));

      if (isInviteDuplicate) {
        return;
      }

      const sender = sid != null ? userMap[String(sid)] : null;

      data.push({
        id: `notification-${notificationId ?? `${sid ?? "x"}-${rid ?? "x"}-${partyId ?? "x"}`}`,
        type: "notification",
        notificationId: notificationId != null ? Number(notificationId) : null,
        partyId: partyId != null ? Number(partyId) : null,
        text: message,
        createdAt: notification.created_at ?? notification.createdAt ?? null,
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

      data.push({
        id: `follow-${followerId}`,
        type: "follow",
        followerId: Number(followerId),
        text: `${getUsername(sender, followerId)} wants to follow you`,
        actorAvatar: sender?.id
          ? `/api/users/${sender.id}/profile-picture`
          : "/images/default_profile-picture.svg",
        actorProfile: sender?.distinctName
          ? `/profile/profile.html?handle=${sender.distinctName}`
          : "#",
        _raw: user
      });
    });

    console.log("Final notification data:", data);
  } catch (e) {
    console.error("Load failed:", e);
    data = [];
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
                if (typeof deleteInvite === "function" && item.invitationId) {
                  await deleteInvite(item.invitationId);
                }
              } else if (item.type === "follow") {
                if (item.followerId != null && currentUserId != null) {
                  await acceptFollowRequest(currentUserId, item.followerId);
                }
              }

              const idx = data.findIndex(d => d.id === item.id);
              if (idx > -1) data.splice(idx, 1);

              render();
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
        dismissBtn.addEventListener("click", async () => {
          try {
            let deleted = false;
            if (item.type === "invite") {
              const deleteFn = window.deleteInvite || window.backend?.deleteInvite;
              if (deleteFn && item.invitationId) {
                await deleteFn(item.invitationId);
                deleted = true;
              }
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
              const idx = data.findIndex(d => d.id === item.id);
              if (idx > -1) data.splice(idx, 1);
              render();
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

      list.prepend(clone);
    });
  }

  render();
});
