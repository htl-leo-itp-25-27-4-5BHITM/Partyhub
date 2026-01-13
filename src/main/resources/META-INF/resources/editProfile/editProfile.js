let selectedProfilePictureFile = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeEditPage();
});

function initializeEditPage() {
    const userId = getCurrentUserId();

    if (!userId) {
        showError('User not logged in');
        return;
    }

    loadUserData(userId);
    setupFormValidation();
    setupProfilePictureUpload();
}

function getCurrentUserId() {
    return 1;
}

async function loadUserData(userId) {
    try {
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
            throw new Error('Failed to load user data');
        }

        const user = await response.json();
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

    // Clear previous errors
    clearErrors();

    // Validate display name
    const displayName = document.getElementById('displayName').value.trim();
    if (!displayName) {
        showFieldError('displayName', 'Display name is required');
        isValid = false;
    } else if (displayName.length < 2) {
        showFieldError('displayName', 'Display name must be at least 2 characters');
        isValid = false;
    }

    // Validate username
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

    // Validate email
    const email = document.getElementById('email').value.trim();
    if (!email) {
        showFieldError('email', 'Email is required');
        isValid = false;
    } else if (!isValidEmail(email)) {
        showFieldError('email', 'Please enter a valid email address');
        isValid = false;
    }

    // Validate biography length
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
            const currentUserId = getCurrentUserId();

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
    const userId = getCurrentUserId();
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
            window.location.href = '/profile/profile.html';
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
    // Return the current profile picture filename from the user data
    const userId = getCurrentUserId();
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

    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please select a valid image file');
        return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showError('Image size must be less than 5MB');
        return;
    }

    // Store the selected file
    selectedProfilePictureFile = file;

    // Preview the image
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
    // Create a simple alert for now
    // You might want to implement a more sophisticated error display
    alert(message);
}