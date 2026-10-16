# Dedicated Keycloak Postgres

PartyHub keeps using `postgres` / `demo` and its existing storage. Keycloak uses
`keycloak-db` / `keycloak`, with a separate user and volume/PVC. Flyway and seed
scripts only connect to the application database. The legacy `keycloak` database
on `postgres` is retained for rollback; nothing drops it automatically.

## Local cutover

Run `./scripts/migrate-keycloak-db.sh`, then
`docker compose up -d --build --wait --wait-timeout 600`, or run `./deploy-local.sh`
(which does both before building and starting Quarkus).

The migration starts both databases, checks for a legacy `keycloak` database and
an empty destination, stops Keycloak, saves a private custom-format PostgreSQL backup in
`${XDG_STATE_HOME:-$HOME/.local/state}/partyhub/backups`, then restores in one transaction. It copies the entire
Keycloak database, preserving IDs, passwords, clients and realm configuration.
A failure leaves Keycloak stopped; fix the error and rerun. A populated destination
is never overwritten. The backup path is printed; retain it securely until login is verified.
Set `PARTYHUB_BACKUP_DIR` to choose another backup directory. For rollback, stop Keycloak and restore its old
Compose configuration pointing at `postgres`, username/password `demo`.

Only new installations import `keycloak/realm-dev.json`. Existing realms are
retained, so changing a realm JSON file does not update a migrated realm.

Optional local `.env` values are `KEYCLOAK_DB_PASSWORD`,
`KEYCLOAK_ADMIN_PASSWORD` and `SMTP_PASSWORD`. Database passwords initialize new
volumes only: changing `.env` after initialization requires changing the database
role password too. Bootstrap admin settings do not rotate an existing admin's
password. The app database keeps its existing `demo` credentials for compatibility.

## School-cloud cutover (before deploying these manifests)

This is a maintenance operation: pause automated deployments and use the correct
namespace/context. Do not apply `k8s/keycloak.yaml` until the restore is complete.
The pipeline requires `keycloak-database-secret` with `migration-complete=true`
before applying any manifests. There is no automatic cloud migration.

1. Confirm the target and provision credentials. Store generated credentials in
   your password manager. Do not commit the secret or database backups.

   ```bash
   kubectl get ingress -o jsonpath='{.items[*].spec.rules[*].host}{"\n"}'
   # Must identify it220274.cloud.htl-leonding.ac.at; verify namespace too.
   kubectl config view --minify -o jsonpath='{.contexts[0].context.namespace}{"\n"}'
   read -rsp 'New Keycloak DB password: ' KC_DB_PASSWORD; echo
   read -rsp 'Bootstrap admin password: ' KC_ADMIN_PASSWORD; echo
   kubectl create secret generic keycloak-database-secret \
     --from-literal=username=keycloak --from-literal=password="$KC_DB_PASSWORD" \
     --from-literal=admin-username=admin --from-literal=admin-password="$KC_ADMIN_PASSWORD"
   unset KC_DB_PASSWORD KC_ADMIN_PASSWORD
   ```

   If the secret already exists, inspect its keys and reuse its database credentials;
   do not replace a password on an initialized database. Change an existing admin's
   password in Keycloak separately; the bootstrap value only applies to a new admin.

2. Start only the dedicated database, then stop the current Keycloak writer.

   ```bash
   kubectl apply -f k8s/keycloak-db.yaml
   kubectl rollout status deployment/keycloak-db --timeout=180s
   # Patch the Deployment directly: the student account lacks deployments/scale access.
   kubectl patch deployment/keycloak --type=merge -p '{"spec":{"replicas":0}}'
   kubectl wait --for=delete pod -l app=keycloak --timeout=180s
   ```

3. Back up the existing identity database and restore it to the empty target.
   Run these commands in Bash with `set -euo pipefail` so a failure stops the cutover.
   The source is the already separated logical `keycloak` database, not `demo`.
   If the cluster still has Keycloak tables in `demo`, complete the older
   [persistent-deployment cutover](deployment-cutover.md) first.

   ```bash
   set -euo pipefail
   umask 077
   mkdir -p "$HOME/partyhub-backups"
   BACKUP="$HOME/partyhub-backups/keycloak-before-separation-$(date +%Y%m%d%H%M%S).dump"
   kubectl exec deployment/postgres -- pg_dump -U demo -d keycloak \
     --format=custom > "$BACKUP"
   test -s "$BACKUP"
   # Must be 0; STOP if it isn't. Never overwrite an already-used destination.
   TABLES=$(kubectl exec deployment/keycloak-db -- psql -U keycloak -d keycloak -Atc \
     "SELECT count(*) FROM pg_tables WHERE schemaname = 'public'")
   test "$TABLES" = 0
   kubectl exec -i deployment/keycloak-db -- pg_restore -U keycloak -d keycloak \
     --no-owner --no-privileges --exit-on-error --single-transaction < "$BACKUP"
   ```

4. Compare realm/user IDs and counts on both servers. Both queries must agree;
   preserve the dump and source database if anything differs.

   ```bash
   SQL="SELECT 'realms', count(*), md5(string_agg(id, ',' ORDER BY id)) FROM realm
        UNION ALL SELECT 'users', count(*), md5(string_agg(id, ',' ORDER BY id)) FROM user_entity"
   kubectl exec deployment/postgres -- psql -U demo -d keycloak -c "$SQL"
   kubectl exec deployment/keycloak-db -- psql -U keycloak -d keycloak -c "$SQL"
   # Only after successful restore and comparison:
   kubectl patch secret keycloak-database-secret --type=merge \
     -p '{"stringData":{"migration-complete":"true"}}'
   ```

   For a genuinely new installation with no prior accounts, skip copying and mark
   the secret complete only after confirming that there is no identity data to retain.

5. Deploy this commit through the existing pipeline. It starts Keycloak on the new
   server. Readiness uses port 9000 (not exposed by the Service); the public issuer
   remains `https://it220274.cloud.htl-leonding.ac.at/keycloak/realms/partyhub`.
   For a manual cutover, preserve the running Keycloak image tag when rendering
   `k8s/keycloak.yaml`; do not accidentally deploy `:latest` during the migration.
   Verify login with an existing account, `/api/users/me`, registration, email
   verification/reset and login after restarting Keycloak. Re-enable deployments.

## Cloud rollback

Before accepting registrations on the new database, rollback can use the untouched
legacy database: pause deployments, stop Keycloak, revert its Deployment to the
previous configuration (host `postgres`, user/password `demo`), then start it again.
The app database/PVC is unaffected. Remove the `migration-complete` key to block
accidental re-deployment until resolved. Keep the dedicated PVC and backups.

After new registrations or identity changes on the new database, the source is
stale. Stop Keycloak and back up the new database before deciding whether to migrate
those changes back; blindly switching to the old database loses those changes.

## Further improvements

- Add scheduled, encrypted, off-cluster backups for both databases and uploaded
  files, with a restore rehearsal. Separate PVCs do not provide backups.
- Move app database credentials into a Secret and use restricted runtime database
  roles. The Postgres image's initialization user is a superuser, even on the new
  dedicated instance; consider separate migration/admin and runtime credentials.
- Stop automatic dev Flyway cleaning; provide an explicit app-only reset command.
  Currently `quarkus:dev` still reseeds app data, while Keycloak accounts persist.
- `sync-import.sh` now defaults to local-only. Consider a backup requirement for
  its explicit `--k8s-only` operation, which still truncates application data.
- Replace exported demo accounts and the staging test-client secret for production,
  and disable unused password grants. Audit realm changes separately from deploys:
  startup import intentionally preserves an existing realm.
- Fix the Quarkus rollout/PVC combination: its current rolling strategy permits
  downtime (`maxUnavailable: 1`) and overlapping writers to a ReadWriteOnce uploads
  volume. Choose a single-instance Recreate strategy or shared/object storage.
- Add an actual browser login test to CI. Current API tests use the authentication
  bypass and do not demonstrate that the OIDC login flow works.

Configuration references: [Keycloak hostname](https://www.keycloak.org/server/hostname),
[health checks](https://www.keycloak.org/observability/health), and
[realm import behavior](https://www.keycloak.org/server/importExport).

## Verification during implementation (2026-10-14)

- Migrated the running local database: 12 users and 2 realms, with identical
  user/realm ID checksums before and after. Rerunning the migration skipped the
  populated destination without modifying it; Keycloak connected as `keycloak`
  to the dedicated `keycloak` database.
- Restarted Keycloak, checked health and OIDC discovery, then authenticated the
  existing `viki_vej` demo account through the browser authorization-code flow.
  Keycloak returned a code to the expected callback. The app was not running on
  port 8080, so callback processing and `/api/users/me` were not tested.
- An isolated fresh database imported the dev realm (12 users, email verification
  disabled). The isolated server also started with the Kubernetes production
  hostname/path settings and passed management readiness, startup and liveness
  checks at port 9000. Test storage was removed afterwards.
- Compose configuration, shell syntax, YAML parsing and whitespace checks passed.
  These were local checks; the subsequent live cloud cutover is recorded below.

## Completed cloud cutover (2026-10-14)

Target: context `leocloud`, namespace `student-it220274`, hostname
`it220274.cloud.htl-leonding.ac.at`.

- Created `keycloak-db`, a separate 1Gi PVC, and a Secret containing independently
  generated database/bootstrap credentials. The existing admin account was copied;
  its password was not changed by the bootstrap settings.
- Waited for the active CI deployment to complete before stopping Keycloak.
  Repository credentials cannot disable workflows, so automation was not paused.
  Student RBAC disallows `deployments/scale`; patching `spec.replicas` on the
  Deployment worked instead.
- Restored the full identity database in one transaction using a custom archive.
  Initial SQL-format restoration was rejected by the destination's older psql
  client (16.8 versus source 16.11); it left the target empty. Custom archive
  restoration succeeded, and the local migration script now uses this format too.
- Full-row checksums matched for 2 realms, 18 users, 17 credentials and 16 clients
  before starting the destination. Keycloak now connects as `keycloak` to
  `keycloak-db`; the app remains on `postgres` / `demo`.
- Preserved deployed Keycloak image tag `050de68`, verified startup/readiness,
  and marked `migration-complete=true`. Removed the obsolete discovery Service.
- Public OIDC discovery returns HTTP 200 with the expected HTTPS issuer. A browser
  login using the existing demo account completed the app's PKCE callback and
  loaded the homepage with all 21 parties and the authenticated profile. App counts remained 13 users / 21 parties.
- Existing application and upload PVCs were not replaced. The old identity
  database on `postgres` remains available for rollback, but becomes stale as
  identity changes occur on the new server.

Private backups and rollback manifests are outside the repository at
`~/.local/state/partyhub/backups/cloud-20261014T072358Z/`; files containing credentials
or identity data have mode 600. `keycloak.dump` is the successful custom archive.
Future CI deployments must use these updated infrastructure manifests; reverting
to the older manifests would restore the shared Postgres connection. The updated
workflow also serializes deployments to the namespace.
