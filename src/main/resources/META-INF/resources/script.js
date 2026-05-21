async function fetchUsers() {
    try {
        const BASE_URL = window.location.hostname === "localhost" ? "http://localhost:8080" : "https://it220214.cloud.htl-leonding.ac.at";
        const response = await fetch(`${BASE_URL}/api/users`);
        const users = await response.json();
        console.log("users:"  + users)
        const userTableBody = document.getElementById('userTable').querySelector('tbody');
        userTableBody.innerHTML = '';
        users.forEach(user => {
            const row = `<tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                </tr>`;
            userTableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}


fetchUsers();
fetchParties();
const x = document.getElementById("demo");

function getLocation() {
    navigator.geolocation.getCurrentPosition((pos) => showPosition(pos), () => {
        x.innerHTML = "Geolocation is not supported by this browser.";
    });
}

function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude;
}

getLocation()

function addFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.name = 'file';
    document.querySelector('form div').appendChild(input);
}

async function loadMedia(){
    const BASE_URL = window.location.hostname === "localhost" ? "http://localhost:8080" : "https://it220214.cloud.htl-leonding.ac.at";
    const input = document.getElementById("media_test");
    const response = await fetch(`${BASE_URL}/api/media/1`);
    const media = await response.json();
    console.log(media)
    media.forEach(element => {
        console.log(element)
        let mediaImg = document.createElement("img")
        mediaImg.src = `./uploads/party1/${element}`
        input.appendChild(mediaImg)
    });
}
loadMedia()

async function fetchParties() {
    try {
        const response = await fetch('/api/parties');
        const parties = await response.json();
        const partyTableBody = document.getElementById('partyTable').querySelector('tbody');
        partyTableBody.innerHTML = '';
        parties.forEach(party => {
            const row = `<tr>
                    <td>${party.id}</td>
                    <td>${party.title}</td>
                    <td>${party.category_id}</td>
                    <td>${party.time_start}</td>
                    <td>${party.time_end}</td>
                    <td>${party.max_people}</td>
                    <td>${party.min_age}</td>
                    <td>${party.max_age}</td>
                    <td>
                        <button class="btn btn-sm btn-success" onclick="attendParty(${party.id})">Join</button>
                        <button class="btn btn-sm btn-danger" onclick="unattendParty(${party.id})">Leave</button>
                    </td>
                </tr>`;
            partyTableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error fetching parties:', error);
    }
}

async function attendParty(partyId) {
    try {
        const res = await window.authService.apiCall(`/api/parties/${partyId}/join`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        if (!res.ok) {
            console.error('Attend failed', res.status);
            alert('Joining failed: ' + res.status);
            return;
        }
        await fetchParties();
    } catch (err) {
        console.error('Attend error', err);
        alert('Error while joining');
    }
}

async function unattendParty(partyId) {
    try {
        const res = await window.authService.apiCall(`/api/parties/${partyId}/join`, {
            method: 'DELETE'
        });
        if (!res.ok) {
            console.error('Unattend failed', res.status);
            alert('Leaving failed: ' + res.status);
            return;
        }
        await fetchParties();
    } catch (err) {
        console.error('Unattend error', err);
        alert('Error while leaving');
    }
}

document.getElementById('filterForm').addEventListener('submit', async e => {
    e.preventDefault();

    const filter = document.getElementById('filter').value;
    const param = document.getElementById('param').value;

    const payload = {
        filterType: filter,
        value: param
    };

    try {
        const response = await fetch('/api/parties', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`Status ${response.status}`);
        const result = await response.json();
        console.log('Server reply:', result);
    } catch (err) {
        console.error('Submit failed:', err);
    }
});
