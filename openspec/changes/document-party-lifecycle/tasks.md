# Tasks

## 1. Lifecycle authorization and visibility

- [x] 1.1 Review the complete modified party-detail, visibility, and management requirements against D001, D007, D008 and access rows 14-18; verify anonymous, host, invitee, attendee, unrelated-user, missing-party, and immutable-host scenarios are retained.
- [x] 1.2 Sync the reviewed lifecycle authorization delta into `party-discovery-and-management`; verify list/detail visibility is query-branch independent and update/delete remain stored-host-only in the integrated text.

## 2. Field and validation contract

- [x] 2.1 Review required, optional, numeric, text, time, location, visibility, and cross-field rules against the Party DTO/model and both active client forms; verify every constraint is either normative in the delta or recorded as an observed gap/explicit later decision.
- [x] 2.2 Sync the atomic validation requirement into the main party spec; verify failed creates/updates have no party, host, invitation, or notification side effects and age/capacity remain metadata pending Q004 admission work.

## 3. Client/API compatibility

- [x] 3.1 Reconcile the browser and iOS lifecycle call-site inventory with the canonical plural CRUD routes and field-preservation rule; verify singular routes, wrong methods, unauthenticated viewer-dependent reads, and destructive defaults retain exact gap references.
- [x] 3.2 Sync the shared browser/iOS lifecycle requirement into the main party spec; verify bearer identity, canonical operations, server-consistent failures, field preservation, and non-parity scope are explicit.

## 4. Traceability and handoff

- [x] 4.1 Update the umbrella checklist, coverage, access, decisions, gaps, runbook, and handoff after integration; verify strict child, umbrella, and main-spec validation passes, links resolve, no application file changed, and Group 5 remains unstarted.
