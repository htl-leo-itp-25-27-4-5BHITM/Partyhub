document.addEventListener("DOMContentLoaded", async () => {
  let data = [];

  const list = document.getElementById("notifList");
  const tpl = document.getElementById("notifTpl");

  function getLoggedInUserId() {
    try {
      const s = sessionStorage.getItem("loggedInUserId");
      if (s) return Number(s);
      const l = localStorage.getItem("loggedInUserId");
      if (l) return Number(l);
    } catch {}
    return null;
  }

  const currentUserId = getLoggedInUserId();
  console.log("Current user:", currentUserId);

  // Robust: liest IDs egal ob als *_id, *Id oder als Objekt {id:...}
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

  async function getReceivedInvites() {
    const res = await fetch("/api/invites/rec");
    if (!res.ok) throw new Error("Fetch failed: " + res.status);
    const json = await res.json();

    // normalize to array
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.items)) return json.items;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.invitations)) return json.invitations;
    return [];
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

    console.log("notifications: raw invitations ->", invitations);
    try {
      console.table(
        invitations.map(inv => ({
          id: inv.id ?? inv.invitationId ?? null,
          senderId: readId(inv, "sender"),
          recipientId: readId(inv, "recipient"),
          partyId:
            (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
            inv.partyId ?? inv.party_id ?? null,
          partyTitle: inv.party?.title ?? inv.party?.name ?? null
        }))
      );
    } catch {}

    // Wenn du wirklich nach storage-user filtern willst:
    // -> nur invs wo recipient == currentUserId
    let filtered = invitations;
    if (currentUserId != null) {
      filtered = invitations.filter(inv => {
        const rid = readId(inv, "recipient");
        return rid != null && Number(rid) === Number(currentUserId);
      });

      // falls Backend schon korrekt gefiltert hat und storage-id nicht passt:
      if (filtered.length === 0 && invitations.length > 0) {
        console.warn("Filter removed all items; falling back to backend list (storage id mismatch?)");
        filtered = invitations;
      }
    }

    console.log("Filtered invites:", filtered.length);

    // Sender/Recipient IDs sammeln
    const ids = new Set();
    filtered.forEach(inv => {
      const sid = readId(inv, "sender");
      const rid = readId(inv, "recipient");
      if (sid != null) ids.add(String(sid));
      if (rid != null) ids.add(String(rid));
    });

    // Users holen
    const userMap = {};
    if (typeof getUserById === "function") {
      await Promise.all([...ids].map(async (id) => {
        try {
          userMap[id] = (await getUserById(id)) ?? null;
        } catch {
          userMap[id] = null;
        }
      }));
    } else {
      console.warn("getUserById() fehlt – usernames werden als User#id angezeigt");
    }
    console.log("notifications: userMap ->", userMap);

    // Party IDs sammeln und optional laden
    const partyIds = new Set();
    filtered.forEach(inv => {
      const pid =
        (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
        inv.partyId ?? inv.party_id ??
        (typeof inv.party === "number" || typeof inv.party === "string" ? inv.party : null) ??
        null;
      if (pid != null) partyIds.add(String(pid));
    });

    const partyMap = {};
    if (typeof getPartyById === "function") {
      await Promise.all([...partyIds].map(async (id) => {
        try {
          partyMap[id] = (await getPartyById(id)) ?? null;
        } catch {
          partyMap[id] = null;
        }
      }));
    } else {
      console.warn("getPartyById() fehlt – partyTitle kommt nur aus invitation.party");
    }

    // Data mappen
    data = filtered.map(inv => {
      const sid = readId(inv, "sender");
      const rid = readId(inv, "recipient");

      const sender = sid != null ? userMap[String(sid)] : null;
      const recipient = rid != null ? userMap[String(rid)] : null;

      const partyId =
        (inv.party && typeof inv.party === "object" ? inv.party.id : null) ??
        inv.partyId ?? inv.party_id ??
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
        if (p) partyTitle = p.title ?? p.name ?? null;
      }

      const message =
        rid != null && String(rid) === String(currentUserId)
          ? `${getUsername(sender, sid)} hat dich zu "${partyTitle ?? "einem Event"}" eingeladen`
          : `${getUsername(sender, sid)} sent ${getUsername(recipient, rid)} an invitation${partyTitle ? ` to ${partyTitle}` : ""}`;

      return {
        id: inv.id ?? inv.invitationId ?? `${sid}-${rid}-${Math.random()}`,
        invitationId: inv.id ?? inv.invitationId ?? null,
        partyId: partyId != null ? Number(partyId) : null,
        text: message,
        actorAvatar: sender?.id ? `/api/users/${sender.id}/profile-picture` : "./images/profile.jpeg",
        actorProfile: sender?.distinctName ? `/profile/profile.html?handle=${sender.distinctName}` : "#",
        _raw: inv
      };
    });

  } catch (e) {
    console.error("Load failed:", e);
    data = [];
  }

  function render() {
    list.innerHTML = "";

    if (!data.length) {
      list.innerHTML = "<p class='muted'>Keine Benachrichtigungen</p>";
      return;
    }

    data.forEach(item => {
      const clone = tpl.content.cloneNode(true);

      const img = clone.querySelector(".notif-avatar img");
      if (img) {
        img.src = item.actorAvatar || "./images/profile.jpeg";
        img.onerror = function () {
          this.onerror = null;
          this.src = "./images/profile.jpeg";
        };
      }

      const link = clone.querySelector(".avatar-link");
      if (link) link.href = item.actorProfile || "#";

      clone.querySelector(".notif-message").textContent = item.text;
      clone.querySelector(".notif-time").textContent = "vor kurzem";

      const actions = clone.querySelector(".notif-actions");
      const viewBtn = clone.querySelector(".btn-view-party");
      const acceptBtn = clone.querySelector(".btn-accept");
      const dismissBtn = clone.querySelector(".btn-dismiss");

      if (viewBtn) {
        viewBtn.addEventListener("click", () => {
          if (item.partyId) {
            window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${item.partyId}`;
          } else {
            showToast("Keine Party-Information vorhanden", "error");
          }
        });
      }

      if (acceptBtn) {
        acceptBtn.addEventListener("click", async () => {
          try {
            if (typeof attendParty === "function" && item.partyId) await attendParty(item.partyId);
            if (typeof deleteInvite === "function" && item.invitationId) await deleteInvite(item.invitationId);

            const idx = data.findIndex(d => d.id === item.id);
            if (idx > -1) data.splice(idx, 1);
            render();
            showToast("Einladung angenommen ✓", "success");
          } catch (err) {
            console.error("Accept failed", err);
            showToast("Fehler beim Annehmen", "error");
          }
        });
      }

      if (dismissBtn) {
        dismissBtn.addEventListener("click", async () => {
          try {
            if (typeof deleteInvite === "function" && item.invitationId) await deleteInvite(item.invitationId);

            const idx = data.findIndex(d => d.id === item.id);
            if (idx > -1) data.splice(idx, 1);
            render();
            showToast("Einladung abgelehnt", "error");
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
