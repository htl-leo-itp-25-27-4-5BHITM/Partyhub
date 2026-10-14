# Proposal

## Why

`DataSeeder` observes the application `StartupEvent` in every profile, including production. On each start of the deployed app it writes data that nobody asked for:

- It gives up to six existing users hard-coded Vienna coordinates in `user_location` when they have none.
- It inserts or renames the `follow_status` reference rows.

This breaks the `deployment-environment` requirement that seed or test data is never put onto the deployed database. It also means real users can show up on the map in Vienna. At the same time, `DataSeeder` is the only thing that creates the `follow_status` rows in production, so follow requests depend on it.

## What Changes

- Add a Flyway migration with the next free version (currently `V3`) that inserts the three `follow_status` reference rows `(1, 'pending')`, `(2, 'accepted')` and `(3, 'blocked')` idempotently. Existing rows are left untouched, so the already-deployed database is unaffected.
- Delete `src/main/java/at/htl/DataSeeder.java`. After this, the application writes nothing at startup.
- Leave dev seed data unchanged. `db/dev-seed/afterMigrate.sql` already seeds `follow_status` and ten Linz `user_location` rows, so no location data needs to move. (The original request said to move the locations; that turned out to be unnecessary.)
- No production rows are deleted or changed. Any fake Vienna locations already written to production are only reported for manual review, through a read-only query documented in the design.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `deployment-environment`: adds a requirement that application startup on the deployed environment does not write seed or test data, and that the reference data the app needs is provided by schema migrations.

## Impact

- **Code:** removes `at.htl.DataSeeder`. No other class references it.
- **Database:** new migration `V3__follow_status_reference_data.sql`, which only inserts. There is no `DROP` and no row deletion.
- **Production:** on the next deploy, Flyway applies V3 and changes nothing if the rows already exist. User locations are no longer touched at startup.
- **Dev:** no visible change. `clean-at-start` plus `afterMigrate.sql` already provide the same data.
- **Tests:** none affected. The test profile uses `drop-and-create` with Flyway disabled, and the tests create their own `FollowStatus` rows.
