# Tasks

## 1. Location scope and access

- [ ] 1.1 Complete the Group 10 evidence matrix for accepted local current-location use, server-stored user locations, attendee maps/lists, permission declarations, clients and tests; verify every inventoried location surface is classified as retained local context or deferred shared location with a source anchor.
- [ ] 1.2 Reconcile location access with D001, D007, D010, D017-D018, PARTY-02/PARTY-04/PARTY-10/PARTY-14 and RADIUS-01-RADIUS-03; verify private parties, caller identity, permission loss and the distinction between location observation and attendance have one non-contradictory disposition.

## 2. Local visit tracking

- [ ] 2.1 Review explicit enablement, platform permission, region eligibility, entry/exit/idempotency, local storage/deletion, party removal and monitoring failure against the proposed visit contract; verify current automatic startup/background behavior and untested transitions remain implementation evidence rather than accepted behavior.
- [ ] 2.2 Integrate the optional iOS visit-tracking requirement into `party-discovery-and-management`; verify no scenario treats a geofence event or local time record as backend attendance, invitation acceptance, identity or shared location.

## 3. Calendar snapshot integration

- [ ] 3.1 Review party-detail export, just-in-time permission, event fields, duplicate association, removal, stale association, snapshot semantics and failure isolation; verify PartyHub lifecycle state never depends on EventKit success and browser parity is not implied.
- [ ] 3.2 Integrate the optional iOS calendar requirement into `party-discovery-and-management`; verify add/remove/update-after-export scenarios describe user-visible snapshot behavior without promising automatic provider synchronization.

## 4. Specification and completion records

- [ ] 4.1 Sync all three added requirements into the main party capability while preserving PARTY-01-PARTY-16 and the radius capability; verify strict child and main party-spec validation passes and accepted totals are updated accurately.
- [ ] 4.2 Update Group 10 evidence, access, coverage, decisions, gaps, inventory, runbook, umbrella checklist and handoff; verify Q002 is resolved, deferred location endpoints remain inventoried, source/unrelated files remain unchanged, and Group 11 is not started.
