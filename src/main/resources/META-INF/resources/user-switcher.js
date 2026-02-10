(function() {
  const STORAGE_KEY = 'partyhub_current_user';
  let isInitialized = false;
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUserSwitcher);
  } else {
    initUserSwitcher();
  }

  async function initUserSwitcher() {
    if (isInitialized) return;
    isInitialized = true;
    createSwitcherUI();
    
    await loadUsers();
    await syncWithBackend();
  }

  function createSwitcherUI() {
    if (document.getElementById('user-switcher')) return;

    const switcherContainer = document.createElement('div');
    switcherContainer.id = 'user-switcher';
    switcherContainer.innerHTML = `
      <div class="user-switcher-wrapper">
        <label for="user-dropdown">Current User:</label>
        <select id="user-dropdown">
          <option value="">Loading users...</option>
        </select>
        <span id="current-user-display"></span>
      </div>
    `;

    const header = document.querySelector('header') || document.body;
    if (header.firstChild) {
      header.insertBefore(switcherContainer, header.firstChild);
    } else {
      header.appendChild(switcherContainer);
    }

    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
      dropdown.addEventListener('change', handleUserChange);
    }

    addStyles();
  }

  function addStyles() {
    if (document.getElementById('user-switcher-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'user-switcher-styles';
    styles.textContent = `
      #user-switcher {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 12px 20px;
        margin-bottom: 10px;
        border-radius: 0 0 12px 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        position: relative;
        z-index: 1000;
      }
      
      .user-switcher-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;
        justify-content: center;
        flex-wrap: wrap;
      }
      
      .user-switcher-wrapper label {
        color: white;
        font-weight: 600;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      #user-dropdown {
        padding: 8px 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 8px;
        background: rgba(255,255,255,0.95);
        color: #333;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        min-width: 220px;
        transition: all 0.3s ease;
      }
      
      #user-dropdown:hover {
        border-color: rgba(255,255,255,0.6);
        background: white;
      }
      
      #user-dropdown:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
      }
      
      #current-user-display {
        color: rgba(255,255,255,0.9);
        font-size: 13px;
        font-weight: 500;
        background: rgba(255,255,255,0.2);
        padding: 4px 10px;
        border-radius: 12px;
      }
      
      @media (max-width: 600px) {
        .user-switcher-wrapper {
          flex-direction: column;
          gap: 8px;
        }
        
        #user-dropdown {
          width: 100%;
          max-width: 280px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  async function loadUsers() {
    const dropdown = document.getElementById('user-dropdown');
    if (!dropdown) return;
    
    try {
      const response = await fetch('/api/users/all');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      
      // Clear loading option
      dropdown.innerHTML = '';
      
      // Add default option
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Select User --';
      dropdown.appendChild(defaultOption);
      
      // Add users to dropdown
      users.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `@${user.distinctName} (${user.displayName})`;
        option.dataset.user = JSON.stringify(user);
        dropdown.appendChild(option);
      });
      
      console.log('Loaded', users.length, 'users');
      
    } catch (error) {
      console.error('Error loading users:', error);
      dropdown.innerHTML = '<option value="">Error loading users</option>';
    }
  }

  async function syncWithBackend() {
    try {
      // First, try to get current user from backend
      const response = await fetch('/api/user-context/current');
      if (response.ok) {
        const backendUser = await response.json();
        console.log('Backend user:', backendUser);
        
        // Update localStorage to match backend
        const userData = {
          id: backendUser.id,
          displayName: backendUser.displayName,
          distinctName: backendUser.distinctName
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        
        // Update UI
        updateDropdownSelection(backendUser.id);
        updateUserDisplay(userData);
        
        // Dispatch event so other components know
        window.dispatchEvent(new CustomEvent('userChanged', { detail: userData }));
      } else {
        // Backend doesn't have user, restore from localStorage
        await restoreFromLocalStorage();
      }
    } catch (error) {
      console.error('Error syncing with backend:', error);
      await restoreFromLocalStorage();
    }
  }

  async function restoreFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        console.log('Restoring from localStorage:', user);
        
        // Try to set backend to this user
        await fetch(`/api/user-context/switch/${user.id}`, { method: 'POST' });
        
        updateDropdownSelection(user.id);
        updateUserDisplay(user);
        window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
      } catch (error) {
        console.error('Error restoring from localStorage:', error);
      }
    }
  }

  async function handleUserChange(event) {
    const userId = event.target.value;
    const dropdown = event.target;
    
    if (!userId) {
      try {
        const response = await fetch('/api/user-context/reset', { method: 'POST' });
        if (response.ok) {
          const result = await response.json();
          console.log('Reset to default:', result);
          
          localStorage.removeItem(STORAGE_KEY);
          updateUserDisplay(null);
          window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));
        }
      } catch (error) {
        console.error('Error resetting user:', error);
      }
      return;
    }
    
    const selectedOption = dropdown.options[dropdown.selectedIndex];
    const userData = JSON.parse(selectedOption.dataset.user);
    
    try {
      console.log('Switching to user:', userId);
      const response = await fetch(`/api/user-context/switch/${userId}`, { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to switch user');
      }
      
      const result = await response.json();
      console.log('Switch successful:', result);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      updateUserDisplay(userData);
      window.dispatchEvent(new CustomEvent('userChanged', { detail: userData }));
      showNotification(`Switched to @${userData.distinctName}`);
      
    } catch (error) {
      console.error('Error switching user:', error);
      showNotification('Failed to switch user: ' + error.message, 'error');
      await syncWithBackend();
    }
  }

  function updateDropdownSelection(userId) {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && userId) {
      dropdown.value = userId;
    }
  }

  function updateUserDisplay(user) {
    const display = document.getElementById('current-user-display');
    if (display) {
      if (user) {
        display.textContent = `ID: ${user.id} • @${user.distinctName}`;
      } else {
        display.textContent = 'No user selected';
      }
    }
  }

  function showNotification(message, type = 'success') {
    let container = document.getElementById('user-switcher-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'user-switcher-notifications';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }
    
    const notification = document.createElement('div');
    notification.style.cssText = `
      background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    
    container.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Add animation styles
  if (!document.getElementById('user-switcher-animations')) {
    const animStyles = document.createElement('style');
    animStyles.id = 'user-switcher-animations';
    animStyles.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(animStyles);
  }

  window.UserSwitcher = {
    getCurrentUser: async function() {
      try {
        const response = await fetch('/api/user-context/current');
        if (response.ok) {
          return await response.json();
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
      return this.getCurrentUserSync();
    },
    
    getCurrentUserId: async function() {
      try {
        const response = await fetch('/api/user-context/current/id');
        if (response.ok) {
          const data = await response.json();
          return data.userId;
        }
      } catch (error) {
        console.error('Error getting current user ID:', error);
      }
      const user = this.getCurrentUserSync();
      return user ? user.id : null;
    },
    
    getCurrentUserSync: function() {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    },
    
    getCurrentUserIdSync: function() {
      const user = this.getCurrentUserSync();
      return user ? user.id : null;
    },
    
    clearUser: async function() {
      try {
        await fetch('/api/user-context/reset', { method: 'POST' });
      } catch (error) {
        console.error('Error resetting user:', error);
      }
      localStorage.removeItem(STORAGE_KEY);
      updateDropdownSelection('');
      updateUserDisplay(null);
      window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));
    },
    
    switchUser: async function(userId) {
      try {
        const response = await fetch(`/api/user-context/switch/${userId}`, { method: 'POST' });
        if (response.ok) {
          const result = await response.json();
          const userData = {
            id: result.userId,
            displayName: result.displayName,
            distinctName: result.distinctName
          };
          
          localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
          updateDropdownSelection(userId);
          updateUserDisplay(userData);
          window.dispatchEvent(new CustomEvent('userChanged', { detail: userData }));
          showNotification(`Switched to @${userData.distinctName}`);
          return userData;
        }
      } catch (error) {
        console.error('Error switching user:', error);
        showNotification('Failed to switch user', 'error');
        throw error;
      }
    },
    
    sync: async function() {
      await syncWithBackend();
    }
  };
  
  if (document.readyState === 'complete') {
    window.UserSwitcher.sync();
  } else {
    window.addEventListener('load', () => window.UserSwitcher.sync());
  }
})();
