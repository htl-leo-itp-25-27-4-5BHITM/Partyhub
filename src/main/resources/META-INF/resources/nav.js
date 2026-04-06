function highlightActiveNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    const links = nav.querySelectorAll('.nav-btn');
    const currentPath = window.location.pathname.toLowerCase();

    links.forEach(a => {
        const icon = a.querySelector('.nav-icon');
        if (!icon) return;

        icon.classList.remove('icon--green');
        icon.classList.add('icon--pink');
        a.classList.remove('active');
        a.removeAttribute('aria-current');

        const href = (a.getAttribute('href') || '').toLowerCase();
        if (href.includes('index') && (currentPath === '/' || currentPath.includes('index'))) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('listpartys') && currentPath.includes('listpartys')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('notifications') && currentPath.includes('notifications')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        } else if (href.includes('profile') && currentPath.includes('profile')) {
            icon.classList.remove('icon--pink');
            icon.classList.add('icon--green');
            a.classList.add('active');
            a.setAttribute('aria-current', 'page');
        }
    });
}

/**
 * Build authentication-aware navigation
 */
function buildAuthNav() {
    const nav = document.querySelector('.bottom-nav');
    if (!nav) return;

    // Wait for auth service to load
    if (!window.authService) {
        setTimeout(buildAuthNav, 100);
        return;
    }

    const isLoggedIn = window.authService.isLoggedIn();

    // Find or create auth button container
    let authContainer = document.querySelector('.auth-buttons');
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.className = 'auth-buttons';
        authContainer.style.cssText = `
            padding: 10px 20px;
            border-top: 1px solid #e0e0e0;
            background: #f9f9f9;
            text-align: center;
        `;
        nav.parentNode.insertBefore(authContainer, nav.nextSibling);
    }

    authContainer.innerHTML = '';

    if (isLoggedIn) {
        const userInfo = window.authService.getUserInfo();
        const username = userInfo ? userInfo.username || userInfo.sub : 'User';

        const userSpan = document.createElement('span');
        userSpan.style.cssText = 'display: block; font-size: 12px; color: #666; margin-bottom: 8px;';
        userSpan.textContent = `Logged in as: ${username}`;
        authContainer.appendChild(userSpan);

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = 'Logout';
        logoutBtn.className = 'btn-logout';
        logoutBtn.style.cssText = `
            padding: 8px 16px;
            background: #ff6b6b;
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            width: 100%;
            font-weight: 500;
        `;
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                window.authService.logout();
            }
        });
        authContainer.appendChild(logoutBtn);
    } else {
        const loginBtn = document.createElement('a');
        loginBtn.href = '/register_login/login/login.html';
        loginBtn.textContent = 'Login';
        loginBtn.className = 'btn-login';
        loginBtn.style.cssText = `
            display: inline-block;
            padding: 8px 16px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            cursor: pointer;
            text-decoration: none;
            font-weight: 500;
            width: 100%;
            box-sizing: border-box;
        `;
        authContainer.appendChild(loginBtn);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        highlightActiveNav();
        buildAuthNav();
    });
} else {
    highlightActiveNav();
    buildAuthNav();
}