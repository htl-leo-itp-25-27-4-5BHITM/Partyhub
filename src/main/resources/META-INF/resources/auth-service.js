
(function () {
  const isProd = window.location.hostname !== 'localhost';
  const KEYCLOAK_URL = isProd 
    ? 'https://it220274.cloud.htl-leonding.ac.at/realms' 
    : 'http://localhost:8180';
  const REALM = 'party-realm';
  const CLIENT_ID = 'party-client';
  const CLIENT_SECRET = 'secret123';
  
  const TOKEN_KEY = 'keycloak_access_token';
  const REFRESH_TOKEN_KEY = 'keycloak_refresh_token';
  const USER_INFO_KEY = 'keycloak_user_info';
  const TOKEN_EXPIRY_KEY = 'keycloak_token_expiry';

  function getTokenEndpoint() {
    return `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  }

  function getAuthorizationEndpoint() {
    return `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`;
  }

  function getLogoutEndpoint() {
    return `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`;
  }

  function isTokenValid() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      if (!token || !expiry) return false;
      
      const expiryTime = parseInt(expiry, 10);
      const now = Date.now();
      
      return now < (expiryTime - 60000);
    } catch (e) {
      console.error('isTokenValid error:', e);
      return false;
    }
  }

  async function getAccessToken() {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      
      if (token && isTokenValid()) {
        return token;
      }

      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        return await refreshAccessToken();
      }

      return null;
    } catch (e) {
      console.error('getAccessToken error:', e);
      return null;
    }
  }

  async function refreshAccessToken() {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) return null;

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: refreshToken
      });

      const response = await fetch(getTokenEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        clearAuth();
        return null;
      }

      const data = await response.json();
      storeTokens(data);
      return data.access_token;
    } catch (e) {
      console.error('refreshAccessToken error:', e);
      clearAuth();
      return null;
    }
  }

  function storeTokens(tokenResponse) {
    try {
      localStorage.setItem(TOKEN_KEY, tokenResponse.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, tokenResponse.refresh_token);
      
      // Calculate expiry time (now + expires_in seconds)
      const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

      // Decode and store user info from token
      const userInfo = parseJwt(tokenResponse.access_token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));

      // Also store as legacy user ID for compatibility
      if (userInfo.sub) {
        window.setCurrentUserId(userInfo.sub);
      }

      console.log('Tokens stored successfully');
    } catch (e) {
      console.error('storeTokens error:', e);
    }
  }

  /**
   * Parse JWT token (without verification - OK for public client)
   */
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('parseJwt error:', e);
      return null;
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
    const token = localStorage.getItem(TOKEN_KEY);
    return token !== null && isTokenValid();
  }

  /**
   * Perform password-based login (Resource Owner Password Credentials flow)
   */
  async function login(username, password) {
    try {
      const params = new URLSearchParams({
        grant_type: 'password',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        username: username,
        password: password,
        scope: 'openid profile email'
      });

      const response = await fetch(getTokenEndpoint(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error_description || 'Login failed');
      }

      const data = await response.json();
      storeTokens(data);
      return getUserInfo();
    } catch (e) {
      console.error('login error:', e);
      throw e;
    }
  }

  /**
   * Logout and clear stored tokens
   */
  function logout() {
    try {
      clearAuth();
      window.clearCurrentUserId();
      
      // Redirect to login
      window.location.href = '/register_login/start.html';
    } catch (e) {
      console.error('logout error:', e);
    }
  }

  /**
   * Clear all auth data
   */
  function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }

  async function apiCall(url, options = {}) {
    try {
      const token = await getAccessToken();
      
      if (!token) {
        throw new Error('No valid token available');
      }

      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(url, {
        ...options,
        headers
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          return fetch(url, { ...options, headers });
        } else {
          logout();
          throw new Error('Session expired');
        }
      }

      return response;
    } catch (e) {
      console.error('apiCall error:', e);
      throw e;
    }
  }

  async function getCurrentUser() {
    try {
      const response = await apiCall('/api/users/me');
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (e) {
      console.error('getCurrentUser error:', e);
      return null;
    }
  }

  window.authService = {
    login,
    logout,
    isLoggedIn,
    getAccessToken,
    getUserInfo,
    getCurrentUser,
    apiCall,
    parseJwt,
    clearAuth,
    KEYCLOAK_URL,
    REALM,
    CLIENT_ID
  };

  console.log('Auth service initialized');
})();
