/**
 * Route Guard - Protects pages that require authentication
 * Add to pages that should only be accessible when logged in
 */

(function () {
  const LOGIN_PAGE = 'http://localhost:8180/realms/partyhub/protocol/openid-connect/auth'; // Keycloak login page
  const HOME_PAGE = '/index.html';

  /**
   * Require authentication - redirect to login if not authenticated
   */
  window.requireAuth = function () {
    if (!window.authService.isLoggedIn()) {
      console.warn('Access denied: User not authenticated');
      window.location.href = LOGIN_PAGE;
      return false;
    }
    return true;
  };

  /**
   * Require logout - redirect to home if already authenticated
   */
  window.requireLogout = function () {
    if (window.authService.isLoggedIn()) {
      console.warn('Access denied: User already authenticated');
      window.location.href = HOME_PAGE;
      return false;
    }
    return true;
  };

  /**
   * Check if user is authenticated (without redirect)
   */
  window.isAuthenticated = function () {
    return window.authService.isLoggedIn();
  };

  /**
   * Get current user info
   */
  window.getCurrentAuthUser = function () {
    return window.authService.getUserInfo();
  };

  /**
   * Make authenticated API call
   */
  window.makeAuthenticatedCall = function (url, options = {}) {
    return window.authService.apiCall(url, options);
  };

  console.log('Route guard initialized');
})();
