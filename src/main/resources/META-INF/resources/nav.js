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
    // The settings belong to the profile tab (settings/index.html must not light up "Home").
    const rawPath = window.location.pathname.toLowerCase();
    const currentPath = rawPath.startsWith('/settings/') ? '/profile/settings' : rawPath;

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

// ---------- Live updates ----------
// One server-sent-events stream per tab (/api/live/events). The server only says *what* changed
// for the logged-in user ("notifications", "follows", "attendance"); pages listen for the
// "partyhub:live" window event and reload that part themselves. Polling stays as a fallback.
const LIVE_MAX_BACKOFF_MS = 30000;
window.partyhubLive = { connected: false };
let liveController = null;
let liveBackoffMs = 2000;
let liveReconnectTimer = null;

function setLiveConnected(connected) {
    if (window.partyhubLive.connected === connected) return;
    window.partyhubLive.connected = connected;
    window.dispatchEvent(new CustomEvent('partyhub:live-status', { detail: { connected } }));
}

function handleLiveBlock(block) {
    const eventName = /^event:\s*(.+)$/m.exec(block)?.[1]?.trim();
    if (eventName === 'ready') {
        setLiveConnected(true);
        return;
    }
    if (eventName !== 'changed') return;
    let kind = null;
    try {
        kind = JSON.parse(/^data:\s*(.+)$/m.exec(block)?.[1] ?? '{}').kind ?? null;
    } catch (error) {
        // Unknown payload: still tell pages that something changed.
    }
    if (kind === 'notifications' || kind === 'follows') refreshUnreadBadge();
    window.dispatchEvent(new CustomEvent('partyhub:live', { detail: { kind } }));
}

async function connectLiveStream() {
    clearTimeout(liveReconnectTimer);
    if (liveController || !(await ensureLoggedIn())) return;

    const controller = new AbortController();
    liveController = controller;
    try {
        const response = await window.authService.apiCall('/api/live/events', {
            headers: { Accept: 'text/event-stream' },
            signal: controller.signal,
            authRequired: false,
        });
        if (response.status === 401 || response.status === 403) {
            liveController = null;
            return; // not logged in (anymore); nothing to stream
        }
        if (!response.ok || !response.body) throw new Error(`Live stream status ${response.status}`);

        liveBackoffMs = 2000;
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = '';
        for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            const blocks = buffer.split(/\r?\n\r?\n/);
            buffer = blocks.pop();
            blocks.forEach(handleLiveBlock);
        }
        throw new Error('Live stream closed');
    } catch (error) {
        if (liveController !== controller) return;
        liveController = null;
        setLiveConnected(false);
        if (controller.signal.aborted) return; // stopped on purpose
        console.warn('Live updates interrupted, reconnecting:', error.message);
        liveReconnectTimer = setTimeout(connectLiveStream, liveBackoffMs);
        liveBackoffMs = Math.min(liveBackoffMs * 2, LIVE_MAX_BACKOFF_MS);
    }
}

function stopLiveStream() {
    clearTimeout(liveReconnectTimer);
    const controller = liveController;
    liveController = null;
    controller?.abort();
    setLiveConnected(false);
}

window.addEventListener('pagehide', stopLiveStream);
window.addEventListener('pageshow', (event) => {
    if (event.persisted) connectLiveStream();
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connectLiveStream);
} else {
    connectLiveStream();
}
