/**
 * Unified Authentication Module
 * Single source of truth for all authentication needs
 * Replaces: keycloak-auth.js, auth-service.js, user-utils.js
 */

(function () {
  const STORAGE = {
    TOKEN: 'auth_token',
    ID_TOKEN: 'auth_id_token',
    USER: 'auth_user',
    USER_ID: 'auth_user_id'
  };

  const KEYCLOAK_URL = "http://localhost:8180";
  const REALM = "partyhub";
  const CLIENT_ID = "partyhub-backend";

  const AUTH_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`;
  const TOKEN_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
  const LOGOUT_ENDPOINT = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`;
  const REDIRECT_URI = window.location.origin + "/register_login/login/callback.html";
  const LOGIN_PAGE = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/auth`;
// Removed reference to legacy login.html; always redirect to Keycloak login page.
  const HOME_PAGE = window.location.origin + "/index.html";

  function generateState() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  function base64UrlEncode(buffer) {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  function generateCodeVerifier() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return base64UrlEncode(array);
  }

  async function calculateCodeChallenge(verifier) {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(hash);
  }

  function storeToken(token) {
    sessionStorage.setItem(STORAGE.TOKEN, token);
  }

  function getToken() {
    return sessionStorage.getItem(STORAGE.TOKEN);
  }

  function storeIdToken(idToken) {
    if (idToken) {
      sessionStorage.setItem(STORAGE.ID_TOKEN, idToken);
    }
  }

  function getIdToken() {
    return sessionStorage.getItem(STORAGE.ID_TOKEN);
  }

  function storeUser(user) {
    sessionStorage.setItem(STORAGE.USER, JSON.stringify(user));
    sessionStorage.setItem(STORAGE.USER_ID, String(user.id));
    sessionStorage.setItem("loggedInUserId", String(user.id));
  }

  function getUser() {
    const userStr = sessionStorage.getItem(STORAGE.USER);
    return userStr ? JSON.parse(userStr) : null;
  }

  function removeAuth() {
    sessionStorage.removeItem(STORAGE.TOKEN);
    sessionStorage.removeItem(STORAGE.ID_TOKEN);
    sessionStorage.removeItem(STORAGE.USER);
    sessionStorage.removeItem(STORAGE.USER_ID);
    sessionStorage.removeItem("loggedInUserId");
  }

  async function fetchUser() {
    const token = getToken();
    if (!token) return null;

    try {
      const response = await fetch("/api/users/me", {
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (response.ok) {
        const user = await response.json();
        storeUser(user);
        return user;
      } else if (response.status === 401) {
        logout();
        return null;
      }
      return null;
    } catch (err) {
      console.error("fetchUser error:", err);
      return null;
    }
  }

  async function handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const storedState = sessionStorage.getItem("oauth_state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    console.log("handleCallback started. Code present:", !!code, "Error:", error);

    if (error) {
      console.error("OAuth error from Keycloak:", error, errorDescription);
      return false;
    }

    if (!code) {
      console.error("No authorization code received");
      return false;
    }

    if (state !== storedState) {
      console.error("State mismatch - possible CSRF attack. Got:", state, "Expected:", storedState);
      window.location.href = LOGIN_PAGE;
      return false;
    }

    sessionStorage.removeItem("oauth_state");
    const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
    sessionStorage.removeItem("pkce_code_verifier");

    console.log("Exchanging code for tokens at:", TOKEN_ENDPOINT);
    console.log("Using client_id:", CLIENT_ID, "redirect_uri:", REDIRECT_URI);

    try {
      const tokenParams = new URLSearchParams({
        grant_type: "authorization_code",
        client_id: CLIENT_ID,
        client_secret: "secret",
        code: code,
        redirect_uri: REDIRECT_URI,
      });
      
      if (codeVerifier) {
        tokenParams.append("code_verifier", codeVerifier);
        console.log("Including PKCE code_verifier in token request");
      }
      
      const response = await fetch(TOKEN_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: tokenParams,
      });

      const responseText = await response.text();
      console.log("Token endpoint response status:", response.status);

      if (!response.ok) {
        console.error("Token exchange failed:", response.status, responseText);
        return false;
      }

      let tokens;
      try {
        tokens = JSON.parse(responseText);
      } catch (e) {
        console.error("Failed to parse token response as JSON:", responseText);
        return false;
      }

      console.log("Token exchange successful, storing tokens");
      storeToken(tokens.access_token);
      storeIdToken(tokens.id_token);

      const user = await fetchUser();
      if (!user) {
        console.error("Failed to fetch user after token exchange");
        return false;
      }

      console.log("User fetched successfully:", user);
      window.history.replaceState({}, document.title, window.location.pathname);
      window.location.href = HOME_PAGE;
      return true;
    } catch (err) {
      console.error("Callback error:", err);
      return false;
    }
  }

  async function login() {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await calculateCodeChallenge(codeVerifier);
    
    sessionStorage.setItem("oauth_state", state);
    sessionStorage.setItem("pkce_code_verifier", codeVerifier);

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "code",
      scope: "openid email profile",
      state: state,
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
    });

    window.location.href = `${AUTH_ENDPOINT}?${params.toString()}`;
  }

  function logout() {
    removeAuth();
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.href = "/register_login/start.html";
  }

  function getUserId() {
    const userId = sessionStorage.getItem(STORAGE.USER_ID);
    return userId ? Number(userId) : null;
  }

  function isLoggedIn() {
    return getToken() !== null;
  }

  async function apiCall(url, options = {}) {
    const token = getToken();
    const headers = {
      ...options.headers,
      "Content-Type": "application/json",
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      logout();
    }

    return response;
  }

  window.auth = {
    login,
    logout,
    handleCallback,
    getUser,
    getUserId,
    isLoggedIn,
    apiCall,
    fetchUser,
  };

  console.log("Auth module initialized");
})();