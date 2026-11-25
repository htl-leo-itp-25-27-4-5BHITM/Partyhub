/* Private / public account. Going public first explains that open requests will be accepted. */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.settings.ready())) return;

  const toggle = document.getElementById("privateSwitch");
  const requestsRow = document.getElementById("requestsRow");
  const requestsLabel = document.getElementById("requestsLabel");

  function show(state) {
    toggle.checked = state.isPrivate;
    requestsRow.hidden = !state.pendingRequests;
    requestsLabel.textContent = state.pendingRequests === 1 ? "1 follow request" : `${state.pendingRequests} follow requests`;
  }

  async function load() {
    const response = await window.settings.api("/api/me/privacy");
    if (!response.ok) throw new Error("Your privacy setting could not be loaded.");
    const state = await response.json();
    show(state);
    return state;
  }

  let state;
  try {
    state = await load();
  } catch (error) {
    window.settings.toast(error.message, { error: true });
    return;
  }

  async function send(body) {
    return window.settings.api("/api/me/privacy", { method: "PUT", body: JSON.stringify(body) });
  }

  toggle.addEventListener("change", async () => {
    const makePrivate = toggle.checked;
    let body = { isPrivate: makePrivate };
    if (!makePrivate && state.pendingRequests > 0) {
      const count = state.pendingRequests;
      const confirmed = await window.settings.confirmDialog({
        title: "Make your account public?",
        message: `Anyone will be able to see your profile and follow you directly. Your ${count === 1 ? "open follow request" : `${count} open follow requests`} will be accepted automatically.`,
        confirmLabel: "Make public",
      });
      if (!confirmed) {
        toggle.checked = true;
        return;
      }
      body = { isPrivate: false, acceptPendingRequests: true };
    }
    toggle.disabled = true;
    try {
      let response = await send(body);
      if (response.status === 409) {
        // A request arrived meanwhile; confirm again with the new count.
        state = await load();
        toggle.checked = true;
        window.settings.toast("New follow requests arrived. Please confirm again.", { error: true });
        return;
      }
      if (!response.ok) throw new Error();
      state = await response.json();
      show(state);
      window.settings.toast(state.isPrivate ? "Your account is now private" : "Your account is now public");
    } catch {
      toggle.checked = !makePrivate;
      window.settings.toast("Your privacy setting could not be saved. Please try again.", { error: true });
    } finally {
      toggle.disabled = false;
    }
  });
});
