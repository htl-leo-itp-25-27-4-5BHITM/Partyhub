/* Settings overview: short state hints per entry and logout with confirmation. */
document.addEventListener("DOMContentLoaded", async () => {
  const user = await window.settings.ready();
  if (!user) return;

  const themeNames = { LIGHT: "Light", DARK: "Dark", SYSTEM: "System" };
  const themeHint = document.getElementById("overview-theme");
  const showTheme = () => { themeHint.textContent = themeNames[window.partyhubTheme.get()] || "System"; };
  showTheme();
  window.addEventListener("partyhub:themechange", showTheme);

  document.getElementById("overview-email").textContent = user.email || "No e-mail address";

  try {
    const response = await window.settings.api("/api/me/privacy");
    if (response.ok) {
      const privacy = await response.json();
      document.getElementById("overview-privacy").textContent = privacy.isPrivate ? "Private" : "Public";
    }
  } catch {
    // The hint is optional; the privacy page loads the state itself.
  }

  document.getElementById("logoutBtn").addEventListener("click", async () => {
    const confirmed = await window.settings.confirmDialog({
      title: "Log out?",
      message: "You will be logged out on this device. Your settings stay saved to your account.",
      confirmLabel: "Log out",
      danger: true,
    });
    if (confirmed) window.authService.logout();
  });
});
