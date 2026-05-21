(function () {
  const CURRENT_USER_KEY = "partyhub_current_user";

  function readCurrentUser() {
    try {
      if (window.authService?.getUserInfo) {
        const user = window.authService.getUserInfo();
        if (user) return user;
      }

      const raw = sessionStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn("getCurrentUserId: Error reading current user", error);
      return null;
    }
  }

  window.getCurrentUserId = function () {
    return readCurrentUser()?.id ?? null;
  };

  window.setCurrentUserId = function (id) {
    const user = readCurrentUser() || {};
    sessionStorage.setItem(CURRENT_USER_KEY, JSON.stringify({ ...user, id }));
    sessionStorage.setItem("loggedInUserId", String(id));
  };

  window.clearCurrentUserId = function () {
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem("loggedInUserId");
  };

  window.isUserLoggedIn = function () {
    return window.authService?.isLoggedIn?.() === true;
  };
})();
