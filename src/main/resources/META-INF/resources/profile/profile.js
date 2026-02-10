document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    const displayNameElement = document.getElementById('displayName');
    const distinctNameElement = document.getElementById('distinctName');
    // global current user id used throughout this file
    let currentUserId = null;
    
    if (!img) return;

    // persistent storage helpers (remember last logged-in user across visits)
    const STORAGE_KEY = 'loggedInUserId';
    function getStoredUserId() {
        try { const v = localStorage.getItem(STORAGE_KEY); return v ? Number(v) : null; } catch (e) { return null; }
    }
    function setStoredUserId(id) {
        try { if (id == null) localStorage.removeItem(STORAGE_KEY); else localStorage.setItem(STORAGE_KEY, String(id)); } catch (e) {}
    }
    // expose setter for external login flows — call this after successful login to remember the user
    window.setLoggedInUser = setStoredUserId;

    // Synchronize storages: prefer localStorage (last logged-in user).
    // If localStorage already has the correct id, mirror it into sessionStorage to avoid legacy defaults (like "1").
    try {
        const local = getStoredUserId();
        if (local != null) {
            sessionStorage.setItem(STORAGE_KEY, String(local));
        } else {
            // remove any leftover session default (e.g. '1') to avoid confusion
            sessionStorage.removeItem(STORAGE_KEY);
        }
    } catch (e) { /* ignore storage errors (private mode) */ }
    
    // try to ask backend who is currently logged in (best-effort)
    async function fetchCurrentUserFromBackend() {
        const endpoints = ['/api/auth/me', '/api/users/me', '/api/session', '/api/users/current'];
        for (const u of endpoints) {
            try {
                const res = await fetch(u);
                if (!res.ok) { continue; }
                const data = await res.json().catch(() => null);
                if (!data) continue;
                // accept either { id: ... } or number or full user object
                if (typeof data === 'number') return data;
                if (data && typeof data === 'object') {
                    if (data.id) return Number(data.id);
                    // sometimes the payload is { user: { id: ... } }
                    if (data.user && data.user.id) return Number(data.user.id);
                }
            } catch (err) {
                // ignore, try next
            }
        }
        return null;
    }

    // 1. Handle aus der URL holen oder current user verwenden (async-safe)
    (async function initProfileLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        const userHandle = urlParams.get('handle');
        const userIdParam = urlParams.get('id');

        if (userHandle) {
            loadUserDataByHandle(userHandle);
            return;
        }

        if (userIdParam) {
            loadUserDataById(userIdParam);
            return;
        }

        // no params -> prefer stored ID, else ask backend, else fallback to getCurrentUserId()
        const stored = getStoredUserId();
        if (stored) {
            loadUserDataById(stored);
            return;
        }

        const fetched = await fetchCurrentUserFromBackend();
        if (fetched) {
            setStoredUserId(fetched);
            loadUserDataById(fetched);
            return;
        }

        // last fallback: use developer fallback
        loadUserDataById(getCurrentUserId());
    })();

    // getCurrentUserId kept as a (developer) fallback only
    function getCurrentUserId() {
        // TODO: Implement based on your authentication system
        return 1; // Test-ID (fallback)
    }

    function loadUserDataByHandle(userHandle) {
        const userApiUrl = `/api/users/handle/${userHandle}`;
        console.log("Loading user data from:", userApiUrl);
        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function loadUserDataById(userId) {
        const userApiUrl = `/api/users/${userId}`;
        console.log("Loading user data from:", userApiUrl);
        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function updateUserProfile(user) {
        currentUserId = user.id;
        // NOTE: don't automatically overwrite stored "last logged-in user" here.
        // The stored last-logged-in ID should be written explicitly by the login flow
        // (window.setLoggedInUser) or by fetchCurrentUserFromBackend() in initProfileLoad.
        // This avoids writing the developer fallback (getCurrentUserId() -> 1) into storage.

        // try multiple candidate URLs for profile image (pick first that loads)
        (async function selectProfileImage() {
            const candidates = [
                `/api/users/${user.id}/profile-picture`,
                `/api/users/${user.id}/profile_picture`,
                user.profileImage ? `/images/${user.profileImage}` : null,
                user.profileImage ? `/uploads/${user.profileImage}` : null,
                `/images/default_profile-picture.jpg`
            ].filter(Boolean);

            const good = await tryImageUrls(candidates, 3000);
            if (good) {
                img.src = good;
            } else {
                // kein externes Bild verfügbar -> setze direkt den eingebetteten SVG-Fallback (keine 404 mehr)
                img.src = 'data:image/svg+xml;utf8,' +
                    encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                        <rect width="100%" height="100%" fill="#444"/>
                        <text x="50%" y="50%" fill="#fff" font-size="18" font-family="Arial" text-anchor="middle" dominant-baseline="central">No Image</text>
                    </svg>`);
            }
        })();

        if (displayNameElement && user.displayName) {
            displayNameElement.textContent = user.displayName;
        }
        if (distinctNameElement && user.distinctName) {
            distinctNameElement.textContent = `@${user.distinctName}`;
        }

        loadUserStats(user.id);

        // Load parties for the selected user (will prefer backend.getPartiesByUser)
        try { loadUserParties(); } catch (e) { console.debug('loadUserParties invocation failed', e); }

        // keep an onerror fallback as a last resort (shouldn't be needed now)
        img.onerror = function() {
            console.warn("Profile picture onerror triggered:", this.src);
            this.onerror = null;
            this.src = 'data:image/svg+xml;utf8,' +
                encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">
                    <rect width="100%" height="100%" fill="#444"/>
                    <text x="50%" y="50%" fill="#fff" font-size="18" font-family="Arial" text-anchor="middle" dominant-baseline="central">No Image</text>
                </svg>`);
        };
    }

    function loadUserStats(userId) {
        const stats = ['followers', 'following', 'media'];
        stats.forEach(stat => {
            fetch(`/api/users/${userId}/${stat}/count`)
                .then(response => response.json())
                .then(data => {
                    const el = document.getElementById(`${stat}Count`);
                    if (el) el.setAttribute('data-count', formatCount(data.count));
                })
                .catch(() => {
                    const el = document.getElementById(`${stat}Count`);
                    if (el) el.setAttribute('data-count', '0');
                });
        });
    }

    function formatCount(count) {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if (searchTimeout) clearTimeout(searchTimeout);
            if (query === '') {
                hideDropdown();
                return;
            }
            searchTimeout = setTimeout(() => performSearch(query), 1000);
        });
    }

    function performSearch(query) {
        fetch(`/api/users/all/search?name=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => displaySearchResults(data))
            .catch(() => hideDropdown());
    }

    function displaySearchResults(results) {
        if (!results || results.length === 0) {
            hideDropdown();
            return;
        }
        searchResults.innerHTML = '';
        results.forEach(user => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <img src="/api/users/${user.id}/profile-picture" class="search-result-avatar" onerror="this.src='/images/default_profile-picture.jpg'">
                <div class="search-result-info">
                    <div class="search-result-name">${user.displayName || user.distinctName}</div>
                    <div class="search-result-distinct-name">@${user.distinctName}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                // close search dropdown
                hideDropdown();
                // persist selected id and load profile by handle in-place
                try { setStoredUserId(user.id); } catch (e) {}
                loadUserDataByHandle(user.distinctName);
                // update URL without reload
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('handle', user.distinctName);
                newUrl.searchParams.delete('id');
                window.history.replaceState({}, '', newUrl);
            });
            searchResults.appendChild(item);
        });
        searchDropdown.classList.remove('hidden');
    }

    function hideDropdown() {
        if (searchDropdown) {
            searchDropdown.classList.add('hidden');
            searchDropdown.setAttribute('aria-hidden', 'true');
        }
    }

    // Username Dropdown Logic
    const usernameBtn = document.getElementById('usernameBtn');
    const usernameDropdown = document.getElementById('usernameDropdown');
    const usernameList = document.getElementById('usernameList');
    let usernameCache = null;

    if (usernameBtn && usernameDropdown) {
        usernameBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            // toggle dropdown + aria
            const isOpen = !usernameDropdown.classList.contains('hidden');
            if (isOpen) {
                usernameDropdown.classList.add('hidden');
                usernameDropdown.setAttribute('aria-hidden', 'true');
                usernameBtn.setAttribute('aria-expanded', 'false');
                return;
            }
            // open -> fetch list
            usernameBtn.setAttribute('aria-expanded', 'true');
            usernameDropdown.setAttribute('aria-hidden', 'false');

            // Always fetch latest users from backend (don't persist full user list across sessions)
            try {
                const endpoints = ['/api/users', '/api/users/all'];
                let users = [];
                for (const url of endpoints) {
                    try {
                        const r = await fetch(url);
                        if (!r.ok) continue;
                        const d = await r.json().catch(() => null);
                        if (!d) continue;
                        users = Array.isArray(d) ? d : (Array.isArray(d.data) ? d.data : []);
                        if (users && users.length) break;
                    } catch (err) { /* try next */ }
                }
                renderUsernameList(users || []);
            } catch (err) {
                console.debug('username dropdown fetch failed', err);
                renderUsernameList([]);
            }
            usernameDropdown.classList.remove('hidden');
        });
    }

    function renderUsernameList(users) {
        usernameList.innerHTML = '';
        users.forEach(u => {
            const btn = document.createElement('button');
            btn.className = 'username-item';
            btn.innerHTML = `<span>@${u.distinctName}</span>`;
            btn.onclick = () => {
                // close dropdown + update aria
                usernameDropdown.classList.add('hidden');
                usernameDropdown.setAttribute('aria-hidden', 'true');
                usernameBtn.setAttribute('aria-expanded', 'false');

                // persist selected as last-logged-in and load profile in-place
                try { setStoredUserId(u.id); } catch (e) {}
                loadUserDataById(u.id);

                // update URL without reload (keep handle param absent, set id)
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', u.id);
                newUrl.searchParams.delete('handle');
                window.history.replaceState({}, '', newUrl);
            };
            usernameList.appendChild(btn);
        });
    }

    // --- PARTY LOADING LOGIC (CORRECTED) ---
    const hasBackend = typeof window.backend === 'object';
    let cachedPartyEndpoint = null;

    async function tryFetchJson(urls) {
        for (const u of urls) {
            try {
                const res = await fetch(u);
                if (res.ok) {
                    const data = await res.json();
                    return { url: u, data };
                }
            } catch (err) {}
        }
        return null;
    }

    async function loadUserParties() {
        if (!currentUserId) return;
        let parties = null;
        let backendProvided = false;

        // 1. Backend Helper
        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try { parties = await window.backend.getPartiesByUser(currentUserId); } catch (e) {}
            if (Array.isArray(parties)) backendProvided = true;
        }

        // 2. Fetch from APIs
        if (!Array.isArray(parties)) {
            const endpoints = [
                `/api/party/`,
                `/api/party?host_user_id=${currentUserId}`,
                `/api/users/${currentUserId}/parties`
            ];
            const found = await tryFetchJson(endpoints);
            if (found) {
                parties = Array.isArray(found.data) ? found.data : found.data.data;
                // if endpoint is user-scoped (contains "/users/"), assume backend already filtered
                if (found.url && found.url.includes(`/users/${currentUserId}`)) backendProvided = true;
            }
        }

        if (!Array.isArray(parties)) parties = [];

        // Wenn Backend bereits eine gefilterte Liste geliefert hat, vertraue darauf.
        let filtered;
        if (backendProvided) {
            filtered = parties;
        } else {
            // sonst robust clientseitig filtern
            filtered = parties.filter(p => {
                if (!p) return false;
                const targetId = String(currentUserId);
                const hostId = p.host_user_id || p.hostId || p.host_id || p.ownerId ||
                               (p.host && p.host.id) || (p.owner && p.owner.id) || p.userId || p.creatorId;
                return String(hostId) === targetId;
            });
            console.log(`Filtered ${filtered.length} parties for user ${currentUserId} (client-side)`);
        }

        // Falls clientseitige Filterung NULL Ergebnisse brachte, aber das Backend Items lieferte,
        // rendern wir die rohe Backend-Liste zur Inspektion (vermeidet versteckte Daten)
        if ((!filtered || filtered.length === 0) && Array.isArray(parties) && parties.length > 0) {
            console.warn('loadUserParties: client filtering removed all items — rendering backend-provided list for inspection. backendProvided=', backendProvided);
            filtered = parties.slice();
        }

        // Dedupliziere Partys nach eindeutiger ID bevor wir rendern.
        // Unterstützte ID-Felder: id, partyId, _id
        function getPartyId(p) {
            if (!p) return null;
            if (p.id != null) return String(p.id);
            if (p.partyId != null) return String(p.partyId);
            if (p._id != null) return String(p._id);
            return null;
        }

        // Helper: build a stable fingerprint from title|date|location
        function getPartyFingerprint(p) {
            if (!p) return null;
            const title = (p.title || p.name || p.partyName || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
            const date = (p.time_start || p.date || p.start || p.startDate || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
            let loc = '';
            if (p.location && typeof p.location === 'object') {
                loc = (p.location.name || `${p.location.latitude||''},${p.location.longitude||''}` || '').toString();
            } else {
                loc = (p.location || p.venue || p.place || '').toString();
            }
            loc = loc.trim().toLowerCase().replace(/\s+/g, ' ');
            const fp = `${title}|${date}|${loc}`;
            // if fingerprint would be empty, return null
            return fp === '||' ? null : fp;
        }

        const seenIds = new Set();
        const seenFp = new Set();
        const finalList = [];

        for (const it of (filtered || [])) {
            const pid = getPartyId(it);
            if (pid) {
                if (seenIds.has(pid)) continue;
                seenIds.add(pid);
                finalList.push(it);
                continue;
            }
            // no stable id -> try fingerprint
            const fp = getPartyFingerprint(it);
            if (fp) {
                if (seenFp.has(fp)) continue;
                seenFp.add(fp);
                finalList.push(it);
                continue;
            }
            // last resort: include if not exact same object ref (avoid JSON fallback heavy comparisons)
            finalList.push(it);
        }

        filtered = finalList;
        console.log(`After dedupe: ${filtered.length} unique parties for user ${currentUserId} (backendProvided=${backendProvided})`);

        const container = document.getElementById('partiesContainer');
        const template = document.getElementById('party-template');
        const noMsg = document.querySelector('#tabContentPartys .no-parties');

        if (!container || !template) return;
        container.innerHTML = '';

        if (filtered.length === 0) {
            if (noMsg) noMsg.style.display = 'block';
            return;
        }

        if (noMsg) noMsg.style.display = 'none';

        filtered.forEach(p => {
            const node = template.content.cloneNode(true);
            const article = node.querySelector('.party-card');
            
            // Fülle sichtbare Felder: Template verwendet drei .info-box .info-value Elemente
            const nameEl = node.querySelector('.party-name');
            const infoValues = Array.from(node.querySelectorAll('.info-box .info-value'));
            const dateEl = infoValues[0] || null;
            const timeEl = infoValues[1] || null;
            const locEl = infoValues[2] || null;

            if (nameEl) nameEl.textContent = p.title || p.name || p.partyName || 'Party';
            if (dateEl) dateEl.textContent = p.time_start || p.date || p.start || (p.startDate || '');
            if (timeEl) timeEl.textContent = p.time_end || p.end || (p.endDate || '');
            if (locEl) {
                if (p.location && typeof p.location === 'object' && p.location.name) locEl.textContent = p.location.name;
                else if (p.location && typeof p.location === 'object' && (p.location.latitude || p.location.longitude)) {
                    locEl.textContent = `${p.location.latitude?.toFixed(4) || ''}${p.location.longitude ? ', ' + (p.location.longitude?.toFixed(4) || '') : ''}`;
                } else {
                    locEl.textContent = p.location || p.venue || p.place || '';
                }
            }

            const deleteBtn = node.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm('Löschen?')) return;
                    const res = await fetch(`/api/party/${p.id}`, { method: 'DELETE' });
                    if (res.ok) loadUserParties();
                };
            }

            container.appendChild(node);
        });

        adjustPartiesContainerHeight();
    }

    function adjustPartiesContainerHeight() {
        const container = document.getElementById('partiesContainer');
        if (!container || container.children.length === 0) return;
        // Einfache Höhenberechnung für Grid-Layout
        const height = container.scrollHeight;
        container.style.maxHeight = height + 100 + "px";
    }

    window.addEventListener('resize', adjustPartiesContainerHeight);

    // --- Tab handlers: ensure the three tabs respond to click + keyboard (Enter/Space) ---
    (function initTabs() {
        const ids = ['Partys', 'Posts', 'Favorites'];
        function showTab(name) {
            ids.forEach(k => {
                const btn = document.getElementById(`tab${k}`);
                const sec = document.getElementById(`tabContent${k}`);
                if (btn) btn.classList.toggle('active', k === name);
                if (sec) sec.style.display = (k === name) ? 'block' : 'none';
            });

            try { hideProfilePictureWhenPosts(name.toLowerCase()); } catch (_) {}
            if (name === 'Partys') {
                // load parties (no-op if currentUserId not set yet)
                try { loadUserParties(); } catch (e) { console.debug('loadUserParties failed', e); }
            } else if (name === 'Posts') {
                try { loadOwnMedia(); } catch (e) { /* ignore */ }
            } else if (name === 'Favorites') {
                try { loadLikedMedia(); } catch (e) { /* ignore */ }
            }
        }

        ids.forEach(k => {
            const btn = document.getElementById(`tab${k}`);
            if (!btn) return;
            // defensive: ensure button type
            btn.setAttribute('type', 'button');

            btn.addEventListener('click', function (ev) {
                ev.preventDefault();
                ev.stopPropagation();
                showTab(k);
            });

            // keyboard support
            btn.addEventListener('keydown', function (ev) {
                if (ev.key === 'Enter' || ev.key === ' ') {
                    ev.preventDefault();
                    btn.click();
                }
            });
        });

        // keep existing initial state if Posts is marked active in HTML; otherwise ensure Partys shown
        const initial = document.querySelector('.tab-btn.active')?.id?.replace('tab','') || 'Partys';
        showTab(initial);
    })();

    // helper: try list of image URLs sequentially, return first that loads
    async function tryImageUrls(urls, timeout = 3000) {
        for (const u of urls) {
            try {
                const ok = await new Promise(resolve => {
                    const imgTest = new Image();
                    let timer = setTimeout(() => {
                        imgTest.onload = imgTest.onerror = null;
                        resolve(false);
                    }, timeout);
                    imgTest.onload = () => { clearTimeout(timer); resolve(true); };
                    imgTest.onerror = () => { clearTimeout(timer); resolve(false); };
                    imgTest.src = u;
                });
                if (ok) {
                    console.debug('Profile image available at', u);
                    return u;
                } else {
                    console.debug('Profile image not available at', u);
                }
            } catch (e) {
                console.debug('tryImageUrls error for', u, e);
            }
        }
        return null;
    }
});