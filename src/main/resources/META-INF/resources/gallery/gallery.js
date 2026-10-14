// Gallery Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Get party ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('id');

  if (partyId) {
    loadGallery(partyId);
  } else {
    showError('No party ID provided');
  }

  // Set up back button
  const backBtn = document.querySelector('.back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', function () {
      window.history.back();
    });
  }

  // Set up modal close functionality
  setupModal();
});

async function loadGallery(partyId) {
  try {
    // Load party details for the title
    const partyResponse = await (window.authService?.apiCall || fetch)(`/api/parties/${encodeURIComponent(partyId)}`, {
      authRequired: false,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!partyResponse.ok) {
      throw new Error('Failed to fetch party details');
    }
    const party = await partyResponse.json();

    // Update party name
    const partyNameElement = document.getElementById('party-name');
    if (partyNameElement) {
      partyNameElement.textContent = party.title || 'Party Gallery';
    }

    // Load media for this party
    const mediaResponse = await (window.authService?.apiCall || fetch)(`/api/parties/${partyId}/media`, {
      authRequired: false
    });
    if (!mediaResponse.ok) {
      throw new Error('Failed to fetch media');
    }

    const mediaList = await mediaResponse.json();

    // Update photo count
    const photoCountElement = document.getElementById('photo-count');
    if (photoCountElement) {
      photoCountElement.textContent = `${mediaList.length} photo${mediaList.length !== 1 ? 's' : ''}`;
    }

    // Display the gallery
    displayGallery(mediaList);

  } catch (error) {
    console.error('Error loading gallery:', error);
    showError('Failed to load gallery');
  }
}

// Images are fetched with the access token (private-party media requires it,
// and an <img src> cannot send one), then shown through object URLs.
const mediaObjectUrls = new Map();

function loadMediaImage(mediaId) {
  if (!mediaObjectUrls.has(mediaId)) {
    const request = (window.authService?.apiCall || fetch)(`/api/media/${encodeURIComponent(mediaId)}`, {
      authRequired: false
    })
      .then(response => {
        if (!response.ok) throw new Error(`Image ${mediaId} unavailable (${response.status})`);
        return response.blob();
      })
      .then(blob => URL.createObjectURL(blob));
    // Drop failed requests so a later attempt can retry
    request.catch(() => mediaObjectUrls.delete(mediaId));
    mediaObjectUrls.set(mediaId, request);
  }
  return mediaObjectUrls.get(mediaId);
}

function revokeMediaImages() {
  mediaObjectUrls.forEach(request => request.then(url => URL.revokeObjectURL(url)).catch(() => {}));
  mediaObjectUrls.clear();
}

window.addEventListener('pagehide', revokeMediaImages);

function displayGallery(mediaList) {
  const galleryGrid = document.getElementById('galleryGrid');
  if (!galleryGrid) return;

  revokeMediaImages();

  // Clear loading message
  galleryGrid.innerHTML = '';

  if (mediaList.length === 0) {
    galleryGrid.innerHTML = '<div class="no-images">No photos available for this party yet.</div>';
    return;
  }

  // Create gallery items
  mediaList.forEach((media, index) => {
    const galleryItem = document.createElement('div');
    galleryItem.className = 'gallery-item';
    galleryItem.setAttribute('data-media-id', media.id);
    galleryItem.setAttribute('data-index', index);

    const img = document.createElement('img');
    img.alt = `Party photo ${index + 1}`;
    img.loading = 'lazy';

    const showUnavailable = () => {
      galleryItem.innerHTML = '<div style="width: 100%; height: 100%; background: var(--bg-secondary); display: flex; align-items: center; justify-content: center; color: rgba(255,255,255,0.5);">Image unavailable</div>';
    };
    img.onerror = showUnavailable;
    loadMediaImage(media.id)
      .then(url => { img.src = url; })
      .catch(error => {
        console.error('Error loading image:', error);
        showUnavailable();
      });

    galleryItem.appendChild(img);
    galleryItem.addEventListener('click', () => openModal(mediaList, index));
    galleryGrid.appendChild(galleryItem);
  });
}

function setupModal() {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <button class="modal-close" aria-label="Close">&times;</button>
      <button class="modal-nav modal-prev" aria-label="Previous image">&larr;</button>
      <img class="modal-image" src="" alt="">
      <button class="modal-nav modal-next" aria-label="Next image">&rarr;</button>
    </div>
  `;
  document.body.appendChild(modal);

  // Close modal events
  const closeBtn = modal.querySelector('.modal-close');
  const modalImage = modal.querySelector('.modal-image');

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('active')) return;

    switch (e.key) {
      case 'Escape':
        closeModal();
        break;
      case 'ArrowLeft':
        navigateModal(-1);
        break;
      case 'ArrowRight':
        navigateModal(1);
        break;
    }
  });

  // Navigation buttons
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');

  prevBtn.addEventListener('click', () => navigateModal(-1));
  nextBtn.addEventListener('click', () => navigateModal(1));
}

let currentMediaList = [];
let currentIndex = 0;

function openModal(mediaList, index) {
  currentMediaList = mediaList;
  currentIndex = index;

  const modal = document.querySelector('.image-modal');
  const modalImage = modal.querySelector('.modal-image');
  const prevBtn = modal.querySelector('.modal-prev');
  const nextBtn = modal.querySelector('.modal-next');

  showModalImage(modalImage, mediaList[index].id, index);

  // Show/hide navigation buttons
  prevBtn.style.display = mediaList.length > 1 ? 'block' : 'none';
  nextBtn.style.display = mediaList.length > 1 ? 'block' : 'none';

  modal.classList.add('active');

  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
}

function showModalImage(modalImage, mediaId, index) {
  modalImage.alt = `Party photo ${index + 1}`;
  modalImage.removeAttribute('src');
  loadMediaImage(mediaId)
    .then(url => {
      // Ignore late responses after the user moved on to another image
      if (currentMediaList[currentIndex]?.id === mediaId) modalImage.src = url;
    })
    .catch(() => { modalImage.alt = 'Image unavailable'; });
}

function closeModal() {
  const modal = document.querySelector('.image-modal');
  modal.classList.remove('active');

  // Restore body scroll
  document.body.style.overflow = '';
}

function navigateModal(direction) {
  if (currentMediaList.length <= 1) return;

  currentIndex = (currentIndex + direction + currentMediaList.length) % currentMediaList.length;

  const modal = document.querySelector('.image-modal');
  const modalImage = modal.querySelector('.modal-image');

  showModalImage(modalImage, currentMediaList[currentIndex].id, currentIndex);
}

function showError(message) {
  const galleryGrid = document.getElementById('galleryGrid');
  if (galleryGrid) {
    galleryGrid.innerHTML = `<div class="no-images">${message}</div>`;
  }

  const partyNameElement = document.getElementById('party-name');
  if (partyNameElement) {
    partyNameElement.textContent = 'Error';
  }

  const photoCountElement = document.getElementById('photo-count');
  if (photoCountElement) {
    photoCountElement.textContent = '0 photos';
  }
}
