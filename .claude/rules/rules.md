# PartyHub Rules

Hard rules for working in this repo. How-to details are in the `partyhub-development` skill and AGENTS.md.

## Data safety
- Run `./sync-import.sh` only with `--local-only`. The default and `--k8s-only` truncate and reseed the persistent school-cloud database, and there is no backup.
- Never run `kubectl` commands that delete, reset or reseed anything in the cluster unless the user explicitly asks.
- Ask before running `./deploy-local.sh`. It runs `docker-compose down -v` and deletes local Postgres and Keycloak data.

## Git and deployment
- A push to `main` deploys to production once Test and Build pass. Work on a branch and merge through a pull request.
- Write commit messages in Conventional Commits style: `feat:`, `fix:`, `docs:`, `ci:`, `test:`, `refactor:`.

## Database
- Change the schema only with a new Flyway migration `src/main/resources/db/migration/V<n>__<description>.sql` using the next free number.
- Never edit or rename a migration that is already on `main`.
- `DROP`, row deletion and raw SQL each need a note in the pull request.
- Seed data belongs only in `src/main/resources/db/dev-seed/afterMigrate.sql`. It must never run outside dev.

## Backend
- Put `@Valid` on every request-body parameter of a REST endpoint.
- Request DTOs are records. Every constraint has a `message`. Use `OnCreate`/`OnUpdate` groups when create and update differ.
- Free-text input gets `@SafeText` and/or `@NoHtml`. Party names get `@ValidPartyName`.
- Echo user input back only through `Encode.forHtml(...)`.
- Endpoints that change data are `@Authenticated`, and the write runs inside `@Transactional`, on the resource method or the repository method it calls. Exceptions: user registration (`createUser`) and the deferred QR-login prototype.
- Queries go through Hibernate/Panache with bound parameters. Never build SQL by string concatenation.

## Behaviour and specs
- `openspec/specs/` is the source of truth for product behaviour. Before changing behaviour, read the matching spec. If the change contradicts it, propose an OpenSpec change (`/opsx:propose`) instead of silently diverging.
- Don't treat the root `openapi.yaml` as the API contract; it is outdated. Use `/q/openapi` or `docs/openspec-baseline/api-contract-matrix.md`.

## Verification
- Before claiming backend work is done, run `./mvnw clean test`. If endpoints changed, also run `./run-http-tests.sh` or the relevant `api/*.http` file.
- Don't use the dev-only `X-User-Id` header as proof that authentication works. Verify with a real Keycloak login (demo users: password = username).

## Keycloak
- Local realm changes go in `keycloak/realm-dev.json`, deployed ones in `keycloak/realm-staging.json`. Keycloak only imports a realm that doesn't exist yet, so changing `realm-staging.json` doesn't affect production. Production changes are made in the Admin Console.
- Theme CSS lives only in `keycloak/themes/partyhub/login/resources/css/styles.css`. Reuse the `--ph-*` tokens instead of hard-coding colours.
