(function () {
  let ready = false;
  let elements;

  document.addEventListener("DOMContentLoaded", async () => {
    if (window.requireAuth && !(await window.requireAuth())) return;
    elements = {
      list: document.getElementById("draftsList"),
      empty: document.getElementById("draftsEmpty"),
      error: document.getElementById("draftsError"),
      errorMessage: document.getElementById("draftsErrorMessage"),
      status: document.getElementById("draftsStatus"),
    };
    document.getElementById("retryDrafts").addEventListener("click", render);
    ready = true;
    render();
  });

  window.addEventListener("storage", () => { if (ready) render(); });
  window.addEventListener("pageshow", () => { if (ready) render(); });

  function currentStore() {
    const userId = window.authService?.getCurrentUserId?.()
      ?? window.getCurrentUserId?.()
      ?? sessionStorage.getItem("loggedInUserId");
    if (!userId) throw new Error("Current account unavailable");
    return window.PartyDrafts.forUser(userId);
  }

  function showError(message) {
    elements.errorMessage.textContent = message;
    elements.error.hidden = false;
    elements.empty.hidden = true;
  }

  function render() {
    elements.error.hidden = true;
    elements.status.textContent = "";
    try {
      const drafts = currentStore().list();
      const unreadable = drafts.unreadable || [];
      elements.list.replaceChildren(...drafts.map(makeRow), ...unreadable.map(makeUnreadableRow));
      elements.empty.hidden = drafts.length + unreadable.length > 0;
    } catch (error) {
      elements.list.replaceChildren();
      showError("Drafts could not be loaded. Check that browser storage is available, then try again.");
    }
  }

  function makeUnreadableRow(draft) {
    const row = document.createElement("li");
    row.className = "drafts-row";
    const label = document.createElement("span");
    label.textContent = "Unreadable draft";
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "drafts-action drafts-delete";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", "Delete unreadable draft");
    remove.addEventListener("click", () => {
      if (!window.confirm("Delete this unreadable draft? This cannot be undone.")) return;
      try {
        const removed = currentStore().removeUnreadable(draft.id);
        render();
        elements.status.textContent = removed ? "Draft deleted." : "Draft changed. The list has been refreshed.";
      } catch { showError("Draft could not be deleted. Please try again."); }
    });
    row.append(label, remove);
    return row;
  }

  function makeRow(draft) {
    const title = typeof draft.fields?.title === "string" && draft.fields.title.trim()
      ? draft.fields.title.trim() : "Untitled party";
    const href = `/addParty/addParty.html?draft=${encodeURIComponent(draft.id)}`;
    const row = document.createElement("li");
    row.className = "drafts-row";
    const details = document.createElement("div");
    details.className = "drafts-details";
    const name = document.createElement("a");
    name.className = "drafts-title";
    name.href = href;
    name.textContent = title;
    details.append(name);

    const date = new Date(draft.updatedAt);
    if (!Number.isNaN(date.getTime())) {
      const updated = document.createElement("time");
      updated.className = "drafts-updated";
      updated.dateTime = date.toISOString();
      updated.textContent = `Edited ${new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium", timeStyle: "short",
      }).format(date)}`;
      details.append(updated);
    }

    const actions = document.createElement("div");
    actions.className = "drafts-row-actions";
    const resume = document.createElement("a");
    resume.className = "drafts-action";
    resume.href = href;
    resume.textContent = "Continue editing";
    resume.setAttribute("aria-label", `Continue editing ${title}`);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "drafts-action drafts-delete";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${title}`);
    remove.addEventListener("click", () => {
      if (!window.confirm(`Delete “${title}”? This cannot be undone.`)) return;
      try {
        currentStore().remove(draft.id);
        render();
        if (elements.error.hidden) elements.status.textContent = "Draft deleted.";
      } catch (error) {
        showError("Draft could not be deleted. Please try again.");
      }
    });
    actions.append(resume, remove);
    row.append(details, actions);
    return row;
  }
})();
