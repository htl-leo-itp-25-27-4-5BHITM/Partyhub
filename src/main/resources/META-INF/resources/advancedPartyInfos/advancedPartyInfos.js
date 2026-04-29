// Advanced Party Infos Page JavaScript

document.addEventListener("DOMContentLoaded", function () {
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get("id");

  if (partyId) {
    loadPartyDetails(partyId);
  } else {
    const titleElement = document.querySelector(".party-title");

    if (titleElement) {
      titleElement.textContent = "Party Not Found";
    }

    console.error("No party ID provided");
  }

  setupInvitedSectionToggle();
  setupPhotosButton();
  setupBackButton();
  setupJoinPartyButton();
});

function getCurrentUserIdSafe() {
  try {
    if (typeof window.getCurrentUserId === "function") {
      const id = window.getCurrentUserId();

      if (id) {
        return id;
      }
    }

    return (
      sessionStorage.getItem("loggedInUserId") ||
      localStorage.getItem("loggedInUserId") ||
      null
    );
  } catch (error) {
    console.warn("Current User ID konnte nicht gelesen werden:", error);
    return null;
  }
}

function getPartyIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

function setupInvitedSectionToggle() {
  const invitedSection = document.querySelector(".invited-section");
  const toggle =
    invitedSection && invitedSection.querySelector(".invited-toggle");
  const list =
    invitedSection && invitedSection.querySelector(".invited-list");

  if (!toggle || !invitedSection) {
    return;
  }

  toggle.addEventListener("click", function () {
    invitedSection.classList.toggle("open");

    if (list) {
      list.setAttribute(
        "aria-hidden",
        invitedSection.classList.contains("open") ? "false" : "true"
      );
    }
  });
}

function setupPhotosButton() {
  const photosBtn = document.querySelector(".photos-btn");

  if (!photosBtn) {
    return;
  }

  photosBtn.addEventListener("click", function () {
    const partyId = getPartyIdFromUrl();

    if (partyId) {
      window.location.href = `/gallery/gallery.html?id=${encodeURIComponent(partyId)}`;
    }
  });
}

function setupBackButton() {
  const backBtn = document.querySelector(".back-btn");

  if (!backBtn) {
    return;
  }

  backBtn.addEventListener("click", function () {
    window.history.back();
  });
}

function setupJoinPartyButton() {
  const joinBtn = document.getElementById("joinPartyBtn");

  if (!joinBtn) {
    return;
  }

  joinBtn.addEventListener("click", function () {
    const partyId = getPartyIdFromUrl();

    if (partyId) {
      handleJoinParty(partyId);
    }
  });
}

async function loadPartyDetails(partyId) {
  const userId = getCurrentUserIdSafe();

  try {
    const url = userId
      ? `/api/parties/${encodeURIComponent(partyId)}?user=${encodeURIComponent(userId)}`
      : `/api/parties/${encodeURIComponent(partyId)}`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: userId
        ? {
            "X-User-Id": String(userId),
            "Cache-Control": "no-cache",
          }
        : { "Cache-Control": "no-cache" },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch party details. Status: ${response.status}`);
    }

    const party = await response.json();

    console.log("Geladene Party Details:", party);

    updatePartyDisplay(party);

    await checkAttendanceStatus(partyId);
  } catch (error) {
    console.error("Error loading party details:", error);

    const titleElement = document.querySelector(".party-title");

    if (titleElement) {
      titleElement.textContent = "Error loading party";
    }
  }
}

async function checkAttendanceStatus(partyId) {
  const userId = getCurrentUserIdSafe();

  if (!userId) {
    console.warn("No user logged in");

    const joinBtn = document.getElementById("joinPartyBtn");

    if (joinBtn) {
      joinBtn.style.display = "flex";
      joinBtn.classList.remove("joined");

      const text = joinBtn.querySelector(".btn-text");

      if (text) {
        text.textContent = "Join Party";
      }
    }

    return;
  }

  try {
    const response = await fetch(
      `/api/parties/${encodeURIComponent(partyId)}/join/status`,
      {
        headers: {
          "X-User-Id": String(userId),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to check attendance status. Status: ${response.status}`);
    }

    const status = await response.json();

    console.log("Join Status:", status);

    const isAttending =
      status.attending ??
      status.isAttending ??
      status.joined ??
      status.attends ??
      false;

    const attendeeCount =
      status.count ??
      status.attendeeCount ??
      status.attendees ??
      null;

    updateJoinButton(Boolean(isAttending), attendeeCount);
  } catch (error) {
    console.error("Error checking attendance status:", error);

    const joinBtn = document.getElementById("joinPartyBtn");

    if (joinBtn) {
      joinBtn.style.display = "flex";
    }
  }
}

function updateJoinButton(isAttending, attendeeCount) {
  const joinBtn = document.getElementById("joinPartyBtn");

  if (!joinBtn) {
    return;
  }

  joinBtn.style.display = "flex";

  const textElement = joinBtn.querySelector(".btn-text");
  const iconSvg = joinBtn.querySelector(".btn-icon svg");

  if (isAttending) {
    joinBtn.classList.add("joined");

    if (textElement) {
      textElement.textContent = "Leave Party";
    }

    if (iconSvg) {
      iconSvg.innerHTML =
        '<path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    }
  } else {
    joinBtn.classList.remove("joined");

    if (textElement) {
      textElement.textContent = "Join Party";
    }

    if (iconSvg) {
      iconSvg.innerHTML =
        '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>';
    }
  }

  if (attendeeCount !== null && attendeeCount !== undefined) {
    joinBtn.dataset.attendeeCount = String(attendeeCount);
  }
}

async function handleJoinParty(partyId) {
  const joinBtn = document.getElementById("joinPartyBtn");

  if (!joinBtn) {
    return;
  }

  const userId = getCurrentUserIdSafe();

  if (!userId) {
    alert("Bitte melde dich an");
    return;
  }

  const isCurrentlyJoined = joinBtn.classList.contains("joined");
  const method = isCurrentlyJoined ? "DELETE" : "POST";

  joinBtn.disabled = true;

  try {
    const response = await fetch(
      `/api/parties/${encodeURIComponent(partyId)}/join`,
      {
        method: method,
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": String(userId),
        },
      }
    );

    if (response.ok) {
      await checkAttendanceStatus(partyId);
    } else {
      const errorText = await response.text().catch(() => "");
      console.error("Failed to update party attendance:", response.status, errorText);

      alert("Teilnahme konnte nicht aktualisiert werden.");
    }
  } catch (error) {
    console.error("Error updating party attendance:", error);
    alert("Fehler beim Aktualisieren der Teilnahme.");
  } finally {
    joinBtn.disabled = false;
  }
}

async function updatePartyDisplay(party) {
  updatePartyTitle(party);
  await updateMediaCount(party);
  updateLocationDisplay(party);
  updateDateDisplay(party);
  updateDescription(party);
  updateWebsite(party);
  updateCategory(party);
  updateTimeDisplay(party);
  updateAgeRestriction(party);
  updateMaxAttendees(party);

  console.log("Party details updated:", party);
}

function updatePartyTitle(party) {
  const titleElement = document.querySelector(".party-title");

  if (!titleElement) {
    return;
  }

  const lockIcon = titleElement.querySelector(".lock");

  if (lockIcon) {
    lockIcon.remove();
  }

  titleElement.textContent = party.title || party.name || "Loading...";
}

async function updateMediaCount(party) {
  const mediaCountElement = document.getElementById("media-count");

  if (!mediaCountElement) {
    return;
  }

  if (!party.id) {
    mediaCountElement.textContent = "0 Fotos";
    return;
  }

  try {
    const mediaResponse = await fetch(`/api/parties/${encodeURIComponent(party.id)}/media`);

    if (mediaResponse.ok) {
      const media = await mediaResponse.json();
      const count = Array.isArray(media) ? media.length : 0;
      mediaCountElement.textContent = `${count} Fotos`;
    } else {
      mediaCountElement.textContent = "0 Fotos";
    }
  } catch (error) {
    console.error("Error fetching media count:", error);
    mediaCountElement.textContent = "0 Fotos";
  }
}

function getPartyAddress(party) {
  const address =
    party.location_address ||
    party.locationAddress ||
    party.location_adress ||
    party.locationAdress ||
    party.address ||
    party.adress ||
    party.place ||
    party.location?.name ||
    party.location?.address ||
    party.location?.adress ||
    party.location?.location_address ||
    party.location?.locationAddress ||
    party.location?.display_name ||
    party.location?.displayName ||
    "";

  if (typeof address === "string" && address.trim()) {
    return address.trim();
  }

  if (party.location && typeof party.location === "string") {
    return party.location;
  }

  return "";
}

function getPartyLatitude(party) {
  return (
    party.latitude ??
    party.lat ??
    party.location_latitude ??
    party.locationLatitude ??
    party.location?.latitude ??
    party.location?.lat ??
    null
  );
}

function getPartyLongitude(party) {
  return (
    party.longitude ??
    party.lon ??
    party.lng ??
    party.location_longitude ??
    party.locationLongitude ??
    party.location?.longitude ??
    party.location?.lon ??
    party.location?.lng ??
    null
  );
}

function updateLocationDisplay(party) {
  const locationElement = document.getElementById("location-display");

  if (!locationElement) {
    return;
  }

  const address = getPartyAddress(party);

  if (address) {
    locationElement.textContent = address;
    return;
  }

  const latitude = getPartyLatitude(party);
  const longitude = getPartyLongitude(party);

  if (latitude !== null && longitude !== null) {
    locationElement.textContent = `${Number(latitude).toFixed(4)}, ${Number(longitude).toFixed(4)}`;
    return;
  }

  locationElement.textContent = "Location TBA";
}

function updateDateDisplay(party) {
  const dateElement = document.getElementById("party-date");

  if (!dateElement) {
    return;
  }

  const startValue =
    party.time_start ||
    party.timeStart ||
    party.start_time ||
    party.startTime ||
    party.start ||
    null;

  if (!startValue) {
    dateElement.textContent = "TBA";
    return;
  }

  const partyDate = parseBackendDate(startValue);

  if (!partyDate || isNaN(partyDate.getTime())) {
    dateElement.textContent = "TBA";
    return;
  }

  dateElement.textContent = formatPartyDate(partyDate);
}

function updateDescription(party) {
  const descElement = document.getElementById("party-description");

  if (!descElement) {
    return;
  }

  descElement.textContent = party.description || "";
}

function updateWebsite(party) {
  const websiteElement = document.getElementById("party-website");

  if (!websiteElement) {
    return;
  }

  if (party.website) {
    websiteElement.href = party.website;
    websiteElement.textContent = party.website;
    websiteElement.style.display = "block";
  } else {
    websiteElement.style.display = "none";
  }
}

function updateCategory(party) {
  const categoryElement = document.getElementById("party-category");

  if (!categoryElement) {
    return;
  }

  categoryElement.textContent =
    party.category?.name ||
    party.categoryName ||
    party.theme ||
    "-";
}

function updateTimeDisplay(party) {
  const partyTimeElement = document.getElementById("party-time");

  if (!partyTimeElement) {
    return;
  }

  const startValue =
    party.time_start ||
    party.timeStart ||
    party.start_time ||
    party.startTime ||
    party.start ||
    null;

  const endValue =
    party.time_end ||
    party.timeEnd ||
    party.end_time ||
    party.endTime ||
    party.end ||
    null;

  if (!startValue) {
    partyTimeElement.textContent = "TBA";
    return;
  }

  const startTime = parseBackendDate(startValue);
  const endTime = endValue ? parseBackendDate(endValue) : null;

  if (!startTime || isNaN(startTime.getTime())) {
    partyTimeElement.textContent = "TBA";
    return;
  }

  partyTimeElement.textContent = formatTimeSpan(startTime, endTime);
}

function updateAgeRestriction(party) {
  const ageElement = document.getElementById("age-restriction");

  if (!ageElement) {
    return;
  }

  const minAge = party.min_age ?? party.minAge ?? null;
  const maxAge = party.max_age ?? party.maxAge ?? null;

  let ageText = "All ages";

  if (minAge || maxAge) {
    if (minAge && maxAge) {
      ageText = `${minAge} - ${maxAge} years`;
    } else if (minAge) {
      ageText = `${minAge}+ years`;
    } else if (maxAge) {
      ageText = `Up to ${maxAge} years`;
    }
  }

  ageElement.textContent = ageText;
}

function updateMaxAttendees(party) {
  const maxAttendeesElement = document.getElementById("max-attendees");

  if (!maxAttendeesElement) {
    return;
  }

  const maxPeople =
    party.max_people ??
    party.maxPeople ??
    party.max_attendees ??
    party.maxAttendees ??
    null;

  if (maxPeople) {
    maxAttendeesElement.textContent = String(maxPeople);
  } else {
    maxAttendeesElement.textContent = "Unlimited";
  }
}

// -----------------------------
// Date and time helper functions
// -----------------------------

function parseBackendDate(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const normalDate = new Date(value);

    if (!isNaN(normalDate.getTime())) {
      return normalDate;
    }

    const match = value.match(
      /^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})$/
    );

    if (match) {
      const [, day, month, year, hour, minute] = match;

      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute)
      );
    }
  }

  return null;
}

function formatPartyDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const partyDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  if (isSameDay(partyDate, today)) {
    return "Today";
  }

  if (isSameDay(partyDate, tomorrow)) {
    return "Tomorrow";
  }

  if (isSameDay(partyDate, yesterday)) {
    return "Yesterday";
  }

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "short",
  });

  const dateStr = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${dayName}, ${dateStr}`;
}

function formatPartyTime(date) {
  return date.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMinutes = Math.abs(diffMs) / (1000 * 60);

  if (diffMs > 0) {
    if (diffMinutes < 60) {
      return `in ${Math.ceil(diffMinutes)} min`;
    }

    if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);

      if (hours === 0) {
        return `in ${minutes} min`;
      }

      if (minutes === 0) {
        return `in ${hours}h`;
      }

      return `in ${hours}h ${minutes}m`;
    }

    if (diffHours < 48) {
      return "tomorrow";
    }

    const days = Math.floor(diffHours / 24);
    return `in ${days} days`;
  }

  if (diffMinutes < 60) {
    return `${Math.ceil(diffMinutes)} min ago`;
  }

  if (Math.abs(diffHours) < 24) {
    const hours = Math.floor(Math.abs(diffHours));
    const minutes = Math.floor((Math.abs(diffHours) - hours) * 60);

    if (hours === 0) {
      return `${minutes} min ago`;
    }

    if (minutes === 0) {
      return `${hours}h ago`;
    }

    return `${hours}h ${minutes}m ago`;
  }

  const days = Math.floor(Math.abs(diffHours) / 24);
  return `${days} days ago`;
}

function formatTimeSpan(startDate, endDate) {
  const now = new Date();
  const dateStr = formatPartyDate(startDate);
  const startTimeStr = formatPartyTime(startDate);

  let timeRange = startTimeStr;

  if (endDate && !isNaN(endDate.getTime())) {
    const endTimeStr = formatPartyTime(endDate);
    timeRange = `${startTimeStr} to ${endTimeStr}`;
  } else {
    timeRange = `${startTimeStr} onwards`;
  }

  let contextInfo = "";

  if (startDate > now) {
    const relative = formatRelativeTime(startDate);
    contextInfo = ` - ${relative}`;
  } else if (startDate <= now && (!endDate || endDate > now)) {
    const relative = formatRelativeTime(startDate);
    contextInfo = ` - started ${relative}`;
  }

  return `${dateStr} from ${timeRange}${contextInfo}`;
}

function calculateDuration(startDate, endDate) {
  const diffMs = endDate - startDate;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMinutes = diffMs / (1000 * 60);

  if (diffHours >= 1) {
    const hours = Math.floor(diffHours);
    const minutes = Math.floor((diffHours - hours) * 60);

    if (minutes === 0) {
      return `${hours}h`;
    }

    return `${hours}h ${minutes}m`;
  }

  return `${Math.floor(diffMinutes)}m`;
}

function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
