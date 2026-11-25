/* Edit profile in settings: dirty-aware saving, inline field errors and an unsaved-changes guard. */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.settings.ready())) return;

  const FIELDS = ["displayName", "distinctName", "phoneNumber", "biography", "gender", "birthDate"];
  const HANDLE = /^[A-Za-z0-9._]{3,30}$/;
  const form = document.getElementById("profileForm");
  const saveBtn = document.getElementById("saveBtn");
  const status = document.getElementById("formStatus");
  const picture = document.getElementById("pictureImg");
  const pictureInput = document.getElementById("pictureInput");
  const pictureRemove = document.getElementById("pictureRemove");
  const input = (id) => document.getElementById(id);

  let saved = {};
  let user = null;

  function values() {
    return Object.fromEntries(FIELDS.map((id) => [id, input(id).value.trim()]));
  }

  function isDirty() {
    const now = values();
    return FIELDS.some((id) => now[id] !== saved[id]);
  }

  function showStatus(message, kind) {
    status.textContent = message;
    status.className = `status-box ${kind || ""}`;
    status.hidden = !message;
  }

  function setError(id, message) {
    const element = input(id);
    const error = document.getElementById(`${id}-error`);
    if (error) error.textContent = message || "";
    if (message) element.setAttribute("aria-invalid", "true");
    else element.removeAttribute("aria-invalid");
  }

  function validate() {
    const now = values();
    let ok = true;
    FIELDS.forEach((id) => setError(id, ""));
    if (!now.displayName) {
      setError("displayName", "Enter a display name");
      ok = false;
    }
    // Older handles stay valid until they are changed.
    if (now.distinctName !== saved.distinctName && !HANDLE.test(now.distinctName)) {
      setError("distinctName", "Use 3–30 letters, digits, dots or underscores");
      ok = false;
    }
    if (/<[^>]+>/.test(now.biography)) {
      setError("biography", "The biography must not contain HTML");
      ok = false;
    }
    if (now.birthDate && new Date(now.birthDate) >= new Date(new Date().toDateString())) {
      setError("birthDate", "The date of birth must be in the past");
      ok = false;
    }
    return ok;
  }

  function refreshSave() {
    saveBtn.disabled = !isDirty();
  }

  function fill(profile) {
    user = profile;
    input("displayName").value = profile.displayName || "";
    input("distinctName").value = profile.distinctName || "";
    input("email").value = profile.email || "";
    input("phoneNumber").value = profile.phoneNumber || "";
    input("biography").value = profile.biography || "";
    input("gender").value = profile.gender || "";
    input("birthDate").value = profile.birthDate || "";
    input("birthDate").max = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    saved = values();
    refreshSave();
  }

  async function loadPicture() {
    picture.onerror = () => { picture.onerror = null; picture.src = "/images/default_profile-picture.svg"; };
    picture.src = `/api/users/${user.id}/profile-picture?v=${Date.now()}`;
    try {
      const response = await window.settings.api(`/api/users/${user.id}/profile-picture-filename`);
      const data = await response.json();
      pictureRemove.hidden = !data.filename;
    } catch {
      pictureRemove.hidden = true;
    }
  }

  const response = await window.settings.api("/api/users/me");
  if (!response.ok) {
    showStatus("Your profile could not be loaded. Please reload the page.", "error");
    return;
  }
  fill(await response.json());
  loadPicture();

  form.addEventListener("input", () => {
    refreshSave();
    showStatus("");
  });
  form.addEventListener("change", refreshSave);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isDirty() || !validate()) return;
    const now = values();
    window.settings.setBusy(saveBtn, true);
    saveBtn.textContent = "Saving…";
    try {
      const result = await window.settings.api(`/api/users/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          displayName: now.displayName,
          distinctName: now.distinctName,
          phoneNumber: now.phoneNumber || null,
          biography: now.biography,
          gender: now.gender || null,
          birthDate: now.birthDate || null,
        }),
      });
      if (!result.ok) {
        const error = await window.settings.readError(result, "Your profile could not be saved.");
        if (error.field && input(error.field)) setError(error.field, error.message);
        else if (result.status === 400 && now.birthDate) setError("birthDate", "The date of birth must be in the past");
        showStatus(error.field ? "Please check the highlighted field." : error.message, "error");
        return;
      }
      const updated = await result.json();
      fill(updated);
      // Keep the cached user of this tab in sync with the new profile.
      window.authService.storeUser(updated.id, { ...window.authService.getUserInfo(), ...updated });
      showStatus("Your profile was saved.", "success");
    } catch {
      showStatus("Your profile could not be saved. Check your connection and try again.", "error");
    } finally {
      window.settings.setBusy(saveBtn, false);
      saveBtn.textContent = "Save changes";
      refreshSave();
    }
  });

  pictureInput.addEventListener("change", async () => {
    const file = pictureInput.files[0];
    pictureInput.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      window.settings.toast("Choose a JPEG, PNG, GIF or WebP image.", { error: true });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      window.settings.toast("The image must be smaller than 5 MB.", { error: true });
      return;
    }
    const data = new FormData();
    data.append("file", file);
    const result = await window.settings.api(`/api/users/${user.id}/upload-profile-picture`, { method: "POST", body: data });
    if (!result.ok) {
      const error = await window.settings.readError(result, "The picture could not be uploaded.");
      window.settings.toast(error.body?.error || error.message, { error: true });
      return;
    }
    window.settings.toast("Profile picture updated");
    loadPicture();
  });

  pictureRemove.addEventListener("click", async () => {
    const confirmed = await window.settings.confirmDialog({
      title: "Remove profile picture?",
      message: "Your profile will show the default picture.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!confirmed) return;
    const result = await window.settings.api(`/api/users/${user.id}/profile-picture`, { method: "DELETE" });
    if (!result.ok) {
      window.settings.toast("The picture could not be removed.", { error: true });
      return;
    }
    window.settings.toast("Profile picture removed");
    loadPicture();
  });

  // Unsaved changes: ask before leaving through the back button, a link or closing the tab.
  window.addEventListener("beforeunload", (event) => {
    if (isDirty()) {
      event.preventDefault();
      event.returnValue = "";
    }
  });
  document.querySelectorAll("a[href]").forEach((link) => link.addEventListener("click", async (event) => {
    if (!isDirty() || link.target === "_blank") return;
    event.preventDefault();
    const leave = await window.settings.confirmDialog({
      title: "Discard changes?",
      message: "You have unsaved changes on this page.",
      confirmLabel: "Discard",
      cancelLabel: "Keep editing",
      danger: true,
    });
    if (leave) {
      saved = values();
      window.location.href = link.href;
    }
  }));
});
