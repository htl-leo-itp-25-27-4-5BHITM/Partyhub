function highlightActiveNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('.nav-btn');
    const navLabels = ['Home', 'Parties', 'Inbox', 'Profile'];
    links.forEach((link, index) => {
        if (!link.querySelector('.nav-label') && navLabels[index]) {
            const label = document.createElement('span');
            label.className = 'nav-label';
            label.textContent = navLabels[index];
            link.appendChild(label);
        }
    });
    const currentPath = window.location.pathname.toLowerCase();

    links.forEach(a => {
        const icon = a.querySelector('.nav-icon');
        if (!icon) return;

        icon.classList.remove('icon--green');
        icon.classList.add('icon--pink');
        a.classList.remove('active');
        a.removeAttribute('aria-current');

        const href = (a.getAttribute('href') || '').toLowerCase();
        if (href.includes('index') && (currentPath === '/' || currentPath.includes('index'))) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('listpartys') && currentPath.includes('listpartys')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('notifications') && currentPath.includes('notifications')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('profile') && currentPath.includes('profile')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightActiveNav);
} else {
    highlightActiveNav();
}

// Unread notification badge on the Inbox nav button.
// Opening the notifications page marks everything as read and clears it.
const UNREAD_POLL_INTERVAL_MS = 15000;
const UNREAD_CACHE_KEY = 'partyhub.unreadCount';
let unreadPollTimer = null;
let unreadRequestInFlight = false;

function getInboxNavLink() {
    return document.querySelector('.bottom-nav .nav-btn[href*="notifications"]');
}

function isNotificationsPage() {
    return window.location.pathname.toLowerCase().includes('/notifications');
}

function readCachedUnreadCount() {
    try {
        const value = Number(sessionStorage.getItem(UNREAD_CACHE_KEY));
        return Number.isFinite(value) ? value : 0;
    } catch (error) {
        return 0;
    }
}

function writeCachedUnreadCount(count) {
    try {
        sessionStorage.setItem(UNREAD_CACHE_KEY, String(count));
    } catch (error) {
        // Storage can be unavailable (private mode); the badge still works.
    }
}

function renderUnreadBadge(count) {
    const link = getInboxNavLink();
    if (!link) return;

    writeCachedUnreadCount(count > 0 ? count : 0);

    let badge = link.querySelector('.nav-badge');
    if (!count || count < 1) {
        badge?.remove();
        link.setAttribute('aria-label', 'Inbox');
        return;
    }

    if (!badge) {
        badge = document.createElement('span');
        badge.className = 'nav-badge';
        badge.setAttribute('aria-hidden', 'true');
        link.appendChild(badge);
    }

    badge.textContent = count > 99 ? '99+' : String(count);
    link.setAttribute('aria-label', `Inbox, ${count} unread notification${count === 1 ? '' : 's'}`);
}

async function ensureLoggedIn() {
    const auth = window.authService;
    if (!auth?.apiCall) return false;
    if (auth.isLoggedIn?.()) return true;
    try {
        return Boolean(await auth.init?.());
    } catch (error) {
        return false;
    }
}

async function markAllNotificationsRead() {
    renderUnreadBadge(0);
    if (!(await ensureLoggedIn())) return;
    try {
        await window.authService.apiCall('/api/notifications/read-all', {
            method: 'POST',
            authRequired: false,
        });
    } catch (error) {
        console.warn('Marking notifications as read failed:', error);
    }
}

async function refreshUnreadBadge() {
    if (isNotificationsPage()) {
        renderUnreadBadge(0);
        return;
    }
    if (unreadRequestInFlight || !getInboxNavLink()) return;

    unreadRequestInFlight = true;
    try {
        if (!(await ensureLoggedIn())) {
            renderUnreadBadge(0);
            return;
        }
        const response = await window.authService.apiCall('/api/notifications/unread/count', {
            authRequired: false,
            cache: 'no-store',
        });
        if (!response.ok) return;
        const data = await response.json();
        renderUnreadBadge(Number(data?.count) || 0);
    } catch (error) {
        console.warn('Loading unread notifications failed:', error);
    } finally {
        unreadRequestInFlight = false;
    }
}

function initUnreadBadge() {
    const link = getInboxNavLink();
    if (!link) return;

    // Clicking the inbox counts as reading: hide the badge right away.
    link.addEventListener('click', () => renderUnreadBadge(0));

    if (isNotificationsPage()) {
        markAllNotificationsRead();
        return;
    }

    // Show the last known count instantly, then fetch the real one.
    renderUnreadBadge(readCachedUnreadCount());
    refreshUnreadBadge();

    clearInterval(unreadPollTimer);
    unreadPollTimer = setInterval(() => {
        if (document.visibilityState === 'visible') refreshUnreadBadge();
    }, UNREAD_POLL_INTERVAL_MS);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshUnreadBadge();
    });
    window.addEventListener('focus', refreshUnreadBadge);
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) refreshUnreadBadge();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUnreadBadge);
} else {
    initUnreadBadge();
}
