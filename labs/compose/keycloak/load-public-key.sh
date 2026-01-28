#!/usr/bin/env bash
# Download pem key from keycloak server

AUTH_SERVER_URL=http://localhost:8000
REALM=demo
WELLKNOWN_URL=$AUTH_SERVER_URL/realms/$REALM

set -e
mkdir -p ./target

curl -o ./target/wellknown.json $WELLKNOWN_URL
#jq -r -c '.public_key' < ./target/wellknown.json
KEY=$(jq -r -c '.public_key' < ./target/wellknown.json)

cat <<EOF > ./target/key.pem
-----BEGIN PUBLIC KEY-----
$KEY
-----END PUBLIC KEY-----
EOF
echo "PUBLIC_KEY=$KEY" > ./target/env.properties

ls -l target
cat ./target/env.properties
cat ./target/key.pem
