// Simple auth service - no Keycloak, all API endpoints are public
// Authentication is handled via QR code login in SwiftUI app

(function () {
  const TOKEN_KEY = 'partyhub_user_id';
  const USER_INFO_KEY = 'partyhub_user_info';

  /**
   * Store user info
   */
  function storeUser(userId, userInfo) {
    try {
      localStorage.setItem(TOKEN_KEY, userId);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
      console.log('User stored successfully, userId:', userId);
    } catch (e) {
      console.error('storeUser error:', e);
    }
  }

  /**
   * Get stored user info
   */
  function getUserInfo() {
    try {
      const info = localStorage.getItem(USER_INFO_KEY);
      return info ? JSON.parse(info) : null;
    } catch (e) {
      console.error('getUserInfo error:', e);
      return null;
    }
  }

  /**
   * Check if user is logged in
   */
  function isLoggedIn() {
    return localStorage.getItem(TOKEN_KEY) !== null;
  }

  /**
   * Login by userId - fetch user from API and store
   */
  async function login(userId) {
    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('User not found');
      }
      const user = await response.json();
      storeUser(userId, user);
      return user;
    } catch (e) {
      console.error('login error:', e);
      throw e;
    }
  }

  /**
   * Logout - clear stored data
   */
  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_INFO_KEY);
      window.clearCurrentUserId && window.clearCurrentUserId();
      window.location.href = '/register_login/start.html';
    } catch (e) {
      console.error('logout error:', e);
    }
  }

  /**
   * Get current user ID
   */
  function getCurrentUserId() {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Make API call (no auth headers needed - API is public)
   */
  async function apiCall(url, options = {}) {
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json'
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    return response;
  }

  /**
   * Get current user from API
   */
  async function getCurrentUser() {
    try {
      const userId = getCurrentUserId();
      if (!userId) return null;
      
      const response = await apiCall(`/api/users/${userId}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('getCurrentUser error:', e);
      return null;
    }
  }

  function getAccessToken() {
    return getCurrentUserId();
  }

  // Export to window
  window.authService = {
    login,
    logout,
    isLoggedIn,
    getAccessToken,
    getUserInfo,
    getCurrentUser,
    getCurrentUserId,
    apiCall,
    storeUser,
    clearAuth: logout
  };

  // Auto-login from URL if userId param present
  (function() {
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId');
    if (userId && !isLoggedIn()) {
      login(userId).then(() => {
        window.location.href = '/index.html';
      }).catch(e => {
        console.error('Auto-login failed:', e);
      });
    }
  })();

  console.log('Auth service initialized (no Keycloak)');
})();