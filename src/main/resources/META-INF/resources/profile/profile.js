document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    const displayNameElement = document.getElementById('displayName');
    const distinctNameElement = document.getElementById('distinctName');
    let currentUserId = null;
    let isViewingOwnProfile = false;
    let viewedUserId = null;
    let relationshipStatus = null;

    if (!img) return;

    // Helper function to try loading images from multiple URLs
    async function tryImageUrls(urls, timeout = 5000) {
        for (const url of urls) {
            try {
                const loaded = await new Promise((resolve) => {
                    const testImg = new Image();
                    const timer = setTimeout(() => resolve(false), timeout);
                    testImg.onload = () => {
                        clearTimeout(timer);
                        resolve(true);
                    };
                    testImg.onerror = () => {
                        clearTimeout(timer);
                        resolve(false);
                    };
                    testImg.src = url;
                });
                if (loaded) return url;
            } catch (e) {
                // Continue to next URL
            }
        }
        return null;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get('handle');
    const userId = urlParams.get('id');

    if (userHandle) {
        loadUserDataByHandle(userHandle);
    } else if (userId) {
        loadUserDataById(userId);
    } else {
        isViewingOwnProfile = true;
        loadCurrentUserData();
    }

    window.addEventListener('userChanged', function(event) {
        if (event.detail && event.detail.id) {
            if (isViewingOwnProfile) {
                window.location.reload();
            }
        }
    });

    async function loadCurrentUserData() {
        try {
            const response = await fetch('/api/user-context/current');
            if (response.ok) {
                const userData = await response.json();
                currentUserId = userData.id;
                isViewingOwnProfile = true;
                updateUserProfile(userData);
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.set('id', userData.id);
                window.history.replaceState({}, '', newUrl);
            } else {
                throw new Error('Failed to load current user');
            }
        } catch (error) {
            console.error('Failed to load current user data:', error);
            loadUserDataById(1);
        }
    }

    function loadUserDataByHandle(userHandle) {
        const userApiUrl = `/api/users/handle/${userHandle}`;
        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(userData => {
                currentUserId = null;
                isViewingOwnProfile = false;
                viewedUserId = userData.id;
                disableTabsForOtherUser();
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
        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(userData => {
                fetch('/api/user-context/current')
                    .then(r => r.json())
                    .then(context => {
                        currentUserId = context.id;
                        isViewingOwnProfile = (String(userId) === String(context.id));
                        viewedUserId = userData.id;
                        if (!isViewingOwnProfile) {
                            disableTabsForOtherUser();
                        }
                        updateUserProfile(userData);
                    })
                    .catch(() => {
                        currentUserId = null;
                        isViewingOwnProfile = false;
                        viewedUserId = userData.id;
                        disableTabsForOtherUser();
                        updateUserProfile(userData);
                    });
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

        // Load profile picture from API
        img.src = `/api/users/${user.id}/profile-picture`;
        img.onerror = function() {
            this.onerror = null;
            this.src = '/images/default_profile-picture.jpg';
        };

        if (displayNameElement && user.displayName) {
            displayNameElement.textContent = user.displayName;
        }
        if (distinctNameElement && user.distinctName) {
            distinctNameElement.textContent = `@${user.distinctName}`;
        }

        if (isViewingOwnProfile) {
            loadUserStats(user.id);
            loadUserParties();
            hideProfileActions();
        } else {
            loadUserStats(user.id);
            loadRelationshipStatus(user.id);
        }

        // Load parties for the selected user (will prefer backend.getPartiesByUser)
        try { loadUserParties(); } catch (e) { console.debug('loadUserParties invocation failed', e); }
    }

    function loadUserStats(userId) {
        const stats = [
            { key: 'followers', id: 'followersCount' },
            { key: 'following', id: 'followingCount' },
            { key: 'media', id: 'postsCount' }
        ];

        stats.forEach(stat => {
            const el = document.getElementById(stat.id);
            if (!el) return;

            fetch(`/api/users/${userId}/${stat.key}/count`)
                .then(response => {
                    if (!response.ok) return { count: 0 };
                    return response.json();
                })
                .then(data => {
                    const count = data.count !== undefined ? data.count : 0;
                    el.textContent = formatCount(count);
                })
                .catch(() => {
                    el.textContent = '0';
                });
        });
    }

    function formatCount(count) {
        if (count >= 1000000) return (count / 1000000).toFixed(1) + 'M';
        if (count >= 1000) return (count / 1000).toFixed(1) + 'K';
        return count.toString();
    }

    function loadFollowersList(userId) {
        const modal = document.getElementById('userListModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalUserList = document.getElementById('modalUserList');
        const modalLoading = document.getElementById('modalLoading');
        const modalEmpty = document.getElementById('modalEmpty');

        modalTitle.textContent = 'Followers';
        modalUserList.innerHTML = '';
        modalLoading.style.display = 'flex';
        modalEmpty.style.display = 'none';
        modal.classList.remove('hidden');

        fetch(`/api/users/${userId}/followers`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load followers');
                return response.json();
            })
            .then(data => {
                modalLoading.style.display = 'none';
                const followers = data.followers || data || [];
                modalUserList.innerHTML = '';

                if (followers.length === 0) {
                    modalEmpty.style.display = 'flex';
                    return;
                }

                followers.forEach(user => {
                    const item = createModalUserItem(user);
                    modalUserList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error loading followers:', error);
                modalLoading.style.display = 'none';
                modalEmpty.style.display = 'flex';
            });
    }

    function loadFollowingList(userId) {
        const modal = document.getElementById('userListModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalUserList = document.getElementById('modalUserList');
        const modalLoading = document.getElementById('modalLoading');
        const modalEmpty = document.getElementById('modalEmpty');

        modalTitle.textContent = 'Following';
        modalUserList.innerHTML = '';
        modalLoading.style.display = 'flex';
        modalEmpty.style.display = 'none';
        modal.classList.remove('hidden');

        fetch(`/api/users/${userId}/following`)
            .then(response => {
                if (!response.ok) throw new Error('Failed to load following');
                return response.json();
            })
            .then(data => {
                modalLoading.style.display = 'none';
                const following = data.following || data || [];
                modalUserList.innerHTML = '';

                if (following.length === 0) {
                    modalEmpty.style.display = 'flex';
                    return;
                }

                following.forEach(user => {
                    const item = createModalUserItem(user);
                    modalUserList.appendChild(item);
                });
            })
            .catch(error => {
                console.error('Error loading following:', error);
                modalLoading.style.display = 'none';
                modalEmpty.style.display = 'flex';
            });
    }

    function createModalUserItem(user) {
        const item = document.createElement('div');
        item.className = 'modal-user-item';
        item.innerHTML = `
            <img src="/api/users/${user.id}/profile-picture" class="modal-user-avatar" onerror="this.src='/images/default_profile-picture.jpg'" alt="${escapeHtml(user.displayName || user.distinctName)}">
            <div class="modal-user-info">
                <span class="modal-user-name">${escapeHtml(user.displayName || user.distinctName)}</span>
                <span class="modal-user-handle">@${escapeHtml(user.distinctName)}</span>
            </div>
        `;
        item.addEventListener('click', () => {
            window.location.href = `/profile/profile.html?handle=${user.distinctName}`;
            closeModal();
        });
        return item;
    }

    function closeModal() {
        const modal = document.getElementById('userListModal');
        modal.classList.add('hidden');
    }

    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            if (searchTimeout) clearTimeout(searchTimeout);
            if (query === '') {
                if (searchDropdown) searchDropdown.classList.add('hidden');
                return;
            }
            searchTimeout = setTimeout(() => performSearch(query), 300);
        });
    }

    function performSearch(query) {
        fetch(`/api/users/all/search?name=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(data => displaySearchResults(data))
            .catch(() => {
                if (searchDropdown) searchDropdown.classList.add('hidden');
            });
    }

    function displaySearchResults(results) {
        if (!results || results.length === 0) {
            if (searchDropdown) searchDropdown.classList.add('hidden');
            return;
        }
        if (!searchResults) return;
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
        if (searchDropdown) searchDropdown.classList.remove('hidden');
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
        if (!usernameList) return;
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

    document.addEventListener('click', (e) => {
        if (usernameDropdown && !usernameDropdown.contains(e.target) && e.target !== usernameBtn) {
            usernameDropdown.classList.add('hidden');
        }
    });

    const followersBtn = document.getElementById('followersBtn');
    const followingBtn = document.getElementById('followingBtn');
    const modalClose = document.querySelector('.modal-close');
    const modalOverlay = document.querySelector('.modal-overlay');

    if (followersBtn) {
        followersBtn.addEventListener('click', () => {
            const userId = viewedUserId || currentUserId;
            if (userId) loadFollowersList(userId);
        });
    }

    if (followingBtn) {
        followingBtn.addEventListener('click', () => {
            const userId = viewedUserId || currentUserId;
            if (userId) loadFollowingList(userId);
        });
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', closeModal);
    }

    function switchTab(tabId) {
        const tabBtn = document.getElementById(tabId);
        if (!tabBtn) return;

        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        tabBtn.classList.add('active');

        document.querySelectorAll('.tab-section').forEach(section => section.style.display = 'none');

        const contentId = tabId.replace('tab', 'tabContent');
        const contentSection = document.getElementById(contentId);
        if (contentSection) {
            contentSection.style.display = 'block';
        }
    }

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isViewingOwnProfile) return;
            switchTab(btn.id);
        });
    });

    async function loadUserParties() {
        if (!currentUserId) return;

        let parties = null;
        let backendProvided = false;

        if (typeof window.backend === 'object' && typeof window.backend.getPartiesByUser === 'function') {
            try { parties = await window.backend.getPartiesByUser(currentUserId); } catch (e) {}
            if (Array.isArray(parties)) backendProvided = true;
        }

        if (!Array.isArray(parties)) {
            const endpoints = [
                `/api/party/`,
                `/api/party?host_user_id=${currentUserId}`,
                `/api/users/${currentUserId}/parties`
            ];
            let found = null;
            for (const u of endpoints) {
                try {
                    const res = await fetch(u);
                    if (res.ok) {
                        const data = await res.json();
                        found = { url: u, data };
                        break;
                    }
                } catch (err) {}
            }
            if (found) {
                parties = Array.isArray(found.data) ? found.data : found.data.data;
                // if endpoint is user-scoped (contains "/users/"), assume backend already filtered
                if (found.url && found.url.includes(`/users/${currentUserId}`)) backendProvided = true;
            }
        }

        if (!Array.isArray(parties)) parties = [];

        const filtered = parties.filter(p => {
            if (!p) return false;
            const hostId = p.host_user_id || p.hostId || p.host_id || p.ownerId ||
                           (p.host && p.host.id) || (p.owner && p.owner.id);
            return String(hostId) === String(currentUserId);
        });

        const container = document.getElementById('partiesContainer');
        const template = document.getElementById('party-template');
        const noMsgState = document.getElementById('noPartiesState');

        if (!container || !template) return;
        container.innerHTML = '';

        if (filtered.length === 0) {
            if (noMsgState) noMsgState.style.display = 'flex';
            return;
        }

        if (noMsgState) noMsgState.style.display = 'none';

        filtered.forEach(p => {
            const node = template.content.cloneNode(true);
            node.querySelector('.party-name').textContent = p.title || p.name || 'Party';
            node.querySelector('.party-date').textContent = p.time_start || p.date || '';

            const locEl = node.querySelector('.party-location');
            if (locEl) locEl.textContent = (p.location && p.location.name) ? p.location.name : (p.location || '');

            const deleteBtn = node.querySelector('.delete-btn');
            if (deleteBtn) {
                deleteBtn.onclick = async (e) => {
                    e.stopPropagation();
                    if (!confirm('Delete this party?')) return;
                    const res = await fetch(`/api/party/${p.id}`, { method: 'DELETE' });
                    if (res.ok) loadUserParties();
                };
            }

            container.appendChild(node);
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function hideProfileActions() {
        const profileActions = document.getElementById('profileActions');
        const editAccountBtn = document.getElementById('editAccountBtn');
        if (profileActions) profileActions.classList.add('hidden');
        if (editAccountBtn) editAccountBtn.style.display = 'block';
    }

    function showProfileActions() {
        const profileActions = document.getElementById('profileActions');
        const editAccountBtn = document.getElementById('editAccountBtn');
        if (profileActions) profileActions.classList.remove('hidden');
        if (editAccountBtn) editAccountBtn.style.display = 'none';
    }

    function loadRelationshipStatus(userId) {
        if (!currentUserId || !userId || currentUserId === userId) {
            hideProfileActions();
            return;
        }

        fetch(`/api/users/${userId}/relationship?from=${currentUserId}`)
            .then(response => {
                if (!response.ok) return { isFollowing: false };
                return response.json();
            })
            .then(data => {
                relationshipStatus = data;
                updateActionButtons(data);
            })
            .catch(() => {
                relationshipStatus = { isFollowing: false };
                updateActionButtons(relationshipStatus);
            });
    }

    function updateActionButtons(status) {
        const followBtn = document.getElementById('followBtn');
        const followSpan = followBtn ? followBtn.querySelector('span') : null;

        if (!followBtn) return;

        showProfileActions();

        if (status.isFollowing) {
            followBtn.classList.add('following');
            followBtn.classList.remove('action-btn--primary');
            followBtn.classList.add('action-btn--secondary');
            if (followSpan) followSpan.textContent = 'Following';
        } else {
            followBtn.classList.remove('following');
            followBtn.classList.add('action-btn--primary');
            followBtn.classList.remove('action-btn--secondary');
            if (followSpan) followSpan.textContent = 'Follow';
        }
    }

    function handleFollow() {
        if (!viewedUserId || !currentUserId) return;

        const followBtn = document.getElementById('followBtn');
        const isCurrentlyFollowing = relationshipStatus?.isFollowing;

        if (isCurrentlyFollowing) {
            fetch(`/api/users/${viewedUserId}/followers/${currentUserId}`, { method: 'DELETE' })
                .then(response => {
                    if (response.ok) {
                        relationshipStatus.isFollowing = false;
                        updateActionButtons(relationshipStatus);
                        ToastManager.success('Unfollowed successfully');
                        refreshStats();
                    } else {
                        throw new Error('Failed to unfollow');
                    }
                })
                .catch(() => {
                    ToastManager.error('Failed to unfollow');
                });
        } else {
            fetch(`/api/users/${viewedUserId}/followers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserId })
            })
            .then(response => {
                if (response.ok || response.status === 201) {
                    relationshipStatus.isFollowing = true;
                    updateActionButtons(relationshipStatus);
                    ToastManager.success('Now following');
                    refreshStats();
                } else {
                    throw new Error('Failed to follow');
                }
            })
            .catch(() => {
                ToastManager.error('Failed to follow');
            });
        }
    }

    function refreshStats() {
        if (viewedUserId) {
            loadUserStats(viewedUserId);
        }
    }

    const followBtn = document.getElementById('followBtn');

    if (followBtn) {
        followBtn.addEventListener('click', handleFollow);
    }
});
