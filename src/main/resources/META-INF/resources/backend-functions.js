// Party-functions
// Create Party in party-Table
// DateTimeFormat needs to be the same

async function createParty(payload) {
    // ...existing implementation...
    try {
        const response = await fetch("/api/party/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201 || response.ok) {
            return { ok: true, status: response.status, data: await response.json().catch(() => null) };
        } else {
            return { ok: false, status: response.status, text: await response.text().catch(() => null) };
        }
    } catch (error) {
        return { ok: false, error };
    }
}

// Fetch all parties
async function getAllParties() {
    try {
        const response = await fetch('/api/party/');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching parties:', error);
        return null;
    }
}

// Sort parties
async function sortParties(sortKey) {
    try {
        const response = await fetch(`/api/party/sort?sort=${sortKey}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching sorted parties:', error);
        return null;
    }
}

// Filter parties by content
async function filterParties(content) {
    const filterPayload = { value: content };
    try {
        const response = await fetch('/api/party/filter?filter=content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filterPayload)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error filtering parties:', error);
        return null;
    }
}

// Get a party by ID
async function getPartyById(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching party by ID:', error);
        return null;
    }
}

// Update a party by ID
async function updateParty(partyId, payload) {
    try {
        const response = await fetch(`/api/party/${partyId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error updating party:', error);
        return null;
    }
}

// Delete a party by ID
async function deleteParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Network response was not ok');
        return { ok: true };
    } catch (error) {
        console.error('Error deleting party:', error);
        return { ok: false, error };
    }
}

// Attend a party
async function attendParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/attend`, { method: 'POST' });
        return response.ok;
    } catch (error) {
        console.error('Error attending the party:', error);
        return false;
    }
}

// Leave a party
async function leaveParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/attend`, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        console.error('Error leaving the party:', error);
        return false;
    }
}

// Get media for a party
async function getMediaForParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/media`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching party media:', error);
        return null;
    }
}

// User-functions
// Fetch all users
async function getAllUsers() {
    try {
        const response = await fetch('/api/users/');
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return null;
    }
}

// Get user by id
async function getUserById(id) {
    try {
        const response = await fetch('/api/users/' + id);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

// Get profile-picture by user id
async function getProfilePicture(id) {
    try {
        const response = await fetch('/api/users/' + id + "/profile-picture");
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching profile-picture:', error);
        return null;
    }
}

// Invite user to party using userId
async function invite(recipient, partyId) {
    const invitationPayload = { recipient, partyId };
    try {
        const response = await fetch(`/api/invites/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invitationPayload)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        return { ok: true };
    } catch (error) {
        console.error('Error during invitation:', error);
        return { ok: false, error };
    }
}

// Get users personally received invites
async function getReceivedInvites() {
    try {
        const response = await fetch(`/api/invites/rec`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching received invitation:', error);
        return null;
    }
}

// Get users personally sent invites
async function getSentInvites() {
    try {
        const response = await fetch(`/api/invites/inv`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching sent invitation:', error);
        return null;
    }
}

async function deleteInvite(invitationId) {
    try {
        const response = await fetch(`/api/invites/delete/` + invitationId, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
        });
        console.log('Delete invite response:', response);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('Invitation not found');
            }
            throw new Error(`Failed to delete invitation: ${response.status}`);
        }
        console.log('Invitation deleted successfully');
        return true;
    } catch (error) {
        console.error('Error deleting invitation:', error);
        throw error;
    }
}
// Get parties created by a specific user (tries several endpoints, fallspezifisch)
async function getPartiesByUser(userId) {
    const candidates = [
        `/api/users/${userId}/parties`,
        `/api/party/user/${userId}`,
        `/api/party?ownerId=${userId}`,
        `/api/party?userId=${userId}`,
        `/api/party/owner/${userId}`
    ];
    // try direct endpoints first
    for (const u of candidates) {
        try {
            const res = await fetch(u);
            if (!res.ok) {
                console.debug(`getPartiesByUser: ${u} -> ${res.status}`);
                continue;
            }
            const data = await res.json().catch(() => null);
            // Accept several response shapes
            if (Array.isArray(data)) return data;
            if (data && Array.isArray(data.parties)) return data.parties;
            if (data && Array.isArray(data.data)) return data.data;
            if (data && Array.isArray(data.results)) return data.results;
            // If object contains party-like items under other keys, attempt to find first array
            if (data && typeof data === 'object') {
                for (const k of Object.keys(data)) {
                    if (Array.isArray(data[k])) return data[k];
                }
            }
            if (Array.isArray(data)) return data;
        } catch (err) {
            console.debug(`getPartiesByUser: network error for ${u}`, err);
        }
    }

    // fallback: fetch all parties and filter by common owner fields
    try {
        const all = await getAllParties();
        if (!Array.isArray(all)) return null;
        return all.filter(p => {
            return p.ownerId == userId || p.creatorId == userId || p.userId == userId || p.owner == userId;
        });
    } catch (err) {
        console.error('getPartiesByUser fallback failed', err);
        return null;
    }
}

// Expose functions on a namespace to be used by other scripts (profile.js etc.)
window.backend = {
    createParty,
    getAllParties,
    sortParties,
    filterParties,
    getPartyById,
    getPartiesByUser, // <-- neu
    updateParty,
    deleteParty,
    attendParty,
    leaveParty,
    getMediaForParty,
    getAllUsers,
    getUserById,
    getProfilePicture,
    invite,
    getReceivedInvites,
    getSentInvites,
    deleteInvite
};