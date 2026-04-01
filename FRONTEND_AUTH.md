# Frontend Authorization Implementation - PartyHub

## Overview

PartyHub frontend now implements full Keycloak OAuth2/OIDC authentication with protected routes and role-based access control.

## Architecture

### Core Services

#### 1. **auth-service.js** - Authentication Management
Handles all authentication logic:
- Token acquisition (password flow)
- Token refresh and expiration
- User info extraction from JWT
- Authenticated API calls
- Login/Logout

**Key Functions:**
```javascript
// Login with username/password
await authService.login(username, password)

// Check authentication status
authService.isLoggedIn()

// Make authenticated API call
const response = await authService.apiCall('/api/endpoint', options)

// Get current access token
const token = await authService.getAccessToken()

// Get user info from token
const user = authService.getUserInfo()

// Get full user from API
const user = await authService.getCurrentUser()

// Logout
authService.logout()
```

#### 2. **route-guard.js** - Route Protection
Protects pages and provides access control helpers:

**Key Functions:**
```javascript
// Require authentication - redirect to login if not authenticated
window.requireAuth()

// Require logout - redirect to home if already authenticated
window.requireLogout()

// Check if authenticated (no redirect)
window.isAuthenticated()

// Get current authenticated user
window.getCurrentAuthUser()

// Make authenticated API call
window.makeAuthenticatedCall(url, options)
```

#### 3. **api.js** - Enhanced API Helpers
Updated to use authenticated calls:
```javascript
// Automatically includes Bearer token
await partyApi.attendParty(partyId)
await partyApi.unattendParty(partyId)
```

## Protected Pages

The following pages require authentication:

| Page | File | Protection |
|------|------|-----------|
| Profile | `profile/profile.html` | `requireAuth()` |
| Edit Profile | `editProfile/editProfile.html` | `requireAuth()` |
| Add Party | `addParty/addParty.html` | `requireAuth()` |
| Notifications | `notifications/notifications.html` | `requireAuth()` |

## Public Pages

These pages are accessible without authentication:

| Page | File |
|------|------|
| Homepage | `index.html` |
| List Parties | `listPartys/listPartys.html` |
| Login | `register_login/login/login.html` |
| Start/Welcome | `register_login/start.html` |

## Authentication Flow

### 1. User Visits Protected Page

```
User visits /profile/profile.html
     ↓
requireAuth() is called
     ↓
Is token valid? → YES → Load page
     ↓
             NO
     ↓
Redirect to /register_login/start.html
```

### 2. User Logs In

```
User enters username/password on login page
     ↓
authService.login(username, password)
     ↓
POST to http://localhost:8180/realms/party-realm/protocol/openid-connect/token
     ↓
Receive access_token + refresh_token
     ↓
Store tokens in localStorage
     ↓
Parse JWT and extract user info
     ↓
Redirect to /index.html
```

### 3. Making API Calls

```
makeAuthenticatedCall('/api/endpoint')
     ↓
Get access token (refresh if expired)
     ↓
Add Bearer token to request header
     ↓
Send request with Authorization: Bearer <token>
     ↓
If 401 (Unauthorized) → Refresh token and retry
     ↓
If refresh fails → Logout and redirect to login
```

## Token Management

### Storage

Tokens are stored in `localStorage`:
- `keycloak_access_token` - JWT access token
- `keycloak_refresh_token` - Refresh token
- `keycloak_user_info` - Decoded token claims
- `keycloak_token_expiry` - Token expiration timestamp

### Expiration Handling

- Tokens expire after `expires_in` seconds (usually 5 minutes)
- Refresh tokens last longer (usually 30 minutes)
- Before expiry, automatic refresh is triggered
- If refresh fails, user is logged out

### Token Validation

```javascript
isTokenValid() {
  // Token is valid if:
  // 1. Token exists
  // 2. Expiration timestamp exists
  // 3. Current time < (expiry - 1 minute buffer)
}
```

## Implementation Guide

### Adding Protection to a Page

Add these scripts to any HTML page that requires authentication:

```html
<head>
    <!-- Essential scripts (in order) -->
    <script src="../user-utils.js" defer></script>
    <script src="../auth-service.js" defer></script>
    <script src="../route-guard.js" defer></script>
    <script src="../nav.js" defer></script>
    
    <!-- Your page scripts -->
    <script src="./your-page.js" defer></script>
    
    <!-- Protection check -->
    <script>
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', window.requireAuth);
        } else {
            window.requireAuth();
        }
    </script>
</head>
```

### Making Authenticated API Calls

#### Option 1: Using route-guard wrapper (Recommended)

```javascript
const response = await window.makeAuthenticatedCall('/api/users/me');
const data = await response.json();
```

#### Option 2: Using auth-service directly

```javascript
const response = await window.authService.apiCall('/api/users/me');
const data = await response.json();
```

#### Option 3: Using existing API helpers

```javascript
// Updated to use authentication automatically
await partyApi.attendParty(partyId);
```

### Handling Login State

```javascript
// Check if user is logged in
if (window.authService.isLoggedIn()) {
    console.log('User is logged in');
}

// Get user info
const userInfo = window.authService.getUserInfo();
console.log(userInfo.username);
console.log(userInfo.email);

// Logout
window.authService.logout();
```

## Navigation UI

The navigation bar now shows:

### If Not Logged In
- "Login" button linking to `/register_login/login/login.html`

### If Logged In
- Username display: "Logged in as: alice"
- "Logout" button (with confirmation dialog)

The logout button is added dynamically below the navigation by `nav.js`.

## Login Page Features

Location: `/register_login/login/login.html`

### Features
- Clean, modern UI with gradient background
- Username and password input fields
- Error message display
- Success message display
- Demo credentials displayed
- Loading state on submit button
- Redirect on successful login
- Redirect to home if already logged in

### Demo Users
- **alice** / alicepwd
- **bob** / bobpwd
- **carol** / carolpwd

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "No valid token available" | Not logged in | Redirect to login |
| "Session expired" | Token refresh failed | Logout and re-login |
| 401 Unauthorized | Token invalid/expired | Automatic refresh attempted |
| 403 Forbidden | User lacks permissions | Check backend RBAC |
| "OIDC server not available" | Keycloak not running | Start Keycloak container |

### Error Recovery

```javascript
// Automatic retry with token refresh
if (response.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
        // Retry request with new token
    } else {
        // Logout - token refresh failed
        logout();
    }
}
```

## Security Considerations

### Token Security
- Tokens stored in `localStorage` (vulnerable to XSS)
- Consider using `sessionStorage` for more security
- For production, use httpOnly cookies via backend

### CORS
- Frontend requests to Keycloak/Backend handled via CORS
- Ensure backend has proper CORS headers for /api/* endpoints

### HTTPS in Production
- Always use HTTPS in production
- Update `KEYCLOAK_URL` to production domain
- Use secure cookies

### Best Practices
```javascript
// Good: Store sensitive operations for logged-in users only
if (authService.isLoggedIn()) {
    // Perform sensitive operation
}

// Good: Handle token expiration gracefully
try {
    const response = await apiCall('/api/endpoint');
} catch (err) {
    if (err.message === 'Session expired') {
        window.location.href = '/register_login/login/login.html';
    }
}

// Avoid: Don't expose tokens in console logs (development only)
console.log(authService.getAccessToken());
```

## Testing Authentication

### Manual Testing

1. **Test Login**
   ```bash
   # Visit login page
   http://localhost:8080/register_login/login/login.html
   
   # Enter credentials
   Username: alice
   Password: alicepwd
   
   # Should redirect to homepage
   ```

2. **Test Protected Page Access**
   ```bash
   # Try accessing profile without login
   http://localhost:8080/profile/profile.html
   
   # Should redirect to login page
   ```

3. **Test Token Expiration**
   - Login
   - Wait 5 minutes (or manually clear token)
   - Try API call
   - Should refresh automatically or redirect to login

### Browser Console Commands

```javascript
// Check login status
authService.isLoggedIn()

// View access token
authService.getAccessToken()

// View user info
authService.getUserInfo()

// View token expiration
localStorage.getItem('keycloak_token_expiry')

// Manually logout
authService.logout()

// Parse and view full token
const token = authService.getAccessToken();
const decoded = authService.parseJwt(token);
console.log(decoded);
```

## Configuration

### Keycloak Settings

Edit `auth-service.js` to change Keycloak configuration:

```javascript
const KEYCLOAK_URL = 'http://localhost:8180';      // Keycloak server
const REALM = 'party-realm';                        // Realm name
const CLIENT_ID = 'party-client';                   // OIDC client ID
const CLIENT_SECRET = 'secret123';                  // Client secret
```

### Storage Keys

Tokens stored with these keys (editable in `auth-service.js`):
- `keycloak_access_token`
- `keycloak_refresh_token`
- `keycloak_user_info`
- `keycloak_token_expiry`

## Troubleshooting

### User redirected to login immediately after successful login

**Cause:** Token validation failed

**Solution:**
1. Check browser console for errors
2. Verify Keycloak token endpoint is reachable
3. Check token expiry calculation
4. Clear localStorage and retry

### "OIDC server not available" warning

**Cause:** Keycloak not responding during page load (normal)

**Solution:**
- This is expected if Keycloak is slow to start
- Page will still work once Keycloak starts
- Warning should disappear after first successful auth

### Token not refreshing automatically

**Cause:** Refresh token missing or expired

**Solution:**
1. Logout completely (clear all localStorage)
2. Login again
3. Check token expiry times

### Logout not working

**Cause:** Redirect failed or script error

**Solution:**
```javascript
// Manual logout in browser console
authService.logout()

// Or clear manually
localStorage.clear()
window.location.href = '/register_login/start.html'
```

## Future Enhancements

- [ ] Social login integration (Google, GitHub)
- [ ] Remember me functionality (longer-lived refresh token)
- [ ] MFA (Multi-Factor Authentication)
- [ ] Session management across tabs
- [ ] Token revocation on logout
- [ ] Role-based UI rendering
- [ ] Progressive profile information loading

## Files Changed

| File | Changes |
|------|---------|
| `auth-service.js` | NEW - Complete auth service |
| `route-guard.js` | NEW - Route protection |
| `nav.js` | UPDATED - Added login/logout UI |
| `api.js` | UPDATED - Uses authenticated calls |
| `login/login.html` | UPDATED - Full Keycloak integration |
| `start.html` | UPDATED - Better UX |
| `index.html` | UPDATED - Added auth scripts |
| `profile/profile.html` | UPDATED - Protected with requireAuth |
| `editProfile/editProfile.html` | UPDATED - Protected with requireAuth |
| `addParty/addParty.html` | UPDATED - Protected with requireAuth |
| `notifications/notifications.html` | UPDATED - Protected with requireAuth |

