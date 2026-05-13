Start implementation for the OpenSpec change `add-keycloak-compose` in `/Users/carla/Documents/Partyhub`.

Read these files first:

- `/Users/carla/Documents/Partyhub/openspec/changes/add-keycloak-compose/proposal.md`
- `/Users/carla/Documents/Partyhub/openspec/changes/add-keycloak-compose/design.md`
- `/Users/carla/Documents/Partyhub/openspec/changes/add-keycloak-compose/specs/local-keycloak-environment/spec.md`

Then implement the change end to end.

Requirements to honor:

- Add Keycloak to `docker-compose.yaml` using the official image `quay.io/keycloak/keycloak:26.5.0`.
- Expose Keycloak on host port `8000`.
- Keep exactly one Postgres service and one exposed Postgres port.
- Use the existing `postgres` container for Keycloak, but with a dedicated database named `keycloak`.
- Add a Postgres first-run init script that creates the `keycloak` database.
- Add a Keycloak realm import file for realm `partyhub`.
- Provision a public client `frontend` with no client secret.
- Configure redirect URI `http://localhost:8000/*`.
- Provision a realm role `admin`.
- Provision an enabled user `admin` with password `password` and assign the `admin` role.
- Do not change PartyHub application source code unless strictly necessary for this infrastructure task.

Implementation notes:

- The existing Postgres service currently uses `POSTGRES_DB=demo`, `POSTGRES_USER=demo`, and `POSTGRES_PASSWORD=demo`.
- Keep Keycloak data isolated from the PartyHub application database by connecting Keycloak to database `keycloak`, not `demo`.
- Use `start-dev --import-realm` for the Keycloak container.
- Join Keycloak to the existing `partyhub-network`.
- Add `depends_on` where appropriate.
- Because Postgres init scripts only run on first initialization, document or mention the manual remediation needed for existing local volumes if verification reveals it matters.

Suggested files to change:

- `/Users/carla/Documents/Partyhub/docker-compose.yaml`
- a new SQL init script under a Postgres init directory in the repo
- a new Keycloak realm import JSON file under the repo's `keycloak` area

Verification:

- Start or validate the Docker Compose configuration if feasible.
- Confirm the compose file still exposes only Postgres port `5432`.
- Confirm Keycloak is mapped to `8000`.
- Confirm the realm import content includes the `partyhub` realm, `frontend` client, `admin` role, and `admin` user.

After implementation, update the OpenSpec task list if appropriate and summarize any verification gaps.
