(() => {
  const actions = document.getElementById("accountActions");
  async function update() {
    try {
      await window.authService.init();
    } catch (error) {
      console.error("Could not restore session", error);
    }
    actions.hidden = window.authService.isLoggedIn();
  }
  actions.addEventListener("click", async (event) => {
    const link = event.target.closest("a");
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    try {
      const action = link.pathname.includes("/register/") ? "register" : "login";
      await window.authService[action]({ redirectTo: "/index.html" });
    } catch (error) {
      // The compatibility route provides a retry screen if navigation fails.
      window.location.assign(link.href);
    }
  });
  window.addEventListener("pageshow", update);
})();
