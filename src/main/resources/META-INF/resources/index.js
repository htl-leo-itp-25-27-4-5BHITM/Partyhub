document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  // Map initialisieren
  const map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    inertia: true,
    updateWhenZooming: false,
    updateWhenIdle: true,
  }).setView([48.3069, 14.2858], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  const partyLayer = L.layerGroup().addTo(map);
  const userLayer = L.layerGroup().addTo(map);

  // Load parties from localStorage and add to map
  function loadPartiesFromLocalStorage() {
    try {
      const partiesJSON = localStorage.getItem("parties");
      if (!partiesJSON) return [];
      const parties = JSON.parse(partiesJSON);
      return Array.isArray(parties) ? parties : [];
    } catch (err) {
      return [];
    }
  }

  // Add party markers from localStorage to map
  function addLocalStoragePartiesToMap() {
    const localParties = loadPartiesFromLocalStorage();
    localParties.forEach((party) => {
      if (party.latitude && party.longitude) {
        const marker = L.marker([party.latitude, party.longitude], {
          icon: L.icon({
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          }),
        })
          .bindPopup(
            `<strong>${escapeHtml(party.title)}</strong><br>${escapeHtml(party.location_address)}`,
          )
          .addTo(partyLayer);
      }
    });
  }

  addLocalStoragePartiesToMap();

  // ---------------------------
  // Helpers
  // ---------------------------
  function toNumber(v) {
    if (v === null || v === undefined) return null;
    const n = typeof v === "string" ? Number(v.replace(",", ".")) : Number(v);
    return Number.isFinite(n) ? n : null;
  }

  function pick(obj, keys) {
    if (!obj || typeof obj !== "object") return null;
    for (const k of keys) {
      if (obj[k] !== undefined && obj[k] !== null) return obj[k];
    }
    return null;
  }

  function extractLatLng(party) {
    if (!party || typeof party !== "object") return null;

    // Direkt am Party-Objekt
    const latDirect = toNumber(
      pick(party, ["lat", "latitude", "Latitude", "y"]),
    );
    const lngDirect = toNumber(
      pick(party, ["lng", "lon", "longitude", "Longitude", "x"]),
    );
    if (latDirect !== null && lngDirect !== null)
      return { lat: latDirect, lng: lngDirect };

    // In party.location (dein Fall)
    if (party.location && typeof party.location === "object") {
      const loc = party.location;
      const latLoc = toNumber(pick(loc, ["lat", "latitude", "Latitude", "y"]));
      const lngLoc = toNumber(
        pick(loc, ["lng", "lon", "longitude", "Longitude", "x"]),
      );
      if (latLoc !== null && lngLoc !== null)
        return { lat: latLoc, lng: lngLoc };

      // GeoJSON
      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        const a = toNumber(loc.coordinates[0]); // lng
        const b = toNumber(loc.coordinates[1]); // lat
        if (a !== null && b !== null) return { lat: b, lng: a };
      }
    }

    return null;
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function partyTitle(p) {
    return p.title ?? p.name ?? `Party #${p.id ?? "?"}`;
  }

  function partyPopupHtml(p) {
    const title = escapeHtml(partyTitle(p));
    const desc = escapeHtml(p.description ?? "");
    const start = escapeHtml(p.time_start ?? "");
    const end = escapeHtml(p.time_end ?? "");
    const locName = escapeHtml(p.location?.name ?? "");
    const category = escapeHtml(p.category?.name ?? "");

    return `
      <div style="min-width:200px">
        <div style="font-weight:700;margin-bottom:6px">${title}</div>
        <div style="opacity:.85;margin-bottom:8px">
          ${category ? `${category}<br>` : ""}
          ${start || end ? `${start}${end ? " → " + end : ""}<br>` : ""}
          ${locName ? `${locName}` : ""}
        </div>
        ${desc ? `<div>${desc}</div>` : ""}
      </div>
    `;
  }

  // ---------------------------
  // Filter: nur nächste 14 Tage (robust + Logs)
  // ---------------------------

  // parsePartyStart: handle ISO, numeric timestamp, and backend format "dd.MM.yyyy HH:mm"
  function parsePartyStart(p) {
    const raw = p?.time_start ?? p?.startDate ?? p?.date ?? null;
    if (!raw) return null;

    // 1) Try native parsing (ISO)
    let d = new Date(raw);
    if (!Number.isNaN(d.getTime())) return d;

    // 2) If it's a numeric timestamp string
    if (/^\d+$/.test(String(raw))) {
      d = new Date(Number(raw));
      if (!Number.isNaN(d.getTime())) return d;
    }

    // 3) Try backend format "dd.MM.yyyy HH:mm" or "dd.MM.yyyy"
    const m = String(raw).match(
      /^\s*(\d{1,2})\.(\d{1,2})\.(\d{4})(?:[ T](\d{1,2}):(\d{2}))?\s*$/,
    );
    if (m) {
      const day = Number(m[1]),
        month = Number(m[2]),
        year = Number(m[3]);
      const hour = m[4] ? Number(m[4]) : 0;
      const minute = m[5] ? Number(m[5]) : 0;
      d = new Date(year, month - 1, day, hour, minute);
      if (!Number.isNaN(d.getTime())) return d;
    }

    // 4) Could not parse
    return null;
  }

  // normalize to start of day (local) to avoid time-of-day excluding same-day events
  function startOfDayLocal(d) {
    const nd = new Date(d);
    nd.setHours(0, 0, 0, 0);
    return nd;
  }

  function isInNext14Days(p) {
    const start = parsePartyStart(p);
    if (!start) return false;

    const now = new Date();
    const today = startOfDayLocal(now);
    const in14 = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // midnight +14d

    const startDay = startOfDayLocal(start);

    // Debug: show raw values if something excluded unexpectedly
    const ok = startDay >= today && startDay <= in14;
    if (!ok) {
      console.debug("isInNext14Days: excluded party", {
        id: p.id ?? p.partyId,
        title: p.title ?? p.name,
        raw_time_start: p?.time_start,
        parsed_iso: start ? start.toISOString() : null,
        startDay: startDay ? startDay.toISOString() : null,
        today: today.toISOString(),
        in14: in14.toISOString(),
      });
    }
    return ok;
  }

  // ---------------------------
  // Parties laden + anzeigen
  // ---------------------------
  async function loadAllPartiesToMap() {
    const parties = window.backend?.getAllParties
      ? await window.backend.getAllParties()
      : await getAllParties();

    // Debug: show what we received
    console.debug("loadAllPartiesToMap: received parties:", parties);
    if (!Array.isArray(parties)) {
      console.warn("Parties nicht als Array bekommen:", parties);
      return;
    }

    const filtered = parties.filter(isInNext14Days);
    console.debug(
      `loadAllPartiesToMap: ${parties.length} total, ${filtered.length} in next 14 days`,
    );

    partyLayer.clearLayers();
    const bounds = [];

    for (const party of filtered) {
      const ll = extractLatLng(party);
      if (!ll) {
        console.debug(
          "loadAllPartiesToMap: no coords for party",
          party.id ?? party.title ?? party,
        );
        continue;
      }

      const marker = L.marker([ll.lat, ll.lng]).addTo(partyLayer);
      marker.bindPopup(partyPopupHtml(party));
      bounds.push([ll.lat, ll.lng]);
    }

    // Zoom auf Marker (nur wenn es welche gibt)
    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      // keine Parties in den nächsten 2 Wochen -> Default View
      map.setView([48.3069, 14.2858], 8);
    }
  }

  // ---------------------------
  // Geräte-Location anzeigen (optional)
  // ---------------------------
  let centeredOnce = false;

  function showUserLocation(lat, lng, accuracy) {
    userLayer.clearLayers();
    L.marker([lat, lng]).addTo(userLayer).bindPopup("Du bist hier");

    if (accuracy) {
      L.circle([lat, lng], { radius: accuracy }).addTo(userLayer);
    }

    if (!centeredOnce) {
      map.setView([lat, lng], 15);
      centeredOnce = true;
    }
  }

  function startGeolocation() {
    if (!("geolocation" in navigator)) return;

    navigator.geolocation.watchPosition(
      (pos) => {
        showUserLocation(
          pos.coords.latitude,
          pos.coords.longitude,
          pos.coords.accuracy,
        );
      },
      (err) => console.warn("Geolocation error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  }

  // ---------------------------
  // “Tile-Salat”/Layout Fix
  // ---------------------------
  const fixSize = () => map.invalidateSize(true);
  requestAnimationFrame(() => requestAnimationFrame(fixSize));
  setTimeout(fixSize, 200);
  setTimeout(fixSize, 600);
  window.addEventListener("resize", () => setTimeout(fixSize, 100));

  // ---------------------------
  // Automatisch jeden Tag updaten (Mitternacht)
  // ---------------------------
  function scheduleDailyRefresh() {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 5, 0); // 00:00:05 (kleiner Puffer)

    const ms = nextMidnight.getTime() - now.getTime();

    setTimeout(async () => {
      await loadAllPartiesToMap();
      // danach alle 24h
      setInterval(loadAllPartiesToMap, 24 * 60 * 60 * 1000);
    }, ms);
  }

  // Start
  await loadAllPartiesToMap();
  scheduleDailyRefresh();
  startGeolocation();
});

async function getAllParties() {
  try {
    const response = await fetch("/api/party/");
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching parties:", error);
    return null;
  }
}

// --- DEV: Override browser geolocation to Vienna (48.2082, 16.3738) ---
// This will make getCurrentPosition / watchPosition return Vienna coordinates.
// Remove or comment out this call in production.
(function setFakeGeolocationToVienna() {
  const fakeLat = 48.2082;
  const fakeLng = 16.3738;
  const fakeAcc = 30;

  try {
    const originalGeo = navigator.geolocation
      ? { ...navigator.geolocation }
      : null;
    const watchers = new Map();
    let nextWatchId = 1;

    const geo = {
      getCurrentPosition(success, error, opts) {
        // call success asynchronously to mimic real behavior
        setTimeout(() => {
          success({
            coords: {
              latitude: fakeLat,
              longitude: fakeLng,
              accuracy: fakeAcc,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }, 50);
      },
      watchPosition(success, error, opts) {
        const id = nextWatchId++;
        // immediate callback
        success({
          coords: {
            latitude: fakeLat,
            longitude: fakeLng,
            accuracy: fakeAcc,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null,
          },
          timestamp: Date.now(),
        });
        // periodic updates (every 5s)
        const handle = setInterval(() => {
          success({
            coords: {
              latitude: fakeLat,
              longitude: fakeLng,
              accuracy: fakeAcc,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          });
        }, 5000);
        watchers.set(id, handle);
        return id;
      },
      clearWatch(id) {
        const h = watchers.get(id);
        if (h) {
          clearInterval(h);
          watchers.delete(id);
        }
      },
    };

    // Replace navigator.geolocation (if allowed)
    try {
      Object.defineProperty(navigator, "geolocation", {
        value: geo,
        configurable: true,
        writable: true,
      });
      console.info("Fake geolocation installed: Vienna (48.2082,16.3738)");
    } catch (e) {
      // fallback: assign if defineProperty not allowed
      try {
        navigator.geolocation = geo;
        console.info("Fake geolocation assigned: Vienna");
      } catch (_) {}
    }

    // Optional: expose restore function for debugging
    window.__restoreOriginalGeolocation = function () {
      try {
        if (originalGeo) {
          Object.defineProperty(navigator, "geolocation", {
            value: originalGeo,
            configurable: true,
            writable: true,
          });
          console.info("Geolocation restored to original.");
        }
      } catch (e) {
        console.warn("Could not restore original geolocation.", e);
      }
    };
  } catch (err) {
    console.warn("Failed to set fake geolocation", err);
  }
})();
