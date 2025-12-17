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

//getPartyById(1)

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

//updateParty(1)

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
        console.error('Error fetching party media:', error);
    }
}

getMediaForParty(1)