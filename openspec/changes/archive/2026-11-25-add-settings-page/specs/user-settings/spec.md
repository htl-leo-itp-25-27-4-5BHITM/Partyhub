# Spec Delta

## Purpose

Gives logged-in browser users one settings area for appearance, profile, security, notifications, privacy, blocked accounts and logout, and keeps every choice stored on the account until the user changes it.

## ADDED Requirements

### Requirement: Settings area is reached from the own profile
The browser SHALL offer a settings area made of an overview page with one entry per section (Appearance, Edit profile, E-mail, Password, Notifications, Privacy, Blocked accounts, Share profile, Dashboard, Logout) and one sub-page per section. Every sub-page SHALL have a back control that returns to the overview, and the overview SHALL have a back control that returns to the own profile. The own profile SHALL show a gear icon at the top right that opens the overview; another user's profile SHALL NOT show it. The settings pages SHALL be reachable only with a valid login.

#### Scenario: User opens settings from their profile
- **WHEN** a logged-in user opens their own profile and presses the gear icon
- **THEN** the browser SHALL show the settings overview

#### Scenario: User views another profile
- **WHEN** a logged-in user opens another user's profile
- **THEN** the profile SHALL NOT show the gear icon

#### Scenario: Logged-out visitor opens a settings URL
- **WHEN** a visitor without a valid login opens any settings page directly
- **THEN** the browser SHALL send them to login and return them to that settings page after a successful login

#### Scenario: User navigates back from a sub-page
- **WHEN** a user presses the back control on a settings sub-page
- **THEN** the browser SHALL show the settings overview

### Requirement: Profile editing, dashboard and logout live only in settings
The own profile page SHALL NOT show an "Edit Account", "Dashboard" or "Logout" button; these actions SHALL be available in the settings area. The former edit-profile address SHALL forward to the edit-profile settings sub-page. The dashboard entry in settings SHALL open the existing host dashboard, and the dashboard's back control SHALL return to the settings overview.

#### Scenario: User looks for the edit button on their profile
- **WHEN** a logged-in user opens their own profile
- **THEN** the profile SHALL show the gear icon but no edit, dashboard or logout button

#### Scenario: User opens the dashboard from settings
- **WHEN** a user presses "Dashboard" on the settings overview
- **THEN** the browser SHALL show their host dashboard, and its back control SHALL return to the settings overview

#### Scenario: Old edit-profile link is opened
- **WHEN** a logged-in user opens the former edit-profile address
- **THEN** the browser SHALL show the edit-profile settings sub-page

### Requirement: Account preferences are stored on the account
PartyHub SHALL store each account preference (theme, notification preferences, account privacy) server-side for the authenticated user. A stored value SHALL stay unchanged until that user changes it; logout, login, reload, a new deployment or another browser SHALL NOT reset it. A default SHALL apply only while the user has never changed that preference. Only the authenticated user SHALL read or change their own preferences.

#### Scenario: Preference survives logout and another browser
- **WHEN** a user selects the light theme, logs out and logs in again in a different browser
- **THEN** the app SHALL show the light theme and the settings page SHALL show "Light" as selected

#### Scenario: User has never changed a preference
- **WHEN** a user who never changed their theme opens the app
- **THEN** the system SHALL use the default "System"

#### Scenario: User targets another user's preferences
- **WHEN** an authenticated user attempts to read or change another user's preferences
- **THEN** the system SHALL reject the request without disclosing or changing them

#### Scenario: Preference update is invalid
- **WHEN** a user submits an unsupported preference value
- **THEN** the system SHALL reject the update and keep the previously stored value

### Requirement: Browser caches preferences per account but trusts the server
The browser SHALL cache the theme of the last logged-in account so the first paint already uses it, and SHALL replace the cached value with the server value once the account's preferences are loaded. Cached values SHALL be kept per account; when a different account logs in, the browser SHALL apply that account's server values and SHALL NOT show the previous account's preferences after they are loaded. The cache SHALL NOT contain tokens or profile data.

#### Scenario: Server value differs from the cache
- **WHEN** the cached theme is dark but the account's stored theme is light
- **THEN** the browser SHALL switch to light as soon as the stored preferences are loaded and update the cache

#### Scenario: Two accounts with different themes use the same browser
- **WHEN** account A with the dark theme logs out and account B with the light theme logs in on the same browser
- **THEN** the app SHALL show the light theme for B once B's preferences are loaded
- **AND** when A logs in again the app SHALL show the dark theme

### Requirement: Users choose light, dark or system appearance
The appearance sub-page SHALL offer Light, Dark and System. The selection SHALL apply immediately on all open app pages without a reload. System SHALL follow the operating-system colour scheme and react live when it changes. Every app page SHALL be usable and readable in both light and dark appearance, and pages SHALL NOT first render in the wrong appearance when the cached value is known.

#### Scenario: User selects dark
- **WHEN** a user selects Dark on the appearance sub-page
- **THEN** the page SHALL switch to the dark appearance without a reload and the choice SHALL be stored on the account

#### Scenario: Operating system changes while System is selected
- **WHEN** the user's appearance is System and the operating system switches from light to dark
- **THEN** the open app pages SHALL switch to dark without user action

#### Scenario: App starts with a cached theme
- **WHEN** a user whose cached theme is light opens any app page
- **THEN** the first rendered frame SHALL use the light appearance

### Requirement: Toggles are optimistic with rollback
Settings switches and choices SHALL show the new value immediately, send it to the server, and on failure SHALL restore the previous value and show an error message. While a change is being sent, repeated input SHALL NOT send conflicting requests out of order.

#### Scenario: Saving a switch fails
- **WHEN** a user turns a settings switch off and the server request fails
- **THEN** the switch SHALL return to on and the page SHALL show an error message

### Requirement: Logout from settings asks for confirmation
The settings overview SHALL offer "Log out", which SHALL ask for confirmation. After confirmation the browser SHALL end the Keycloak session, remove the session token data and cached user data of the tab, and show the login page. Stored account preferences SHALL remain on the account.

#### Scenario: User confirms logout
- **WHEN** a user presses "Log out" and confirms
- **THEN** the browser SHALL end the session, clear the tab's session and user data and show the login page

#### Scenario: User cancels logout
- **WHEN** a user presses "Log out" and cancels the confirmation
- **THEN** the user SHALL stay logged in on the settings overview

### Requirement: Settings pages are accessible
Settings pages SHALL work on phone and desktop widths, label every input, expose each switch's state to screen readers, show a visible keyboard focus and meet the app's contrast in both appearances.

#### Scenario: Screen reader reads a switch
- **WHEN** a screen-reader user focuses a notification switch
- **THEN** the switch SHALL announce its label and whether it is on or off
