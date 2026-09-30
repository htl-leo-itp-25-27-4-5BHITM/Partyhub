# Design

## Context

See [proposal.md](proposal.md) for motivation. The current iOS application requests location access during startup, uses the same location manager for accepted home-map distance behavior and background geofences, stores visit intervals in SwiftData, exposes a top-level time-tracking tab and party-local visit history, and offers EventKit export from party details. Separate attendee map/list screens call open backend location reads and a bearer-authenticated location update, but those routes have no consent, freshness, retention, or Viewer enforcement contract.

PARTY-02/D010 exclude live current-user and attendee location from core discovery. PARTY-10/PARTY-11 and RADIUS-01-RADIUS-03 already retain on-device current location for finite-distance filtering. D001/D014 require token-derived identity for protected calls, while D007/D016/D017 govern private-party visibility and attendance. This change must preserve those rules and must not treat a geofence observation as attendance proof.

This is documentation/specification work. It records intended extension behavior and implementation gaps; application, database, permission, and API changes require later bounded changes.

## Goals / Non-Goals

**Goals:**

- Separate private on-device location use from server-published live location.
- Define optional iOS visit tracking with explicit enablement, local ownership, coherent interval transitions, deletion, and permission failure behavior.
- Define optional iOS calendar export as a user-controlled local snapshot with clear permission, duplicate, removal, stale-association, and failure behavior.
- Give attendee/user-location endpoints and screens an explicit unsupported/deferred disposition instead of inferring a contract from their presence.
- Preserve core discovery, Viewer, attendance, identity, and platform-specific scope decisions.

**Non-Goals:**

- Implement or expose live user or attendee location, browser location features, server-synchronized visit history, or calendar-provider synchronization.
- Use location or visit history as attendance, invitation acceptance, identity, or authorization evidence.
- Select HTTP status/envelope details for deferred location endpoints, a retention period for future server location data, or a future shared-location architecture.
- Modify iOS, backend, configuration, database, tests, deployment, or device data in this change.
- Start Group 11 or archive the umbrella or active child changes.

## Decisions

### 1. Split current-location use from location publication

Current coordinates remain an iOS-local input for accepted finite-distance behavior and optional visit detection. They are not a PartyHub user-location resource. Server-stored current positions and attendee maps/lists are deferred because the source exposes coordinates without an accepted consent, audience, freshness, revocation, or private-party policy.

Alternative considered: retain the current backend routes as the live-location contract. Rejected because route reachability and persistence do not answer who consented, which viewers qualify, how stale data expires, or how a user stops sharing.

### 2. Retain visit tracking as optional device-local functionality

Visit tracking is iOS-only and opt-in. It stores one open interval per monitored party, closes it on exit, keeps history in local application storage, and lets the user delete records. Permission loss or monitoring failure stops new evidence; it never changes server attendance. Local party removal also removes its owned visit history, matching the current local data ownership instead of promising long-term server retention.

Alternative considered: make geofence visits authoritative attendance. Rejected because device location can be unavailable, spoofed, delayed, duplicated, or observed without the authenticated party transition required by PARTY-07.

### 3. Treat calendar export as a snapshot rather than synchronization

Calendar export is an optional iOS party-detail action. The client requests permission when the user invokes it, creates one local event from the visible party fields, uses a documented bounded default duration when the optional party end time is absent, stores only the local party/event association, and supports removal of that event. Later PartyHub edits or cancellation do not silently change the external calendar event; the UI must not describe the snapshot as synchronized.

Alternative considered: automatically update or delete calendar events after PartyHub changes. Rejected because no background reconciliation or accepted cross-system delivery contract exists, and silent changes to a user's external calendar need a separately designed lifecycle.

### 4. Reuse the party capability

The retained extensions act on an already visible party and depend on party schedule, location, detail access, and attendance separation. Their observable behavior therefore belongs in `party-discovery-and-management`; a new generic client-integration capability would duplicate Party concepts and weaken traceability.

Alternative considered: create a new extensions capability. Rejected because the only retained behaviors are optional party-detail/device functions and the shared-location surface is explicitly deferred.

### 5. Preserve unsupported endpoints as inventory and implementation work

`GET /api/users/location/{id}`, `PUT /api/users/location`, and `GET /api/parties/{id}/locations` remain inventoried until a later implementation change contains or removes them. The accepted baseline does not promise their current response. Step 11 may define exact removal/status compatibility, but it may not revive location sharing without a separate product proposal.

Alternative considered: remove the routes during this change. Rejected because this workflow is documentation-only and route retirement can affect clients and stored data.

## Risks / Trade-offs

- **[Optional local features may be mistaken for cross-platform parity]** → Mark every retained behavior iOS-only and keep browser parity out of scope.
- **[Startup permission prompts conflict with explicit enablement]** → Record the source mismatch and require a later client change before claiming conformance.
- **[Local party refresh can delete visit history]** → State the local ownership lifecycle explicitly and keep longer retention or export outside the baseline.
- **[Calendar snapshots become stale]** → Label them as snapshots and require explicit remove-and-export rather than promising automatic synchronization.
- **[Deferred routes remain exposed]** → Keep their access and privacy gaps high priority and assign exact containment mechanics to Step 11 or a bounded implementation change.
- **[Permission and platform behavior are unexecuted]** → Treat static source and plist entries as evidence only; require device-level tests during implementation.

## Migration Plan

1. Apply this child change by completing the evidence/classification record and syncing the three added requirements into `party-discovery-and-management`.
2. Update Group 10 access, coverage, decision, gap, inventory, runbook, checklist, and handoff records; preserve the main spec's existing requirements and Group 11 ownership of exact route/status and broader runtime policy.
3. Implement explicit visit-tracking enablement, permission transitions, local lifecycle behavior, calendar snapshot feedback, and unsupported location-route containment in separate application changes.
4. Verify retained behavior on a real or simulated iOS device with location/calendar permission transitions and local persistence scenarios; verify backend location routes are unavailable according to the later containment choice.
5. If shared live location is proposed later, create a separate product change defining consent, Viewer audience, precision, freshness, revocation, deletion/retention, failure, and private-party behavior before implementation.

Rollback for this documentation change is to revert the child delta and Group 10 evidence/decision updates together. Application and user data are unaffected by planning or specification integration.
