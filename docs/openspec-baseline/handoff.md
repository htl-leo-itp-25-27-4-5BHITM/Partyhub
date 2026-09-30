# Final handoff: specification baseline complete

## Status

- Umbrella `complete-partyhub-specification`: **46/46 items complete**, all twelve groups done. **Archived on 2026-09-30** to `openspec/changes/archive/2026-09-30-complete-partyhub-specification/`.
- Ten child changes are applied, synced and **archived** (`openspec/changes/archive/2026-09-30-document-*`), all tasks complete: authentication, profiles/social, party lifecycle, invitations/attendance, discovery/maps, media/profile pictures, notifications/preferences, extended client features, runtime/quality contracts, acceptance decisions.
- Accepted baseline: **7 capabilities, 61 requirements, 313 scenarios**. AUTH 12/45, SOC 11/82, PARTY 19/113, MEDIA 3/20, RADIUS 3/10, ENV 11/35, DEPLOY 2/8.
- Device and revisions: second device (`/Users/carla/Documents/PartyHub`). Group 11 commits `4c55180`/`76972ed`; Group 12 proposal `ce2e0b1` plus the completion commit. Application source, configuration, manifests, workflows and scripts are unchanged since `9487ccb`. Group 12 edited documentation only: README, narrative docs, specs and records.

## Group 12 outputs

- Product-owner answers (2026-09-30) are recorded as D026-D031. Q004: shown/filterable only. Q011: `POST /api/users` kept for testing and test data. Q012: every login ends linked; ambiguous matches create a new linked user; seed data stays unlinked. Q013: iOS unchanged. Q015: persistent school cloud, push deploys without reset. Q016-Q018: deferred. G066: CLI 1.13.2 installed (W022).
- `document-acceptance-decisions`: modified AUTH-08 (+2 scenarios; the no-match onboarding alternative is removed so that every login links) and a new `deployment-environment` capability.
- [acceptance.md](acceptance.md): coverage audit (61/61, 313/313, no unowned surface), journey review (consistent; notes on SOC-04 wording and the AUTH-12 defensive onboarding handling), documentation reconciliation, final validation.
- [backlog.md](backlog.md): B01-B20 bounded implementation changes. **B01 (persistent deployment) is first**, because the current `deploy.yml` still wipes school-cloud data on every push.
- README and narrative docs are reconciled; 39 obsolete local links repaired; `map-radius-control` Purpose repaired (G012).

## Validation (OpenSpec CLI 1.13.2)

| Command | Result |
|---|---|
| `openspec validate complete-partyhub-specification --type change --strict --no-interactive` | valid |
| `openspec validate --specs --strict --no-interactive` | 7 passed, 0 failed |
| `openspec validate --changes --strict --no-interactive` | 11 passed, 0 failed |

No application, JUnit, HTTPYac, browser, iOS, Keycloak, database, CI or deployment command was run. Validation does not prove that the implementation conforms.

## Open items

- Q014 (error envelope, PUT semantics) is non-blocking and is the first step of backlog B11.
- The other device's checkout is behind. Pull before doing any further work there.

## Next steps

1. Done: all 11 changes archived on 2026-09-30; links in the records now point to the archived paths.
2. Start implementation with `/opsx:propose` for backlog B01 (persistent school-cloud deployment), then B02/B03 (bypass removal plus real-token tests).
