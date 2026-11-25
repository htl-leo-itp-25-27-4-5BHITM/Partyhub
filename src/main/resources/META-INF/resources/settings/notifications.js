/*
 * Notification settings. Every switch saves itself optimistically. While the master switch is
 * off the other switches are disabled but keep their values.
 */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.settings.ready())) return;

  const groups = {
    masterCard: [["allEnabled", "All notifications", "Turn every notification on or off at once"]],
    channelCard: [
      ["inAppEnabled", "In the app", "Your inbox in PartyHub"],
      ["emailEnabled", "By e-mail", "Including the weekly party digest"],
    ],
    categoryCard: [
      ["partyInvites", "Party invitations", "New invitations and withdrawn ones"],
      ["invitationResponses", "Answers to your parties", "Guests who accept, decline, join or leave"],
      ["partyUpdates", "Party updates", "Changes to parties you go to, and the weekly digest"],
      ["partyCancellations", "Cancelled parties", "When a party you go to is cancelled"],
      ["followEvents", "Followers", "Follow requests, accepted requests and new followers"],
      ["unfollows", "Unfollows", "When someone stops following you"],
    ],
  };
  const inputs = {};

  const response = await window.settings.api("/api/me/notification-settings");
  if (!response.ok) {
    window.settings.toast("Your notification settings could not be loaded.", { error: true });
    return;
  }
  const state = await response.json();

  function updateDisabled() {
    const masterOn = inputs.allEnabled.checked;
    Object.entries(inputs).forEach(([key, input]) => {
      if (key === "allEnabled") return;
      input.disabled = !masterOn;
      input.closest(".switch-row").classList.toggle("disabled", !masterOn);
    });
  }

  Object.entries(groups).forEach(([cardId, rows]) => {
    const card = document.getElementById(cardId);
    rows.forEach(([key, title, hint]) => {
      const row = document.createElement("div");
      row.className = "settings-row switch-row";
      const text = document.createElement("span");
      text.className = "row-text";
      const titleEl = document.createElement("span");
      titleEl.className = "row-title";
      titleEl.id = `label-${key}`;
      titleEl.textContent = title;
      const hintEl = document.createElement("span");
      hintEl.className = "row-hint";
      hintEl.id = `hint-${key}`;
      hintEl.textContent = hint;
      text.append(titleEl, hintEl);
      const wrap = document.createElement("span");
      wrap.className = "switch";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.setAttribute("role", "switch");
      input.setAttribute("aria-labelledby", titleEl.id);
      input.setAttribute("aria-describedby", hintEl.id);
      input.checked = state[key] !== false;
      const track = document.createElement("span");
      track.className = "track";
      wrap.append(input, track);
      row.append(text, wrap);
      card.appendChild(row);
      inputs[key] = input;

      window.settings.bindSwitch(input, async (value) => {
        if (key === "allEnabled") updateDisabled();
        const result = await window.settings.api("/api/me/notification-settings", {
          method: "PUT",
          body: JSON.stringify({ [key]: value }),
        });
        if (!result.ok) throw new Error("Could not save the notification setting. Please try again.");
      });
      input.addEventListener("rollback", () => { if (key === "allEnabled") updateDisabled(); });
    });
  });
  updateDisabled();
});
