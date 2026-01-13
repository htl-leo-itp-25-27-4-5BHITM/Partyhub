document.addEventListener('DOMContentLoaded', function () {
    const img = document.getElementById('profileImg');
    const displayNameElement = document.getElementById('displayName');
    const distinctNameElement = document.getElementById('distinctName');

    if (!img) return;

    // 1. Handle aus der URL holen oder current user verwenden
    const urlParams = new URLSearchParams(window.location.search);
    const userHandle = urlParams.get('handle');
    const userId = urlParams.get('id');

    // 2. User data laden
    if (userHandle) {
        loadUserDataByHandle(userHandle);
    } else if (userId) {
        loadUserDataById(userId);
    } else {
        // Default to current user
        loadUserDataById(getCurrentUserId());
    }

    function getCurrentUserId() {
        // TODO: Implement based on your authentication system
        // This could be from localStorage, session, JWT token, etc.
        // For now, return a hardcoded ID for testing
        return 1; // Replace with actual user ID retrieval
    }

    function loadUserDataByHandle(userHandle) {
        const userApiUrl = `/api/users/handle/${userHandle}`;

        console.log("Loading user data from:", userApiUrl);

        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                // Fallback: show error state
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function loadUserDataById(userId) {
        const userApiUrl = `/api/users/${userId}`;

        console.log("Loading user data from:", userApiUrl);

        fetch(userApiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(userData => {
                console.log("User data loaded:", userData);
                updateUserProfile(userData);
            })
            .catch(error => {
                console.error("Failed to load user data:", error);
                // Fallback: show error state
                if (displayNameElement) displayNameElement.textContent = "User not found";
                if (distinctNameElement) distinctNameElement.textContent = "@unknown";
            });
    }

    function updateUserProfile(user) {
        // Update profile picture
        const finalPath = `/api/users/${user.id}/profile-picture`;
        console.log("Loading profile picture from: " + finalPath);
        img.src = finalPath;

        // Update display name
        if (displayNameElement && user.displayName) {
            displayNameElement.textContent = user.displayName;
        }

        // Update distinct name/handle
        if (distinctNameElement && user.distinctName) {
            distinctNameElement.textContent = `@${user.distinctName}`;
        }

        // Load and update follower/following/media counts
        loadUserStats(user.id);

        // Error handling for profile picture
        img.onerror = function() {
            console.error("Profile picture not found:", this.src);
            // Fallback to default image
            this.src = "/images/default_profile-picture.jpg";
        };
    }

    function loadUserStats(userId) {
        // Load follower count
        fetch(`/api/users/${userId}/followers/count`)
            .then(response => response.json())
            .then(data => {
                const followersElement = document.getElementById('followersCount');
                if (followersElement) {
                    followersElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading follower count:', error);
                const followersElement = document.getElementById('followersCount');
                if (followersElement) {
                    followersElement.setAttribute('data-count', '0');
                }
            });

        // Load following count
        fetch(`/api/users/${userId}/following/count`)
            .then(response => response.json())
            .then(data => {
                const followingElement = document.getElementById('followingCount');
                if (followingElement) {
                    followingElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading following count:', error);
                const followingElement = document.getElementById('followingCount');
                if (followingElement) {
                    followingElement.setAttribute('data-count', '0');
                }
            });

        // Load media count (posts)
        fetch(`/api/users/${userId}/media/count`)
            .then(response => response.json())
            .then(data => {
                const postsElement = document.getElementById('postsCount');
                if (postsElement) {
                    postsElement.setAttribute('data-count', formatCount(data.count));
                    // Don't set textContent - CSS handles display via ::before pseudo-element
                }
            })
            .catch(error => {
                console.error('Error loading media count:', error);
                const postsElement = document.getElementById('postsCount');
                if (postsElement) {
                    postsElement.setAttribute('data-count', '0');
                }
            });
    }

    function formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        } else {
            return count.toString();
        }
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const searchResults = document.getElementById('searchResults');
    let searchTimeout;

    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();

            // Clear previous timeout
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }

            // If query is empty, hide dropdown
            if (query === '') {
                hideDropdown();
                return;
            }

            // Set new timeout for search (1 second delay)
            searchTimeout = setTimeout(function() {
                performSearch(query);
            }, 1000);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
                hideDropdown();
            }
        });

        // Hide dropdown on escape key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideDropdown();
                searchInput.blur();
            }
        });
    }

    function performSearch(query) {
        const searchUrl = `/api/users/all/search?name=${encodeURIComponent(query)}`;

        console.log('Performing search with URL:', searchUrl);

        fetch(searchUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Search results:', data);
                displaySearchResults(data);
            })
            .catch(error => {
                console.error('Search failed:', error);
                hideDropdown();
            });
    }

    function displaySearchResults(results) {
        if (!results || results.length === 0) {
            hideDropdown();
            return;
        }

        // Clear previous results
        searchResults.innerHTML = '';

        // Create result items
        results.forEach(user => {
            const resultItem = document.createElement('div');
            resultItem.className = 'search-result-item';
            resultItem.setAttribute('data-user-handle', user.distinctName);

            resultItem.innerHTML = `
                <img src="/api/users/${user.id}/profile-picture" alt="${user.displayName}" class="search-result-avatar" onerror="this.src='/images/default_profile-picture.jpg'">
                <div class="search-result-info">
                    <div class="search-result-name">${user.displayName || user.distinctName}</div>
                    <div class="search-result-distinct-name">@${user.distinctName}</div>
                </div>
            `;

            // Add click handler to navigate to user profile
            resultItem.addEventListener('click', function() {
                const userHandle = this.getAttribute('data-user-handle');
                window.location.href = `/profile/profile.html?handle=${userHandle}`;
            });

            searchResults.appendChild(resultItem);
        });

        // Show dropdown
        searchDropdown.classList.remove('hidden');
    }

    function hideDropdown() {
        searchDropdown.classList.add('hidden');
        searchResults.innerHTML = '';
    }

    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', function() {
                const tabName = this.id;

                // Remove active class from all buttons
                tabButtons.forEach(btn => btn.classList.remove('active'));

                // Add active class to clicked button
                this.classList.add('active');

                // Hide all tab sections
                tabSections.forEach(section => section.style.display = 'none');

                // Show the corresponding tab section
                const targetSection = document.getElementById('tabContent' + tabName.charAt(3).toUpperCase() + tabName.slice(4));
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });
    }
});