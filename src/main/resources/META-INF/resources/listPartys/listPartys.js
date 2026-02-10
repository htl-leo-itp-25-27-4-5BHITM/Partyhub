document.addEventListener('DOMContentLoaded', function() {
    initSearch();
    initFilters();
    loadAllParties();
});

let allParties = [];
let filteredParties = [];
let currentFilter = 'all';
let currentSearch = '';

async function loadAllParties() {
    const container = document.getElementById('partiesContainer');
    container.innerHTML = '';
    container.appendChild(SkeletonLoader.multipleCards(3));

    try {
        const response = await fetch('/api/party');
        if (!response.ok) {
            throw new Error('Failed to fetch parties');
        }

        allParties = await response.json();
        applyFilters();

    } catch (error) {
        console.error('Error loading parties:', error);
        container.innerHTML = '';
        container.appendChild(EmptyState.create('parties', {
            message: 'Unable to load parties. Please check your connection and try again.',
            actionLabel: 'Retry',
            actionOnClick: () => loadAllParties()
        }));
        ToastManager.error('Failed to load parties. Please try again.');
    }
}

function applyFilters() {
    filteredParties = allParties.filter(party => {
        const matchesSearch = currentSearch === '' ||
            party.title.toLowerCase().includes(currentSearch.toLowerCase()) ||
            (party.description && party.description.toLowerCase().includes(currentSearch.toLowerCase()));

        if (!matchesSearch) return false;

        if (currentFilter === 'all') return true;

        const partyDate = new Date(party.time_start);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        switch (currentFilter) {
            case 'today':
                return partyDate >= now && partyDate < new Date(today.getTime() + 86400000);
            case 'week':
                return partyDate >= now && partyDate <= weekEnd;
            case 'public':
                return party.visibility === 'public';
            default:
                return true;
        }
    });

    renderParties();
}

function renderParties() {
    const container = document.getElementById('partiesContainer');

    if (filteredParties.length === 0) {
        container.innerHTML = '';

        if (allParties.length === 0) {
            container.appendChild(EmptyState.create('parties', {
                title: 'No Parties Yet',
                message: 'Be the first to create a party and get the celebration started!',
                actionLabel: 'Create Party',
                actionHref: '/addParty/addParty.html'
            }));
        } else if (currentSearch || currentFilter !== 'all') {
            container.appendChild(EmptyState.create('search', {
                title: 'No Results',
                message: `No parties match your "${currentSearch || currentFilter}" filter. Try adjusting your search.`
            }));
        }
        return;
    }

    container.innerHTML = '';

    filteredParties.forEach((party, index) => {
        const partyCard = createPartyCard(party);
        partyCard.style.animationDelay = `${index * 0.05}s`;
        container.appendChild(partyCard);
    });
}

function createPartyCard(party) {
    const card = document.createElement('article');
    card.className = 'party-card-list card-hover';
    card.onclick = () => {
        window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${party.id}`;
    };

    const partyDate = new Date(party.time_start);
    const formattedDate = formatPartyDateList(partyDate);

    const location = party.location_address || 'Location TBA';
    const visibilityBadge = party.visibility === 'public'
        ? '<span class="party-category">Public</span>'
        : '<span class="party-category" style="background: #6c5ce7;">Private</span>';

    card.innerHTML = `
        <header class="party-header-list">
            <h3 class="party-name-list">${escapeHtml(party.title)}</h3>
            ${visibilityBadge}
        </header>

        <div class="party-meta">
            <div class="party-date">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                ${formattedDate}
            </div>

            <div class="party-location">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="1.5" fill="none"/>
                    <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>
                </svg>
                ${escapeHtml(location)}
            </div>
        </div>

        <div class="party-attendees">
            <strong>${party.max_people || 'Unlimited'}</strong> max attendees
        </div>
    `;

    return card;
}

function initSearch() {
    const searchInput = document.getElementById('partySearchInput');
    const clearBtn = document.getElementById('searchClearBtn');

    if (!searchInput) return;

    searchInput.addEventListener('input', debounce((e) => {
        currentSearch = e.target.value.trim();
        clearBtn.style.display = currentSearch ? 'flex' : 'none';
        applyFilters();

        if (currentSearch && filteredParties.length > 0) {
            ToastManager.info(`Found ${filteredParties.length} party${filteredParties.length !== 1 ? 's' : ''} matching "${currentSearch}"`);
        }
    }, 300));

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            searchInput.value = '';
            currentSearch = '';
            clearBtn.style.display = 'none';
            applyFilters();
        });
    }
}

function initFilters() {
    const filterChips = document.getElementById('filterChips');
    if (!filterChips) return;

    filterChips.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        filterChips.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('filter-chip--active'));
        chip.classList.add('filter-chip--active');

        currentFilter = chip.dataset.filter;

        const filterMessages = {
            all: 'Showing all parties',
            today: 'Showing parties happening today',
            week: 'Showing parties this week',
            public: 'Showing public parties only'
        };

        ToastManager.info(filterMessages[currentFilter] || `Filter: ${currentFilter}`);

        applyFilters();
    });
}

function formatPartyDateList(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const partyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (isSameDay(partyDate, today)) {
        return 'Today';
    } else if (isSameDay(partyDate, tomorrow)) {
        return 'Tomorrow';
    } else {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = date.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        return `${dayName}, ${dateStr}`;
    }
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
