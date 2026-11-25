/* The caller's blocked accounts with unblock (after confirmation). */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.settings.ready())) return;
  const list = document.getElementById("blockedList");

  function empty() {
    list.replaceChildren();
    const message = document.createElement("p");
    message.className = "empty-state";
    message.textContent = "You haven't blocked anyone.";
    list.appendChild(message);
  }

  function row(person) {
    const item = document.createElement("div");
    item.className = "settings-row person-row";
    const avatar = document.createElement("img");
    avatar.src = `/api/users/${person.id}/profile-picture`;
    avatar.alt = "";
    avatar.width = 40;
    avatar.height = 40;
    avatar.onerror = () => { avatar.onerror = null; avatar.src = "/images/default_profile-picture.svg"; };
    const text = document.createElement("span");
    text.className = "row-text";
    const name = document.createElement("span");
    name.className = "row-title";
    name.textContent = person.displayName || person.distinctName;
    const handle = document.createElement("span");
    handle.className = "row-hint";
    handle.textContent = `@${person.distinctName}`;
    text.append(name, handle);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-btn";
    button.textContent = "Unblock";
    button.setAttribute("aria-label", `Unblock ${name.textContent}`);
    button.addEventListener("click", async () => {
      const confirmed = await window.settings.confirmDialog({
        title: `Unblock ${name.textContent}?`,
        message: "You will see each other again. Earlier follows are not restored.",
        confirmLabel: "Unblock",
      });
      if (!confirmed) return;
      window.settings.setBusy(button, true);
      const response = await window.settings.api(`/api/me/blocks/${person.id}`, { method: "DELETE" });
      if (!response.ok) {
        window.settings.setBusy(button, false);
        window.settings.toast("Could not unblock. Please try again.", { error: true });
        return;
      }
      item.remove();
      if (!list.querySelector(".person-row")) empty();
      window.settings.toast(`${name.textContent} is unblocked`);
    });
    item.append(avatar, text, button);
    return item;
  }

  const response = await window.settings.api("/api/me/blocks");
  if (!response.ok) {
    window.settings.toast("Your blocked accounts could not be loaded.", { error: true });
    return;
  }
  const people = await response.json();
  if (!people.length) empty();
  else list.replaceChildren(...people.map(row));
});
