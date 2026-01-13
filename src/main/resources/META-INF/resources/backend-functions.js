// Party-functions
// Create Party in party-Table
// DateTimeFormat needs to be the same
async function createParty() {
    const partyPayload = {
        title: "Yet Yet Another Summer Picnic",
        description: "Casual get-together in the park.",
        fee: 3,
        time_start: "16.07.2025 12:00",
        time_end: "16.07.2025 16:00",
        max_people: 30,
        min_age: 12,
        max_age: 65,
        website: "https://example.com/picnic",
        latitude: 48.2082,
        longitude: 16.3738,
        category_id: 2
    };

    try {
        const response = await fetch("/api/party/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(partyPayload)
        });

        if (response.status === 201) {
            console.log("Party created successfully!");
        } else {
            console.error("Error creating party:", response.status);
        }
    } catch (error) {
        console.error("Network error:", error);
    }
}

//createParty();

// Fetch all parties
async function getAllParties() {
    try {
        const response = await fetch('/api/party/');
        console.log(response);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching parties:', error);
    }
}
//getAllParties()

// Sort parties
async function sortParties(sortKey) {
    try {
        const response = await fetch(`/api/party/sort?sort=${sortKey}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching sorted parties:', error);
    }
}

//sortParties("asc")

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
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error filtering parties:', error);
    }
}

//filterParties("a")

// Get a party by ID
async function getPartyById(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching party by ID:', error);
    }
}

//getPartyById(2)

// Update a party by ID
async function updateParty(partyId) {
    const partyPayload = {
        title: "Yet Yet Another Summer Picnic",
        description: "Casual get-together in the park.",
        fee: 3,
        time_start: "16.07.2025 12:00",
        time_end: "16.07.2025 16:00",
        max_people: 30,
        min_age: 12,
        max_age: 65,
        website: "https://example.com/picnic",
        latitude: 48.2082,
        longitude: 16.3738,
        category_id: 2
    };
    try {
        const response = await fetch(`/api/party/${partyId}`, {
            method: 'POST',
                headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(partyPayload)
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Party updated:', data);
        return data;
    } catch (error) {
        console.error('Error updating party:', error);
    }
}

//updateParty(2)

// Delete a party by ID
async function deleteParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Network response was not ok');
        console.log('Party deleted');
    } catch (error) {
        console.error('Error deleting party:', error);
    }
}

// delete fails due to p1 not existing
//deleteParty(1)

// Attend a party
async function attendParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/attend`, {
        method: 'POST'
    });
    console.log('Attended the party');
} catch (error) {
    console.error('Error attending the party:', error);
}
}

//attendParty(2)

// Leave a party
async function leaveParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/attend`, {
        method: 'DELETE'
    });
    if (!response.ok) throw new Error('Network response was not ok');
    console.log('Left the party');
} catch (error) {
    console.error('Error leaving the party:', error);
}
}

//leaveParty(2)

// Get media for a party
async function getMediaForParty(partyId) {
    try {
        const response = await fetch(`/api/party/${partyId}/media`);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Party media:', data);
        return data;
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

//getMediaForParty(2)

// User-functions
// Fetch all users
async function getAllUsers() {
    try {
        const response = await fetch('/api/users/all');
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching parties:', error);
    }
}

//getAllUsers()

// Get user by id
async function getUserById(id) {
    try {
        const response = await fetch('/api/users/' + id);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

//getUserById(2)

// Get profile-picture by user id
async function getProfilePicture(id) {
    try {
        const response = await fetch('/api/users/' + id + "/profile-picture");
        console.log(response)
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error fetching profile-picture:', error);
    }
}

//getProfilePicture(2)

// Invite user to party using userId
async function invite(recipient, partyId) {
    const invitationPayload = {
        recipient, partyId
    };
    try {
        const response = await fetch(`/api/invites/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invitationPayload)
        });
        console.log('Invite:', response);
        if (!response.ok) throw new Error('Network response was not ok');
        console.log(response.ok)
    } catch (error) {
        console.error('Error during invitation:', error);
    }
}

// Get user by id
async function createUser() {
    try {
        const response = await fetch("/api/users/", {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log(data);
        return data;
    } catch (error) {
        console.error('Error creating user:', error);
    }
}

//getUserById(2)

// Invite-functions
//invite(3, 2)

// Get users personally received invites
async function getReceivedInvites() {
    try {
        const response = await fetch(`/api/invites/rec`);
        console.log('Received Invites:', response);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Invite:', data);
        return data;
    } catch (error) {
        console.error('Error fetching received invitation:', error);
    }
}

//getReceivedInvites()

// Get users personally received invites
async function getSentInvites() {
    try {
        const response = await fetch(`/api/invites/inv`);
        console.log('Sent Invites:', response);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Invite:', data);
        return data;
    } catch (error) {
        console.error('Error fetching received invitation:', error);
    }
}

//getSentInvites()

// Delete invites using invitation id
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

//deleteInvite(1)