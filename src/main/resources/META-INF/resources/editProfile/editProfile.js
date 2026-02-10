let selectedProfilePictureFile = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeEditPage();
});

function setupBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (!backBtn) return;

    backBtn.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const redirect = urlParams.get('redirect');
        const userHandle = urlParams.get('handle');
        const userId = urlParams.get('id');

        if (redirect) {
            window.location.href = decodeURIComponent(redirect);
        } else if (userHandle) {
            window.location.href = `/profile/profile.html?handle=${userHandle}`;
        } else if (userId) {
            window.location.href = `/profile/profile.html?id=${userId}`;
        } else {
            // Default to going back in history or to profile page
            if (window.history.length > 1) {
                history.back();
            } else {
                window.location.href = '/profile/profile.html';
            }
        }
    });
}

function initializeEditPage() {
    setupBackButton();
    const userId = getCurrentUserId();

    if (!userId) {
        // Still try to load data - getCurrentUserId might return null
        // but loadUserData will handle the async resolution
        loadUserData(userId);
    } else {
        loadUserData(userId);
    }
    
    setupFormValidation();
    setupProfilePictureUpload();
}

function getCurrentUserId() {
    // Check URL parameters first for specific user to edit
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userHandle = urlParams.get('handle');
    
    if (userId) {
        return parseInt(userId);
    }
    
    if (userHandle) {
        // We'll need to fetch user by handle to get the ID
        // For now, return null and handle it in loadUserData
        return null;
    }
    
    // If no specific user, load current user context
    // This will be handled asynchronously in loadUserData
    return null;
}

async function getUserIdForSubmission() {
    // Similar to getCurrentUserId but async to handle API calls
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userHandle = urlParams.get('handle');
    
    if (userId) {
        return parseInt(userId);
    }
    
    if (userHandle) {
        const response = await fetch(`/api/users/handle/${userHandle}`);
        if (response.ok) {
            const user = await response.json();
            return user.id;
        }
        throw new Error('User not found');
    }
    
    // Load current user context
    const contextResponse = await fetch('/api/user-context/current');
    if (contextResponse.ok) {
        const contextData = await contextResponse.json();
        return contextData.id;
    }
    
    throw new Error('No user context available');
}

async function loadUserData(userId) {
    try {
        let user;
        
        // If no userId provided, try to get from URL or current user context
        if (!userId) {
            const urlParams = new URLSearchParams(window.location.search);
            const userIdParam = urlParams.get('id');
            const userHandle = urlParams.get('handle');
            
            if (userIdParam) {
                userId = parseInt(userIdParam);
            } else if (userHandle) {
                // Load user by handle
                const response = await fetch(`/api/users/handle/${userHandle}`);
                if (response.ok) {
                    user = await response.json();
                } else {
                    throw new Error('User not found');
                }
            } else {
                // Load current user context
                const contextResponse = await fetch('/api/user-context/current');
                if (contextResponse.ok) {
                    const contextData = await contextResponse.json();
                    userId = contextData.id;
                } else {
                    throw new Error('No user context available');
                }
            }
        }
        
        // If we still don't have user data, fetch by userId
        if (!user) {
            const response = await fetch(`/api/users/${userId}`);
            if (!response.ok) {
                throw new Error('Failed to load user data');
            }
            user = await response.json();
        }

        populateForm(user);

    } catch (error) {
        console.error('Error loading user data:', error);
        showError('Failed to load profile data. Please try again.');
    }
}

function populateForm(user) {
    document.getElementById('displayName').value = user.displayName || '';
    document.getElementById('distinctName').value = user.distinctName || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('biography').value = user.biography || '';

    // Update page title to reflect whose profile is being edited
    const titleElement = document.getElementById('editTitle');
    if (user.displayName) {
        titleElement.textContent = `Edit ${user.displayName}'s Profile`;
    } else {
        titleElement.textContent = 'Edit Profile';
    }

    // Load profile picture
    const profileImg = document.getElementById('currentProfileImg');
    if (user.profileImage) {
        profileImg.src = `/api/users/${user.id}/profile-picture`;
    } else {
        profileImg.src = '/images/default_profile-picture.jpg';
    }
}

function setupFormValidation() {
    const form = document.getElementById('editProfileForm');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        await submitForm();
    });

    // Real-time validation
    setupRealTimeValidation();
}

function validateForm() {
    let isValid = true;

    clearErrors();

    const displayName = document.getElementById('displayName').value.trim();
    if (!displayName) {
        showFieldError('displayName', 'Display name is required');
        isValid = false;
    } else if (displayName.length < 2) {
        showFieldError('displayName', 'Display name must be at least 2 characters');
        isValid = false;
    }

    const distinctName = document.getElementById('distinctName').value.trim();
    if (!distinctName) {
        showFieldError('distinctName', 'Username is required');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(distinctName)) {
        showFieldError('distinctName', 'Username can only contain letters, numbers, and underscores');
        isValid = false;
    } else if (distinctName.length < 3) {
        showFieldError('distinctName', 'Username must be at least 3 characters');
        isValid = false;
    }

    const email = document.getElementById('email').value.trim();
    if (!email) {
        showFieldError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    const biography = document.getElementById('biography').value.trim();
    if (biography.length > 500) {
        showFieldError('biography', 'Biography must be less than 500 characters');
        isValid = false;
    }

    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');

    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;

    field.parentNode.appendChild(errorElement);
}

function clearErrors() {
    // Remove error classes
    document.querySelectorAll('.form-input.error').forEach(field => {
        field.classList.remove('error');
    });

    // Remove error messages
    document.querySelectorAll('.error-message').forEach(error => {
        error.remove();
    });
}

function setupRealTimeValidation() {
    // Username validation - check uniqueness
    let usernameTimeout;
    document.getElementById('distinctName').addEventListener('input', function(e) {
        clearTimeout(usernameTimeout);
        const username = e.target.value.trim();

        // Clear previous username errors
        clearFieldError('distinctName');

        if (username && username.length >= 3) {
            usernameTimeout = setTimeout(() => {
                checkUsernameAvailability(username);
            }, 500);
        }
    });

    // Email validation
    let emailTimeout;
    document.getElementById('email').addEventListener('input', function(e) {
        clearTimeout(emailTimeout);
        const email = e.target.value.trim();

        clearFieldError('email');

        if (email) {
            emailTimeout = setTimeout(() => {
                if (!isValidEmail(email)) {
                    showFieldError('email', 'Please enter a valid email address');
                }
            }, 500);
        }
    });
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    field.classList.remove('error');

    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
}

async function checkUsernameAvailability(username) {
    try {
        const response = await fetch(`/api/users/handle/${username}`);

        if (response.ok) {
            // Username exists and belongs to someone else
            const existingUser = await response.json();
            const currentUserId = await getUserIdForSubmission();

            if (existingUser.id !== currentUserId) {
                showFieldError('distinctName', 'This username is already taken');
            }
        }
        // If 404, username is available - no action needed
    } catch (error) {
        // Ignore errors for availability check
        console.log('Username availability check completed');
    }
}

async function submitForm() {
    const userId = await getUserIdForSubmission();
    const saveBtn = document.querySelector('.save-btn');

    // Show loading state
    saveBtn.classList.add('loading');
    saveBtn.textContent = 'Saving...';

    try {
        let profilePictureFilename = null;

        // Upload profile picture first if one is selected
        if (selectedProfilePictureFile) {
            profilePictureFilename = await uploadProfilePicture(userId);
        } else {
            // Use existing profile picture
            profilePictureFilename = await getProfilePictureFilename();
        }

        const formData = {
            displayName: document.getElementById('displayName').value.trim(),
            distinctName: document.getElementById('distinctName').value.trim(),
            email: document.getElementById('email').value.trim(),
            biography: document.getElementById('biography').value.trim(),
            profilePicture: profilePictureFilename
        };

        const response = await fetch(`/api/users/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to update profile');
        }

        // Clear the selected file after successful upload
        selectedProfilePictureFile = null;

        // Show success message
        showSuccess('Profile updated successfully!');

        // Reset button state
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'Save Changes';

        // Redirect back to profile after a short delay
        setTimeout(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect');
            const userHandle = urlParams.get('handle');
            const userId = urlParams.get('id');

            if (redirect) {
                window.location.href = decodeURIComponent(redirect);
            } else if (userHandle) {
                window.location.href = `/profile/profile.html?handle=${userHandle}`;
            } else if (userId) {
                window.location.href = `/profile/profile.html?id=${userId}`;
            } else {
                window.location.href = '/profile/profile.html';
            }
        }, 1500);

    } catch (error) {
        console.error('Error updating profile:', error);
        showError('Failed to update profile. Please try again.');
        saveBtn.classList.remove('loading');
        saveBtn.textContent = 'Save Changes';
    }
}

async function uploadProfilePicture(userId) {
    const formData = new FormData();
    formData.append('file', selectedProfilePictureFile);

    const response = await fetch(`/api/users/${userId}/upload-profile-picture`, {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile picture');
    }

    const result = await response.json();
    return result.filename ? 'uploads/profiles/' + result.filename : null;
}

async function getProfilePictureFilename() {
    const userId = await getUserIdForSubmission();
    try {
        const response = await fetch(`/api/users/${userId}`);
        const user = await response.json();
        return user.profileImage || 'default_profile-picture.jpg';
    } catch (error) {
        return 'default_profile-picture.jpg';
    }
}

function setupProfilePictureUpload() {
    const fileInput = document.getElementById('profilePictureInput');
    const changeBtn = document.querySelector('.change-picture-btn');

    changeBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', handleFileSelect);
}

function handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
    }

    selectedProfilePictureFile = file;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('currentProfileImg').src = e.target.result;
    };
    reader.readAsDataURL(file);

    showSuccess('Profile picture selected. Changes will be saved when you submit the form.');
}

function showSuccess(message) {
    const existingMessage = document.querySelector('.success-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;

    const form = document.getElementById('editProfileForm');
    form.insertBefore(successDiv, form.firstChild);

    // Auto-hide after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.remove();
        }
    }, 3000);
}

function showError(message) {
    // You might want to implement a more sophisticated error display
    alert(message);
}