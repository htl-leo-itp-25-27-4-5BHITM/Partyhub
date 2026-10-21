// Gallery Page JavaScript
document.addEventListener("DOMContentLoaded", function () {
  // Get party ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const partyId = urlParams.get('id');

  if (partyId) {
    currentPartyId = partyId;
    loadGallery(partyId);
    setupUpload(partyId);
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

let currentPartyId = null;

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
    if (media.canDelete) {
      galleryItem.appendChild(createDeleteButton(media.id));
    }
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
      <button class="media-delete-btn modal-delete" aria-label="Delete photo" hidden>${TRASH_ICON}</button>
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

  modal.querySelector('.modal-delete').addEventListener('click', () => {
    const media = currentMediaList[currentIndex];
    if (media) deleteMedia(media.id);
  });
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
  const deleteBtn = document.querySelector('.image-modal .modal-delete');
  if (deleteBtn) deleteBtn.hidden = !currentMediaList[index]?.canDelete;
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

// ---------- Upload ----------

const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MiB, same limit as the server
const MAX_UPLOAD_FILES = 20;

async function setupUpload(partyId) {
  const addBtn = document.getElementById('addPhotosBtn');
  const loginBtn = document.getElementById('loginToAddBtn');
  const input = document.getElementById('photoInput');
  if (!addBtn || !loginBtn || !input || !window.authService) return;

  try {
    await window.authService.init({ requireLogin: false });
  } catch (error) {
    console.error('Auth init failed:', error);
  }

  if (window.authService.isLoggedIn()) {
    addBtn.hidden = false;
  } else {
    loginBtn.hidden = false;
  }

  loginBtn.addEventListener('click', () => {
    window.authService.login({ redirectTo: window.location.pathname + window.location.search });
  });
  addBtn.addEventListener('click', () => input.click());
  input.addEventListener('change', async () => {
    const files = Array.from(input.files || []);
    // Reset so selecting the same file again still fires 'change'
    input.value = '';
    if (files.length > 0) await uploadPhotos(partyId, files);
  });
}

/** The reason a file can't be uploaded, or null if it passes the client-side checks. */
function uploadProblem(file) {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return 'only JPEG, PNG, GIF or WebP images are allowed';
  if (file.size === 0) return 'the file is empty';
  if (file.size > MAX_UPLOAD_BYTES) return `${(file.size / 1048576).toFixed(1)} MB is larger than 5 MB`;
  return null;
}

async function uploadPhotos(partyId, files) {
  if (files.length > MAX_UPLOAD_FILES) {
    showStatus(`You can upload at most ${MAX_UPLOAD_FILES} photos at once (you selected ${files.length}).`, { error: true });
    return;
  }
  const rejected = files
    .map(file => ({ name: file.name, reason: uploadProblem(file) }))
    .filter(item => item.reason);
  if (rejected.length > 0) {
    showStatus('Nothing was uploaded. Please fix these files:', { error: true, items: rejected });
    return;
  }

  const addBtn = document.getElementById('addPhotosBtn');
  addBtn.disabled = true;
  const failed = [];
  let uploaded = 0;

  // One request per photo keeps every request below the server and proxy body limits
  for (let i = 0; i < files.length; i++) {
    addBtn.textContent = `Uploading ${i + 1} of ${files.length}…`;
    showStatus(`Uploading ${i + 1} of ${files.length}…`);
    const formData = new FormData();
    formData.append('file', files[i], files[i].name);
    try {
      const response = await window.authService.apiCall(
        `/api/parties/${encodeURIComponent(partyId)}/media/upload`,
        { method: 'POST', body: formData }
      );
      if (response.ok) {
        uploaded++;
      } else {
        failed.push({ name: files[i].name, reason: await errorMessage(response) });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      failed.push({ name: files[i].name, reason: 'network error' });
    }
  }

  addBtn.disabled = false;
  addBtn.textContent = 'Add photos';
  await loadGallery(partyId);

  const done = `${uploaded} photo${uploaded === 1 ? '' : 's'} uploaded.`;
  if (failed.length > 0) {
    showStatus(`${done} ${failed.length} could not be uploaded:`, { error: true, items: failed });
  } else {
    showStatus(done);
  }
}

// ---------- Delete ----------

const TRASH_ICON = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function createDeleteButton(mediaId) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'media-delete-btn';
  button.setAttribute('aria-label', 'Delete photo');
  button.innerHTML = TRASH_ICON;
  button.addEventListener('click', event => {
    event.stopPropagation(); // don't open the photo viewer
    deleteMedia(mediaId);
  });
  return button;
}

async function deleteMedia(mediaId) {
  if (!window.confirm('Delete this photo from the party gallery? This cannot be undone.')) return;
  try {
    const response = await window.authService.apiCall(`/api/media/${encodeURIComponent(mediaId)}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      showStatus(`The photo could not be deleted: ${await errorMessage(response)}`, { error: true });
      return;
    }
  } catch (error) {
    console.error('Delete failed:', error);
    showStatus('The photo could not be deleted: network error', { error: true });
    return;
  }
  closeModal();
  await loadGallery(currentPartyId);
  showStatus('Photo deleted.');
}

// ---------- Status line ----------

async function errorMessage(response) {
  try {
    const body = await response.json();
    if (body && typeof body.error === 'string') return body.error;
  } catch (_) {
    // not JSON, fall back to the status code
  }
  switch (response.status) {
    case 401: return 'please log in again';
    case 403: return 'you are not allowed to do this';
    case 404: return 'not found';
    case 413: return 'the file is too large';
    default: return `server error (${response.status})`;
  }
}

/** Shows a message (and optional per-file reasons) under the header; text only, never HTML. */
function showStatus(message, { error = false, items = [] } = {}) {
  const status = document.getElementById('galleryStatus');
  if (!status) return;
  status.replaceChildren(document.createTextNode(message));
  if (items.length > 0) {
    const list = document.createElement('ul');
    items.forEach(item => {
      const entry = document.createElement('li');
      entry.textContent = `${item.name}: ${item.reason}`;
      list.appendChild(entry);
    });
    status.appendChild(list);
  }
  status.classList.toggle('is-error', error);
  status.hidden = false;
}
