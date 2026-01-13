// Gallery Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
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
        backBtn.addEventListener('click', function() {
            window.history.back();
        });
    }
});

async function loadGallery(partyId) {
    const grid = document.getElementById('galleryGrid');

    try {
        // Load party details for header
        const partyResponse = await fetch(`/api/party/${partyId}`);
        if (!partyResponse.ok) {
            throw new Error('Failed to fetch party details');
        }
        const party = await partyResponse.json();
        updateGalleryHeader(party);

        // Load media
        const mediaResponse = await fetch(`/api/party/${partyId}/media`);
        if (!mediaResponse.ok) {
            throw new Error('Failed to fetch media');
        }
        const media = await mediaResponse.json();

        if (media.length === 0) {
            grid.innerHTML = '<div class="loading">No photos available for this party.</div>';
            return;
        }

        // Clear loading message and create gallery
        grid.innerHTML = '';
        media.forEach((item, index) => {
            const galleryItem = createGalleryItem(item, index, media);
            grid.appendChild(galleryItem);
        });

        // Store media data globally for modal navigation
        window.galleryMedia = media;

    } catch (error) {
        console.error('Error loading gallery:', error);
        grid.innerHTML = '<div class="loading">Error loading gallery. Please try again.</div>';
    }
}

function updateGalleryHeader(party) {
    const partyNameElement = document.getElementById('party-name');
    const photoCountElement = document.getElementById('photo-count');

    if (partyNameElement) {
        partyNameElement.textContent = party.title || 'Untitled Party';
    }

    // Photo count will be updated after media is loaded
}

function createGalleryItem(mediaItem, index, allMedia) {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.onclick = () => openModal(index);

    // For now, since we only have URLs, we'll create image elements
    // In a real implementation, you might have different media types
    if (mediaItem.url && mediaItem.url.includes('http')) {
        const img = document.createElement('img');
        img.className = 'gallery-image';
        img.src = mediaItem.url;
        img.alt = `Party photo ${index + 1}`;
        img.loading = 'lazy';
        img.onerror = () => {
            // Fallback for broken images - simple colored background
            item.innerHTML = '<div class="gallery-placeholder"></div>';
        };
        item.appendChild(img);
    } else {
        // Placeholder for items without proper URLs - simple colored background
        item.innerHTML = '<div class="gallery-placeholder"></div>';
    }

    return item;
}

// Modal functionality
function openModal(index) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close" onclick="closeModal()">×</button>
            <button class="modal-nav modal-prev" onclick="navigateModal(-1)">‹</button>
            <img class="modal-image" src="" alt="" />
            <button class="modal-nav modal-next" onclick="navigateModal(1)">›</button>
        </div>
    `;

    document.body.appendChild(modal);

    // Show modal with animation
    setTimeout(() => modal.classList.add('active'), 10);

    // Load initial image
    navigateModal(0, index);

    // Close modal on background click
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', handleKeyNavigation);
}

function closeModal() {
    const modal = document.querySelector('.image-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
        document.removeEventListener('keydown', handleKeyNavigation);
    }
}

function navigateModal(direction, specificIndex = null) {
    const media = window.galleryMedia;
    if (!media || media.length === 0) return;

    // Calculate new index
    let newIndex;
    if (specificIndex !== null) {
        newIndex = specificIndex;
    } else {
        const currentSrc = document.querySelector('.modal-image').src;
        const currentIndex = media.findIndex(item => item.url === currentSrc);
        newIndex = (currentIndex + direction + media.length) % media.length;
    }

    const mediaItem = media[newIndex];
    const modalImage = document.querySelector('.modal-image');

    if (modalImage && mediaItem.url) {
        modalImage.src = mediaItem.url;
        modalImage.alt = `Party photo ${newIndex + 1}`;
    }
}

function handleKeyNavigation(e) {
    if (e.key === 'Escape') {
        closeModal();
    } else if (e.key === 'ArrowLeft') {
        navigateModal(-1);
    } else if (e.key === 'ArrowRight') {
        navigateModal(1);
    }
}

// Utility function for errors
function showError(message) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = `<div class="loading">${message}</div>`;
}