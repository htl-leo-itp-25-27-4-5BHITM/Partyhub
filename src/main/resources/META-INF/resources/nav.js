// Global Navigation Script - Active page highlighting
function highlightActiveNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('.nav-btn');
    const currentPath = window.location.pathname.toLowerCase();

    links.forEach(a => {
        const icon = a.querySelector('.nav-icon');
        if (!icon) return;

        // Reset all to pink
        icon.classList.remove('icon--green');
        icon.classList.add('icon--pink');
        a.classList.remove('active');
        a.removeAttribute('aria-current');

        // Get the href and check if it matches current page
        const href = (a.getAttribute('href') || '').toLowerCase();

        // Check for specific page matches
        if (href.includes('index') && (currentPath === '/' || currentPath.includes('index'))) {
            // Home page (index.html)
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('listpartys') && currentPath.includes('listpartys')) {
            // List Parties page
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('notifications') && currentPath.includes('notifications')) {
            // Notifications page
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('profile') && currentPath.includes('profile')) {
            // Profile page
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
    });
}

// Initialize navigation highlighting when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightActiveNav);
} else {
    highlightActiveNav();
}