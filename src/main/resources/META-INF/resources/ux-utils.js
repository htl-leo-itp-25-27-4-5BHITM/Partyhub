const ToastManager = {
  container: null,
  defaultDuration: 4000,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
    return this.container;
  },

  show(options) {
    this.init();
    const { title, message, type = 'info', duration = this.defaultDuration, action } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');

    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 12l2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2"/></svg>',
      info: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <div class="toast-content">
        ${title ? `<h4 class="toast-title">${title}</h4>` : ''}
        ${message ? `<p class="toast-message">${message}</p>` : ''}
        ${action ? `<button class="toast-action">${action.label}</button>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
      ${duration > 0 ? `<div class="toast-progress" style="animation-duration: ${duration}ms"></div>` : ''}
    `;

    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    if (action && action.onClick) {
      const actionBtn = toast.querySelector('.toast-action');
      actionBtn.addEventListener('click', () => {
        action.onClick();
        this.dismiss(toast);
      });
    }

    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  },

  dismiss(toast) {
    if (!toast || !toast.parentNode) return;
    toast.classList.add('toast--exit');
    toast.addEventListener('animationend', () => {
      toast.remove();
    });
  },

  success(message, title = 'Success') {
    return this.show({ title, message, type: 'success' });
  },

  error(message, title = 'Error') {
    return this.show({ title, message, type: 'error' });
  },

  warning(message, title = 'Warning') {
    return this.show({ title, message, type: 'warning' });
  },

  info(message, title = 'Info') {
    return this.show({ title, message, type: 'info' });
  },

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
};

const EmptyState = {
  create(type, options = {}) {
    const { title, message, actionLabel, actionHref, actionOnClick, icon } = options;

    const icons = {
      parties: '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6.5L8 4l7 2.5 6-2.5v11l-6 2.5L10 15 3 17.5v-11z" stroke="currentColor" stroke-width="1.5"/><path d="M12 22a2.5 2.5 0 0 0 2.45-2H9.55A2.5 2.5 0 0 0 12 22z" fill="currentColor"/><path d="M18 8a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2V8z" stroke="currentColor" stroke-width="1.5"/></svg>',
      favorites: '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21c-.6 0-1.2-.2-1.7-.6C6.1 17.1 2 13.36 2 9.5 2 6.42 4.42 4 7.5 4c1.74 0 3.41.81 4.5 2.09C13.09 4.81 14.76 4 16.5 4 19.58 4 22 6.42 22 9.5c0 3.86-4.1 7.6-8.3 10.9-.5.4-1.1.6-1.7.6z" fill="currentColor" stroke="currentColor" stroke-width="1.5"/></svg>',
      notifications: '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 8A6 6 0 1 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" stroke-width="1.5"/></svg>',
      search: '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="1.5"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.5"/></svg>',
      generic: '<svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>'
    };

    const titles = {
      parties: 'No Parties Yet',
      favorites: 'No Favorites',
      notifications: 'No Notifications',
      search: 'Nothing Found',
      generic: 'Nothing Here'
    };

    const messages = {
      parties: 'Be the first to create a party and get the celebration started!',
      favorites: 'Start exploring and save your favorite parties here.',
      notifications: 'When you receive invitations or updates, they\'ll appear here.',
      search: 'Try adjusting your search terms or filters.',
      generic: 'There\'s nothing to show right now.'
    };

    const div = document.createElement('div');
    div.className = `empty-state empty-state--${type}`;
    div.innerHTML = `
      ${icon || icons[type] || icons.generic}
      <h3 class="empty-state-title">${title || titles[type]}</h3>
      <p class="empty-state-message">${message || messages[type]}</p>
      ${actionLabel ? `<a href="${actionHref || '#'}" class="empty-state-action">${actionLabel}</a>` : ''}
    `;

    return div;
  }
};

const SkeletonLoader = {
  card() {
    const div = document.createElement('div');
    div.className = 'skeleton-card';
    div.innerHTML = `
      <div class="skeleton-card-header">
        <div class="skeleton skeleton-avatar"></div>
        <div style="flex: 1">
          <div class="skeleton skeleton-text skeleton-text--title"></div>
          <div class="skeleton skeleton-text skeleton-text--subtitle"></div>
        </div>
      </div>
      <div class="skeleton-card-body">
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text"></div>
        <div class="skeleton skeleton-text" style="width: 70%"></div>
      </div>
      <div class="skeleton-card-footer">
        <div class="skeleton skeleton-button"></div>
      </div>
    `;
    return div;
  },

  listItem() {
    const div = document.createElement('div');
    div.className = 'skeleton-list-item';
    div.innerHTML = `
      <div class="skeleton skeleton-avatar"></div>
      <div style="flex: 1">
        <div class="skeleton skeleton-text" style="width: 60%"></div>
        <div class="skeleton skeleton-text" style="width: 40%; margin-top: 8px"></div>
      </div>
    `;
    return div;
  },

  loadingContainer() {
    const div = document.createElement('div');
    div.className = 'loading-container';
    div.innerHTML = `
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading...</p>
    `;
    return div;
  },

  multipleCards(count = 3) {
    const container = document.createElement('div');
    container.className = 'skeleton-list';
    for (let i = 0; i < count; i++) {
      container.appendChild(this.card());
    }
    return container;
  }
};

const FormValidator = {
  patterns: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    url: /^https?:\/\/[^\s]+$/,
    phone: /^[\d\s\-+()]{7,}$/
  },

  validateField(field) {
    const value = field.value.trim();
    const errors = [];
    const type = field.type;

    if (field.required && !value) {
      errors.push('This field is required');
    }

    if (value && type === 'email' && !this.patterns.email.test(value)) {
      errors.push('Please enter a valid email address');
    }

    if (value && type === 'url' && !this.patterns.url.test(value)) {
      errors.push('Please enter a valid URL (starting with http:// or https://)');
    }

    if (field.minLength && value.length < field.minLength) {
      errors.push(`Must be at least ${field.minLength} characters`);
    }

    if (field.maxLength && value.length > field.maxLength) {
      errors.push(`Must be less than ${field.maxLength} characters`);
    }

    if (field.min && parseFloat(value) < field.min) {
      errors.push(`Must be at least ${field.min}`);
    }

    if (field.max && parseFloat(value) > field.max) {
      errors.push(`Must be less than or equal to ${field.max}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  showError(field, errors) {
    const container = field.closest('.form-field') || field.parentElement;
    let errorEl = container.querySelector('.form-field__error');

    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-field__error';
      errorEl.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
          <path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span class="error-text"></span>
      `;
      container.appendChild(errorEl);
    }

    field.classList.add('form-field__input--error');
    field.classList.remove('form-field__input--success');
    errorEl.querySelector('.error-text').textContent = errors[0];
    errorEl.classList.add('form-field__error--visible');
  },

  showSuccess(field) {
    const container = field.closest('.form-field') || field.parentElement;
    const errorEl = container.querySelector('.form-field__error');

    field.classList.remove('form-field__input--error');
    field.classList.add('form-field__input--success');

    if (errorEl) {
      errorEl.classList.remove('form-field__error--visible');
    }
  },

  clearValidation(field) {
    const container = field.closest('.form-field') || field.parentElement;
    const errorEl = container.querySelector('.form-field__error');

    field.classList.remove('form-field__input--error', 'form-field__input--success');

    if (errorEl) {
      errorEl.classList.remove('form-field__error--visible');
    }
  },

  validateForm(form) {
    const fields = form.querySelectorAll('input, textarea, select');
    let isValid = true;

    fields.forEach(field => {
      if (field.type !== 'hidden' && !field.disabled) {
        const result = this.validateField(field);
        if (!result.valid) {
          this.showError(field, result.errors);
          isValid = false;
        } else if (field.value.trim()) {
          this.showSuccess(field);
        }
      }
    });

    return isValid;
  }
};

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

const Storage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

async function handleApiError(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
    ToastManager.error(errorData.message || 'Something went wrong');
    throw new Error(errorData.message || 'API request failed');
  }
  return response.json();
}

function formatRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return then.toLocaleDateString();
}

window.ToastManager = ToastManager;
window.EmptyState = EmptyState;
window.SkeletonLoader = SkeletonLoader;
window.FormValidator = FormValidator;
window.debounce = debounce;
window.throttle = throttle;
window.Storage = Storage;
window.handleApiError = handleApiError;
window.formatRelativeTime = formatRelativeTime;
