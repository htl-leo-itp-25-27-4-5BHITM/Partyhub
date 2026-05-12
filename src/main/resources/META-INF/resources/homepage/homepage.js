// Initialize map (e.g. Linz)
const map = L.map("map").setView([48.3069, 14.2858], 13);

// OpenStreetMap Layer
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Place marker
const marker = L.marker([48.3069, 14.2858]).addTo(map);
marker.bindPopup("Starting point").openPopup();

// Click on the map -> new marker
map.on("click", (event) => {
  const lat = event.latlng.lat;
  const lng = event.latlng.lng;

  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(`Lat: ${lat.toFixed(5)}<br>Lng: ${lng.toFixed(5)}`)
    .openPopup();
});
