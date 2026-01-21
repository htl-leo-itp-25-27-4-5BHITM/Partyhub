document.addEventListener("DOMContentLoaded", () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  const map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    inertia: true,
    updateWhenZooming: false,
    updateWhenIdle: true
  }).setView([48.3069, 14.2858], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);

  L.marker([48.3069, 14.2858]).addTo(map).bindPopup("Linz").openPopup();

  // Leaflet muss nach Layout/Fonts nochmal messen (sonst “Tile-Salat” wie bei dir)
  const fixSize = () => map.invalidateSize(true);

  // 1) nach dem ersten Render
  requestAnimationFrame(() => requestAnimationFrame(fixSize));

  // 2) nach kurzem Delay (Fonts/Header/Nav sind dann safe)
  setTimeout(fixSize, 200);
  setTimeout(fixSize, 600);

  // 3) bei Fenstergrößenänderung
  window.addEventListener("resize", () => {
    setTimeout(fixSize, 100);
  });
});
