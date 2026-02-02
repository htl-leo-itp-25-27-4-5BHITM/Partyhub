document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    const displayNameElement = document.getElementById('displayName');
    const distinctNameElement = document.getElementById('distinctName');
    // global current user id used throughout this file
    let currentUserId = null;
    
    if (!img) return;

    // 1. Handle aus der URL holen oder current user verwenden
    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get('handle');
    const userId = urlParams.get('id');

    // 2. User data laden
    if (userHandle) {
        loadUserDataByHandle(userHandle);
    } else if (userId) {
        loadUserDataById(userId);
    } else {
        loadUserDataById(getCurrentUserId());
    }

    function getCurrentUserId() {
        // TODO: Implement based on your authentication system
        return 1; // Test-ID
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
        
        const finalPath = `/api/users/${user.id}/profile-picture`;
        img.src = finalPath;

        if (displayNameElement && user.displayName) {
            displayNameElement.textContent = user.displayName;
        }
        if (distinctNameElement && user.distinctName) {
            distinctNameElement.textContent = `@${user.distinctName}`;
        }

        loadUserStats(user.id);
        loadUserParties(); // Wird aufgerufen, sobald currentUserId feststeht

        img.onerror = function() {
            this.src = "/images/default_profile-picture.jpg";
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
                window.location.href = `/profile/profile.html?handle=${user.distinctName}`;
            });
            searchResults.appendChild(item);
        });
        searchDropdown.classList.remove('hidden');
    }

    function hideDropdown() {
        if (searchDropdown) searchDropdown.classList.add('hidden');
    }

    // Username Dropdown Logic
    const usernameBtn = document.getElementById('usernameBtn');
    const usernameDropdown = document.getElementById('usernameDropdown');
    const usernameList = document.getElementById('usernameList');
    let usernameCache = null;

    if (usernameBtn && usernameDropdown) {
        usernameBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            if (!usernameDropdown.classList.contains('hidden')) {
                usernameDropdown.classList.add('hidden');
                return;
            }
            if (!usernameCache) {
                const endpoints = ['/api/users', '/api/users/all'];
                for (let url of endpoints) {
                    try {
                        const r = await fetch(url);
                        if (r.ok) {
                            const d = await r.json();
                            usernameCache = Array.isArray(d) ? d : d.data;
                            if (usernameCache) break;
                        }
                    } catch (e) {}
                }
            }
            renderUsernameList(usernameCache || []);
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
                usernameDropdown.classList.add('hidden');
                loadUserDataById(u.id);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', u.id);
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

        // 1. Backend Helper
        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try { parties = await window.backend.getPartiesByUser(currentUserId); } catch (e) {}
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
            }
        }

        if (!Array.isArray(parties)) parties = [];

        // ROBUSTER FILTER: Vergleicht verschiedene mögliche ID-Felder
        const filtered = parties.filter(p => {
            if (!p) return false;
            const targetId = String(currentUserId);
            const hostId = p.host_user_id || p.hostId || p.host_id || p.ownerId || 
                           (p.host && p.host.id) || (p.owner && p.owner.id);
            return String(hostId) === targetId;
        });

        console.log(`Filtered ${filtered.length} parties for user ${currentUserId}`);

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
            
            node.querySelector('.party-name').textContent = p.title || p.name || 'Party';
            node.querySelector('.party-date').textContent = p.time_start || p.date || '';
            
            const locEl = node.querySelector('.party-location');
            if (locEl) locEl.textContent = (p.location && p.location.name) ? p.location.name : (p.location || '');

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
});