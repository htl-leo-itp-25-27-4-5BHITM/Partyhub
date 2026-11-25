/* Shared helpers for the settings pages: auth gate, toast, confirm dialog, API errors, switches. */
(function () {
  let toastTimer = null;

  function toast(message, { error = false } = {}) {
    let element = document.querySelector(".settings-toast");
    if (!element) {
      element = document.createElement("div");
      element.className = "settings-toast";
      element.setAttribute("role", "status");
      element.setAttribute("aria-live", "polite");
      document.body.appendChild(element);
    }
    element.textContent = message;
    element.classList.toggle("error", error);
    element.classList.add("visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => element.classList.remove("visible"), 3200);
  }

  /** Resolves true when the user confirms. Uses a native <dialog> so focus and Escape work. */
  function confirmDialog({ title, message, confirmLabel = "Confirm", cancelLabel = "Cancel", danger = false }) {
    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "settings-dialog";
      dialog.setAttribute("aria-labelledby", "settings-dialog-title");
      const heading = document.createElement("h2");
      heading.id = "settings-dialog-title";
      heading.textContent = title;
      const text = document.createElement("p");
      text.textContent = message;
      const actions = document.createElement("div");
      actions.className = "settings-actions";
      const cancel = document.createElement("button");
      cancel.type = "button";
      cancel.className = "settings-btn";
      cancel.textContent = cancelLabel;
      const ok = document.createElement("button");
      ok.type = "button";
      ok.className = danger ? "settings-btn primary danger-confirm" : "settings-btn primary";
      ok.textContent = confirmLabel;
      actions.append(cancel, ok);
      dialog.append(heading, text, actions);
      document.body.appendChild(dialog);

      const close = (result) => {
        dialog.close();
        dialog.remove();
        resolve(result);
      };
      cancel.addEventListener("click", () => close(false));
      ok.addEventListener("click", () => close(true));
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        close(false);
      });
      dialog.showModal();
      cancel.focus();
    });
  }

  async function readError(response, fallback) {
    try {
      const body = await response.json();
      return { message: body.message || fallback, code: body.code, field: body.field, body };
    } catch {
      return { message: fallback };
    }
  }

  async function api(url, options = {}) {
    const response = await window.authService.apiCall(url, options);
    return response;
  }

  /**
   * Optimistic switch: shows the new value at once, saves it, and on failure restores the old
   * value with an error toast. Changes on one switch are sent one after another.
   */
  function bindSwitch(input, save) {
    let queue = Promise.resolve();
    input.addEventListener("change", () => {
      const value = input.checked;
      queue = queue.then(async () => {
        try {
          await save(value);
        } catch (error) {
          input.checked = !value;
          input.dispatchEvent(new Event("rollback"));
          toast(error?.message || "Could not save. Please try again.", { error: true });
        }
      });
    });
  }

  function setBusy(button, busy) {
    button.disabled = busy;
    if (busy) button.setAttribute("aria-busy", "true");
    else button.removeAttribute("aria-busy");
  }

  /** Waits for a valid login (redirects to Keycloak otherwise) and returns the current user. */
  async function ready() {
    const ok = await window.requireAuth();
    if (!ok) return null;
    return window.authService.getCurrentUser();
  }

  window.settings = { toast, confirmDialog, readError, api, bindSwitch, setBusy, ready };
})();
