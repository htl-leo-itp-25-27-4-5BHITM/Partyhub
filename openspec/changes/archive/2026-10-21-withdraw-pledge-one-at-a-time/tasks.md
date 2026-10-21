# Tasks

## 1. Detail page

- [x] 1.1 Make "Withdraw" in `advancedPartyInfos/bringAlong.js` send `PUT …/pledge` with quantity − 1, or `DELETE …/pledge` when the pledge is 1, and label it so the one-step behaviour is clear; verify in the browser that 3 → 2 → 1 → removed, and another member's open page shows each step live

## 2. Integration check

- [x] 2.1 Run `./mvnw clean test` and the detail-page browser scenario with real Keycloak logins
