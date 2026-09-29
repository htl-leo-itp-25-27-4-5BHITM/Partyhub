# Tasks

## 1. Event and recipient contract

- [ ] 1.1 Review follow, invitation, attendance, party-update and cancellation event recipients against SOC-01, PARTY-15 and the Group 5 transition evidence; verify every committed transition has one non-contradictory recipient set and every no-op has none.
- [ ] 1.2 Record welcome and digest recipients plus the per-channel support classification; verify integrated email, unintegrated push and unsupported SMS are not presented as equivalent capabilities.

## 2. Notification-center state and cleanup

- [ ] 2.1 Review recipient-scoped list, type/party/search filters, unread/read/delete, ordering and denial behavior; verify type/action policy is explicit and not inferred from message text.
- [ ] 2.2 Reconcile authoritative invitation/follow actions, informational deletion, stale actions, party cancellation snapshots and cleanup; verify notification changes never replay or mutate domain transitions.

## 3. Preferences and delivery

- [ ] 3.1 Review same-user settings, effective defaults, atomic replacement and independent channel/category gates; verify pending actions remain accessible and missing legacy settings have deterministic behavior.
- [ ] 3.2 Review email eligibility, welcome/digest rules, recipient visibility, failure isolation, retry identity, push/device-token and SMS boundaries; verify domain success never depends on delivery success.

## 4. Specification and completion records

- [ ] 4.1 Sync the modified and four added notification requirements into `social-and-notifications` while preserving SOC-01, SOC-02 and SOC-04-SOC-07; verify strict child and main-spec validation passes.
- [ ] 4.2 Update Group 8 evidence, access, coverage, decision, gap, inventory, runbook, umbrella checklist and handoff records; verify totals/links are consistent, source and unrelated files remain unchanged, and Group 9 is not started.
