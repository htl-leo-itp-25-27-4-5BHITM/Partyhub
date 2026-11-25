/*
 * Light / dark / system appearance. Loaded synchronously as the first script in every page head,
 * so the cached theme is applied before the first paint. The account's stored value
 * (/api/me/settings) always wins once it is loaded; the cache only remembers the last
 * logged-in account's choice and holds no personal data.
 */
(function () {
  const CACHE_KEY = "partyhub_theme";
  const THEMES = ["LIGHT", "DARK", "SYSTEM"];
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  let current = readCache()?.theme || "SYSTEM";

  function readCache() {
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      return value && THEMES.includes(value.theme) ? value : null;
    } catch {
      return null;
    }
  }

  function writeCache(theme, userId) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ theme, userId: userId ?? null }));
    } catch {
      // Private mode or blocked storage: the server value still applies after load.
    }
  }

  function resolve(theme) {
    if (theme === "LIGHT") return "light";
    if (theme === "DARK") return "dark";
    return media && !media.matches ? "light" : "dark";
  }

  function apply(theme) {
    current = THEMES.includes(theme) ? theme : "SYSTEM";
    const resolved = resolve(current);
    const root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = current.toLowerCase();
    root.style.colorScheme = resolved;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", resolved === "light" ? "#f6f4fb" : "#1a1040");
    window.dispatchEvent(new CustomEvent("partyhub:themechange", { detail: { theme: current, resolved } }));
  }

  apply(current);

  // "System" follows the operating system live.
  media?.addEventListener?.("change", () => {
    if (current === "SYSTEM") apply(current);
  });

  // Other open tabs follow a change made in this one.
  window.addEventListener("storage", (event) => {
    if (event.key === CACHE_KEY) apply(readCache()?.theme || "SYSTEM");
  });

  async function loggedInUserId() {
    const auth = window.authService;
    if (!auth) return null;
    try {
      await auth.init();
      if (!auth.isLoggedIn()) return null;
      return (await auth.getCurrentUser())?.id ?? null;
    } catch {
      return null;
    }
  }

  /** Loads the account's stored theme and replaces the cached hint with it. */
  async function syncFromServer() {
    const userId = await loggedInUserId();
    if (userId == null) return null;
    try {
      const response = await window.authService.apiCall("/api/me/settings", { authRequired: false });
      if (!response.ok) return null;
      const settings = await response.json();
      writeCache(settings.theme, userId);
      if (settings.theme !== current) apply(settings.theme);
      return settings;
    } catch {
      return null;
    }
  }

  /** Applies a new theme immediately and stores it on the account; rolls back if saving fails. */
  async function save(theme) {
    const previous = current;
    apply(theme);
    const response = await window.authService.apiCall("/api/me/settings", {
      method: "PUT",
      body: JSON.stringify({ theme }),
    });
    if (!response.ok) {
      apply(previous);
      throw new Error(`Saving the theme failed (${response.status})`);
    }
    writeCache(theme, window.authService.getCurrentUserId());
    return theme;
  }

  window.partyhubTheme = {
    get: () => current,
    apply,
    save,
    syncFromServer,
  };

  window.addEventListener("DOMContentLoaded", () => { syncFromServer(); });
})();
