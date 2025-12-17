// Create Party in party-Table
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

createParty();