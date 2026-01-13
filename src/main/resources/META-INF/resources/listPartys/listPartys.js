// List Parties Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    loadAllParties();
});

async function loadAllParties() {
    const container = document.getElementById('partiesContainer');

    try {
        const response = await fetch('/api/party');
        if (!response.ok) {
            throw new Error('Failed to fetch parties');
        }

        const parties = await response.json();

        if (parties.length === 0) {
            container.innerHTML = '<div class="loading">No parties found.</div>';
            return;
        }

        // Clear loading message
        container.innerHTML = '';

        // Create party cards
        parties.forEach(party => {
            const partyCard = createPartyCard(party);
            container.appendChild(partyCard);
        });

    } catch (error) {
        console.error('Error loading parties:', error);
        container.innerHTML = '<div class="loading">Error loading parties. Please try again.</div>';
    }
}

function createPartyCard(party) {
    const card = document.createElement('article');
    card.className = 'party-card-list';
    card.onclick = () => {
        window.location.href = `/advancedPartyInfos/advancedPartyInfos.html?id=${party.id}`;
    };

    // Format date with improved formatting
    const partyDate = new Date(party.time_start);
    const formattedDate = formatPartyDateList(partyDate);

    // Get location (party.location is coordinates object, so use placeholder for now)
    const location = 'Location TBA'; // TODO: Implement reverse geocoding for coordinates

    card.innerHTML = `
        <header class="party-header-list">
            <h3 class="party-name-list">${party.title}</h3>
            <span class="party-category">${party.category_id || 'General'}</span>
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
                ${location}
            </div>
        </div>

        <div class="party-attendees">
            <strong>${party.max_people || 'Unlimited'}</strong> max attendees
        </div>
    `;

    return card;
}

// Helper function for improved date formatting in party list
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
        // Show abbreviated day name and date
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