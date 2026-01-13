document.addEventListener('DOMContentLoaded', function () {
    // Profile image load logic
    const img = document.getElementById('profileImg');
    if (!img) return;

    const TEST_USER_ID = "1";
    const userId = TEST_USER_ID;
    console.log(`Using fixed user id=${userId} for profile testing`);

    const finalPath = `/images/profile_picture${userId}.jpg`;
    img.src = finalPath;
    img.onerror = function() { this.src = "/images/profile_picture1.jpg"; };

    // Helper: safe call to backend namespace
    const hasBackend = typeof window.backend === 'object';

    // Try multiple endpoints sequentially, return first successful JSON or null.
    async function tryFetchJson(urls, options) {
        for (const u of urls) {
            try {
                const res = await fetch(u, options);
                if (!res.ok) {
                    // Log 404 / other errors but continue trying other endpoints
                    console.debug(`tryFetchJson: ${u} returned ${res.status}`);
                    continue;
                }
                const data = await res.json().catch(() => null);
                return { url: u, data, res };
            } catch (err) {
                console.debug(`tryFetchJson: network error for ${u}`, err);
                // try next
            }
        }
        return null;
    }

    // Update basic user info (username, counts) using backend if available
    (async function loadUserInfo() {
        let user = null;
        if (hasBackend && typeof window.backend.getUserById === 'function') {
            user = await window.backend.getUserById(userId);
        } else {
            // fallback fetch
            try {
                const res = await fetch(`/api/users/${userId}`);
                if (res.ok) user = await res.json();
            } catch (_) {}
        }
        if (!user) {
            console.warn('User info not found for id', userId);
            return;
        }
        const usernameEl = document.querySelector('#username p');
        if (usernameEl && (user.username || user.name)) usernameEl.textContent = '@' + (user.username || user.name);

        const setCount = (id, val) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.textContent = (val === undefined || val === null) ? (el.dataset.count || '0') : String(val);
        };
        setCount('followingCount', user.followingCount ?? user.following ?? user.following_count);
        setCount('followersCount', user.followersCount ?? user.followers ?? user.followers_count);
        setCount('postsCount', user.postCount ?? user.posts ?? user.post_count);

        // --- NEU: lade Profilbild über backend, falls vorhanden ---
        if (hasBackend && typeof window.backend.getProfilePicture === 'function') {
            try {
                const pic = await window.backend.getProfilePicture(userId);
                // Akzeptiere unterschiedliche Formen: { url }, { path }, { filename }, oder direkte URL string
                if (pic) {
                    if (typeof pic === 'string' && pic.length) {
                        img.src = pic;
                    } else if (pic.url || pic.path) {
                        img.src = pic.url || pic.path;
                    } else if (pic.filename) {
                        img.src = `/images/${pic.filename}`;
                    }
                }
            } catch (err) {
                console.debug('getProfilePicture failed', err);
            }
        }
        // --- Ende NEU ---
    })();

    // Tab logic
    const tabs = {
        partysBtn: document.getElementById('tabPartys'),
        postsBtn: document.getElementById('tabPosts'),
        favsBtn: document.getElementById('tabFavorites'),
        partysSection: document.getElementById('tabContentPartys'),
        postsSection: document.getElementById('tabContentPosts'),
        favsSection: document.getElementById('tabContentFavorites'),
    };
    function showTab(name) {
        // reset
        ['partys', 'posts', 'favs'].forEach(k => {
            const btn = tabs[`${k}Btn`];
            const sec = tabs[`${k}Section`];
            if (btn) btn.classList.toggle('active', k === name);
            if (sec) sec.style.display = k === name ? '' : 'none';
        });
    }
    // initial: show Partys tab so user's created parties are visible immediately
    showTab('partys');

    // kurze Helfer
    function hideProfilePictureWhenPosts(activeTabName) {
        const pic = document.getElementById('profilePicture');
        if (!pic) return;
        // wenn Beiträge aktiv, verstecke Profilbild, sonst zeigen
        pic.style.display = (activeTabName === 'posts') ? 'none' : '';
    }

    // erweitere showTab um Profilbild-Logik
    const originalShowTab = showTab;
    showTab = function(name) {
        originalShowTab(name);
        hideProfilePictureWhenPosts(name);
        // wenn posts ausgewählt, lade Medien (falls noch nicht geladen)
        if (name === 'posts') {
            loadOwnMedia();
        }
    };

    // Robust loadUserParties (nutzt backend helper wenn vorhanden)
    async function loadUserParties() {
        let parties = null;
        // prefer backend helper
        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try {
                parties = await window.backend.getPartiesByUser(userId);
            } catch (err) {
                console.debug('backend.getPartiesByUser failed', err);
            }
        }
        // fallback to getAllParties+filter
        if (!Array.isArray(parties) && hasBackend && typeof window.backend.getAllParties === 'function') {
            try {
                const all = await window.backend.getAllParties();
                if (Array.isArray(all)) {
                    parties = all.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId);
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
                    if (Array.isArray(data)) parties = data.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId);
                    // handle wrapper objects
                    else if (data && Array.isArray(data.data)) parties = data.data.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId);
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
            if (locEl) locEl.textContent = p.location || p.venue || '';

            // edit/delete buttons
            const editBtn = node.querySelector('.edit-btn');
            const deleteBtn = node.querySelector('.delete-btn');
            const partyId = article.dataset.id;
            if (editBtn) {
                editBtn.addEventListener('click', (ev) => {
                    ev.stopPropagation();
                    // open addParty in edit mode
                    window.location.href = `/addParty/addParty.html?id=${partyId}`;
                });
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async (ev) => {
                    ev.stopPropagation();
                    if (!confirm('Soll diese Party wirklich gelöscht werden?')) return;
                    // use backend.deleteParty if available
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

            // option: toggle extra details (keine Pflicht)
            const extra = node.querySelector('.party-extra');
            if (article && extra) {
                article.addEventListener('click', () => {
                    extra.style.display = (extra.style.display === 'block') ? 'none' : 'block';
                });
            }

            container.appendChild(node);
        });

        // ensure partys tab visible after loading
        showTab('partys');
    }

    // Load own media uses backend.getPartiesByUser -> getMediaForParty if possible, else fallbacks
    async function loadOwnMedia() {
        let media = [];

        if (hasBackend && typeof window.backend.getPartiesByUser === 'function') {
            try {
                const partiesList = await window.backend.getPartiesByUser(userId);
                if (Array.isArray(partiesList) && partiesList.length > 0) {
                    const mediaArrays = await Promise.all(partiesList.map(async p => {
                        // prefer backend media helper
                        if (hasBackend && typeof window.backend.getMediaForParty === 'function') {
                            try {
                                const m = await window.backend.getMediaForParty(p.id ?? p.partyId);
                                return Array.isArray(m) ? m : [];
                            } catch (_) {
                                return [];
                            }
                        }
                        // fallback per-party endpoint
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

        // fallback endpoints if nothing collected
        if (!Array.isArray(media) || media.length === 0) {
            const found = await tryFetchJson([
                `/api/users/${userId}/media`,
                `/api/media/user/${userId}`,
                `/api/users/${userId}/photos`,
                `/api/media?userId=${userId}`
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
            imgEl.src = m.url || m.path || `/images/${m.filename || 'placeholder.jpg'}`;
            imgEl.alt = m.title || 'media';
            imgEl.style.width = '100%';
            imgEl.style.height = 'auto';
            imgEl.style.objectFit = 'cover';
            cont.appendChild(imgEl);
        });
    }

    // Load liked media (fallback to endpoints)
    async function loadLikedMedia() {
        let media = null;
        const candidates = [
            `/api/users/${userId}/likes`,
            `/api/users/${userId}/likedMedia`,
            `/api/media/liked/${userId}`,
            `/api/media/likes/${userId}`,
            `/api/users/${userId}/favourites`,
            `/api/users/${userId}/favorites`
        ];
        const found = await tryFetchJson(candidates);
        if (found && Array.isArray(found.data)) media = found.data;
        if (!Array.isArray(media)) media = [];
        renderMediaGrid('likedMediaGrid', media);
    }

    // Initial loads
    loadUserParties();
    loadOwnMedia();
    loadLikedMedia();
});
// end of file
