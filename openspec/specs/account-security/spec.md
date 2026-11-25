# account-security Specification

## Purpose
Lets users change their login e-mail and password through flows connected to Keycloak, and makes sure every such change is confirmed and announced by security e-mails that cannot be switched off.

## Requirements

### Requirement: E-mail change requires a fresh login confirmation
Requesting an e-mail change SHALL require that the user confirmed their current password with Keycloak within the last 5 minutes. Without such a confirmation the system SHALL reject the request and the browser SHALL send the user through a Keycloak password prompt and back to the e-mail sub-page. The new address SHALL be a syntactically valid e-mail address, SHALL differ from the current address (ignoring case), and SHALL NOT belong to another PartyHub or Keycloak account.

#### Scenario: User requests a change after confirming the password
- **WHEN** a user who entered their current password at the Keycloak prompt less than 5 minutes ago submits a valid unused new address
- **THEN** the system SHALL create a pending e-mail change
- **AND** the browser SHALL show "We sent a confirmation link to <new address>"

#### Scenario: User enters a wrong current password
- **WHEN** a user enters a wrong current password at the Keycloak prompt
- **THEN** Keycloak SHALL show an error and the system SHALL NOT create a pending e-mail change

#### Scenario: Login confirmation is too old
- **WHEN** a user submits an e-mail change and their last password confirmation is older than 5 minutes
- **THEN** the system SHALL reject the request as needing re-authentication without creating a pending change

#### Scenario: New address is already used
- **WHEN** a user submits an address that belongs to another account
- **THEN** the system SHALL reject the request with a field error and create no pending change

#### Scenario: New address equals the current address
- **WHEN** a user submits their current address in different letter case
- **THEN** the system SHALL reject the request with a field error

#### Scenario: New address is invalid
- **WHEN** a user submits a value that is not a valid e-mail address
- **THEN** the system SHALL reject the request with a field error

### Requirement: Pending e-mail change notifies both addresses
When a pending e-mail change is created, the system SHALL send a confirmation e-mail with a single-use link to the new address and a notice to the current address. The notice SHALL contain the request time, the approximate browser and operating system, the new address partly masked (for example `ma***@example.com`) and a "This wasn't me" link.

#### Scenario: Change is requested
- **WHEN** a pending e-mail change from `old@example.com` to `new@example.com` is created
- **THEN** `new@example.com` SHALL receive exactly one confirmation e-mail with a link
- **AND** `old@example.com` SHALL receive exactly one notice with the masked new address and a "This wasn't me" link
- **AND** neither e-mail SHALL contain the other link

### Requirement: Old e-mail stays active until confirmation
Until the confirmation link is used, the current address SHALL remain the account's e-mail for login, password reset and all e-mails. The e-mail sub-page SHALL show "Change pending" with the new address and the actions "Resend" and "Cancel".

#### Scenario: Change is not confirmed
- **WHEN** a user requested an e-mail change but has not used the link
- **THEN** the user SHALL still log in with the current address and the profile SHALL still show it

#### Scenario: User resends the confirmation
- **WHEN** a user presses "Resend" for a pending change
- **THEN** the system SHALL send a new confirmation link to the new address and the previously sent link SHALL stop working

#### Scenario: User cancels the pending change
- **WHEN** a user presses "Cancel" for a pending change
- **THEN** the system SHALL end the pending change and its links SHALL stop working

### Requirement: Only one e-mail change is pending per account
An account SHALL have at most one pending e-mail change. A new request SHALL replace the previous one, and the previous links SHALL stop working.

#### Scenario: User requests a second change
- **WHEN** a user with a pending change to `a@example.com` requests a change to `b@example.com`
- **THEN** only the change to `b@example.com` SHALL be pending and the link sent to `a@example.com` SHALL be rejected

### Requirement: Confirming the link activates the new e-mail
Using a valid confirmation link SHALL make the new address the account's e-mail in Keycloak (marked verified) and in the PartyHub profile, end the pending change, and send "Your e-mail address was changed successfully" to the new address and "The e-mail of your account was changed" with recovery and support information to the old address. If the new address was taken by another account in the meantime, the confirmation SHALL fail without changing the e-mail.

#### Scenario: User confirms the change
- **WHEN** the user opens a valid confirmation link
- **THEN** the new address SHALL be used for the next login
- **AND** the new address SHALL receive a success e-mail and the old address SHALL receive a change notice

#### Scenario: Address was taken meanwhile
- **WHEN** a confirmation link is opened after another account started using the new address
- **THEN** the system SHALL keep the old address and show that the address is no longer available

### Requirement: Expired or used links show a clear error
Confirmation links SHALL be valid for 24 hours and only once. An expired, used, replaced or cancelled link SHALL show an understandable error page that lets a logged-in user start a new request from the e-mail sub-page.

#### Scenario: Link is expired
- **WHEN** a user opens a confirmation link more than 24 hours after it was sent
- **THEN** the system SHALL NOT change the e-mail and SHALL show that the link expired with a way to request a new one

#### Scenario: Link is used twice
- **WHEN** a user opens a confirmation link that was already used
- **THEN** the system SHALL NOT change anything and SHALL show that the link is no longer valid

### Requirement: "This wasn't me" cancels the request and leads to password reset
The "This wasn't me" link in the notice to the old address SHALL end the pending change so its confirmation link stops working, and SHALL lead to the Keycloak password-reset page. It SHALL work without login, be valid for 24 hours and only once.

#### Scenario: Owner of the old address reports the change
- **WHEN** the recipient of the notice opens "This wasn't me"
- **THEN** the pending change SHALL end, the confirmation link at the new address SHALL be rejected, and the browser SHALL show the password-reset page

### Requirement: Password change runs through Keycloak
The password sub-page SHALL start Keycloak's password update for the logged-in user. Keycloak SHALL ask for the current password, then the new password twice, and SHALL enforce the realm password policy: at least 8 characters, not equal to the username, and not equal to the current password. The PartyHub login theme SHALL show the policy and live feedback while typing. After a successful change the user SHALL return to the password sub-page with a success message and stay logged in in the current browser. The sub-page SHALL also link to the existing "Forgot password?" flow.

#### Scenario: User changes the password
- **WHEN** a user enters the correct current password and a valid new password twice
- **THEN** Keycloak SHALL store the new password and the browser SHALL return to settings with a success message while the user stays logged in

#### Scenario: Current password is wrong
- **WHEN** a user enters a wrong current password
- **THEN** Keycloak SHALL show an error and keep the old password

#### Scenario: New password equals the old one
- **WHEN** a user enters the current password as the new password
- **THEN** Keycloak SHALL reject it with a policy message and keep the old password

#### Scenario: Repeated password does not match
- **WHEN** the two new-password fields differ
- **THEN** the change SHALL be rejected with a field message

#### Scenario: User cancels the password change
- **WHEN** a user cancels on the Keycloak page
- **THEN** the browser SHALL return to the password sub-page without a success message and the password SHALL be unchanged

### Requirement: Every password change sends a security e-mail
After every successful password change, including a reset through "Forgot password?", the account's e-mail address SHALL receive "Your password was changed" with the time, the approximate location information available to Keycloak (IP address) and a "This wasn't me" link leading to the password-reset page and support information.

#### Scenario: Password is changed in settings
- **WHEN** a user changes the password from the settings
- **THEN** the account address SHALL receive one "Your password was changed" e-mail with a "This wasn't me" link

#### Scenario: Password is reset through "Forgot password?"
- **WHEN** a user resets the password through the reset e-mail
- **THEN** the account address SHALL receive the same "Your password was changed" e-mail

### Requirement: Security e-mails ignore notification preferences
E-mail change confirmations and notices, change-success mails and password-changed mails SHALL be sent regardless of the user's notification channel, category or master settings. The notification sub-page SHALL say so.

#### Scenario: All notifications are off
- **WHEN** a user with every notification switch off changes their password
- **THEN** the user SHALL still receive the "Your password was changed" e-mail

### Requirement: Security e-mails and tokens are handled safely
Security e-mails SHALL use PartyHub-styled HTML with a plain-text alternative and SHALL never contain a password. Link tokens SHALL be random with at least 128 bits of entropy, stored only as a hash, valid once and for a limited time. Passwords and complete tokens SHALL NOT be written to logs. E-mail change requests and resends SHALL be limited to 5 per account per hour; further requests SHALL be rejected with a "try again later" message.

#### Scenario: User exceeds the rate limit
- **WHEN** a user sends a sixth e-mail change request or resend within one hour
- **THEN** the system SHALL reject it as too many requests and send no e-mail

#### Scenario: Stored token is read from the database
- **WHEN** someone reads the stored e-mail change data
- **THEN** it SHALL contain only token hashes, not usable link tokens

### Requirement: E-mail delivery failures do not break the flows
Security e-mails SHALL be sent after the change was committed, with retries. A delivery failure SHALL be logged without the token. A failed password-changed e-mail SHALL NOT undo the password change. A pending e-mail change whose confirmation e-mail failed SHALL stay pending so the user can resend it.

#### Scenario: Confirmation e-mail cannot be delivered
- **WHEN** the mail server rejects the confirmation e-mail of a pending change after all retries
- **THEN** the change SHALL stay pending, the old address SHALL stay active, and the failure SHALL be logged
