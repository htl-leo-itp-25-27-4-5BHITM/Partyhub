#!/usr/bin/env bash


#/opt/keycloak/bin/kc.sh export --db postgres --db-url-host postgres --db-url-database jdbc:postgresql://postgres/keycloak --db-username keycloak --db-password keycloak --realm demo --dir /opt/keycloak/export

/opt/keycloak/bin/kc.sh export --db postgres --db-url jdbc:postgresql://postgres/keycloak \
    --db-username keycloak --db-password keycloak \
    --realm demo --dir /opt/keycloak/export --users same_file \
    --features-disabled=admin-api,admin2 
     
