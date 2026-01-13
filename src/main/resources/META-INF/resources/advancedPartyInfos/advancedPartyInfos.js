// Advanced Party Infos Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Get party ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('id');

  if (partyId) {
    loadPartyDetails(partyId);
  } else {
    // If no party ID provided, show error or redirect
    document.querySelector('.party-title').textContent = 'Party Not Found';
    console.error('No party ID provided');
  }

  // Set up invited section toggle
  const invitedSection = document.querySelector(".invited-section");
  const toggle =
    invitedSection && invitedSection.querySelector(".invited-toggle");
  const list = invitedSection && invitedSection.querySelector(".invited-list");

  if (toggle && invitedSection) {
    toggle.addEventListener("click", function () {
      invitedSection.classList.toggle("open");
      if (list)
        list.setAttribute(
          "aria-hidden",
          invitedSection.classList.contains("open") ? "false" : "true"
        );
    });
  }

  // Set up photos button
  const photosBtn = document.querySelector(".photos-btn");
  if (photosBtn) {
    photosBtn.addEventListener("click", function () {
      // Navigate to gallery page with party ID
      const partyId = urlParams.get('id');
      if (partyId) {
        window.location.href = `/gallery/gallery.html?id=${partyId}`;
      }
    });
  }

  // Set up back button
  const backBtn = document.querySelector(".back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      window.history.back();
    });
  }
});

async function loadPartyDetails(partyId) {
  try {
    const response = await fetch(`/api/party/${partyId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch party details');
    }

    const party = await response.json();
    updatePartyDisplay(party);

  } catch (error) {
    console.error('Error loading party details:', error);
    document.querySelector('.party-title').textContent = 'Error loading party';
  }
}

async function updatePartyDisplay(party) {
  // Update title
  const titleElement = document.querySelector('.party-title');
  if (titleElement) {
    // Remove any existing lock icon
    const lockIcon = titleElement.querySelector('.lock');
    if (lockIcon) lockIcon.remove();

    titleElement.childNodes[0].textContent = party.title || 'Untitled Party';
  }

  // Update meta information
  const mediaCountElement = document.getElementById('media-count');
  const locationElement = document.getElementById('location-display');
  const dateElement = document.getElementById('party-date');

  // Get media and display previews
  if (mediaCountElement) {
    try {
      const mediaResponse = await fetch(`/api/party/${party.id}/media`);
      if (mediaResponse.ok) {
        const media = await mediaResponse.json();
        mediaCountElement.textContent = `${media.length} Fotos`;

        // Show photo previews if there are photos
        if (media.length > 0) {
          displayPhotoPreviews(media, party.id);
        }
      } else {
        mediaCountElement.textContent = '0 Fotos';
      }
    } catch (error) {
      console.error('Error fetching media count:', error);
      mediaCountElement.textContent = '0 Fotos';
    }
  }

  // Location - since location is coordinates, show a placeholder or coordinates
  if (locationElement) {
    if (party.location && party.location.latitude && party.location.longitude) {
      // For now, show coordinates. In a real app, you'd reverse geocode to get address
      locationElement.textContent = `${party.location.latitude.toFixed(4)}, ${party.location.longitude.toFixed(4)}`;
    } else {
      locationElement.textContent = 'Location TBA';
    }
  }

  // Date with improved formatting
  if (dateElement && party.time_start) {
    const partyDate = new Date(party.time_start);
    const formattedDate = formatPartyDate(partyDate);
    dateElement.textContent = formattedDate;
  }

  // Update description
  const descElement = document.getElementById('party-description');
  if (descElement) {
    descElement.textContent = party.description || 'No description available.';
  }

  // Update website
  const websiteElement = document.getElementById('party-website');
  if (websiteElement && party.website) {
    websiteElement.href = party.website;
    websiteElement.textContent = party.website;
    websiteElement.style.display = 'block';
  } else if (websiteElement) {
    websiteElement.style.display = 'none';
  }

  // Update category
  const categoryElement = document.getElementById('party-category');
  if (categoryElement) {
    categoryElement.textContent = party.category ? party.category.name : 'General';
  }

  // Update time information with time span formatting
  const partyTimeElement = document.getElementById('party-time');

  if (party.time_start) {
    const startTime = new Date(party.time_start);
    const endTime = party.time_end ? new Date(party.time_end) : null;
    const timeSpanStr = formatTimeSpan(startTime, endTime);

    if (partyTimeElement) {
      partyTimeElement.textContent = timeSpanStr;
    }
  } else {
    if (partyTimeElement) partyTimeElement.textContent = 'TBA';
  }

  // Update age restrictions
  const ageElement = document.getElementById('age-restriction');
  if (ageElement) {
    let ageText = 'All ages';
    if (party.min_age || party.max_age) {
      if (party.min_age && party.max_age) {
        ageText = `${party.min_age} - ${party.max_age} years`;
      } else if (party.min_age) {
        ageText = `${party.min_age}+ years`;
      } else if (party.max_age) {
        ageText = `Up to ${party.max_age} years`;
      }
    }
    ageElement.textContent = ageText;
  }

  // Update max attendees
  const maxAttendeesElement = document.getElementById('max-attendees');
  if (maxAttendeesElement) {
    if (party.max_people) {
      maxAttendeesElement.textContent = party.max_people.toString();
    } else {
      maxAttendeesElement.textContent = 'Unlimited';
    }
  }

  console.log('Party details updated:', party);
}

function displayPhotoPreviews(media, partyId) {
  const previewContainer = document.getElementById('photoPreviews');
  const previewGrid = document.getElementById('previewGrid');

  if (!previewContainer || !previewGrid) return;

  // Show up to 6 photos as previews for better visibility
  const previewCount = Math.min(media.length, 6);
  const previewMedia = media.slice(0, previewCount);

  // Clear existing content
  previewGrid.innerHTML = '';

  // Create preview images
  previewMedia.forEach((item, index) => {
    const previewItem = document.createElement('div');
    previewItem.className = 'preview-item';
    previewItem.onclick = () => {
      // Navigate to full gallery when clicking a preview
      window.location.href = `/gallery/gallery.html?id=${partyId}`;
    };

    if (item.url && item.url.includes('http')) {
      const img = document.createElement('img');
      img.className = 'preview-image';
      img.src = item.url;
      img.alt = `Party photo preview ${index + 1}`;
      img.loading = 'lazy';
      img.onerror = () => {
        // Fallback for broken images - simple colored background
        previewItem.innerHTML = '<div class="preview-placeholder"></div>';
      };
      previewItem.appendChild(img);
    } else {
      // Placeholder for items without proper URLs - simple colored background
      previewItem.innerHTML = '<div class="preview-placeholder"></div>';
    }

    previewGrid.appendChild(previewItem);
  });

  // Show the preview container
  previewContainer.style.display = 'block';
}

// Helper functions for improved time formatting

function formatPartyDate(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const partyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (isSameDay(partyDate, today)) {
    return 'Today';
  } else if (isSameDay(partyDate, tomorrow)) {
    return 'Tomorrow';
  } else if (isSameDay(partyDate, yesterday)) {
    return 'Yesterday';
  } else {
    // Show day name and date
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${dayName}, ${dateStr}`;
  }
}

function formatPartyTime(date) {
  return date.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

function formatRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffMinutes = Math.abs(diffMs) / (1000 * 60);

  // Future events
  if (diffMs > 0) {
    if (diffMinutes < 60) {
      return `in ${Math.ceil(diffMinutes)} min`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = Math.floor((diffHours - hours) * 60);
      if (hours === 0) {
        return `in ${minutes} min`;
      } else if (minutes === 0) {
        return `in ${hours}h`;
      } else {
        return `in ${hours}h ${minutes}m`;
      }
    } else if (diffHours < 48) {
      return 'tomorrow';
    } else {
      const days = Math.floor(diffHours / 24);
      return `in ${days} days`;
    }
  }
  // Past events
  else {
    if (diffMinutes < 60) {
      return `${Math.ceil(diffMinutes)} min ago`;
    } else if (Math.abs(diffHours) < 24) {
      const hours = Math.floor(Math.abs(diffHours));
      const minutes = Math.floor((Math.abs(diffHours) - hours) * 60);
      if (hours === 0) {
        return `${minutes} min ago`;
      } else if (minutes === 0) {
        return `${hours}h ago`;
      } else {
        return `${hours}h ${minutes}m ago`;
      }
    } else {
      const days = Math.floor(Math.abs(diffHours) / 24);
      return `${days} days ago`;
    }
  }
}

function formatTimeSpan(startDate, endDate) {
  const now = new Date();
  const dateStr = formatPartyDate(startDate);
  const startTimeStr = formatPartyTime(startDate);

  let timeRange = startTimeStr;

  // Add end time if available
  if (endDate) {
    const endTimeStr = formatPartyTime(endDate);
    timeRange = `${startTimeStr} to ${endTimeStr}`;
  } else {
    timeRange = `${startTimeStr} onwards`;
  }

  // Add contextual information based on current time
  let contextInfo = '';

  // If party hasn't started yet
  if (startDate > now) {
    const relative = formatRelativeTime(startDate);
    contextInfo = ` - ${relative}`;
  }
  // If party is ongoing
  else if (startDate <= now && (!endDate || endDate > now)) {
    const relative = formatRelativeTime(startDate);
    contextInfo = ` - started ${relative}`;
  }
  // For past events, no additional context needed

  // Combine date and time range with context
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
    } else {
      return `${hours}h ${minutes}m`;
    }
  } else {
    return `${Math.floor(diffMinutes)}m`;
  }
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}
