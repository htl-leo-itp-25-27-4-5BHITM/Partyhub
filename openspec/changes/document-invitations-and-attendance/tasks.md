# Tasks

## 1. Invitation authority and state

- [ ] 1.1 Review the complete modified private-invitation requirement against D004-D007, access rows 2-5 and G017; verify stored-host authority, per-transition mutual-contact eligibility, one logical invitation, self/missing rejection, duplicate no-op, renewal and withdrawal are retained.
- [ ] 1.2 Sync the reviewed private-invitation requirement into `party-discovery-and-management`; verify PARTY-06 contains all eight scenarios and accepted PARTY-01-PARTY-05 plus PARTY-08-PARTY-13 remain unchanged.

## 2. Attendance transitions and visibility

- [ ] 2.1 Review the complete modified attendance requirement against the transition matrix, access rows 20-22 and Q004; verify public/private join eligibility, accept/decline/leave atomicity, repeated-action behavior and the admission-policy boundary are explicit.
- [ ] 2.2 Sync the reviewed attendance requirement into `party-discovery-and-management`; verify PARTY-07 contains all nine scenarios and denial/no-op paths preserve membership, invitation, visibility, projection and event state.

## 3. Projections and transition events

- [ ] 3.1 Review actor-scoped projections and transition events against access rows 3-7 and 22-25, G009/G031-G033 and the Group 8 notification boundary; verify host, recipient, party-viewer and unrelated-user audiences plus no-op event behavior are explicit.
- [ ] 3.2 Sync the projection and event requirements as PARTY-14 and PARTY-15; verify nine projection scenarios and six event scenarios are indexed without defining notification delivery or exact Q014 wire behavior.

## 4. Traceability and handoff

- [ ] 4.1 Update the umbrella checklist, coverage, access, decisions, gaps, inventory, runbook and handoff after integration; verify strict child, umbrella and party-spec validation, local links, access-row preservation and application-source preservation pass, then mark umbrella 5.4 complete without starting Group 6.
