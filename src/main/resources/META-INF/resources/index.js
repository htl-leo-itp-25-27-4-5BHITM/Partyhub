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

  // Current user's location layer (different color)
  const currentUserLayer = L.layerGroup().addTo(map);

  function currentUserRequest() {
    const userId = window.getCurrentUserId?.() ?? window.authService?.getCurrentUserId?.() ?? null;
    return {
      userId,
      headers: {}
    };
  }

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
          .bindPopup(partyPopupHtml(party), partyPopupOptions())
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

    // In party.location
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

  function partyPopupOptions() {
    return {
      className: "party-map-popup",
      minWidth: Math.min(240, Math.max(160, mapEl.clientWidth - 64)),
      maxWidth: Math.min(320, Math.max(160, mapEl.clientWidth - 64)),
      maxHeight: Math.max(160, Math.min(340, mapEl.clientHeight - 80)),
      autoPanPadding: [18, 18],
    };
  }

  function partyPopupHtml(p) {
    const title = escapeHtml(partyTitle(p));
    const description = escapeHtml(p.description ?? "");
    const location = escapeHtml(p.location?.address ?? p.location?.name ?? p.location_address ?? "");
    const theme = escapeHtml(p.theme ?? p.category?.name ?? "");
    const start = parsePartyStart(p);
    const date = start ? escapeHtml(new Intl.DateTimeFormat("de-AT", {
      weekday: "short", day: "numeric", month: "short", year: "numeric"
    }).format(start)) : "";
    const time = start ? escapeHtml(new Intl.DateTimeFormat("de-AT", {
      hour: "2-digit", minute: "2-digit"
    }).format(start)) : "";
    const fee = p.fee == null ? null : toNumber(p.fee);
    const price = fee === null ? "" : fee === 0 ? "Free entry" : escapeHtml(
      new Intl.NumberFormat("de-AT", { style: "currency", currency: "EUR" }).format(fee)
    );
    const detailsUrl = `/advancedPartyInfos/advancedPartyInfos.html?id=${encodeURIComponent(String(p.id ?? ""))}`;

    return `
      <article class="map-event">
        ${theme ? `<span class="map-event__theme">${theme}</span>` : ""}
        <h3 class="map-event__title">${title}</h3>
        <div class="map-event__meta">
          ${date ? `<div class="map-event__row">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16"/></svg>
            <span>${date}<span class="map-event__time">${time}</span></span>
          </div>` : ""}
          ${location ? `<div class="map-event__row">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
            <span>${location}</span>
          </div>` : ""}
        </div>
        ${description ? `<p class="map-event__description">${description}</p>` : ""}
        <footer class="map-event__footer">
          ${price ? `<span class="map-event__price">${price}</span>` : ""}
          ${p.id != null ? `<a class="map-event__link" href="${detailsUrl}">View party <span aria-hidden="true">↗</span></a>` : ""}
        </footer>
      </article>
    `;
  }

  // ---------------------------
  // Filter: next 14 days only (robust + logs)
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
  // Load and display parties
  // ---------------------------
  const partySearch = document.getElementById("homePartySearch");
  const searchStatus = document.getElementById("homeSearchStatus");
  let upcomingParties = [];

  partySearch?.addEventListener("input", renderPartiesOnMap);

  async function loadAllPartiesToMap() {
    const parties = window.backend?.getAllParties
      ? await window.backend.getAllParties()
      : await getAllParties();

    // Debug: show what we received
    console.debug("loadAllPartiesToMap: received parties:", parties);
    if (!Array.isArray(parties)) {
      console.warn("Received parties are not an array:", parties);
      return;
    }

    const filtered = parties.filter(isInNext14Days);
    console.debug(
      `loadAllPartiesToMap: ${parties.length} total, ${filtered.length} in next 14 days`,
    );

    upcomingParties = filtered;
    renderPartiesOnMap();
  }

  function renderPartiesOnMap() {
    const query = (partySearch?.value || "").trim().toLocaleLowerCase();
    const matches = upcomingParties.filter(party =>
      !query || [party.title, party.location?.address, party.location_address]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(query)
    );
    partyLayer.clearLayers();
    const bounds = [];

    for (const party of matches) {
      const ll = extractLatLng(party);
      if (!ll) {
        console.debug(
          "loadAllPartiesToMap: no coords for party",
          party.id ?? party.title ?? party,
        );
        continue;
      }

      const marker = L.marker([ll.lat, ll.lng]).addTo(partyLayer);
      marker.bindPopup(partyPopupHtml(party), partyPopupOptions());
      bounds.push([ll.lat, ll.lng]);
    }

    if (searchStatus) {
      searchStatus.textContent = query
        ? `${bounds.length} ${bounds.length === 1 ? "party" : "parties"} on the map in the next 14 days`
        : "";
    }

    // Zoom to markers when present
    if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    } else if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [30, 30] });
    } else {
      // No parties in the next 2 weeks -> default view
      map.setView([48.3069, 14.2858], 8);
    }
  }

  // ---------------------------
  // Show device location (client-side only, never sent to the server)
  // ---------------------------
  let centeredOnce = false;
  let geolocationWatchId = null;

  function showUserLocation(lat, lng, accuracy) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    currentUserLayer.clearLayers();
    L.marker([lat, lng], {
      icon: L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }).addTo(currentUserLayer).bindPopup("Du bist hier");

    if (Number.isFinite(accuracy) && accuracy > 0) {
      L.circle([lat, lng], { radius: accuracy }).addTo(currentUserLayer);
    }

    if (!centeredOnce) {
      map.setView([lat, lng], 15);
      centeredOnce = true;
    }
  }

  function startGeolocation() {
    const geolocation = navigator.geolocation;
    if (
      geolocationWatchId !== null ||
      !geolocation ||
      typeof geolocation.watchPosition !== "function"
    ) return;

    try {
      geolocationWatchId = geolocation.watchPosition(
        (pos) => {
          showUserLocation(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
          );
        },
        (err) => {
          if (err.code === 1) currentUserLayer.clearLayers();
          console.warn("Geolocation error:", err.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
      );
    } catch (err) {
      geolocationWatchId = null;
      console.warn("Geolocation unavailable:", err.message);
    }
  }

  function stopGeolocation() {
    if (geolocationWatchId === null) return;

    navigator.geolocation?.clearWatch?.(geolocationWatchId);
    geolocationWatchId = null;
  }

  window.addEventListener("pagehide", stopGeolocation);
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) startGeolocation();
  });

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
      // then every 24h
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
    const response = await (window.authService?.apiCall || fetch)("/api/parties", {
      authRequired: false
    });
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching parties:", error);
    return null;
  }
}
