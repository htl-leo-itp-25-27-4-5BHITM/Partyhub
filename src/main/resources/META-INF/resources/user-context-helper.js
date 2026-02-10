/**
 * User Context Helper for Pages
 * Provides easy integration with the global user switcher
 * Include this script on any page that needs to react to user changes
 */

(function() {
  // Store page-specific handlers
  const pageHandlers = {
    onUserChange: null,
    onLoad: null
  };

  /**
   * Initialize user context for the current page
   * @param {Object} options - Configuration options
   * @param {Function} options.onUserChange - Callback when user changes (receives user object)
   * @param {Function} options.onLoad - Callback when user context is loaded (receives user object)
   * @param {boolean} options.autoRefresh - Whether to automatically refresh on user change
   */
  function initPageUserContext(options = {}) {
    console.log('[UserContext] Initializing page user context...');
    
    // Store handlers
    if (options.onUserChange) pageHandlers.onUserChange = options.onUserChange;
    if (options.onLoad) pageHandlers.onLoad = options.onLoad;
    
    // Listen for user changes
    window.addEventListener('userChanged', function(event) {
      console.log('[UserContext] User changed:', event.detail);
      
      if (pageHandlers.onUserChange) {
        pageHandlers.onUserChange(event.detail);
      }
      
      if (options.autoRefresh && !pageHandlers.onUserChange) {
        // Default behavior: refresh the page
        console.log('[UserContext] Auto-refreshing page...');
        window.location.reload();
      }
    });
    
    // Call onLoad with current user if available
    if (pageHandlers.onLoad) {
      // Try to get user from UserSwitcher API
      if (window.UserSwitcher) {
        window.UserSwitcher.getCurrentUser().then(user => {
          if (user) {
            console.log('[UserContext] Current user on load:', user);
            pageHandlers.onLoad(user);
          }
        }).catch(err => {
          console.error('[UserContext] Error getting current user:', err);
        });
      }
    }
  }

  /**
   * Get the current user ID (works with or without UserSwitcher loaded)
   */
  function getCurrentUserId() {
    if (window.UserSwitcher) {
      return window.UserSwitcher.getCurrentUserIdSync();
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('partyhub_current_user');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        return user.id;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Get the current user object (sync)
   */
  function getCurrentUser() {
    if (window.UserSwitcher) {
      return window.UserSwitcher.getCurrentUserSync();
    }
    // Fallback to localStorage
    const stored = localStorage.getItem('partyhub_current_user');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /**
   * Check if current user is authenticated (has a selection)
   */
  function isUserSelected() {
    return getCurrentUserId() !== null;
  }

  // Expose API
  window.PageUserContext = {
    init: initPageUserContext,
    getCurrentUserId: getCurrentUserId,
    getCurrentUser: getCurrentUser,
    isUserSelected: isUserSelected
  };
  
  console.log('[UserContext] Page helper loaded');
})();
