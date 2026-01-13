document.addEventListener('DOMContentLoaded', function () {
    // Profile image load logic
    const img = document.getElementById('profileImg');
    if (!img) return;

    const TEST_USER_ID = "2";
    const userId = TEST_USER_ID;
    console.log(`Using fixed user id=${userId} for profile testing`);

    const finalPath = `/images/profile_picture${userId}.jpg`;
    img.src = finalPath;
    img.onerror = function() { this.src = "/images/profile_picture1.jpg"; };

    // Helper: safe call to backend namespace
    const hasBackend = typeof window.backend === 'object';

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
    // initial
    showTab('posts'); // match previous default (tabPosts active in HTML)

    tabs.partysBtn?.addEventListener('click', () => showTab('partys'));
    tabs.postsBtn?.addEventListener('click', () => showTab('posts'));
    tabs.favsBtn?.addEventListener('click', () => showTab('favs'));

    // Render parties created by user
    async function loadUserParties() {
        let parties = null;
        if (hasBackend && typeof window.backend.getAllParties === 'function') {
            const all = await window.backend.getAllParties();
            if (Array.isArray(all)) {
                parties = all.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId);
            }
        } else {
            // previous multi-endpoint attempts
            try {
                const res = await fetch(`/api/users/${userId}/parties`);
                if (res.ok) parties = await res.json();
            } catch (_) {}
            if (!parties) {
                try {
                    const all = await fetch('/api/party/').then(r => r.ok ? r.json() : null);
                    if (Array.isArray(all)) {
                        parties = all.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId);
                    }
                } catch (_) {}
            }
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
            const nameEl = node.querySelector('.party-name');
            if (nameEl) nameEl.textContent = p.title || p.name || 'Untitled Party';
            const dateEl = node.querySelector('.party-date');
            const timeEl = node.querySelector('.party-time');
            const locEl = node.querySelector('.party-location');
            if (dateEl) dateEl.textContent = p.time_start || p.date || '';
            if (timeEl) timeEl.textContent = p.time_end || '';
            if (locEl) locEl.textContent = p.location || p.venue || (p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : '');
            // attach handlers
            const editBtn = node.querySelector('.edit-btn');
            const deleteBtn = node.querySelector('.delete-btn');
            const partyId = article.dataset.id;
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    // redirect to edit page (assumes existence)
                    window.location.href = `/editParty/editParty.html?id=${partyId}`;
                });
            }
            if (deleteBtn) {
                deleteBtn.addEventListener('click', async () => {
                    const ok = confirm('Soll diese Party wirklich gelöscht werden?');
                    if (!ok) return;
                    let result = null;
                    if (hasBackend && typeof window.backend.deleteParty === 'function') {
                        result = await window.backend.deleteParty(partyId);
                        if (result && result.ok) article.remove();
                        else alert('Löschen fehlgeschlagen');
                    } else {
                        try {
                            const res = await fetch(`/api/party/${partyId}`, { method: 'DELETE' });
                            if (!res.ok) throw new Error('Löschen fehlgeschlagen');
                            article.remove();
                        } catch (err) {
                            alert('Löschen fehlgeschlagen: ' + (err.message || ''));
                        }
                    }
                });
            }
            container.appendChild(node);
        });
    }

    // Render media grid helper
    function renderMediaGrid(containerId, mediaArray) {
        const cont = document.getElementById(containerId);
        const noMsg = cont?.previousElementSibling; // the <p class="muted ...">
        if (!cont) return;
        cont.innerHTML = '';
        if (!mediaArray || mediaArray.length === 0) {
            if (noMsg) noMsg.style.display = '';
            return;
        }
        if (noMsg) noMsg.style.display = 'none';
        mediaArray.forEach(m => {
            const img = document.createElement('img');
            img.className = 'media-thumb';
            img.src = m.url || m.path || `/images/${m.filename || 'placeholder.jpg'}`;
            img.alt = m.title || 'media';
            img.onerror = function () { this.src = '/images/placeholder.jpg'; };
            cont.appendChild(img);
        });
    }

    // Load own media
    async function loadOwnMedia() {
        let media = null;
        // backend doesn't have getUserMedia, so try getAllParties -> media per party OR try endpoints
        if (hasBackend && typeof window.backend.getAllParties === 'function') {
            // naive: collect party media where owner==userId
            const all = await window.backend.getAllParties();
            if (Array.isArray(all)) {
                const userParties = all.filter(p => p.ownerId == userId || p.creatorId == userId || p.userId == userId);
                // try to fetch media per party via backend.getMediaForParty
                const mediaPromises = userParties.map(async p => {
                    if (hasBackend && typeof window.backend.getMediaForParty === 'function') {
                        return await window.backend.getMediaForParty(p.id ?? p.partyId);
                    } else {
                        try {
                            const res = await fetch(`/api/party/${p.id ?? p.partyId}/media`);
                            if (res.ok) return await res.json();
                        } catch (_) {}
                    }
                    return null;
                });
                const arrays = await Promise.all(mediaPromises);
                media = arrays.flat().filter(Boolean);
            }
        }

        // fallback to direct endpoints if nothing found
        if (!Array.isArray(media) || media.length === 0) {
            try {
                const res = await fetch(`/api/users/${userId}/media`);
                if (res.ok) media = await res.json();
            } catch (_) {}
        }

        if (!Array.isArray(media)) media = [];
        renderMediaGrid('ownMediaGrid', media);
    }

    // Load liked media (try backend.getAllUsers / other endpoints)
    async function loadLikedMedia() {
        let media = null;
        // try backend endpoints
        if (hasBackend && typeof window.backend.getAllUsers === 'function') {
            // no direct likedMedia function exposed; fallback to endpoints
        }
        try {
            const res = await fetch(`/api/users/${userId}/likes`);
            if (res.ok) media = await res.json();
        } catch (_) {}

        if (!Array.isArray(media)) media = [];
        renderMediaGrid('likedMediaGrid', media);
    }

    // Initial loads
    loadUserParties();
    loadOwnMedia();
    loadLikedMedia();
});