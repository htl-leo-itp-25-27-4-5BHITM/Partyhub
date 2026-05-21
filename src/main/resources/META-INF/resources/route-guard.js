/**
 * Route Guard - Protects pages that require authentication.
 */

(function () {
  window.requireAuth = async function () {
    const authenticated = await window.authService.init({
      requireLogin: true,
      redirectTo: `${window.location.pathname}${window.location.search}${window.location.hash}`,
    });
    return authenticated;
  };

  window.requireLogout = async function () {
    await window.authService.init();
    if (window.authService.isLoggedIn()) {
      window.location.href = "/index.html";
      return false;
    }
    return true;
  };

  window.isAuthenticated = function () {
    return window.authService.isLoggedIn();
  };

  window.getCurrentAuthUser = async function () {
    await window.authService.init();
    return window.authService.getCurrentUser();
  };

  window.makeAuthenticatedCall = function (url, options = {}) {
    return window.authService.apiCall(url, options);
  };
})();
