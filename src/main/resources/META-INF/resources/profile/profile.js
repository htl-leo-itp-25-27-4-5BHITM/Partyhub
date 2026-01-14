document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    const displayNameElement = document.getElementById('displayName');
    const distinctNameElement = document.getElementById('distinctName');

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
        // Default to current user
        loadUserDataById(getCurrentUserId());
    }

    function getCurrentUserId() {
        // TODO: Implement based on your authentication system
        // This could be from localStorage, session, JWT token, etc.
        // For now, return a hardcoded ID for testing
        return 1; // Replace with actual user ID retrieval
    }

    function loadUserDataByHandle(userHandle) {
        const userApiUrl = `/api/users/handle/${userHandle}`;

        console.log("Loading user data from:", userApiUrl);

        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                // Fallback: show error state
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function loadUserDataById(userId) {
        const userApiUrl = `/api/users/${userId}`;

        console.log("Loading user data from:", userApiUrl);

        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                // Fallback: show error state
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function updateUserProfile(user) {
        // Set current user ID for party/media loading
        currentUserId = user.id;
        
        // Update profile picture
        const finalPath = `/api/users/${user.id}/profile-picture`;
        console.log("Loading profile picture from: " + finalPath);
        img.src = finalPath;

        // Update display name
        if (displayNameElement && user.displayName) {
            displayNameElement.textContent = user.displayName;
        }

        // Update distinct name/handle
        if (distinctNameElement && user.distinctName) {
            distinctNameElement.textContent = `@${user.distinctName}`;
        }

        // Load and update follower/following/media counts
        loadUserStats(user.id);

        // Load initial data
        loadUserParties();

        // Error handling for profile picture
        img.onerror = function() {
            console.error("Profile picture not found:", this.src);
            // Fallback to default image
            this.src = "/images/default_profile-picture.jpg";
        };
    }

    function loadUserStats(userId) {
        // Load follower count
        fetch(`/api/users/${userId}/followers/count`)
            .then(response => response.json())
            .then(data => {
                const followersElement = document.getElementById('followersCount');
                if (followersElement) {
                    followersElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading follower count:', error);
                const followersElement = document.getElementById('followersCount');
                if (followersElement) {
                    followersElement.setAttribute('data-count', '0');
                }
            });

        // Load following count
        fetch(`/api/users/${userId}/following/count`)
            .then(response => response.json())
            .then(data => {
                const followingElement = document.getElementById('followingCount');
                if (followingElement) {
                    followingElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading following count:', error);
                const followingElement = document.getElementById('followingCount');
                if (followingElement) {
                    followingElement.setAttribute('data-count', '0');
                }
            });

        // Load media count (posts)
        fetch(`/api/users/${userId}/media/count`)
            .then(response => response.json())
            .then(data => {
                const postsElement = document.getElementById('postsCount');
                if (postsElement) {
                    postsElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading media count:', error);
                const postsElement = document.getElementById('postsCount');
                if (postsElement) {
                    postsElement.setAttribute('data-count', '0');
                }
            });
    }

    function formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        } else {
            return count.toString();
        }
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // If query is empty, hide dropdown
            if (query === '') {
                hideDropdown();
                return;
            }

            // Set new timeout for search (1 second delay)
            searchTimeout = setTimeout(function() {
                performSearch(query);
            }, 1000);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                hideDropdown();
            }
        });

        // Hide dropdown on escape key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideDropdown();
                searchInput.blur();
            }
        });
    }

    function performSearch(query) {
        const searchUrl = `/api/users/all/search?name=${encodeURIComponent(query)}`;

        console.log('Performing search with URL:', searchUrl);

        fetch(searchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Search results:', data);
                displaySearchResults(data);
            })
            .catch(error => {
                console.error('Search failed:', error);
                hideDropdown();
            });
    }

    function displaySearchResults(results) {
        if (!results || results.length === 0) {
            hideDropdown();
            return;
        }

        // Clear previous results
        searchResults.innerHTML = '';

        // Create result items
        results.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.setAttribute('data-user-handle', user.distinctName);

            resultItem.innerHTML = `
                <img src="/api/users/${user.id}/profile-picture" alt="${user.displayName}" class="search-result-avatar" onerror="this.src='/images/default_profile-picture.jpg'">
                <div class="search-result-info">
                    <div class="search-result-name">${user.displayName || user.distinctName}</div>
                    <div class="search-result-distinct-name">@${user.distinctName}</div>
                </div>
            `;

            // Add click handler to navigate to user profile
            resultItem.addEventListener('click', function() {
                const userHandle = this.getAttribute('data-user-handle');
                window.location.href = `/profile/profile.html?handle=${userHandle}`;
            });

            searchResults.appendChild(resultItem);
        });

        // Show dropdown
        searchDropdown.classList.remove('hidden');
    }

    function hideDropdown() {
        searchDropdown.classList.add('hidden');
        searchResults.innerHTML = '';
    }

    // Helper: safe call to backend namespace
    const hasBackend = typeof window.backend === 'object';

    // Helper: Try multiple endpoints sequentially
    async function tryFetchJson(urls, options) {
        for (const u of urls) {
            try {
                const res = await fetch(u, options);
                if (!res.ok) {
                    console.debug(`tryFetchJson: ${u} returned ${res.status}`);
                    continue;
                }
                const data = await res.json().catch(() => null);
                return { url: u, data, res };
            } catch (err) {
                console.debug(`tryFetchJson: network error for ${u}`, err);
            }
        }
        return null;
    }

    // Load user parties
    let currentUserId = null;
    async function loadUserParties() {
        if (!currentUserId) return;
        
        let parties = null;
        // prefer backend helper
        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try {
                parties = await window.backend.getPartiesByUser(currentUserId);
            } catch (err) {
                console.debug('backend.getPartiesByUser failed', err);
            }
        }
        // fallback to getAllParties+filter
        if (!Array.isArray(parties) && hasBackend && typeof window.backend.getAllParties === 'function') {
            try {
                const all = await window.backend.getAllParties();
                if (Array.isArray(all)) {
                    parties = all.filter(p => p.ownerId == currentUserId || p.creatorId == currentUserId || p.userId == currentUserId || p.owner == currentUserId);
                }
            } catch (err) {
                console.debug('backend.getAllParties failed', err);
            }
        }
        // endpoint fallbacks
        if (!Array.isArray(parties)) {
            try {
                const r = await fetch(`/api/party/`);
                if (r.ok) {
                    const data = await r.json().catch(() => null);
                    if (Array.isArray(data)) parties = data.filter(p => p.ownerId == currentUserId || p.creatorId == currentUserId || p.userId == currentUserId || p.owner == currentUserId);
                    else if (data && Array.isArray(data.data)) parties = data.data.filter(p => p.ownerId == currentUserId || p.creatorId == currentUserId || p.userId == currentUserId || p.owner == currentUserId);
                }
            } catch (err) { console.debug('fallback fetch failed', err); }
        }

        const container = document.getElementById('partiesContainer');
        const noMsg = document.querySelector('#tabContentPartys .no-parties');
        const template = document.getElementById('party-template');
        if (!container || !template) return;

        container.innerHTML = '';
        if (!parties || parties.length === 0) {
            if (noMsg) noMsg.style.display = '';
            return;
        }
        if (noMsg) noMsg.style.display = 'none';

        parties.forEach(p => {
            const node = template.content.cloneNode(true);
            const article = node.querySelector('article.party-card');
            article.dataset.id = p.id ?? p.partyId ?? '';
            // visible fields
            const nameEl = node.querySelector('.party-name');
            const dateEl = node.querySelector('.party-date');
            const timeEl = node.querySelector('.party-time');
            const locEl = node.querySelector('.party-location');
            if (nameEl) nameEl.textContent = p.title || p.name || 'Untitled Party';
            if (dateEl) dateEl.textContent = p.time_start || p.date || p.start || '';
            if (timeEl) timeEl.textContent = p.time_end || p.end || '';
            // Handle location - can be object with name property or string
            if (locEl) {
                if (p.location && typeof p.location === 'object' && p.location.name) {
                    locEl.textContent = p.location.name;
                } else if (p.location && typeof p.location === 'object' && (p.location.latitude || p.location.longitude)) {
                    // Fallback to coordinates if name not available
                    locEl.textContent = `${p.location.latitude?.toFixed(4) || ''}, ${p.location.longitude?.toFixed(4) || ''}`;
                } else {
                    locEl.textContent = p.location || p.venue || '';
                }
            }

            // edit/delete buttons
            const editBtn = node.querySelector('.edit-btn');
            const deleteBtn = node.querySelector('.delete-btn');
            const partyId = article.dataset.id;
            if (editBtn) {
                editBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    window.location.href = `/addParty/addParty.html?id=${partyId}`;
                });
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    if (!confirm('Soll diese Party wirklich gelöscht werden?')) return;
                    let deleted = false;
                    if (hasBackend && typeof window.backend.deleteParty === 'function') {
                        try {
                            const res = await window.backend.deleteParty(partyId);
                            deleted = !!(res && res.ok);
                        } catch (_) { deleted = false; }
                    } else {
                        try {
                            const res = await fetch(`/api/party/${partyId}`, { method: 'DELETE' });
                            deleted = res.ok;
                        } catch (_) { deleted = false; }
                    }
                    if (deleted) {
                        article.remove();
                    } else {
                        alert('Löschen fehlgeschlagen');
                    }
                });
            }

            // option: toggle extra details
            const extra = node.querySelector('.party-extra');
            if (article && extra) {
                article.addEventListener('click', () => {
                    extra.style.display = (extra.style.display === 'block') ? 'none' : 'block';
                });
            }

            container.appendChild(node);
        });
    }

    // Load own media
    async function loadOwnMedia() {
        if (!currentUserId) return;
        
        let media = [];

        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try {
                const partiesList = await window.backend.getPartiesByUser(currentUserId);
                if (Array.isArray(partiesList) && partiesList.length > 0) {
                    const mediaArrays = await Promise.all(partiesList.map(async p => {
                        if (hasBackend && typeof window.backend.getMediaForParty === 'function') {
                            try {
                                const m = await window.backend.getMediaForParty(p.id ?? p.partyId);
                                return Array.isArray(m) ? m : [];
                            } catch (_) {
                                return [];
                            }
                        }
                        try {
                            const res = await fetch(`/api/party/${p.id ?? p.partyId}/media`);
                            if (res.ok) {
                                const d = await res.json().catch(() => null);
                                return Array.isArray(d) ? d : [];
                            }
                        } catch (_) {}
                        return [];
                    }));
                    media = mediaArrays.flat().filter(Boolean);
                }
            } catch (err) {
                console.debug('loadOwnMedia: backend.getPartiesByUser/getMediaForParty failed', err);
            }
        }

        // fallback endpoints
        if (!Array.isArray(media) || media.length === 0) {
            const found = await tryFetchJson([
                `/api/users/${currentUserId}/media`,
                `/api/media/user/${currentUserId}`,
                `/api/users/${currentUserId}/photos`,
                `/api/media?userId=${currentUserId}`
            ]);
            if (found && Array.isArray(found.data)) media = found.data;
        }

        if (!Array.isArray(media)) media = [];

        const cont = document.getElementById('ownMediaGrid');
        const noMsg = document.querySelector('#tabContentPosts .no-posts');
        if (!cont) return;
        cont.innerHTML = '';
        if (!media || media.length === 0) {
            if (noMsg) noMsg.style.display = '';
            return;
        }
        if (noMsg) noMsg.style.display = 'none';

        media.forEach(m => {
            const imgEl = document.createElement('img');
            imgEl.className = 'media-thumb';
            const mediaUrl = m.url || m.path || (m.id ? `/api/media/${m.id}` : `/images/${m.filename || 'placeholder.jpg'}`);
            imgEl.src = mediaUrl;
            imgEl.alt = m.title || 'media';
            imgEl.style.width = '100%';
            imgEl.style.height = 'auto';
            imgEl.style.objectFit = 'cover';
            imgEl.style.borderRadius = '8px';
            cont.appendChild(imgEl);
        });
    }

    // Load liked media
    async function loadLikedMedia() {
        if (!currentUserId) return;
        
        let media = null;
        const candidates = [
            `/api/users/${currentUserId}/likes`,
            `/api/users/${currentUserId}/likedMedia`,
            `/api/media/liked/${currentUserId}`,
            `/api/media/likes/${currentUserId}`,
            `/api/users/${currentUserId}/favourites`,
            `/api/users/${currentUserId}/favorites`
        ];
        const found = await tryFetchJson(candidates);
        if (found && Array.isArray(found.data)) media = found.data;
        if (!Array.isArray(media)) media = [];

        const cont = document.getElementById('likedMediaGrid');
        const noMsg = document.querySelector('#tabContentFavorites .no-favs');
        if (!cont) return;
        cont.innerHTML = '';
        if (!media || media.length === 0) {
            if (noMsg) noMsg.style.display = '';
            return;
        }
        if (noMsg) noMsg.style.display = 'none';

        media.forEach(m => {
            const imgEl = document.createElement('img');
            imgEl.className = 'media-thumb';
            const mediaUrl = m.url || m.path || (m.id ? `/api/media/${m.id}` : `/images/${m.filename || 'placeholder.jpg'}`);
            imgEl.src = mediaUrl;
            imgEl.alt = m.title || 'media';
            imgEl.style.width = '100%';
            imgEl.style.height = 'auto';
            imgEl.style.objectFit = 'cover';
            imgEl.style.borderRadius = '8px';
            cont.appendChild(imgEl);
        });
    }

    // Helper: hide profile picture when posts tab is active
    function hideProfilePictureWhenPosts(activeTabName) {
        const pic = document.getElementById('profilePicture');
        if (!pic) return;
        pic.style.display = (activeTabName === 'posts') ? 'none' : '';
    }

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    function showTab(name) {
        // reset
        ['Partys', 'Posts', 'Favorites'].forEach(k => {
            const btn = document.getElementById(`tab${k}`);
            const sec = document.getElementById(`tabContent${k}`);
            if (btn) btn.classList.toggle('active', k === name);
            if (sec) sec.style.display = (k === name) ? 'block' : 'none';
        });
        hideProfilePictureWhenPosts(name.toLowerCase());
        
        // Load data when switching tabs
        if (name === 'Posts') {
            loadOwnMedia();
        } else if (name === 'Favorites') {
            loadLikedMedia();
        } else if (name === 'Partys') {
            loadUserParties();
        }
    }

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.id.replace('tab', '');
                showTab(tabName);
            });
        });
        
        // Initial load - show Partys tab
        showTab('Partys');
    }

});