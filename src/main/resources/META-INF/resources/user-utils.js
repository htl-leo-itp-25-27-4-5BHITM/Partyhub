(function() {
  const STORAGE_KEY = "loggedInUserId";
  window.getCurrentUserId = function() {
    try {
      const s = sessionStorage.getItem(STORAGE_KEY);
      if (s) {
        console.log("Current logged in user:", Number(s));
        return Number(s);
      }
      const l = localStorage.getItem(STORAGE_KEY);
      if (l) {
        console.log("Current logged in user:", Number(l));
        return Number(l);
      }
      console.log("No user logged in");
    } catch (e) {
      console.warn("getCurrentUserId: Error reading storage", e);
    }
    return null;
  };
  window.setCurrentUserId = function(id) {
    sessionStorage.setItem(STORAGE_KEY, String(id));
    localStorage.setItem(STORAGE_KEY, String(id));
    console.log("User logged in:", id);
  };
  window.clearCurrentUserId = function() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    console.log("User logged out");
  };

  window.isUserLoggedIn = function() {
    return window.getCurrentUserId() !== null;
  };

  window.getCurrentUserId();
})();
