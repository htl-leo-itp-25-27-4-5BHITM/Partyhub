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
        `/api/users/${userId}/followers?status=pending`,
        `/users/${userId}/followers?status=pending`
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

  async function acceptFollowRequest(followerId, targetId) {
    return fetchWithFallback([
      {
        url: `/api/users/${encodeURIComponent(followerId)}/follow/${encodeURIComponent(targetId)}`,
        options: { method: "PUT" }
      },
      {
        url: `/users/${encodeURIComponent(followerId)}/follow/${encodeURIComponent(targetId)}`,
        options: { method: "PUT" }
      }
    ]);
  }

  async function removeFollowRequest(followerId, targetId) {
    return fetchWithFallback([
      {
        url: `/api/users/${encodeURIComponent(followerId)}/follow/${encodeURIComponent(targetId)}`,
        options: { method: "DELETE" }
      },
      {
        url: `/users/${encodeURIComponent(followerId)}/follow/${encodeURIComponent(targetId)}`,
        options: { method: "DELETE" }
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

    console.log("notifications: raw invitations ->", invitations);
    console.log("notifications: raw pending follow users ->", pendingFollowUsers);

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
      console.warn("getUserById() fehlt – usernames werden als User#id angezeigt");
    }

    console.log("notifications: userMap ->", userMap);

    const partyIds = new Set();

    filteredInvites.forEach(inv => {
      const pid =
        (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
        inv.partyId ??
        inv.party_id ??
        (typeof inv.party === "number" || typeof inv.party === "string" ? inv.party : null) ??
        null;

      if (pid != null) partyIds.add(String(pid));
    });

    const partyMap = {};

    if (typeof getPartyById === "function") {
      await Promise.all(
        [...partyIds].map(async (id) => {
          try {
            partyMap[id] = (await getPartyById(id)) ?? null;
          } catch {
            partyMap[id] = null;
          }
        })
      );
    } else {
      console.warn("getPartyById() fehlt – partyTitle kommt nur aus invitation.party");
    }

    data = [];

    filteredInvites.forEach(inv => {
      const sid = readId(inv, "sender");
      const rid = readId(inv, "recipient");
      const sender = sid != null ? userMap[String(sid)] : null;

      const partyId =
        (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
        inv.partyId ??
        inv.party_id ??
        (typeof inv.party === "number" || typeof inv.party === "string" ? inv.party : null) ??
        null;

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
          ? `${getUsername(sender, sid)} hat dich zu "${partyTitle ?? "einem Event"}" eingeladen`
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

    pendingFollowUsers.forEach(user => {
      const followerId = user?.id ?? user?.userId ?? user?.user_id ?? null;
      if (followerId == null) return;

      const sender = userMap[String(followerId)] ?? user;

      data.push({
        id: `follow-${followerId}`,
        type: "follow",
        followerId: Number(followerId),
        text: `${getUsername(sender, followerId)} möchte dir folgen`,
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
      list.innerHTML = "<p class='muted'>Keine Benachrichtigungen</p>";
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
      if (timeEl) timeEl.textContent = "vor kurzem";

      const viewBtn = clone.querySelector(".btn-view-party");
      const acceptBtn = clone.querySelector(".btn-accept");
      const dismissBtn = clone.querySelector(".btn-dismiss");

      if (viewBtn) {
        if (item.type === "invite") {
          viewBtn.style.display = "";
          viewBtn.addEventListener("click", () => {
            if (item.partyId) {
              window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${item.partyId}`;
            } else {
              showToast("Keine Party-Information vorhanden", "error");
            }
          });
        } else {
          viewBtn.style.display = "none";
        }
      }

      if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
          try {
            if (item.type === "invite") {
              if (typeof attendParty === "function" && item.partyId) {
                await attendParty(item.partyId);
              }
              if (typeof deleteInvite === "function" && item.invitationId) {
                await deleteInvite(item.invitationId);
              }
            } else if (item.type === "follow") {
              if (item.followerId != null && currentUserId != null) {
                await acceptFollowRequest(item.followerId, currentUserId);
              }
            }

            const idx = data.findIndex(d => d.id === item.id);
            if (idx > -1) data.splice(idx, 1);

            render();
            showToast(
              item.type === "follow"
                ? "Follow-Anfrage akzeptiert ✓"
                : "Einladung angenommen ✓",
              "success"
            );
          } catch (err) {
            console.error("Accept failed", err);
            showToast("Fehler beim Annehmen", "error");
          }
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener("click", async () => {
          try {
            if (item.type === "invite") {
              if (typeof deleteInvite === "function" && item.invitationId) {
                await deleteInvite(item.invitationId);
              }
            } else if (item.type === "follow") {
              if (item.followerId != null && currentUserId != null) {
                await removeFollowRequest(item.followerId, currentUserId);
              }
            }

            const idx = data.findIndex(d => d.id === item.id);
            if (idx > -1) data.splice(idx, 1);

            render();
            showToast(
              item.type === "follow"
                ? "Follow-Anfrage abgelehnt"
                : "Einladung abgelehnt",
              "error"
            );
          } catch (err) {
            console.error("Reject failed", err);
            showToast("Fehler beim Ablehnen", "error");
          }
        });
      }

      list.prepend(clone);
    });
  }

  render();
});