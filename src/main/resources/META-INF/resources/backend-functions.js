// Party-functions
// Create Party in party-Table
// DateTimeFormat needs to be the same

function getUserIdFromStorage() {
    return window.getCurrentUserId?.() ?? null;
}

async function createParty(payload) {
    // ...existing implementation...
    const userId = getUserIdFromStorage();
    if (!userId) {
        return { ok: false, error: "User not logged in" };
    }
    try {
        const response = await fetch(`/api/party/add?user=${userId}`, {
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
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.error('User not logged in');
        return false;
    }
    try {
        const response = await fetch(`/api/party/${partyId}/attend?user=${userId}`, { method: 'POST' });
        return response.ok;
    } catch (error) {
        console.error('Error attending the party:', error);
        return false;
    }
}

// Leave a party
async function leaveParty(partyId) {
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.error('User not logged in');
        return false;
    }
    try {
        const response = await fetch(`/api/party/${partyId}/attend?user=${userId}`, { method: 'DELETE' });
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

// Get profile-picture URL by user id
function getProfilePictureUrl(id) {
    return `/api/users/${id}/profile-picture`;
}

// Get profile-picture by user id (returns the URL for img src)
async function getProfilePicture(id) {
    return `/api/users/${id}/profile-picture`;
}

// Invite user to party using userId
async function invite(recipient, partyId) {
    const userId = getUserIdFromStorage();
    if (!userId) {
        return { ok: false, error: "User not logged in" };
    }
    const invitationPayload = { recipient, partyId };
    try {
        const response = await fetch(`/api/invites/?user=${userId}`, {
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
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.error('User not logged in');
        return [];
    }
    try {
        const response = await fetch(`/api/invites/rec?user=${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching received invitation:', error);
        return null;
    }
}

// Get users personally sent invites
async function getSentInvites() {
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.error('User not logged in');
        return [];
    }
    try {
        const response = await fetch(`/api/invites/inv?user=${userId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching sent invitation:', error);
        return null;
    }
}

async function deleteInvite(invitationId) {
    const userId = getUserIdFromStorage();
    if (!userId) {
        console.error('User not logged in');
        return { ok: false, error: "User not logged in" };
    }
    try {
        const response = await fetch(`/api/invites/delete/${invitationId}?user=${userId}`, {
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
// Get parties created by a specific user (tries several endpoints, fallbacks)
async function getPartiesByUser(userId) {
    const candidates = [
        `/api/users/${userId}/parties`,
        `/api/party/user/${userId}`,
        `/api/party?host_user_id=${userId}`,
        `/api/party?hostId=${userId}`,
        `/api/party?host_id=${userId}`,
        `/api/party?ownerId=${userId}`,
        `/api/party?userId=${userId}`,
        `/api/party/owned/${userId}`,
        `/api/party/owner/${userId}`,
        `/api/party/` // last resort - list all
    ];

    for (const u of candidates) {
        try {
            const res = await fetch(u);
            if (!res.ok) {
                console.debug(`getPartiesByUser: ${u} -> ${res.status}`);
                continue;
            }
            const data = await res.json().catch(() => null);
            if (!data) continue;

            // Normalize several possible shapes to an array "arr"
            let arr = null;
            if (Array.isArray(data)) arr = data;
            else if (Array.isArray(data.parties)) arr = data.parties;
            else if (Array.isArray(data.data)) arr = data.data;
            else if (Array.isArray(data.results)) arr = data.results;
            else if (typeof data === 'object') {
                // try to find the first array value inside the response object
                for (const k of Object.keys(data)) {
                    if (Array.isArray(data[k])) { arr = data[k]; break; }
                }
            }

            if (Array.isArray(arr)) {
                // Filter strictly for host/owner fields matching userId to be safe
                const filtered = arr.filter(p => {
                    if (!p) return false;
                    const id = String(userId);
                    if (p.host_user_id != null && String(p.host_user_id) === id) return true;
                    if (p.hostId != null && String(p.hostId) === id) return true;
                    if (p.host_id != null && String(p.host_id) === id) return true;
                    if (p.hostUserId != null && String(p.hostUserId) === id) return true;
                    if (p.ownerId != null && String(p.ownerId) === id) return true;
                    if (p.creatorId != null && String(p.creatorId) === id) return true;
                    if (p.userId != null && String(p.userId) === id) return true;
                    if (p.owner != null && String(p.owner) === id) return true;
                    if (p.host && typeof p.host === 'object' && (String(p.host.id) === id || String(p.host.userId) === id)) return true;
                    return false;
                });
                console.debug(`getPartiesByUser: endpoint ${u} returned ${arr.length} item(s), filtered -> ${filtered.length}`);
                // If we queried a direct user-scoped endpoint (not the generic /api/party/), return filtered (could be empty)
                return filtered;
            }
            // If data itself is an object that looks like a single party, return it as single-element array when host matches
            if (data && typeof data === 'object') {
                const maybe = data;
                const idStr = String(userId);
                if (
                    (maybe.host_user_id != null && String(maybe.host_user_id) === idStr) ||
                    (maybe.hostId != null && String(maybe.hostId) === idStr) ||
                    (maybe.ownerId != null && String(maybe.ownerId) === idStr) ||
                    (maybe.creatorId != null && String(maybe.creatorId) === idStr) ||
                    (maybe.host && typeof maybe.host === 'object' && String(maybe.host.id) === idStr)
                ) {
                    return [maybe];
                }
            }
        } catch (err) {
            console.debug(`getPartiesByUser: network error for ${u}`, err);
            continue;
        }
    }

    // fallback: fetch all parties and filter by many possible owner/host fields
    try {
        const all = await getAllParties();
        if (!Array.isArray(all)) return [];
        const result = all.filter(p => {
            if (!p) return false;
            const id = String(userId);
            if (p.host_user_id != null && String(p.host_user_id) === id) return true;
            if (p.hostId != null && String(p.hostId) === id) return true;
            if (p.host_id != null && String(p.host_id) === id) return true;
            if (p.hostUserId != null && String(p.hostUserId) === id) return true;
            if (p.ownerId != null && String(p.ownerId) === id) return true;
            if (p.creatorId != null && String(p.creatorId) === id) return true;
            if (p.userId != null && String(p.userId) === id) return true;
            if (p.owner != null && String(p.owner) === id) return true;
            if (p.host && typeof p.host === 'object' && (String(p.host.id) === id || String(p.host.userId) === id)) return true;
            return false;
        });
        console.debug(`getPartiesByUser: fallback filtered ${result.length} parties from all (${Array.isArray(all)?all.length:0})`);
        return result;
    } catch (err) {
        console.error('getPartiesByUser fallback failed', err);
        return [];
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