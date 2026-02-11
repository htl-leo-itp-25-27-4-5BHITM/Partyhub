document.addEventListener("DOMContentLoaded", async () => {
    let data = [];

    // Helper: read logged-in user id from storages (sessionStorage preferred)
    const STORAGE_KEY = 'loggedInUserId';
    function getLoggedInUserId() {
        try {
            const s = sessionStorage.getItem(STORAGE_KEY);
            if (s) return Number(s);
            const l = localStorage.getItem(STORAGE_KEY);
            return l ? Number(l) : null;
        } catch (e) {
            return null;
        }
    }
    // allow updating later if not present in storage
    let loggedInId = getLoggedInUserId();

    // If no stored id, try to ask the backend which user is logged-in (best-effort)
    async function fetchCurrentUserFromBackend() {
        const endpoints = ['/api/auth/me', '/api/users/me', '/api/session', '/api/users/current'];
        for (const u of endpoints) {
            try {
                const res = await fetch(u);
                if (!res.ok) continue;
                const data = await res.json().catch(() => null);
                if (!data) continue;
                if (typeof data === 'number') return Number(data);
                if (data && typeof data === 'object') {
                    if (data.id) return Number(data.id);
                    if (data.user && data.user.id) return Number(data.user.id);
                }
            } catch (err) {
                /* ignore and try next endpoint */
            }
        }
        return null;
    }

    try {
        const invitations = await getReceivedInvites();
        console.debug('notifications: raw invitations', invitations);
        console.debug('notifications: loggedInId (from storage)', loggedInId);

        // If we don't have a stored id, try to fetch from backend session endpoints
        if (!loggedInId) {
            try {
                const fetchedId = await fetchCurrentUserFromBackend();
                if (fetchedId) {
                    loggedInId = fetchedId;
                    console.debug('notifications: loggedInId obtained from backend:', loggedInId);
                } else {
                    console.debug('notifications: no loggedInId from backend (anonymous)');
                }
            } catch (e) {
                console.debug('notifications: fetchCurrentUserFromBackend failed', e);
            }
        }

        if (invitations) {
            // robust helper: erkennen, ob eine Einladung für userId bestimmt ist
            function isInviteForUser(inv, userId) {
                if (!userId) return true; // keine stored id -> keine Einschränkung
                const idStr = String(userId);
                // direct fields
                const candidates = [
                    inv.recipient, inv.recipientId, inv.recipient_id, inv.to, inv.toUser, inv.to_user,
                    inv.receiver, inv.receiverId, inv.receiver_id, inv.userId, inv.user_id
                ];
                // DEBUG: collect candidate string values for inspection
                const candidateStrs = [];
                for (const c of candidates) {
                    if (c == null) continue;
                    if (typeof c === 'object') {
                        const v = c.id ?? c.userId ?? c.user_id ?? c.recipientId ?? c.recipient_id;
                        candidateStrs.push(String(v ?? 'object'));
                        if (v != null && String(v) === idStr) {
                            console.debug('isInviteForUser: matched via object field', v, 'for invitation', inv.id ?? inv);
                            return true;
                        }
                    } else {
                        candidateStrs.push(String(c));
                        if (String(c) === idStr) {
                            console.debug('isInviteForUser: matched via direct field', c, 'for invitation', inv.id ?? inv);
                            return true;
                        }
                    }
                }
                // If nothing matched, print candidates for debugging
                console.debug('isInviteForUser: no match for invitation', inv.id ?? inv, 'candidates=', candidateStrs, 'looking for', idStr);
                // nested shapes: invitation.party?.recipient etc.
                try {
                    const nested = (inv.recipient && typeof inv.recipient === 'object') ? (inv.recipient.id ?? inv.recipient.userId) : null;
                    if (nested != null && String(nested) === idStr) return true;
                } catch (e) {}
                return false;
            }

            // Versuche zunächst die Einladungen zu filtern (robuste Prüffunktion).
            let relevant = Array.isArray(invitations) ? invitations.filter(inv => isInviteForUser(inv, loggedInId)) : [];
            console.debug('notifications: relevant invitations after filter ->', relevant.length);

            // FALLBACK: falls die clientseitige Prüfung alle Einträge entfernt hat,
            // aber das Backend bereits Items geliefert hat, verwende die Backend‑Liste.
            if ((relevant.length === 0) && Array.isArray(invitations) && invitations.length > 0) {
                console.warn('notifications: client filter removed all items — falling back to backend-provided invitations');
                relevant = Array.from(invitations);
            }

            // Sammle Sender-IDs und lade Benutzerdaten (Cache)
            const senderIds = new Set();
            relevant.forEach(inv => {
                // Der Sender kann in verschiedenen Feldern stecken; prüfen und sammeln
                const s = inv.sender ?? inv.from ?? inv.senderUser ?? inv.sender_info;
                const sid = (s && typeof s === 'object') ? (s.id ?? s.userId ?? s.user_id) : (inv.senderId ?? inv.sender_id ?? inv.fromId ?? inv.from_id ?? s);
                if (sid != null) senderIds.add(String(sid));
            });

            const senderMap = {};
            await Promise.all(Array.from(senderIds).map(async id => {
                try {
                    const u = await getUserById(id);
                    if (u) senderMap[String(id)] = u;
                } catch (e) {
                    senderMap[String(id)] = null;
                }
            }));

            data = relevant.map(invitation => {
                // resolve sender info robustly (fallback to fields inside invitation)
                const sCandidate = invitation.sender ?? invitation.from ?? invitation.senderUser ?? invitation.sender_info;
                const sid = (sCandidate && typeof sCandidate === 'object') ? (sCandidate.id ?? sCandidate.userId ?? sCandidate.user_id) : (invitation.senderId ?? invitation.sender_id ?? invitation.fromId ?? invitation.from_id ?? sCandidate);
                const senderUser = sid ? senderMap[String(sid)] : null;
                const actorName = senderUser?.displayName || senderUser?.distinctName || senderUser?.username || invitation.senderName || invitation.fromName || 'Unbekannt';
                const actorAvatar = senderUser?.id ? `/api/users/${senderUser.id}/profile-picture` : defaultAvatarDataUri();
                const actorProfile = senderUser?.distinctName ? `/profile/profile.html?handle=${senderUser.distinctName}` : (invitation.senderDistinctName ? `/profile/profile.html?handle=${invitation.senderDistinctName}` : '#');

                return {
                    id: invitation.id,
                    type: "invite",
                    actorName,
                    actorAvatar,
                    actorProfile,
                    party: invitation.party?.title || invitation.party?.name || 'Event',
                    partyId: invitation.party?.id,
                    time: "vor kurzem",
                    invitationId: invitation.id,
                    _raw: invitation
                };
            });
            console.debug('notifications: loaded', invitations.length, 'invitations, after filter ->', data.length);
            // Zeige komplette Datenstruktur und eine kompakte Tabelle in der Console
            console.debug('notifications: data (full)', data);
            try {
                console.table(data.map(d => ({
                    id: d.id,
                    actorName: d.actorName,
                    party: d.party,
                    invitationId: d.invitationId
                })));
            } catch (e) { /* ignore table errors in older consoles */ }
        }
    } catch (error) {
        console.error("Failed to load invitations:", error);
        data = [];
    }

    const list = document.getElementById("notifList");
    const tpl = document.getElementById("notifTpl");
    const toastContainer = document.getElementById("toastContainer");

    // Inline default avatar to avoid 404s
    function defaultAvatarDataUri() {
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 120 120">
                <rect width="100%" height="100%" fill="#6b6b6b"/>
                <text x="50%" y="50%" fill="#fff" font-size="24" font-family="Arial" text-anchor="middle" dominant-baseline="central">No Img</text>
            </svg>`
        );
    }

    function showToast(message, type = "success") {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        let iconSVG = "";
        if (type === "success") {
            iconSVG =
                '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        } else if (type === "error") {
            iconSVG =
                '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
        }

        toast.innerHTML = `
        <div class="toast-icon">${iconSVG}</div>
        <span>${message}</span>
      `;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 2500);
    }

    function render() {
        list.innerHTML = "";
        if (!data.length) {
            const empty = document.createElement("p");
            empty.className = "muted";
            empty.textContent = "Keine Benachrichtigungen";
            list.appendChild(empty);
            return;
        }
        data.forEach((item) => {
            const clone = tpl.content.cloneNode(true);
            const card = clone.querySelector(".notif-card");
            card.dataset.id = item.id;

            // Debug: log jede Notification beim Rendern (inkl. originales Rohobjekt)
            console.debug('notifications: rendering item', { id: item.id, actorName: item.actorName, party: item.party, invitationId: item.invitationId, raw: item._raw });

            // set avatar image + profile link
            const avatarLink = clone.querySelector(".avatar-link");
            const avatarImg = clone.querySelector(".notif-avatar img");
            avatarImg.src = item.actorAvatar || defaultAvatarDataUri();
            avatarImg.alt = item.actorName
                ? item.actorName + " Profilbild"
                : "Profilbild";
            avatarImg.onerror = function() {
                this.onerror = null;
                this.src = defaultAvatarDataUri();
            };
            avatarLink.href = item.actorProfile || "#";

            let message = item.text || "";
            if (item.type === "invite") {
                message = `Du wurdest von ${item.actorName || "jemandem"} zu ${
                    item.party || "einem Event"
                } eingeladen`;
            } else if (item.type === "view") {
                message = `${
                    item.actorName || "Jemand"
                } hat dein Profil angesehen`;
            } else if (item.type === "like") {
                message = `${
                    item.actorName || "Jemand"
                } hat deinen Beitrag geliked`;
            }

            clone.querySelector(".notif-message").textContent = message;
            clone.querySelector(".notif-time").textContent = item.time || "";

            const actions = clone.querySelector(".notif-actions");
            const viewPartyBtn = clone.querySelector(".btn-view-party");
            const acceptBtn = clone.querySelector(".btn-accept");
            const dismissBtn = clone.querySelector(".btn-dismiss");

            if (item.type !== "invite") {
                acceptBtn.style.display = "none";
                viewPartyBtn.style.display = "none";
            }

            viewPartyBtn.addEventListener("click", () => {
                window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${item.partyId}`;
            });

            acceptBtn.addEventListener("click", async () => {
                try {
                    await attendParty(item.partyId);
                    await deleteInvite(item.invitationId);
                    console.log(await deleteInvite(item.invitationId));
                    console.log(item.invitationId);

                    const badge = document.createElement("div");
                    badge.className = "accepted-badge";
                    badge.innerHTML =
                        '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>angenommen</span>';
                    actions.replaceWith(badge);

                    const idx = data.findIndex((d) => d.id == item.id);
                    if (idx > -1) data.splice(idx, 1);
                    render();
                    showToast("Einladung angenommen ✓", "success");
                } catch (error) {
                    console.error("Error accepting invitation:", error);
                    showToast("Fehler beim Annehmen der Einladung", "error");
                }
            });

            dismissBtn.addEventListener("click", async () => {
                if (item.type === "invite") {
                    try {
                        await deleteInvite(item.invitationId);
                        const rejected = document.createElement("div");
                        rejected.className = "rejected-badge";
                        rejected.innerHTML =
                            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span>abgelehnt</span>';
                        actions.replaceWith(rejected);

                        const idx = data.findIndex((d) => d.id == item.id);
                        if (idx > -1) data.splice(idx, 1);
                        render();

                        showToast("Einladung abgelehnt", "error");
                    } catch (error) {
                        console.error("Error rejecting invitation:", error);
                        showToast("Fehler beim Ablehnen der Einladung", "error");
                    }
                } else {
                    card.style.opacity = "0";
                    card.style.transform = "translateY(6px)";
                    showToast("Benachrichtigung entfernt", "error");
                    setTimeout(() => {
                        const idx = data.findIndex((d) => d.id == item.id);
                        if (idx > -1) data.splice(idx, 1);
                        render();
                    }, 180);
                }
            });

            list.prepend(clone);
        });
    }

    render();
});

function markActiveNav() {
    const nav = document.querySelector(".bottom-nav");
    if (!nav) return;
    const links = nav.querySelectorAll(".nav-btn");
    links.forEach((a) => {
        const icon = a.querySelector(".nav-icon");
        if (!icon) return;
        icon.classList.remove("icon--green");
        icon.classList.add("icon--pink");
        a.classList.remove("active");

        const href = a.getAttribute("href") || "";
        if (href.includes("notifications")) {
            icon.classList.remove("icon--pink");
            icon.classList.add("icon--green");
            a.classList.add("active");
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", markActiveNav);
} else {
    markActiveNav();
}