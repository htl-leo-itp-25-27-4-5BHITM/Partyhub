(function() {
  const STORAGE_KEY = 'partyhub_current_user';
  let isInitialized = false;

  function isProfilePage() {
    const path = window.location.pathname;
    return path.includes('/profile/') ||
           path.endsWith('profile.html') ||
           path.endsWith('/profile');
  }

  if (!isProfilePage()) return;

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    createSwitcherUI();
    loadUsers();
    syncWithBackend();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function createSwitcherUI() {
    if (document.getElementById('user-switcher')) return;

    const switcher = document.createElement('div');
    switcher.id = 'user-switcher';
    switcher.innerHTML = `
      <div class="user-switcher-trigger" id="userSwitcherTrigger">
        <div class="current-user-info">
          <span class="user-avatar" id="switcherAvatar"></span>
          <span class="user-name" id="switcherName">Loading...</span>
        </div>
        <svg class="switcher-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </div>
      <div class="user-switcher-dropdown hidden" id="userSwitcherDropdown">
        <div class="dropdown-header">Switch Account</div>
        <div class="user-list" id="userList"></div>
      </div>
    `;

    const profileContainer = document.getElementById('profileContainer');
    if (profileContainer) {
      if (profileContainer.firstChild) {
        profileContainer.insertBefore(switcher, profileContainer.firstChild);
      } else {
        profileContainer.appendChild(switcher);
      }
    }

    addStyles();

    const trigger = document.getElementById('userSwitcherTrigger');
    const dropdown = document.getElementById('userSwitcherDropdown');

    if (trigger && dropdown) {
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
        trigger.classList.toggle('active');
      });
    }

    document.addEventListener('click', function(e) {
      if (dropdown && trigger && !switcher.contains(e.target)) {
        dropdown.classList.add('hidden');
        trigger.classList.remove('active');
      }
    });
  }

  function addStyles() {
    if (document.getElementById('user-switcher-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'user-switcher-styles';
    styles.textContent = `
      #user-switcher {
        width: 100%;
        max-width: 320px;
        margin: 0 auto 16px;
        position: relative;
        z-index: 100;
      }

      .user-switcher-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: linear-gradient(135deg, #1a1040 0%, #2a2259 100%);
        border: 1px solid rgba(255, 46, 99, 0.3);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .user-switcher-trigger:hover {
        border-color: rgba(255, 46, 99, 0.6);
        box-shadow: 0 4px 12px rgba(255, 46, 99, 0.15);
      }

      .user-switcher-trigger.active {
        border-color: #ff2e63;
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
      }

      .current-user-info {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #ff2e63, #ff6b9d);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
      }

      .user-name {
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
      }

      .switcher-chevron {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.6);
        transition: transform 0.2s ease;
      }

      .user-switcher-trigger.active .switcher-chevron {
        transform: rotate(180deg);
        color: #ff2e63;
      }

      .user-switcher-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: #1a1040;
        border: 1px solid rgba(255, 46, 99, 0.3);
        border-top: none;
        border-radius: 0 0 12px 12px;
        overflow: hidden;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      }

      .user-switcher-dropdown.hidden {
        display: none;
      }

      .dropdown-header {
        padding: 10px 16px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .user-list {
        max-height: 240px;
        overflow-y: auto;
      }

      .user-list::-webkit-scrollbar {
        width: 6px;
      }

      .user-list::-webkit-scrollbar-track {
        background: transparent;
      }

      .user-list::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }

      .user-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .user-option:last-child {
        border-bottom: none;
      }

      .user-option:hover {
        background: rgba(255, 46, 99, 0.1);
      }

      .user-option.active {
        background: rgba(255, 46, 99, 0.15);
      }

      .user-option-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #4f3b9a, #6c5ce7);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: 600;
        color: white;
        text-transform: uppercase;
        flex-shrink: 0;
      }

      .user-option-info {
        flex: 1;
        min-width: 0;
      }

      .user-option-name {
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-option-handle {
        color: rgba(255, 255, 255, 0.5);
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .user-option-check {
        width: 20px;
        height: 20px;
        color: #56f27c;
        flex-shrink: 0;
        opacity: 0;
      }

      .user-option.active .user-option-check {
        opacity: 1;
      }

      @media (max-width: 480px) {
        #user-switcher {
          max-width: 280px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  function loadUsers() {
    const list = document.getElementById('userList');
    if (!list) return;

    fetch('/api/users/all')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
      })
      .then(users => {
        if (!users || users.length === 0) {
          list.innerHTML = '<div class="user-option"><div class="user-option-info"><div class="user-option-name" style="color: #888;">No users found</div></div></div>';
          return;
        }

        list.innerHTML = users.map(user => `
          <div class="user-option" data-user-id="${user.id}" data-user='${JSON.stringify(user)}'>
            <div class="user-option-avatar">${user.displayName ? user.displayName.charAt(0) : '?'}</div>
            <div class="user-option-info">
              <div class="user-option-name">${user.displayName || user.distinctName}</div>
              <div class="user-option-handle">@${user.distinctName}</div>
            </div>
            <svg class="user-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
        `).join('');

        list.querySelectorAll('.user-option').forEach(option => {
          option.addEventListener('click', function() {
            handleUserChange(this);
          });
        });
      })
      .catch(error => {
        console.error('Error loading users:', error);
        list.innerHTML = '<div class="user-option"><div class="user-option-info"><div class="user-option-name" style="color: #ff4757;">Error loading users</div></div></div>';
      });
  }

  async function syncWithBackend() {
    try {
      const response = await fetch('/api/user-context/current');
      if (response.ok) {
        const backendUser = await response.json();

        const userData = {
          id: backendUser.id,
          displayName: backendUser.displayName,
          distinctName: backendUser.distinctName
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

        updateUI(userData);
        highlightCurrentUser(userData.id);
        window.dispatchEvent(new CustomEvent('userChanged', { detail: userData }));
      } else {
        await restoreFromLocalStorage();
      }
    } catch (error) {
      await restoreFromLocalStorage();
    }
  }

  async function restoreFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        await fetch(`/api/user-context/switch/${user.id}`, { method: 'POST' });
        updateUI(user);
        highlightCurrentUser(user.id);
        window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));
      } catch (error) {
        console.error('Error restoring user:', error);
      }
    }
  }

  async function handleUserChange(option) {
    const userId = option.dataset.userId;
    const userData = JSON.parse(option.dataset.user);

    try {
      await fetch(`/api/user-context/switch/${userId}`, { method: 'POST' });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      const dropdown = document.getElementById('userSwitcherDropdown');
      const trigger = document.getElementById('userSwitcherTrigger');
      if (dropdown) dropdown.classList.add('hidden');
      if (trigger) trigger.classList.remove('active');

      window.location.reload();

    } catch (error) {
      console.error('Error switching user:', error);
    }
  }

  function updateUI(user) {
    const nameEl = document.getElementById('switcherName');
    const avatarEl = document.getElementById('switcherAvatar');

    if (nameEl && user) {
      nameEl.textContent = `@${user.distinctName}`;
    }
    if (avatarEl && user) {
      avatarEl.textContent = user.displayName ? user.displayName.charAt(0).toUpperCase() : '?';
    }
  }

  function highlightCurrentUser(userId) {
    if (!userId) return;
    const options = document.querySelectorAll('.user-option');
    options.forEach(option => {
      if (option.dataset.userId === String(userId)) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }

  window.UserSwitcher = {
    getCurrentUser: async function() {
      try {
        const response = await fetch('/api/user-context/current');
        if (response.ok) return await response.json();
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
      updateUI(null);
      highlightCurrentUser(null);
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
          updateUI(userData);
          highlightCurrentUser(userId);
          window.dispatchEvent(new CustomEvent('userChanged', { detail: userData }));
          return userData;
        }
      } catch (error) {
        console.error('Error switching user:', error);
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
