document.addEventListener("DOMContentLoaded", async () => {
    let data = [];

    try {
        const invitations = await getReceivedInvites();
        if (invitations) {
            data = invitations.map(invitation => ({
                id: invitation.id,
                type: "invite",
                actorName: invitation.sender.displayName || invitation.sender.distinctName,
                actorAvatar: `/api/users/${invitation.sender.id}/profile-picture`,
                actorProfile: `/profile/profile.html?handle=${invitation.sender.distinctName}`,
                party: invitation.party.title,
                partyId: invitation.party.id,
                time: "vor kurzem",
                invitationId: invitation.id
            }));
        }
    } catch (error) {
        console.error("Failed to load invitations:", error);
        data = [];
    }

    const list = document.getElementById("notifList");
    const tpl = document.getElementById("notifTpl");
    const toastContainer = document.getElementById("toastContainer");

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

            // set avatar image + profile link
            const avatarLink = clone.querySelector(".avatar-link");
            const avatarImg = clone.querySelector(".notif-avatar img");
            avatarImg.src = item.actorAvatar || "/images/default_profile-picture.jpg";
            avatarImg.alt = item.actorName
                ? item.actorName + " Profilbild"
                : "Profilbild";
            avatarImg.onerror = function() {
                this.src = "/images/default_profile-picture.jpg";
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