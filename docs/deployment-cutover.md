# One-time cut-over to persistent deployments (B01)

This runbook moves the school cloud from "reset on every deploy" to persistent,
incremental deployments (change `persistent-school-cloud-deployment`, DEPLOY-01/DEPLOY-02).
It is run **once**, by someone with `kubectl` access to the school cloud, and
it follows the Migration Plan in
[`openspec/changes/archive/2026-09-30-persistent-school-cloud-deployment/design.md`](../openspec/changes/archive/2026-09-30-persistent-school-cloud-deployment/design.md).

What changes on the cluster with the first deploy after the merge:

- `deploy.yml` no longer deletes Deployments, drops `demo.public` or replays seed data.
- The Keycloak initContainer creates the `keycloak` database. Keycloak starts on it
  and imports `realm-staging.json` once, because the realm does not exist there yet.
- Quarkus finds a non-empty `demo.public` without `flyway_schema_history`,
  records a Flyway baseline at version 1, applies V2 onward and validates the schema.

Keycloak accounts registered since the last reset are **not** carried over,
unless step 3 is run. PartyHub rows in `demo` are kept, and users whose email matches are
re-linked on their next login.

All commands need a shell whose kubeconfig points at the **deployment target**: the
namespace that the repository secret `KUBE_CONFIG_DATA` deploys to, whose ingress serves
`it220274.cloud.htl-leonding.ac.at` (`k8s/ingress.yaml`). Each student has their own
namespace on the school cloud, so a working `kubectl` is not enough. Check it first:

```bash
kubectl get ingress -o jsonpath='{.items[*].spec.rules[*].host}{"\n"}'   # must print it220274.cloud.htl-leonding.ac.at
POD=$(kubectl get pods -l app=postgres -o jsonpath="{.items[0].metadata.name}")
```

## 1. Rehearse locally (before merging)

Already done during implementation (task 1.7). The current `main` schema
(Hibernate `update` plus the old startup DDL, seeded like the deploy) baselines at
version 1, applies V2 and passes `validate` without losing rows. Repeat it if the
entities changed since then.

## 2. Back up the cloud database (before merging)

The dump contains personal data. Store it off-cluster and **outside the repository**.
Never commit it.

```bash
kubectl exec $POD -- pg_dump -U demo demo > ~/partyhub-backups/demo-before-b01.sql
test -s ~/partyhub-backups/demo-before-b01.sql && grep -c "CREATE TABLE public.party " ~/partyhub-backups/demo-before-b01.sql
```

The last command must print `1`.

Also record the row counts to compare them later:

```bash
kubectl exec $POD -- psql -U demo -d demo -c "
  SELECT 'users' t, count(*) FROM users UNION ALL SELECT 'party', count(*) FROM party
  UNION ALL SELECT 'invitation', count(*) FROM invitation UNION ALL SELECT 'party_user', count(*) FROM party_user
  UNION ALL SELECT 'follow', count(*) FROM follow UNION ALL SELECT 'notification', count(*) FROM notification"
```

## 3. Optional: keep the current Keycloak accounts

Skip this step if losing the accounts registered since the last deploy is acceptable
(Decision 7). Otherwise, run it **right before merging**. Nothing else may deploy
between this step and the merge, because an old-style deploy would wipe `demo` again.

```bash
# Stop Keycloak so the copy is consistent (the deploy scales it back to 1)
kubectl scale deployment/keycloak --replicas=0

# Create the target database (the initContainer would skip it later, since it exists)
kubectl exec $POD -- psql -U demo -d demo -c "CREATE DATABASE keycloak"

# Copy every table in demo.public except the PartyHub tables
kubectl exec $POD -- sh -c 'pg_dump -U demo -d demo --no-owner --no-privileges \
  -T users -T party -T invitation -T party_user -T follow -T follow_status \
  -T notification -T location -T media -T profile_picture -T user_location \
  -T qr_login -T user_notification_settings \
  | psql -U demo -d keycloak -v ON_ERROR_STOP=1 -q'

# Check that the realm arrived
kubectl exec $POD -- psql -U demo -d keycloak -tAc "SELECT name FROM realm"
```

On start, Keycloak finds the existing `partyhub` realm and skips the import
(`IGNORE_EXISTING`), so the copied accounts are kept.

## 4. Merge to `main`

Merging starts the pipeline: `Test` → `Build and Push` → `deploy` job (calls `deploy.yml`
with the commit's short SHA). Watch it under *Actions → Build and Push*.

## 5. Check

```bash
kubectl rollout status deployment/keycloak --timeout=600s
kubectl rollout status deployment/quarkus --timeout=300s

# Images are pinned to the merged commit
kubectl get deployment quarkus keycloak -o jsonpath='{range .items[*]}{.metadata.name}{" "}{.spec.template.spec.containers[0].image}{"\n"}{end}'

# Flyway baselined demo and applied V2
kubectl logs deployment/quarkus | grep -iE "flyway|baseline|Migrating"
kubectl exec $POD -- psql -U demo -d demo -c "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank"

# Keycloak runs on its own database and kept or imported the realm
kubectl logs deployment/keycloak -c create-keycloak-db
kubectl exec $POD -- psql -U demo -d postgres -tAc "SELECT datname FROM pg_database WHERE datname = 'keycloak'"
kubectl logs deployment/keycloak | grep -iE "realm|import"
```

Then:

- Compare the row counts (step 2 query) with the recorded ones. They must match.
- Log in at https://it220274.cloud.htl-leonding.ac.at with a demo user from
  `keycloak/realm-staging.json` (or with an existing account if step 3 ran).
- Register a new Keycloak user and upload a profile picture. Push a trivial commit
  to `main`, wait for the deploy, and confirm that the row counts, the new user
  and the picture are all still there (DEPLOY-01, DEPLOY-02).

## 6. Clean up the old Keycloak tables in `demo`

Only after step 5 passed. Build the list of tables from the `keycloak`
database, so that only Keycloak tables are named, and review it before running it.

```bash
kubectl exec $POD -- psql -U demo -d keycloak -tAc \
  "SELECT 'DROP TABLE ' || string_agg(format('public.%I', tablename), ', ' ORDER BY tablename) || ';'
   FROM pg_tables WHERE schemaname = 'public'" > drop-old-keycloak-tables.sql

# Review: the list must not contain a PartyHub table or flyway_schema_history
cat drop-old-keycloak-tables.sql
grep -oE "public\.(users|party|invitation|party_user|follow|follow_status|notification|location|media|profile_picture|user_location|qr_login|user_notification_settings|flyway_schema_history)[,;]" drop-old-keycloak-tables.sql \
  && echo "STOP: PartyHub table in list" || echo "list ok"

# Drop them in one transaction. There is no CASCADE: this fails if anything else depends on them.
kubectl exec -i $POD -- psql -U demo -d demo -v ON_ERROR_STOP=1 --single-transaction < drop-old-keycloak-tables.sql
kubectl exec $POD -- psql -U demo -d demo -c '\dt'
```

`\dt` must list only the PartyHub tables and `flyway_schema_history`. Check that
the app and the login still work, then delete `drop-old-keycloak-tables.sql`.

## Rollback

- A bad rollout: `kubectl rollout undo deployment/quarkus` (and `deployment/keycloak`).
  Because of the rolling update, the old Quarkus pod keeps serving until the new one is Ready.
- Damaged data: restore `demo-before-b01.sql` into an empty `demo` database.
- Do **not** revert only `deploy.yml` to the pre-B01 version, because that brings back the reset
  on every deploy. Revert through a normal commit instead.
