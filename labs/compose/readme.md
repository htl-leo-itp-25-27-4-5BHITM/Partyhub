# Docker compose images for local development

## starting
```bash
docker compose up --build
```

## postgres

We use postgres for our demo- and the keycloak- database.
As a first step we create an init container to create the sql - scripts in a file, 
that is mounted to the postgres docker entry point directory to set up the database
when there is no existing database volume.
You can rewrite this code if you work on an operating system that has no problems
with host mounted volumes (OSX or Linux). In that case the init container can be
removed and initdb.sql can be host mounted.

## keycloak

The keycloak image imports a demo realm from the two json files.

## backup

To export the keycloak setting to files you start backup-keycloak.yaml.
When the keycloak container has stopped again you run the backup.sh

That script will export the demo realm and its users and make a pg_dump backup
of both databases. You find the backup in the ./target folder.


