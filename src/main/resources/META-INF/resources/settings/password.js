/* Password change runs as Keycloak's UPDATE_PASSWORD action; Keycloak reports the result back. */
document.addEventListener("DOMContentLoaded", async () => {
  if (!(await window.settings.ready())) return;

  const status = document.getElementById("passwordStatus");
  const result = new URLSearchParams(window.location.search).get("kc_action_status");
  const messages = {
    success: ["Your password was changed. We sent you a confirmation e-mail.", "success"],
    cancelled: ["Your password was not changed.", ""],
    error: ["Your password could not be changed. Please try again.", "error"],
  };
  if (result && messages[result]) {
    const [message, kind] = messages[result];
    status.textContent = message;
    status.className = `status-box ${kind}`;
    status.hidden = false;
    history.replaceState(null, "", window.location.pathname);
  }

  document.getElementById("changePasswordBtn").addEventListener("click", (event) => {
    window.settings.setBusy(event.currentTarget, true);
    window.authService.login({ kcAction: "UPDATE_PASSWORD", redirectTo: "/settings/password.html" });
  });

  document.getElementById("forgotLink").addEventListener("click", (event) => {
    event.preventDefault();
    const url = new URL(`${window.authService.config.issuer}/login-actions/reset-credentials`);
    url.searchParams.set("client_id", window.authService.config.clientId);
    window.location.href = url.toString();
  });
});
