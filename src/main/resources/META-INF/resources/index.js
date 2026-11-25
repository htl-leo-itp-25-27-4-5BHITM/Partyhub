document.addEventListener("DOMContentLoaded", async () => {
  const mapEl = document.getElementById("map");
  if (!mapEl) return;

  // Map initialisieren
  const map = L.map("map", {
    preferCanvas: true,
    zoomControl: true,
    attributionControl: false,
    inertia: true,
    updateWhenZooming: false,
    updateWhenIdle: true,
  }).setView([48.3069, 14.2858], 13);

  const tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    keepBuffer: 2,
    updateWhenIdle: true,
    updateWhenZooming: false,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
  }).addTo(map);

  const partyLayer = L.layerGroup().addTo(map);

  // Current user's location layer (different color)
  const currentUserLayer = L.layerGroup().addTo(map);

  const selection = document.getElementById("mapSelection");
  const selectionContent = document.getElementById("mapSelectionContent");
  const status = document.getElementById("mapStatus");
  const fitButton = document.getElementById("fitParties");
  let selectedMarker = null;
  let matchingBounds = [];
  let dateFilter = "all";
  let hasInitialView = false;
  let latestPosition = null;
  let userNavigated = false;
  map.on("dragstart zoomstart", event => {
    if (event.originalEvent || event.type === "dragstart") userNavigated = true;
  });
  const setStatus = message => { status.textContent = message; status.hidden = !message; };
  let tileFailures = 0;
  tiles.on("tileerror", () => { if (++tileFailures >= 3) setStatus("Map unavailable. Check your connection and reload."); });
  tiles.on("load", () => { tileFailures = 0; });
  function closeSelection(restoreFocus = false) {
    selection.hidden = true;
    selectedMarker?.getElement()?.classList.remove("is-selected");
    selectedMarker?.getElement()?.setAttribute("aria-expanded", "false");
    if (restoreFocus) selectedMarker?.getElement()?.focus();
    selectedMarker = null;
  }
  document.getElementById("closeMapSelection").addEventListener("click", () => closeSelection(true));
  document.addEventListener("keydown", event => { if (event.key === "Escape" && !selection.hidden) closeSelection(true); });
  fitButton.addEventListener("click", () => {
    if (matchingBounds.length) map.fitBounds(matchingBounds, {padding:[55,55], maxZoom:15});
  });
  document.querySelectorAll("[data-date]").forEach(button => button.addEventListener("click", () => {
    dateFilter = button.dataset.date;
    document.querySelectorAll("[data-date]").forEach(item => item.setAttribute("aria-pressed", String(item === button)));
    renderPartiesOnMap();
  }));
  map.zoomControl.setPosition("topright");
  const Locate = L.Control.extend({
    options:{position:"topright"},
    onAdd() {
      const box = L.DomUtil.create("div", "leaflet-bar leaflet-control");
      const button = L.DomUtil.create("button", "map-locate", box);
      button.type = "button";
      button.disabled = true;
      button.title = "Return to your location";
      button.setAttribute("aria-label", "Return to your location");
      button.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4"/></svg>';
      button.addEventListener("click", () => { if (latestPosition) map.setView(latestPosition,15); });
      L.DomEvent.disableClickPropagation(box);
      box.append(button);
      return box;
    }
  });
  new Locate().addTo(map);

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

  function partyPopupHtml(p) {
    const title = escapeHtml(partyTitle(p));
    const description = escapeHtml(p.description ?? "");
    const location = escapeHtml(p.location?.address ?? p.location?.name ?? p.location_address ?? "");
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
        ${window.partySocial?.html(p) || ""}
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
    let parties;
    try {
      parties = window.backend?.getAllParties
        ? await window.backend.getAllParties()
        : await getAllParties();
    } catch (error) {
      setStatus("Parties could not load. Reload to try again.");
      return;
    }

    // Debug: show what we received
    console.debug("loadAllPartiesToMap: received parties:", parties);
    if (!Array.isArray(parties)) {
      setStatus("Parties could not load. Reload to try again.");
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
    const today = startOfDayLocal(new Date());
    const saturday = new Date(today);
    const weekday = today.getDay();
    saturday.setDate(today.getDate() + (weekday === 0 ? -1 : (6 - weekday)));
    const monday = new Date(saturday);
    monday.setDate(saturday.getDate() + 2);
    const matches = upcomingParties.filter(party => {
      const day = startOfDayLocal(parsePartyStart(party));
      const dateMatches = dateFilter === "all" || (dateFilter === "today" ? day.getTime() === today.getTime() : day >= saturday && day < monday);
      return dateMatches && (!query || [party.title, party.location?.address, party.location_address]
        .filter(Boolean).join(" ").toLocaleLowerCase().includes(query));
    });
    closeSelection();
    partyLayer.clearLayers();
    const bounds = [];

    const groups = new Map();
    for (const party of matches) {
      const ll = extractLatLng(party);
      if (!ll || Math.abs(ll.lat) > 90 || Math.abs(ll.lng) > 180) continue;
      const point = map.project([ll.lat,ll.lng],map.getZoom());
      // Compare actual screen positions so pins across a grid boundary also cluster.
      const nearby = [...groups.entries()].find(([, group]) => {
        const first = extractLatLng(group[0]);
        const anchor = map.project([first.lat,first.lng],map.getZoom());
        return Math.abs(anchor.x-point.x) < 94 && Math.abs(anchor.y-point.y) < 78;
      });
      const key = nearby ? nearby[0] : groups.size;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(party);
    }
    for (const group of groups.values()) {
      if (group.length > 1) {
        const points = group.map(party => { const ll = extractLatLng(party); return [ll.lat,ll.lng]; });
        bounds.push(...points);
        const center = L.latLngBounds(points).getCenter();
        const friendParties = group.filter(party => (window.partySocial?.summary(party).count || 0) > 0).length;
        const clusterLabel = `${group.length} parties. Zoom in to explore.${friendParties ? ` Friends are attending ${friendParties} of them.` : ""}`;
        const cluster = L.marker(center, {icon:L.divIcon({className:"event-cluster",html:`<span>${group.length}</span>${friendParties ? `<span class="cluster-friends" aria-hidden="true">${friendParties} with friends</span>` : ""}`,iconSize:[48,48],iconAnchor:[24,24]}),title:clusterLabel,keyboard:true}).addTo(partyLayer);
        cluster.getElement()?.setAttribute("aria-label", clusterLabel);
        cluster.on("click", () => {
          if (map.getZoom() < 18) map.fitBounds(points, {padding:[70,70],maxZoom:Math.min(18,map.getZoom()+2)});
          else {
            closeSelection();
            selectedMarker = cluster;
            selectionContent.innerHTML = group.map(partyPopupHtml).join("");
            selection.hidden = false;
            document.getElementById("closeMapSelection").focus({preventScroll:true});
          }
        });
        continue;
      }
      const party = group[0];
      const ll = extractLatLng(party);
      if (!ll) {
        console.debug(
          "loadAllPartiesToMap: no coords for party",
          party.id ?? party.title ?? party,
        );
        continue;
      }

      if (Math.abs(ll.lat) > 90 || Math.abs(ll.lng) > 180) continue;
      const start = parsePartyStart(party);
      const time = new Intl.DateTimeFormat("de-AT", {hour:"2-digit", minute:"2-digit"}).format(start);
      const day = new Intl.DateTimeFormat("en-GB", {weekday:"short"}).format(start);
      const friendCount = window.partySocial?.summary(party).count || 0;
      const markerLabel = `${partyTitle(party)}, ${day} ${time}${friendCount ? `, ${friendCount} ${friendCount === 1 ? "friend" : "friends"} attending` : ""}`;
      const marker = L.marker([ll.lat, ll.lng], {
        icon:L.divIcon({className:"event-pin",html:`<span class="event-pin__body"><span>${escapeHtml(day)}</span><strong>${escapeHtml(time)}</strong></span>${window.partySocial?.pinHtml(party) || ""}`,iconSize:[76,44],iconAnchor:[38,48]}),
        title:markerLabel, alt:partyTitle(party), keyboard:true
      }).addTo(partyLayer);
      const markerEl = marker.getElement();
      markerEl?.setAttribute("aria-label", markerLabel);
      markerEl?.setAttribute("aria-expanded", "false");
      marker.on("click", () => {
        closeSelection();
        selectedMarker = marker;
        markerEl?.classList.add("is-selected");
        markerEl?.setAttribute("aria-expanded", "true");
        marker.setZIndexOffset(1000);
        selectionContent.innerHTML = partyPopupHtml(party);
        selection.hidden = false;
        document.getElementById("closeMapSelection").focus({preventScroll:true});
      });
      bounds.push([ll.lat, ll.lng]);
    }

    if (searchStatus) {
      searchStatus.textContent = query
        ? `${bounds.length} ${bounds.length === 1 ? "party" : "parties"} on the map in the next 14 days`
        : "";
    }

    matchingBounds = bounds;
    fitButton.disabled = bounds.length === 0;
    setStatus(bounds.length ? "" : "No parties match. Try another date or search.");
    if (!hasInitialView && bounds.length) {
      hasInitialView = true;
      map.fitBounds(bounds, {padding:[55,55], maxZoom:14});
    }
  }

  map.on("zoomend", () => { if (hasInitialView) renderPartiesOnMap(); });

  // ---------------------------
  // Show device location (client-side only, never sent to the server)
  // ---------------------------
  let centeredOnce = false;
  let geolocationWatchId = null;

  function showUserLocation(lat, lng, accuracy) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    currentUserLayer.clearLayers();
    latestPosition = [lat,lng];
    document.querySelector(".map-locate").disabled = false;
    L.marker([lat, lng], {
      icon:L.divIcon({className:"user-location",html:'<span></span>',iconSize:[22,22],iconAnchor:[11,11]}),
      title:"Your location", alt:"Your location"
    }).addTo(currentUserLayer).bindPopup("Your location");

    if (Number.isFinite(accuracy) && accuracy > 0) {
      L.circle([lat, lng], { radius: accuracy, color:"#1a1040", weight:1, fillColor:"#4f3b9a", fillOpacity:0.08 }).addTo(currentUserLayer);
    }

    if (!centeredOnce) {
      if (!hasInitialView && !userNavigated) map.setView([lat, lng], 15);
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
          if (err.code === 1) {
            currentUserLayer.clearLayers();
            latestPosition = null;
            document.querySelector(".map-locate").disabled = true;
          }
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
