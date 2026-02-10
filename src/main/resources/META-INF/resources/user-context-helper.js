(function() {
  const pageHandlers = {
    onUserChange: null,
    onLoad: null
  };

  function initPageUserContext(options = {}) {
    if (options.onUserChange) pageHandlers.onUserChange = options.onUserChange;
    if (options.onLoad) pageHandlers.onLoad = options.onLoad;
    
    window.addEventListener('userChanged', function(event) {
      if (pageHandlers.onUserChange) {
        pageHandlers.onUserChange(event.detail);
      }
      
      if (options.autoRefresh && !pageHandlers.onUserChange) {
        window.location.reload();
      }
    });
    
    if (pageHandlers.onLoad) {
      if (window.UserSwitcher) {
        window.UserSwitcher.getCurrentUser().then(user => {
          if (user) {
            pageHandlers.onLoad(user);
          }
        }).catch(err => {
          console.error('Error getting current user:', err);
        });
      }
    }
  }

  function getCurrentUserId() {
    if (window.UserSwitcher) {
      return window.UserSwitcher.getCurrentUserIdSync();
    }
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

  function getCurrentUser() {
    if (window.UserSwitcher) {
      return window.UserSwitcher.getCurrentUserSync();
    }
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

  function isUserSelected() {
    return getCurrentUserId() !== null;
  }

  window.PageUserContext = {
    init: initPageUserContext,
    getCurrentUserId: getCurrentUserId,
    getCurrentUser: getCurrentUser,
    isUserSelected: isUserSelected
  };
})();
