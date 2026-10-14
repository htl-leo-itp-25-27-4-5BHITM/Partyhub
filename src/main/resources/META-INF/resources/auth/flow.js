/** Automatic entry points retained for bookmarked authentication URLs. */
(() => {
  const status = document.getElementById("status");
  const retry = document.getElementById("retry");
  async function start() {
    retry.hidden = true;
    try {
      const auth = window.authService;
      await auth.init();
      const action = document.body.dataset.authAction;
      if (action === "logout") {
        auth.logout();
      } else if (auth.isLoggedIn()) {
        window.location.replace("/index.html");
      } else {
        await auth[action]({ redirectTo: "/index.html" });
      }
    } catch (error) {
      console.error("Authentication navigation failed", error);
      status.textContent = "We couldn’t connect. Please try again or return home.";
      retry.hidden = false;
    }
  }
  // Reload resets any interrupted authentication navigation before retrying.
  retry.addEventListener("click", () => window.location.reload());
  start();
})();
