# Design

## Context

The product owner answered the Group 12 acceptance questions on 2026-09-30:

| Question | Answer (verbatim intent) | Record |
|---|---|---|
| Q004 age/capacity admission | "just show" | D026, no delta; PARTY-12 already treats metadata as display/filter only |
| Q011 unauthenticated `POST /api/users` | keep it for testing and test data | D027, no delta; AUTH already denies it any identity role |
| Q012 ambiguous first-login matches | from now on there should be a link, but leave the test data unlinked | D028, AUTH-08 modification |
| Q013 iOS provider logout | don't touch iOS | D029, deferral; AUTH-12 unchanged |
| Q015 deployed environment | not a demo; our school cloud; every push deploys changes, without resetting | D030, new `deployment-environment` capability |
| Q016-Q018 retention, accessibility, operations | skip | D031, explicit deferral |
| G066 CLI mismatch | use the version the other device used | W022: OpenSpec CLI 1.13.2 installed; it reproduces the original device's results |

## Decisions

### Ambiguous matches link a new user, not a guessed one

"There should be a link" means every successful first login must end with the subject linked to exactly one PartyHub user. When the claims match several unlinked records, choosing one would risk attaching someone to another person's data (G020 takes the first result). The safe way to always produce a link is to create a minimal user and link it. The seed data in `import.sql` keeps `keycloak_id = NULL`: demo users still link through the existing unique-match scenario (ENV-07), and no seed record is pre-linked or rewritten.

Alternative considered: onboarding-required responses for ambiguous matches. Rejected because that path ends without a link, which contradicts the answer.

### A new capability for the deployed environment

D023 declined a deployment capability because no durability decision existed. Q015 now provides one, and the contract is distinct from the local Compose capability, so `deployment-environment` is justified. It states durability and update behaviour, not hosting mechanics. Keycloak isolation, persistent upload storage, migrations and deploy gating are implementation choices in the backlog (G057-G059, G061). The requirements rule out the current full-reset workflow, not a particular tool.

## Risks / Trade-offs

- [Existing ambiguous links in deployed data] → Currently every deploy resets the data, so nothing legacy needs repair; after G057 is fixed, the rule applies to new logins only.
- [The first persistent deploy still runs the old reset] → The G057 remediation must land before data is considered durable. The backlog orders it first.

## Migration Plan

Documentation only. Apply syncs the modified AUTH requirement and the new capability, then updates the records.
