/** Shared authentication guard for protected pages and browser history restores. */
(function () {
  let checkPromise = null;
  const protectedPage = () => document.body?.hasAttribute("data-auth-required");
  function hideProtectedContent() {
    if (protectedPage()) document.body.removeAttribute("data-auth-ready");
  }
  window.requireAuth = function () {
    if (!checkPromise) {
      checkPromise = (async () => {
        hideProtectedContent();
        try {
          const authenticated = await window.authService.init({
            requireLogin: true,
            redirectTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
          });
          if (authenticated && protectedPage()) document.body.setAttribute("data-auth-ready", "true");
          return authenticated;
        } catch (error) {
          console.error("Authentication check failed", error);
          return false;
        }
      })().finally(() => { checkPromise = null; });
    }
    return checkPromise;
  };
  window.requireLogout = async function () {
    await window.authService.init();
    if (window.authService.isLoggedIn()) { window.location.replace("/index.html"); return false; }
    return true;
  };
  window.isAuthenticated = () => window.authService.isLoggedIn();
  window.getCurrentAuthUser = async () => { await window.authService.init(); return window.authService.getCurrentUser(); };
  window.makeAuthenticatedCall = (url, options = {}) => window.authService.apiCall(url, options);
  window.addEventListener("pagehide", hideProtectedContent);
  window.addEventListener("pageshow", () => { if (protectedPage()) window.requireAuth(); });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && protectedPage()) window.requireAuth();
  });
})();
