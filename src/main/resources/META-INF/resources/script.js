async function fetchUsers() {
    try {
        const response = await fetch('http://localhost:8080/api/users');
        const users = await response.json();
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

async function fetchParties() {
    try {
        const response = await fetch('http://localhost:8080/api/party/list');
        const parties = await response.json();
        const partyTableBody = document.getElementById('partyTable').querySelector('tbody');
        partyTableBody.innerHTML = '';
        parties.forEach(party => {
            const row = `<tr>
                    <td>${party.party_id}</td>
                    <td>${party.category_id}</td>
                    <td>${party.time_start}</td>
                    <td>${party.time_end}</td>
                    <td>${party.max_people}</td>
                    <td>${party.min_age}</td>
                    <td>${party.max_age}</td>
                </tr>`;
            partyTableBody.insertAdjacentHTML('beforeend', row);
        });
    } catch (error) {
        console.error('Error fetching parties:', error);
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