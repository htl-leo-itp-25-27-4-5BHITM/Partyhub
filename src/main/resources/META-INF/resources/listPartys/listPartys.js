const partyListState = {
    parties: [],
    invitations: [],
    filter: 'all',
    search: '',
    sort: 'soonest',
    currentUserId: null
};

document.addEventListener('DOMContentLoaded', async function() {
    initFilterControls();
    prepareCreateButton();
    await loadAllParties();
});

function prepareCreateButton() {
    const createBtn = document.querySelector('.create-party-btn');
    if (!createBtn) {
        return;
    }

    createBtn.addEventListener('click', function () {
        try {
            localStorage.removeItem('editingParty');
            localStorage.removeItem('editingFrom');
            localStorage.removeItem('editingPartyId');
        } catch {
            // ignore
        }
    });
}

function initFilterControls() {
    const searchInput = document.getElementById('partySearch');
    const filterSelect = document.getElementById('partyFilter');
    const sortSelect = document.getElementById('partySort');

    if (searchInput) {
        searchInput.addEventListener('input', () => {
            partyListState.search = searchInput.value.trim().toLowerCase();
            renderParties();
        });
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', () => {
            partyListState.filter = filterSelect.value || 'all';
            renderParties();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            partyListState.sort = sortSelect.value;
            renderParties();
        });
    }
}

async function loadAllParties() {
    const container = document.getElementById('partiesContainer');

    try {
        await window.authService?.init?.({ requireLogin: false });
        partyListState.currentUserId = await resolveCurrentUserId();

        const [parties, invitations] = await Promise.all([
            fetchParties(),
            fetchReceivedInvites()
        ]);

        partyListState.parties = parties;
        partyListState.invitations = invitations;
        updateFilterAvailability();
        renderParties();
    } catch (error) {
        console.error('Error loading parties:', error);
        if (container) {
            container.innerHTML = '<div class="loading">Error loading parties. Please try again.</div>';
        }
    }
}

async function resolveCurrentUserId() {
    const directId = window.authService?.getCurrentUserId?.();
    if (directId != null) {
        return String(directId);
    }

    try {
        const user = await window.authService?.getCurrentUser?.();
        if (user?.id != null) {
            return String(user.id);
        }
    } catch {
        // logged-out users can still browse public parties
    }

    return null;
}

async function fetchParties() {
    const response = await (window.authService?.apiCall || fetch)('/api/parties', {
        authRequired: false,
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch parties');
    }

    return normalizeArray(await response.json().catch(() => []));
}

async function fetchReceivedInvites() {
    if (!window.authService?.isLoggedIn?.()) {
        return [];
    }

    try {
        const response = await window.authService.apiCall('/api/invitations?direction=received');
        if (!response.ok) {
            return [];
        }
        return normalizeArray(await response.json().catch(() => []));
    } catch {
        return [];
    }
}

function normalizeArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.results)) return payload.results;
    if (Array.isArray(payload?.parties)) return payload.parties;
    if (Array.isArray(payload?.invitations)) return payload.invitations;
    return [];
}

function updateFilterAvailability() {
    const loggedInFilters = new Set(['invited', 'hosted']);
    const filterSelect = document.getElementById('partyFilter');

    if (!filterSelect) {
        return;
    }

    Array.from(filterSelect.options).forEach((option) => {
        const needsLogin = loggedInFilters.has(option.value);
        option.disabled = needsLogin && !partyListState.currentUserId;
    });

    if (filterSelect.selectedOptions[0]?.disabled) {
        filterSelect.value = 'all';
        partyListState.filter = 'all';
    }
}

function renderParties() {
    const container = document.getElementById('partiesContainer');
    if (!container) {
        return;
    }

    const parties = getVisibleParties();

    if (parties.length === 0) {
        container.innerHTML = '<div class="loading">No parties match your filters.</div>';
        return;
    }

    container.innerHTML = '';
    parties.forEach((party) => {
        container.appendChild(createPartyCard(party));
    });
}

function getVisibleParties() {
    const invitedPartyIds = getInvitedPartyIds();

    return [...partyListState.parties]
        .filter((party) => matchesFilter(party, invitedPartyIds))
        .filter((party) => matchesSearch(party))
        .sort(compareParties);
}

function getInvitedPartyIds() {
    return new Set(
        partyListState.invitations
            .filter((invitation) => String(invitation?.status || 'PENDING').toUpperCase() !== 'DECLINED')
            .map((invitation) => invitation?.partyId ?? invitation?.party?.id ?? invitation?.party_id)
            .filter((id) => id != null)
            .map(String)
    );
}

function matchesFilter(party, invitedPartyIds) {
    const filter = partyListState.filter;

    if (filter === 'public') {
        return getVisibility(party) === 'PUBLIC';
    }

    if (filter === 'private') {
        return getVisibility(party) === 'PRIVATE';
    }

    if (filter === 'invited') {
        return getPartyId(party) != null && invitedPartyIds.has(String(getPartyId(party)));
    }

    if (filter === 'hosted') {
        return partyListState.currentUserId != null &&
            String(getHostId(party)) === String(partyListState.currentUserId);
    }

    if (filter === 'free') {
        return Number(party.fee || 0) <= 0;
    }

    return true;
}

function matchesSearch(party) {
    if (!partyListState.search) {
        return true;
    }

    const haystack = [
        party.title,
        party.name,
        party.theme,
        party.description,
        getLocationText(party),
        getVisibility(party)
    ].filter(Boolean).join(' ').toLowerCase();

    return haystack.includes(partyListState.search);
}

function compareParties(a, b) {
    if (partyListState.sort === 'title') {
        return String(a.title || a.name || '').localeCompare(String(b.title || b.name || ''));
    }

    const aDate = getPartyDate(a)?.getTime() ?? 0;
    const bDate = getPartyDate(b)?.getTime() ?? 0;

    if (partyListState.sort === 'newest') {
        return bDate - aDate;
    }

    const now = Date.now();
    const aFuture = aDate >= now ? aDate : Number.MAX_SAFE_INTEGER + aDate;
    const bFuture = bDate >= now ? bDate : Number.MAX_SAFE_INTEGER + bDate;
    return aFuture - bFuture;
}

function createPartyCard(party) {
    const card = document.createElement('article');
    card.className = 'party-card-list';
    card.tabIndex = 0;

    const partyId = getPartyId(party);
    if (partyId != null) {
        card.dataset.partyId = partyId;
    }

    card.addEventListener('click', () => {
        if (partyId != null) {
            window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${encodeURIComponent(partyId)}`;
        }
    });

    card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            card.click();
        }
    });

    const partyDate = getPartyDate(party);
    const visibility = getVisibility(party);
    const theme = party.theme || party.category_id || 'General';
    const title = party.title || party.name || 'Untitled party';
    const fee = Number(party.fee || 0);

    card.innerHTML = `
        <header class="party-header-list">
            <div class="party-title-group">
                <h3 class="party-name-list">${escapeHtml(title)}</h3>
                <span class="party-visibility ${visibility.toLowerCase()}">${escapeHtml(visibility)}</span>
            </div>
            <span class="party-category">${escapeHtml(theme)}</span>
        </header>

        <div class="party-meta">
            <div class="party-date">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                ${escapeHtml(formatPartyDateList(partyDate))}
            </div>

            <div class="party-location">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
                ${escapeHtml(getLocationText(party))}
            </div>

            <div class="party-attendees">
                <strong>${escapeHtml(String(party.max_people || 'Unlimited'))}</strong> max
            </div>

            <div class="party-price">
                ${fee > 0 ? escapeHtml(formatMoney(fee)) : 'Free'}
            </div>
        </div>
    `;

    return card;
}

function getPartyId(party) {
    return party?.id ?? party?.partyId ?? null;
}

function getHostId(party) {
    return (
        party?.host_user?.id ??
        party?.hostUser?.id ??
        party?.host?.id ??
        party?.host_user_id ??
        party?.hostUserId ??
        party?.hostId ??
        party?.ownerId ??
        party?.creatorId ??
        null
    );
}

function getVisibility(party) {
    return String(party?.visibility || 'PUBLIC').toUpperCase();
}

function getPartyDate(party) {
    const value = party?.time_start || party?.timeStart || party?.date;
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function getLocationText(party) {
    const direct =
        party?.location_address ||
        party?.locationAddress ||
        party?.location_adress ||
        party?.locationAdress ||
        party?.address ||
        party?.adress ||
        party?.place;

    if (direct) {
        return direct;
    }

    if (typeof party?.location === 'string') {
        return party.location;
    }

    if (party?.location?.address) {
        return party.location.address;
    }

    if (party?.location?.latitude != null && party?.location?.longitude != null) {
        return `${Number(party.location.latitude).toFixed(4)}, ${Number(party.location.longitude).toFixed(4)}`;
    }

    if (party?.latitude != null && party?.longitude != null) {
        return `${Number(party.latitude).toFixed(4)}, ${Number(party.longitude).toFixed(4)}`;
    }

    return 'Location TBA';
}

function formatMoney(value) {
    return new Intl.NumberFormat('de-AT', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: value % 1 === 0 ? 0 : 2
    }).format(value);
}

function formatPartyDateList(date) {
    if (!date) {
        return 'Date TBA';
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const partyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const time = date.toLocaleTimeString('de-AT', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isSameDay(partyDate, today)) {
        return `Today, ${time}`;
    }

    if (isSameDay(partyDate, tomorrow)) {
        return `Tomorrow, ${time}`;
    }

    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    return `${dayName}, ${dateStr}, ${time}`;
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
