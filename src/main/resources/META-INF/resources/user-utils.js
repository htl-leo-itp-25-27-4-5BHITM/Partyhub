(function() {
  const STORAGE_KEY = "loggedInUserId";
  const AUTH_STORAGE_KEY = "partyhub_user_id";

  function readStoredId(storage, key) {
    const value = storage.getItem(key);
    return value ? Number(value) : null;
  }

  window.getCurrentUserId = function() {
    try {
      return (
        readStoredId(sessionStorage, STORAGE_KEY) ??
        readStoredId(localStorage, STORAGE_KEY) ??
        readStoredId(localStorage, AUTH_STORAGE_KEY) ??
        null
      );
    } catch (e) {
      console.warn("getCurrentUserId: Error reading storage", e);
    }
    return null;
  };
  window.setCurrentUserId = function(id) {
    sessionStorage.setItem(STORAGE_KEY, String(id));
    localStorage.setItem(STORAGE_KEY, String(id));
    localStorage.setItem(AUTH_STORAGE_KEY, String(id));
  };
  window.clearCurrentUserId = function() {
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  window.isUserLoggedIn = function() {
    return window.getCurrentUserId() !== null;
  };

  window.getCurrentUserId();
})();
