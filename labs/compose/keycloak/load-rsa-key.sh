#!/usr/bin/env bash
# Download pem key from keycloak server

AUTH_SERVER_URL=http://localhost:8000
REALM=demo
CERTS_URL=$AUTH_SERVER_URL/realms/$REALM/protocol/openid-connect/certs

set -e
mkdir -p ./target

curl $CERTS_URL > ./target/cert.json

#jq -c '.keys[]|[.alg, .x5c]|.' < ./target/cert.json
KEY=$(jq -r -c '.keys[]|{alg: .alg, key: .x5c}|select(.alg == "RS256")|.key|.[0]' < ./target/cert.json)


cat <<EOF > ./target/cert.pem
-----BEGIN PRIVATE KEY-----
$KEY
-----END PRIVATE KEY-----
EOF
ls -l target
cat ./target/cert.pem
