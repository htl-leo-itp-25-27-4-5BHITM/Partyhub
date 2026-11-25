/*
 * E-mail change. The backend needs a fresh password confirmation, so on REAUTH_REQUIRED the page
 * sends the user through the Keycloak password prompt and resubmits the address afterwards.
 */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.settings.ready();
  if (!user) return;

  const RESUME_KEY = "partyhub_email_change_input";
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const form = document.getElementById("emailForm");
  const input = document.getElementById("newEmail");
  const error = document.getElementById("newEmail-error");
  const status = document.getElementById("emailStatus");
  const submitBtn = document.getElementById("submitBtn");
  const pendingSection = document.getElementById("pendingSection");
  const messages = {
    SAME_EMAIL: "This is already your e-mail address.",
    EMAIL_TAKEN: "This e-mail address is already used by another account.",
    RATE_LIMITED: "Too many requests. Please try again in an hour.",
    TEMPORARY_ERROR: "E-mail changes are not available right now. Please try again later.",
    NO_PENDING_CHANGE: "There is no pending change anymore.",
  };

  async function loadCurrentEmail() {
    const response = await window.settings.api("/api/users/me");
    const me = response.ok ? await response.json() : user;
    document.getElementById("currentEmail").textContent = me.email || "No e-mail address";
  }
  loadCurrentEmail();

  function showStatus(message, kind) {
    status.textContent = message || "";
    status.className = `status-box ${kind || ""}`;
    status.hidden = !message;
  }

  function setFieldError(message) {
    error.textContent = message || "";
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }

  function showPending(pending) {
    pendingSection.hidden = !pending?.pending;
    if (!pending?.pending) return;
    document.getElementById("pendingEmail").textContent = pending.newEmail;
    const expires = new Date(pending.expiresAt);
    document.getElementById("pendingExpiry").textContent =
      `The link is valid until ${expires.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}.`;
  }

  async function loadPending() {
    const response = await window.settings.api("/api/me/email-change");
    if (response.ok) showPending(await response.json());
  }

  async function submit(newEmail) {
    setFieldError("");
    showStatus("");
    if (!EMAIL.test(newEmail)) {
      setFieldError("Enter a valid e-mail address.");
      input.focus();
      return;
    }
    window.settings.setBusy(submitBtn, true);
    try {
      const response = await window.settings.api("/api/me/email-change", {
        method: "POST",
        body: JSON.stringify({ newEmail }),
      });
      if (response.status === 201) {
        sessionStorage.removeItem(RESUME_KEY);
        const pending = await response.json();
        showPending(pending);
        form.reset();
        showStatus(`We sent a confirmation link to ${pending.newEmail}.`, "success");
        return;
      }
      const problem = await window.settings.readError(response, "Your e-mail could not be changed.");
      if (problem.code === "REAUTH_REQUIRED") {
        // Keycloak asks for the current password, then returns here and we resubmit.
        sessionStorage.setItem(RESUME_KEY, newEmail);
        await window.authService.login({ redirectTo: "/settings/email.html?resume=1", prompt: "login", maxAge: 0 });
        return;
      }
      sessionStorage.removeItem(RESUME_KEY);
      const message = messages[problem.code] || problem.message;
      if (problem.field === "newEmail" || response.status === 400) setFieldError(message);
      else showStatus(message, "error");
    } catch {
      showStatus("Your e-mail could not be changed. Check your connection and try again.", "error");
    } finally {
      window.settings.setBusy(submitBtn, false);
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submit(input.value.trim());
  });

  document.getElementById("resendBtn").addEventListener("click", async (event) => {
    const button = event.currentTarget;
    window.settings.setBusy(button, true);
    try {
      const response = await window.settings.api("/api/me/email-change/resend", { method: "POST" });
      if (response.ok) {
        showPending(await response.json());
        window.settings.toast("We sent a new confirmation link");
      } else {
        const problem = await window.settings.readError(response, "The link could not be sent again.");
        window.settings.toast(messages[problem.code] || problem.message, { error: true });
        loadPending();
      }
    } finally {
      window.settings.setBusy(button, false);
    }
  });

  document.getElementById("cancelBtn").addEventListener("click", async () => {
    const confirmed = await window.settings.confirmDialog({
      title: "Cancel e-mail change?",
      message: "The confirmation link will stop working and your current address stays.",
      confirmLabel: "Cancel change",
      cancelLabel: "Keep it",
    });
    if (!confirmed) return;
    const response = await window.settings.api("/api/me/email-change", { method: "DELETE" });
    if (response.ok) {
      showPending(null);
      showStatus("");
      window.settings.toast("E-mail change cancelled");
    } else {
      window.settings.toast("The change could not be cancelled.", { error: true });
    }
  });

  await loadPending();
  const resume = new URLSearchParams(window.location.search).get("resume");
  const stored = sessionStorage.getItem(RESUME_KEY);
  if (resume && stored) {
    history.replaceState(null, "", "/settings/email.html");
    input.value = stored;
    sessionStorage.removeItem(RESUME_KEY);
    submit(stored);
  }
});
