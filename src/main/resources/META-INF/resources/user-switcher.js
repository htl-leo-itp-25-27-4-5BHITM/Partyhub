(function() {
  'use strict';

  const STORAGE_KEY = 'partyhub_current_user';
  let isInitialized = false;
  let currentUserData = null;
  let allUsers = [];

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    createSwitcherUI();
    loadInitialState();
  }

  function createSwitcherUI() {
    if (document.getElementById('user-switcher')) return;
    
    const switcher = document.createElement('div');
    switcher.id = 'user-switcher';
    switcher.style.zIndex = '1000';
    switcher.innerHTML = `
      <button class="user-switcher-trigger" id="userSwitcherTrigger" aria-haspopup="true" aria-expanded="false">
        <img class="user-avatar-img" id="switcherAvatarImg" src="/images/default_profile-picture.jpg" alt="" onerror="this.src='/images/default_profile-picture.jpg'">
        <span class="user-info">
          <span class="user-name" id="switcherName">Loading...</span>
          <span class="user-handle" id="switcherHandle">@username</span>
        </span>
        <svg class="switcher-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <path d="M6 9l6 6-6"/>
        </svg>
      </button>
      <div class="user-switcher-dropdown hidden" id="userSwitcherDropdown" role="menu">
        <div class="dropdown-header">
          <span>Switch Account</span>
        </div>
        <div class="user-list" id="userList" role="none">
          <div class="user-list-loading">Loading users...</div>
        </div>
      </div>
    `;

    const container = document.getElementById('profileContainer') || document.body;
    container.insertBefore(switcher, container.firstChild);
    
    injectStyles();
    attachEventListeners();
  }

    function injectStyles() {
    if (document.getElementById('user-switcher-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'user-switcher-styles';
    styles.textContent = `
      #user-switcher {
        width: 100%;
        max-width: 360px;
        margin: 0 auto 20px;
        position: relative;
        z-index: 1000;
      }

      .user-switcher-trigger {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        background: linear-gradient(135deg, var(--bg-secondary, #2d1b69) 0%, var(--bg-tertiary, #3d2878) 100%);
        border: 2px solid var(--accent-color, #ff2e63);
        border-radius: 16px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 15px rgba(255, 46, 99, 0.2);
      }

      .user-switcher-trigger:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(255, 46, 99, 0.35);
        border-color: #ff6b9d;
      }

      .user-switcher-trigger[aria-expanded="true"] {
        border-bottom-left-radius: 0;
        border-bottom-right-radius: 0;
        border-bottom-color: transparent;
      }

      .user-switcher-trigger[aria-expanded="true"] .switcher-chevron {
        transform: rotate(180deg);
        color: var(--accent-color, #ff2e63);
      }

      .user-avatar-img {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        box-shadow: 0 2px 8px rgba(255, 46, 99, 0.4);
        border: 2px solid rgba(255, 46, 99, 0.3);
      }

      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        flex: 1;
        min-width: 0;
      }

      .user-name {
        color: #ffffff;
        font-size: 15px;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
      }

      .user-handle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 13px;
        font-weight: 400;
      }

      .switcher-chevron {
        width: 20px;
        height: 20px;
        color: rgba(255, 255, 255, 0.5);
        transition: all 0.3s ease;
        flex-shrink: 0;
      }

      .user-switcher-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, var(--bg-secondary, #2d1b69) 0%, var(--bg-tertiary, #3d2878) 100%);
        border: 2px solid var(--accent-color, #ff2e63);
        border-top: none;
        border-radius: 0 0 16px 16px;
        overflow: hidden;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
        max-height: 320px;
        display: flex;
        flex-direction: column;
      }

      .user-switcher-dropdown.hidden {
        display: none;
      }

      .dropdown-header {
        padding: 12px 16px;
        font-size: 11px;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.4);
        text-transform: uppercase;
        letter-spacing: 1px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
      }

      .user-list {
        overflow-y: auto;
        flex: 1;
        max-height: 260px;
      }

      .user-list::-webkit-scrollbar {
        width: 6px;
      }

      .user-list::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
      }

      .user-list::-webkit-scrollbar-thumb {
        background: var(--accent-color, #ff2e63);
        border-radius: 3px;
      }

      .user-list-loading {
        padding: 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
      }

      .user-option {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s ease;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .user-option:last-child {
        border-bottom: none;
      }

      .user-option:hover {
        background: rgba(255, 46, 99, 0.15);
      }

      .user-option.active {
        background: rgba(255, 46, 99, 0.25);
      }

      .user-option-avatar-img {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        border: 2px solid rgba(108, 92, 231, 0.4);
      }

      .user-option.active .user-option-avatar-img {
        border-color: var(--accent-color, #ff2e63);
        box-shadow: 0 2px 10px rgba(255, 46, 99, 0.4);
      }

      .user-option-avatar-img.fallback {
        background: linear-gradient(135deg, #6c5ce7, #a29bfe);
      }

      .user-option.active .user-option-avatar-img.fallback {
        background: linear-gradient(135deg, var(--accent-color, #ff2e63), #ff8fab);
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
        color: var(--accent-color-green, #56f27c);
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.2s ease;
      }

      .user-option.active .user-option-check {
        opacity: 1;
      }

      .user-list-error {
        padding: 20px;
        text-align: center;
        color: #ff6b6b;
        font-size: 14px;
      }

      .user-list-empty {
        padding: 30px 20px;
        text-align: center;
        color: rgba(255, 255, 255, 0.5);
        font-size: 14px;
      }

      @media (max-width: 480px) {
        #user-switcher {
          max-width: 100%;
          margin: 0 16px 16px;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  function attachEventListeners() {
    const trigger = document.getElementById('userSwitcherTrigger');
    const dropdown = document.getElementById('userSwitcherDropdown');

    if (!trigger || !dropdown) return;

    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle('hidden');
      trigger.setAttribute('aria-expanded', !isOpen);
      
      if (!isOpen && allUsers.length === 0) {
        loadUsers();
      }
    });

    document.addEventListener('click', function(e) {
      if (!switcher.contains(e.target)) {
        dropdown.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        dropdown.classList.add('hidden');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  async function loadInitialState() {
    try {
      const response = await fetch('/api/user-context/current');
      if (response.ok) {
        const user = await response.json();
        currentUserData = user;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        updateUI(user);
      } else {
        await restoreFromStorage();
      }
    } catch (error) {
      console.error('Failed to sync with backend:', error);
      await restoreFromStorage();
    }
  }

  async function restoreFromStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const user = JSON.parse(stored);
        currentUserData = user;
        updateUI(user);
        
        await fetch(`/api/user-context/switch/${user.id}`, { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Failed to restore user from storage:', error);
        updateUI(null);
      }
    } else {
      updateUI(null);
    }
  }

  async function loadUsers() {
    const list = document.getElementById('userList');
    if (!list) return;

    try {
      const response = await fetch('/api/users/all');
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      allUsers = users || [];

      if (allUsers.length === 0) {
        list.innerHTML = '<div class="user-list-empty">No users found</div>';
        return;
      }

      renderUserList(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      list.innerHTML = '<div class="user-list-error">Failed to load users. Please try again.</div>';
    }
  }

  function renderUserList(users) {
    const list = document.getElementById('userList');
    if (!list) return;

    const currentId = currentUserData?.id;

    list.innerHTML = users.map(user => {
      const isActive = String(user.id) === String(currentId);
      const displayName = escapeHtml(user.displayName || user.distinctName);
      const distinctName = escapeHtml(user.distinctName);
      
      return `
        <div class="user-option ${isActive ? 'active' : ''}" 
             data-user-id="${user.id}" 
             role="menuitem"
             tabindex="0">
          <img class="user-option-avatar-img" 
               src="/api/users/${user.id}/profile-picture" 
               alt="${displayName}"
               onerror="this.src='/images/default_profile-picture.jpg'; this.classList.add('fallback')">
          <div class="user-option-info">
            <div class="user-option-name">${displayName}</div>
            <div class="user-option-handle">@${distinctName}</div>
          </div>
          <svg class="user-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
      `;
    }).join('');

    list.querySelectorAll('.user-option').forEach(option => {
      option.addEventListener('click', () => handleUserSwitch(option.dataset.userId));
      option.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleUserSwitch(option.dataset.userId);
        }
      });
    });
  }

  async function handleUserSwitch(userId) {
    const user = allUsers.find(u => String(u.id) === String(userId));
    if (!user) return;

    try {
      const response = await fetch(`/api/user-context/switch/${userId}`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error('Failed to switch user');

      currentUserData = user;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));

      const dropdown = document.getElementById('userSwitcherDropdown');
      const trigger = document.getElementById('userSwitcherTrigger');
      if (dropdown) dropdown.classList.add('hidden');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');

      updateUI(user);
      window.dispatchEvent(new CustomEvent('userChanged', { detail: user }));

      renderUserList(allUsers);

    } catch (error) {
      console.error('Error switching user:', error);
      showNotification('Failed to switch user. Please try again.', 'error');
    }
  }

  function updateUI(user) {
    const nameEl = document.getElementById('switcherName');
    const handleEl = document.getElementById('switcherHandle');
    const avatarImg = document.getElementById('switcherAvatarImg');

    if (!user) {
      if (nameEl) nameEl.textContent = 'No user selected';
      if (handleEl) handleEl.textContent = 'Select an account';
      if (avatarImg) avatarImg.src = '/images/default_profile-picture.jpg';
      return;
    }

    if (nameEl) nameEl.textContent = user.displayName || user.distinctName || 'Unknown';
    if (handleEl) handleEl.textContent = `@${user.distinctName || 'unknown'}`;
    if (avatarImg) {
      avatarImg.src = `/api/users/${user.id}/profile-picture`;
    }
  }

  function showNotification(message, type = 'info') {
    if (window.ToastManager) {
      const method = type === 'error' ? 'error' : type === 'success' ? 'success' : 'show';
      window.ToastManager[method](message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  window.UserSwitcher = {
    getCurrentUser: async function() {
      try {
        const response = await fetch('/api/user-context/current');
        if (response.ok) {
          const user = await response.json();
          currentUserData = user;
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          return user;
        }
      } catch (error) {
        console.error('Error getting current user:', error);
      }
      return this.getCurrentUserSync();
    },

    getCurrentUserId: async function() {
      const user = await this.getCurrentUser();
      return user ? user.id : null;
    },

    getCurrentUserSync: function() {
      return currentUserData;
    },

    getCurrentUserIdSync: function() {
      return currentUserData ? currentUserData.id : null;
    },

    switchUser: async function(userId) {
      await handleUserSwitch(userId);
      return currentUserData;
    },

    clearUser: async function() {
      try {
        await fetch('/api/user-context/reset', { method: 'POST' });
      } catch (error) {
        console.error('Error resetting user context:', error);
      }
      localStorage.removeItem(STORAGE_KEY);
      currentUserData = null;
      updateUI(null);
      window.dispatchEvent(new CustomEvent('userChanged', { detail: null }));
    },

    refresh: async function() {
      await loadInitialState();
      await loadUsers();
    },

    reloadUsers: loadUsers
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
