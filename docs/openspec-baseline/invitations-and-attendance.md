# Invitation and attendance evidence and accepted contract

Group 5 review and integration, 2026-09-25, against the unchanged application-source snapshot `9487ccb90bb438e24b3cfab547a5dc900b11aecb`, with the proposal checkpoint at `d1765ee015c09a496b672868a77d07749bc26fe0`. This document separates accepted D001/D004-D007/D012/D016-D017 behavior from source observations. No application, API, browser, iOS, database, or runtime test was executed.

## Scope and stable boundaries

- Group 5 owns invitation selection, creation, withdrawal, renewal, acceptance and decline; attendance join/leave/retry behavior; invitation-driven private visibility; attendance/invitation projections; and domain-event inputs for Step 8.
- D004 defines one-way accepted follows and two-way mutual contacts. D005 requires backend-enforced mutual contacts for private invitations. D006 ties invitation acceptance to attendance and requires leaving an accepted invitation to mark it declined. D007/D016 supply party visibility, stored-host authority and atomic state-change boundaries.
- PARTY-12 stores age/capacity metadata but does not decide admission enforcement. Q004 remains unresolved because no accepted artifact establishes full-capacity or age-boundary denial.
- Exact route aliases, response envelopes and status codes remain Q014/Step 11. Step 8 owns notification channels, preferences, delivery, retry and cleanup. The Group 5 contract defines only the originating event and intended domain recipient.
- Browser and iOS may expose different controls. Their supported invitation and attendance operations must represent the same server state; UI parity is not required.

## Source entry points

| Surface | Inspected behavior | Evidence limit / disposition |
|---|---|---|
| `InvitationResource` / `InvitationRepository` | Protected create/list/delete/detail/accept/decline routes. Lists are caller-relative; detail is sender/recipient-only. Any authenticated caller can currently invite any user to any party, sender deletion removes the row, recipient deletion marks declined, and declined rows can be renewed. | Identity checks are partial. Stored-host authority, private mutual-contact eligibility and consistent transition ownership are missing (G017/G031). |
| `PartyRepository.inviteSelectedUsersForPrivateParty` | Party create/update creates PENDING rows, renews DECLINED or ACCEPTED-without-attendance rows, skips other duplicates, and writes invitation notifications. Deselected users are not removed. | Source behavior is not accepted selection-set semantics. The path has no backend mutual-contact check (G017/G031). |
| `PartyRepository.attendParty` / `leaveParty` | Join adds membership and changes an existing invitation to ACCEPTED; leave removes membership and changes an existing invitation to DECLINED. Repeated join is a no-op; repeated leave returns not found. Any authenticated user can join an existing private party. | D006 is partially implemented. Private eligibility, repeat behavior and state/event atomicity diverge from the accepted contract (G009/G031). |
| `getInvitedMembers`, `getJoinedMembers`, `attendStatus`, `getInvitationStats` | Authenticated party viewers can read invitation identities/statuses, joined identities and stats; join status does not check party visibility. Stats count the host as accepted although no host invitation exists. | Supplementary exposure and counting conflict with accepted least-privilege projections (G032). |
| Browser add/edit party | Computes the intersection of followers and following for the selector, retains previously invited rows during edit, and sends `selectedUsers`. | Selector supports D005 in the UI, but fetches are plain `fetch`, update deselection has no matching backend removal, and UI restriction cannot replace backend authorization (G017/G031). |
| Browser detail/notification center | Join/leave use canonical attendance routes. Invitation cards call invitation accept/decline routes, with a join fallback. Party details render invitation statuses or joined members. | Two acceptance APIs reach similar state through different code paths; duplicated `acceptInvite` helpers and projection audience need reconciliation (G031/G032). |
| iOS invitation center | Lists received invitations, accepts through party join and declines through party leave. | The decoded model expects nested/snake-case fields while the backend list DTO is flat/camel-case; the flow was not run (G033). |
| iOS invite sheet | Loads only `following`, posts a snake-case `party_id`, and marks a row invited locally after success. | `following` is not proof of mutual contact; payload naming differs from `InvitationDto.partyId`; existing invitation state is not loaded (G017/G033). |
| iOS party/detail helpers | Main lifecycle routes are plural, but a notification helper polls singular party/attendee routes. Detail join/leave controls include debug/local behavior. | Active reachability and state synchronization were not exercised; stale routes remain G006 and attendance-client discrepancies G033. |

## Invitation selection and management matrix

The accepted contract uses one logical invitation per `(party, recipient)` with `PENDING`, `ACCEPTED` and `DECLINED` states. Storage may retain history, but a declined or withdrawn invitation is not a current private-visibility grant.

| Action / prior state | Authorized actor and eligibility | Accepted next state | Membership / visibility effect | Event input | Observed source |
|---|---|---|---|---|---|
| Create / no row | Stored host; recipient exists, is not host; private recipient is a mutual contact | `PENDING` | No membership; pending recipient qualifies for private visibility | Invitation issued → recipient | Both create paths make PENDING, but direct route lacks host/mutual checks. |
| Create / already PENDING | Stored host with same eligible recipient | Unchanged `PENDING` | Unchanged | None | Direct route conflicts; party-selected path skips. |
| Create / ACCEPTED and attending | Stored host | Unchanged `ACCEPTED` | Membership preserved | None | Direct route conflicts; selected-user path skips. |
| Renew / DECLINED | Stored host; eligibility re-evaluated | Existing logical invitation returns to `PENDING` | Private visibility restored; no membership | Invitation renewed → recipient | Both repository paths renew declined rows. |
| Withdraw / PENDING | Stored host | No qualifying current invitation | No membership; private visibility removed unless another viewer role applies | Invitation withdrawn → recipient | Sender delete removes row; party update deselection does not. |
| Remove / ACCEPTED and attending | No invitation-only transition | Unchanged until attendee leaves or a future moderation contract exists | Membership and viewer access preserved | None | Source sender deletion can remove invitation without removing membership; target avoids inventing host eviction. |
| Self invite | None | No change | No change | None | Party-selected path skips host; direct route accepts self if IDs resolve. |
| Missing party/recipient or non-host action | None | No change | No change | None | Source checks existence but not stored-host authority. |

This disposition resolves the invitation portion of Q003 through D017 without defining host moderation or banning retained invitation history. Public-party invitation eligibility beyond stored-host authority is not expanded by inference; the existing private-invitation contract remains the normative scope.

## Invitation and attendance transition table

| Action / prior state | Actor and party eligibility | Accepted invitation state | Accepted membership | Visibility result | Event input | Repeat behavior |
|---|---|---|---|---|---|---|
| Join public party / not attending | Authenticated non-host viewer | Existing invitation becomes `ACCEPTED`; otherwise none | Add once | Public visibility unchanged | Attendance joined → host | Repeated join changes nothing and emits no duplicate event. |
| Join private party / `PENDING` | Authenticated invitation recipient | `ACCEPTED` | Add once, atomically with state | Access continues through membership | Invitation accepted / attendance joined → host | Repeated accept/join changes nothing and emits no duplicate event. |
| Join private party / no pending invitation | Authenticated non-host | Unchanged | Unchanged | Denied; no fields disclosed beyond accepted denial behavior | None | Repeated denial has no side effects. |
| Accept through an invitation action | Invitation recipient with `PENDING` state | Same transition as join | Add once | Same as join | Same single acceptance event | A second accepted action is a no-op. |
| Decline `PENDING` | Invitation recipient | `DECLINED` | Ensure absent | Private visibility removed unless another role applies | Invitation declined → host | Repeated decline changes nothing and emits no duplicate event. |
| Leave after accepted invitation | Joined recipient | `DECLINED` | Remove once | Private visibility removed after membership ends | Attendance left / invitation declined → host | Repeated leave changes nothing and emits no duplicate event. |
| Leave public party without invitation | Joined authenticated non-host | No invitation state | Remove once | Public visibility unchanged | Attendance left → host | Repeated leave changes nothing and emits no duplicate event. |
| Missing party/user | Any caller | Unchanged | Unchanged | No new access | None | Exact error/status remains Q014. |

The host owns the party rather than attending through an invitation. Host attendance/moderation is not introduced by this contract. Q004 remains explicit: this transition table does not claim that age or capacity metadata currently authorizes or denies admission.

## Projection and access matrix

| Projection | Accepted audience | Minimum content / rule | Current observation |
|---|---|---|---|
| Received invitation list | Authenticated recipient, own rows only | Invitation ID/status plus bounded sender/party summary | Backend list is caller-relative; iOS model does not match the flat DTO. |
| Sent invitation list | Stored host/sender, own rows only | Invitation ID/status plus bounded recipient/party summary | Backend is caller-relative but sender need not be stored host. |
| Invitation detail | Stored host/sender or recipient of that invitation | Bounded invitation/party summary consistent with party visibility | Backend sender/recipient check exists. |
| Own attendance status | Authenticated party viewer | Caller membership and a viewer-safe total count | Source checks caller/party existence but not private visibility. |
| Invited-member identities and statuses | Stored host only | Pending/accepted/declined recipient summary | Source exposes to every authenticated party viewer. |
| Joined-member roster | Authenticated party viewer | Bounded attendee profile summary | Source uses the general party viewer predicate. |
| Invitation statistics | Stored host only | Counts derived from actual invitation rows; host is not an accepted invitation unless represented by an invitation, which self-invite forbids | Source exposes to every authenticated party viewer and increments accepted for host. |

These accepted audiences resolve Q010 for invitations/attendance. They do not decide `can-edit` metadata beyond PARTY-05 host authority, profile field projections beyond SOC-05, or attendee location exposure owned by Step 10.

## Event and projection side effects

| Originating transition | Intended domain recipient | Required domain effect | Step 8 dependency |
|---|---|---|---|
| Invitation issued or renewed | Recipient | One actionable invitation event tied to party and invitation | Channel, preferences, delivery and cleanup. |
| Pending invitation withdrawn | Recipient | One withdrawal event; obsolete actionable invite state is removed | Whether/how withdrawal is surfaced out of app. |
| Invitation accepted / attendee joins | Host | One accepted/joined event; invite action becomes non-pending | Event presentation and channel selection. |
| Invitation declined | Host | One declined event; recipient membership is absent | Event presentation and channel selection. |
| Attendee leaves | Host | One leave event; accepted invitation becomes declined when applicable | Event presentation and channel selection. |
| Duplicate/no-op/denied action | None | No duplicate event; lists, membership, status and counts remain consistent | Retry/deduplication details. |

The Group 5 contract requires the state transition and event input to commit together. It does not require email, push or in-app delivery success to make the domain state valid; Step 8 defines those guarantees.

## Test evidence and limitations

- `InvitationRepositoryTest` asserts basic creation, sender deletion, recipient decline, declined-row renewal and invitation-notification counts. It does not establish stored-host authority, self-invite denial, mutual-contact eligibility, duplicate accepted behavior or withdrawal of a selected invitee.
- `InvitationResourceTest` asserts protected list/detail/accept/decline status cases under the test identity mechanism. Its success assertions do not verify complete persisted membership, visibility, event deduplication or client schemas.
- `PartyRepositoryTest` covers selected-user invitation creation, update-to-private invitation creation, joined-member projection and invitation status display. `PartyResourceTest` primarily covers missing/anonymous attendance and basic stats responses.
- No inspected test establishes private join denial, public join/leave success, join-to-accepted and leave-to-declined atomicity, retry semantics, host-only projections, correct stats counting or cross-client payload compatibility. No relevant test was run.

## Integrated result

The bounded modification of `party-discovery-and-management` is integrated: existing invitation and attendance requirements are expanded, and actor-scoped projections plus transition event inputs are added. The child [proposal](../../openspec/changes/document-invitations-and-attendance/proposal.md), [design](../../openspec/changes/document-invitations-and-attendance/design.md), [delta](../../openspec/changes/document-invitations-and-attendance/specs/party-discovery-and-management/spec.md) and [tasks](../../openspec/changes/document-invitations-and-attendance/tasks.md) are applied with **7/7 tasks complete** and remain active/unarchived.

Accepted main coverage is now **46 requirements/200 scenarios**, including `party-discovery-and-management` at **15/88**. PARTY-06/PARTY-07 are modified and PARTY-14/PARTY-15 are added. D017 resolves Q003 and Q010. Q004 and Q014 remain unresolved at their stated boundaries; G006/G009/G017 and G031-G033 retain implementation/client discrepancies.
