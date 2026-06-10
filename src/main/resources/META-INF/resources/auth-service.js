(function () {
  // Default issuer should prefer the same origin as the frontend when
  // running in production. Using a localhost literal causes the browser to
  // attempt token requests against localhost when /api/config/public fails
  // (which results in CORS/network errors in the cloud). Build a sensible
  // default from window.location.origin so deployments that serve the
  // frontend and Keycloak under the same host work out of the box.
  const DEFAULT_ISSUER = `${window.location.origin}/keycloak/realms/partyhub`;

  const config = {
    realm: "partyhub",
    clientId: "frontend",
    issuer: DEFAULT_ISSUER,
    redirectUri: `${window.location.origin}/auth/callback.html`,
    postLogoutRedirectUri: `${window.location.origin}/register_login/start.html`,
  };

  function buildEndpoints() {
    config.authorizationEndpoint = `${config.issuer}/protocol/openid-connect/auth`;
    config.tokenEndpoint = `${config.issuer}/protocol/openid-connect/token`;
    config.logoutEndpoint = `${config.issuer}/protocol/openid-connect/logout`;
  }

  async function fetchKeycloakConfig() {
    try {
      const response = await fetch("/api/config/public");
      if (response.ok) {
        const data = await response.json();
        if (data.keycloakIssuer) {
          config.issuer = data.keycloakIssuer;
        }
      }
    } catch (err) {
      // Keep DEFAULT_ISSUER but surface the error to aid debugging.
      // This used to be silently ignored which caused the frontend to
      // fall back to a hardcoded localhost URL in cloud deployments.
      // eslint-disable-next-line no-console
      console.warn("Could not fetch /api/config/public, using default issuer:", err);
    }
    buildEndpoints();
  }

  buildEndpoints();

  const TOKEN_SESSION_KEY = "partyhub_keycloak_session";
  const LOGIN_TRANSACTION_KEY = "partyhub_oidc_transaction";
  const CURRENT_USER_KEY = "partyhub_current_user";

  let tokenSession = readJson(TOKEN_SESSION_KEY);
  let currentUser = readJson(CURRENT_USER_KEY);
  let initPromise = null;

  function readJson(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.warn(`Could not read ${key}`, error);
      return null;
    }
  }

  function writeJson(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  function removeLegacyLocalAuth() {
    try {
      localStorage.removeItem("partyhub_user_id");
      localStorage.removeItem("partyhub_user_info");
      localStorage.removeItem("loggedInUserId");
    } catch (error) {
      console.warn("Could not clear legacy auth storage", error);
    }
  }

  function clearAuthState() {
    tokenSession = null;
    currentUser = null;
    initPromise = null;
    sessionStorage.removeItem(TOKEN_SESSION_KEY);
    sessionStorage.removeItem(LOGIN_TRANSACTION_KEY);
    sessionStorage.removeItem(CURRENT_USER_KEY);
    sessionStorage.removeItem("loggedInUserId");
    removeLegacyLocalAuth();
  }

  function base64UrlEncode(bytes) {
    const binary = String.fromCharCode(...new Uint8Array(bytes));
    return btoa(binary)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
  }

  function randomBase64Url(byteLength = 32) {
    const bytes = new Uint8Array(byteLength);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
  }

  async function sha256Base64Url(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return base64UrlEncode(digest);
  }

  function decodeJwtPayload(token) {
    if (!token || !token.includes(".")) {
      return null;
    }

    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(payload.length + ((4 - payload.length % 4) % 4), "=");
    try {
      return JSON.parse(atob(padded));
    } catch (error) {
      console.warn("Could not decode JWT payload", error);
      return null;
    }
  }

  function storeTokenResponse(tokenResponse) {
    const now = Math.floor(Date.now() / 1000);
    const nextSession = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token || null,
      idToken: tokenResponse.id_token || null,
      tokenType: tokenResponse.token_type || "Bearer",
      expiresAt: now + Number(tokenResponse.expires_in || 0),
      refreshExpiresAt: tokenResponse.refresh_expires_in
        ? now + Number(tokenResponse.refresh_expires_in)
        : null,
    };

    tokenSession = nextSession;
    writeJson(TOKEN_SESSION_KEY, nextSession);
    removeLegacyLocalAuth();
  }

  function getIntendedPath() {
    return `${window.location.pathname}${window.location.search}${window.location.hash}`;
  }

  async function login(options = {}) {
    const codeVerifier = randomBase64Url(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const state = randomBase64Url(32);
    const nonce = randomBase64Url(32);
    const redirectTo = options.redirectTo || getIntendedPath() || "/index.html";

    writeJson(LOGIN_TRANSACTION_KEY, {
      state,
      nonce,
      codeVerifier,
      redirectTo,
      createdAt: Date.now(),
    });

    const kcAction = options.kcAction || "";

    try {
      const authUrl = new URL(config.authorizationEndpoint);
      authUrl.searchParams.set("client_id", config.clientId);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "openid profile email");
      authUrl.searchParams.set("redirect_uri", config.redirectUri);
      authUrl.searchParams.set("state", state);
      authUrl.searchParams.set("nonce", nonce);
      authUrl.searchParams.set("code_challenge", codeChallenge);
      authUrl.searchParams.set("code_challenge_method", "S256");

      if (kcAction) {
        authUrl.searchParams.set("kc_action", kcAction);
      }

      window.location.assign(authUrl.toString());
    } catch (err) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: config.redirectUri,
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      if (kcAction) {
        params.set("kc_action", kcAction);
      }
      window.location.assign(`${config.authorizationEndpoint}?${params.toString()}`);
    }
  }

  async function register(options = {}) {
    const codeVerifier = randomBase64Url(64);
    const codeChallenge = await sha256Base64Url(codeVerifier);
    const state = randomBase64Url(32);
    const nonce = randomBase64Url(32);
    const redirectTo = options.redirectTo || getIntendedPath() || "/index.html";

    writeJson(LOGIN_TRANSACTION_KEY, {
      state,
      nonce,
      codeVerifier,
      redirectTo,
      createdAt: Date.now(),
    });

    sessionStorage.setItem("partyhub_post_registration", "true");

    const registrationRedirect = `${window.location.origin}/register_login/login/login.html`;
    const registrationEndpoint = `${config.issuer}/protocol/openid-connect/registrations`;

    try {
      const url = new URL(registrationEndpoint);
      url.searchParams.set("client_id", config.clientId);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid profile email");
      url.searchParams.set("redirect_uri", registrationRedirect);
      url.searchParams.set("state", state);
      url.searchParams.set("nonce", nonce);
      url.searchParams.set("code_challenge", codeChallenge);
      url.searchParams.set("code_challenge_method", "S256");
      window.location.assign(url.toString());
    } catch (err) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        response_type: "code",
        scope: "openid profile email",
        redirect_uri: registrationRedirect,
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
      });
      window.location.assign(`${registrationEndpoint}?${params.toString()}`);
    }
  }

  async function handleCallback() {
    // Ensure we have up-to-date Keycloak issuer configuration before
    // attempting the token exchange. Without this, the code may use the
    // DEFAULT_ISSUER (localhost) which causes the token POST to go to the
    // wrong origin when the app is hosted elsewhere.
    await fetchKeycloakConfig();

    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");
    if (error) {
      clearAuthState();
      throw new Error(params.get("error_description") || error);
    }

    const code = params.get("code");
    const state = params.get("state");
    const transaction = readJson(LOGIN_TRANSACTION_KEY);

    if (!code || !state) {
      clearAuthState();
      throw new Error("Invalid Keycloak login callback: missing code or state");
    }

    if (!transaction || transaction.state !== state) {
      // OIDC transaction not found — likely the email verification link
      // opened in a different tab/window where sessionStorage is separate.
      // Keycloak already processed the action (email verified), so redirect
      // to login for a fresh flow instead of showing "Sign-in failed".
      clearAuthState();
      sessionStorage.setItem("partyhub_post_verify", "true");
      window.location.replace("/register_login/login/login.html");
      return;
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: transaction.codeVerifier,
    });

    const response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      clearAuthState();
      throw new Error(`Token exchange failed: ${response.status}`);
    }

    const tokenResponse = await response.json();
    const idClaims = decodeJwtPayload(tokenResponse.id_token);
    if (idClaims?.nonce && idClaims.nonce !== transaction.nonce) {
      clearAuthState();
      throw new Error("Invalid Keycloak login callback nonce");
    }

    storeTokenResponse(tokenResponse);
    sessionStorage.removeItem(LOGIN_TRANSACTION_KEY);
    await loadCurrentUser();
    window.location.replace(transaction.redirectTo || "/index.html");
  }

  function hasUsableAccessToken(minValiditySeconds = 0) {
    return Boolean(
      tokenSession?.accessToken &&
      tokenSession.expiresAt &&
      tokenSession.expiresAt - Math.floor(Date.now() / 1000) > minValiditySeconds
    );
  }

  async function updateToken(minValiditySeconds = 30) {
    if (hasUsableAccessToken(minValiditySeconds)) {
      return true;
    }

    if (!tokenSession?.refreshToken) {
      clearAuthState();
      return false;
    }

    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: config.clientId,
      refresh_token: tokenSession.refreshToken,
    });

    const response = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!response.ok) {
      clearAuthState();
      return false;
    }

    storeTokenResponse(await response.json());
    return true;
  }

  async function init(options = {}) {
    if (!initPromise) {
      initPromise = (async () => {
        await fetchKeycloakConfig();
        removeLegacyLocalAuth();
        tokenSession = readJson(TOKEN_SESSION_KEY);
        currentUser = readJson(CURRENT_USER_KEY);

        if (tokenSession && !(await updateToken(10))) {
          return false;
        }

        if (tokenSession && !currentUser) {
          await loadCurrentUser();
        }

        return isLoggedIn();
      })();
    }

    await initPromise;
    if (options.requireLogin && !isLoggedIn()) {
      await login({ redirectTo: options.redirectTo });
      return false;
    }

    return isLoggedIn();
  }

  function isLoggedIn() {
    return hasUsableAccessToken(0);
  }

  function getAccessToken() {
    return tokenSession?.accessToken || null;
  }

  function getUserInfo() {
    return currentUser;
  }

  function getCurrentUserId() {
    return currentUser?.id ?? null;
  }

  async function loadCurrentUser() {
    if (!tokenSession?.accessToken) {
      currentUser = null;
      sessionStorage.removeItem(CURRENT_USER_KEY);
      return null;
    }

    const response = await apiCall("/api/users/me", { authRequired: true });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        clearAuthState();
      }
      return null;
    }

    currentUser = await response.json();
    writeJson(CURRENT_USER_KEY, currentUser);
    sessionStorage.setItem("loggedInUserId", String(currentUser.id));
    return currentUser;
  }

  async function getCurrentUser() {
    if (currentUser) {
      return currentUser;
    }
    return loadCurrentUser();
  }

  async function apiCall(url, options = {}) {
    const { authRequired = true, headers: optionHeaders, ...fetchOptions } = options;
    const headers = { ...(optionHeaders || {}) };

    if (!(fetchOptions.body instanceof FormData) && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    if (tokenSession?.accessToken) {
      const refreshed = await updateToken(30);
      if (refreshed && tokenSession?.accessToken) {
        headers.Authorization = `Bearer ${tokenSession.accessToken}`;
      }
    } else if (authRequired) {
      await login({ redirectTo: getIntendedPath() });
      return new Response(null, { status: 401 });
    }

    if (authRequired && !headers.Authorization) {
      await login({ redirectTo: getIntendedPath() });
      return new Response(null, { status: 401 });
    }

    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  }

  function logout() {
    const idToken = tokenSession?.idToken;
    clearAuthState();

    // Use URL API to avoid duplicated parameters if logoutEndpoint already
    // contains query parameters.
    try {
      const logoutUrl = new URL(config.logoutEndpoint);
      logoutUrl.searchParams.set("client_id", config.clientId);
      logoutUrl.searchParams.set("post_logout_redirect_uri", config.postLogoutRedirectUri);
      if (idToken) {
        logoutUrl.searchParams.set("id_token_hint", idToken);
      }
      window.location.assign(logoutUrl.toString());
    } catch (err) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        post_logout_redirect_uri: config.postLogoutRedirectUri,
      });
      if (idToken) {
        params.set("id_token_hint", idToken);
      }
      window.location.assign(`${config.logoutEndpoint}?${params.toString()}`);
    }
  }

  function storeUser(_userId, userInfo) {
    currentUser = userInfo || null;
    if (currentUser) {
      writeJson(CURRENT_USER_KEY, currentUser);
      sessionStorage.setItem("loggedInUserId", String(currentUser.id));
    }
  }

  window.authService = {
    config,
    init,
    login,
    register,
    handleCallback,
    logout,
    isLoggedIn,
    getAccessToken,
    getUserInfo,
    getCurrentUser,
    getCurrentUserId,
    updateToken,
    apiCall,
    storeUser,
    clearAuth: clearAuthState,
  };

  init({ requireLogin: false }).catch((error) => {
    console.error("Auth initialization failed", error);
  });
})();
